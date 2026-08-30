import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred in the networking lab engine.';

  console.error(`[API Error] ${req.method} ${req.path} (${code}): ${message}`);

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message
    }
  });
}
