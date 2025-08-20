import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export class AppError extends Error implements ApiError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { statusCode = 500, message } = error;

  console.error(`Error ${statusCode}:`, message);
  
  if (process.env.NODE_ENV === 'development') {
    console.error(error.stack);
  }

  const extra: any = {};
  // Surface minimal diagnostics even in production for MVP debugging
  const anyErr: any = error as any;
  if (anyErr?.code) extra.code = anyErr.code;
  if (anyErr?.detail) extra.detail = anyErr.detail;

  res.status(statusCode).json({
    success: false,
    error: {
      message: statusCode === 500 ? 'Internal server error' : message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      ...extra,
    },
  });
};

export const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
