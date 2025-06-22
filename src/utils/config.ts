import dotenv from "dotenv";

import { IAppConfig } from "../types";

dotenv.config();

const getEnvVariable = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value || defaultValue!;
};

const getEnvNumber = (key: string, defaultValue?: number): number => {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required`);
  }
  const parsed = parseInt(value || String(defaultValue), 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  return parsed;
};

export const config: IAppConfig = {
  port: getEnvNumber("PORT", 3000),
  nodeEnv: getEnvVariable("NODE_ENV", "development"),
  corsOrigin: getEnvVariable("CORS_ORIGIN", "http://localhost:3000"),
  logLevel: getEnvVariable("LOG_LEVEL", "info"),
};

export const isDevelopment = config.nodeEnv === "development";
export const isProduction = config.nodeEnv === "production";
