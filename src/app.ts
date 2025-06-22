import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { createRoutes } from "./routes";
import { TickService } from "./services/TickService";
import { config } from "./utils/config";
import { loggerService } from "./utils/logger";

export const createApp = (): {
  app: express.Application;
  tickService: TickService;
} => {
  const app = express();
  const tickService = new TickService();

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS configuration
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
    }),
  );

  // Compression middleware
  app.use(compression());

  // Request logging
  app.use(
    morgan("combined", {
      stream: {
        write: (message: string) => {
          loggerService.info(message.trim(), { source: "morgan" });
        },
      },
    }),
  );

  // Parse JSON bodies
  app.use(express.json({ limit: "10mb" }));

  // Parse URL-encoded bodies
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // API routes
  app.use("/api", createRoutes(tickService));

  // Root endpoint
  app.get("/", (_req, res) => {
    res.json({
      name: "Tick Server",
      description:
        "Server-sent events service that broadcasts events every minute",
      version: "1.0.0",
      endpoints: {
        health: "/api/health",
        stats: "/api/stats",
        events: "/api/events",
        testTick: "/api/test-tick (development only)",
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Handle 404 errors
  app.use(notFoundHandler);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return { app, tickService };
};
