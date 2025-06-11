import type { ServerResponse } from "http";

export interface IAppConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  logLevel: string;
}

export interface ITickEvent {
  timestamp: string;
  minute: number;
  hour: number;
  date: string;
  message: string;
}

export interface ISSEClient {
  id: string;
  response: ServerResponse;
  lastPing: Date;
}

export interface ILoggerService {
  info: (message: string, meta?: Record<string, unknown>) => void;
  error: (
    message: string,
    error?: Error,
    meta?: Record<string, unknown>,
  ) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  debug: (message: string, meta?: Record<string, unknown>) => void;
}
