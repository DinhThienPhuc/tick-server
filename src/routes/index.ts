import { randomUUID } from "crypto";
import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";

import { asyncHandler } from "../middleware/errorHandler";
import { TickService } from "../services/TickService";
import { loggerService } from "../utils/logger";

export const createRoutes = (tickService: TickService): Router => {
  const router = createRouter();

  // Health check endpoint
  router.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Stats endpoint
  router.get("/stats", (_req: Request, res: Response) => {
    const stats = tickService.getStats();
    res.json({
      status: "ok",
      data: stats,
      timestamp: new Date().toISOString(),
    });
  });

  // Server-Sent Events endpoint
  router.get(
    "/events",
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const clientId = (req.query["clientId"] as string) || randomUUID();

      loggerService.info("New SSE connection request", {
        clientId,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      tickService.addClient(clientId, res);
    }),
  );

  // Test endpoint to trigger manual tick (for development)
  router.post(
    "/test-tick",
    asyncHandler(async (_req: Request, res: Response): Promise<void> => {
      if (process.env["NODE_ENV"] !== "development") {
        res.status(403).json({
          status: "fail",
          message: "Test endpoint only available in development",
        });
      } else {
        res.json({
          status: "ok",
          message: "Manual tick triggered - check connected clients",
          timestamp: new Date().toISOString(),
        });
      }
    }),
  );

  return router;
};
