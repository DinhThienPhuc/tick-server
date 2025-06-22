import type { ServerResponse } from "http";

import { ISSEClient, ITickEvent } from "../types";
import { loggerService } from "../utils/logger";

export class TickService {
  private clients: Map<string, ISSEClient> = new Map();
  private tickInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startTicking();
  }

  addClient(clientId: string, response: ServerResponse): void {
    // Set SSE headers
    response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    });

    const client: ISSEClient = {
      id: clientId,
      response,
      lastPing: new Date(),
    };

    this.clients.set(clientId, client);

    // Send initial connection message
    this.sendToClient(clientId, {
      timestamp: new Date().toISOString(),
      minute: new Date().getMinutes(),
      hour: new Date().getHours(),
      date: new Date().toDateString(),
      message: "Connected to tick server",
    });

    // Handle client disconnect
    response.on("close", () => {
      this.removeClient(clientId);
    });

    loggerService.info("Client connected", {
      clientId,
      totalClients: this.clients.size,
    });
  }

  removeClient(clientId: string): void {
    if (this.clients.has(clientId)) {
      this.clients.delete(clientId);
      loggerService.info("Client disconnected", {
        clientId,
        totalClients: this.clients.size,
      });
    }
  }

  private sendToClient(clientId: string, event: ITickEvent): void {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    try {
      const data = `data: ${JSON.stringify(event)}\n\n`;
      client.response.write(data);
      client.lastPing = new Date();
    } catch (error) {
      loggerService.error("Failed to send event to client", error as Error, {
        clientId,
      });
      this.removeClient(clientId);
    }
  }

  private broadcastToAllClients(event: ITickEvent): void {
    const clientIds = Array.from(this.clients.keys());

    if (clientIds.length === 0) {
      loggerService.debug("No clients to broadcast to");
      return;
    }

    loggerService.info("Broadcasting tick event", {
      clientCount: clientIds.length,
      timestamp: event.timestamp,
    });

    clientIds.forEach((clientId) => {
      this.sendToClient(clientId, event);
    });
  }

  private createTickEvent(): ITickEvent {
    const now = new Date();
    // Round to the exact minute (set seconds and milliseconds to 0)
    const exactMinute = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      0,
      0,
    );

    return {
      timestamp: exactMinute.toISOString(),
      minute: exactMinute.getMinutes(),
      hour: exactMinute.getHours(),
      date: exactMinute.toDateString(),
      message: `Tick at ${exactMinute.getHours()}:${exactMinute.getMinutes().toString().padStart(2, "0")}:00`,
    };
  }

  private startTicking(): void {
    // Calculate milliseconds until next minute
    const now = new Date();
    const msUntilNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    loggerService.info("Starting tick service", {
      nextTickIn: `${Math.ceil(msUntilNextMinute / 1000)}s`,
      currentTime: now.toISOString(),
      localTime: now.toLocaleString(),
    });

    // Set initial timeout to sync with next minute
    setTimeout(() => {
      // Send first tick - this should happen at the start of the minute
      const tickEvent = this.createTickEvent();
      this.broadcastToAllClients(tickEvent);

      // Then set interval for every minute
      this.tickInterval = setInterval(() => {
        const tickEvent = this.createTickEvent();
        this.broadcastToAllClients(tickEvent);
      }, 60000); // 60 seconds
    }, msUntilNextMinute);
  }

  getStats(): { clientCount: number; uptime: string } {
    return {
      clientCount: this.clients.size,
      uptime: process.uptime().toString(),
    };
  }

  shutdown(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    // Close all client connections
    this.clients.forEach((client, clientId) => {
      try {
        client.response.end();
      } catch (error) {
        loggerService.error("Error closing client connection", error as Error, {
          clientId,
        });
      }
    });

    this.clients.clear();
    loggerService.info("Tick service shut down");
  }
}
