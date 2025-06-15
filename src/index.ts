import { createApp } from "./app";
import { config } from "./utils/config";
import { loggerService } from "./utils/logger";

// Handle uncaught exceptions
process.on("uncaughtException", (err: Error) => {
  loggerService.error("Uncaught Exception", err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on(
  "unhandledRejection",
  (reason: unknown, promise: Promise<unknown>) => {
    loggerService.error("Unhandled Rejection", new Error(String(reason)), {
      promise,
    });
    process.exit(1);
  },
);

const startServer = (): void => {
  try {
    const { app, tickService } = createApp();

    const server = app.listen(config.port, () => {
      loggerService.info("Server started successfully", {
        port: config.port,
        nodeEnv: config.nodeEnv,
        corsOrigin: config.corsOrigin,
      });
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      loggerService.info(`Received ${signal}. Starting graceful shutdown...`);

      server.close(() => {
        loggerService.info("HTTP server closed");

        tickService.shutdown();

        loggerService.info("Graceful shutdown completed");
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        loggerService.error("Forced shutdown due to timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    loggerService.error("Failed to start server", error as Error);
    process.exit(1);
  }
};

startServer();
