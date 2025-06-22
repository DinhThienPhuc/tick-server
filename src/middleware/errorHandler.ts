import type { NextFunction, Request, Response } from "express";

import { loggerService } from "../utils/logger";

export interface IAppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

export const createError = (message: string, statusCode = 500): IAppError => {
  const error = new Error(message) as IAppError;
  error.statusCode = statusCode;
  error.status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";
  error.isOperational = true;
  return error;
};

export const errorHandler = (
  err: IAppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const statusCode = err.statusCode || 500;
  const status = err.status || "error";

  loggerService.error("Express error handler", err, {
    url: req.url,
    method: req.method,
    statusCode,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
  });

  // Don't leak error details in production
  const message = statusCode === 500 ? "Internal Server Error" : err.message;

  res.status(statusCode).json({
    status,
    message,
    ...(process.env["NODE_ENV"] === "development" && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    status: "fail",
    message: `Route ${req.originalUrl} not found`,
  });
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
};
