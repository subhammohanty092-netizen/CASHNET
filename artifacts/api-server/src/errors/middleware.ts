import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { AppError, NotFoundError, ValidationFailureError } from "./app-error";

export const v1NotFoundHandler: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`No API v1 route matches ${req.method} ${req.path}`));
};

export const apiErrorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const appError = error instanceof ZodError
    ? new ValidationFailureError("Request validation failed", error.issues)
    : error instanceof AppError
      ? error
      : new AppError("INTERNAL_ERROR", "An unexpected error occurred", 500);

  req.log?.error({ err: appError, code: appError.code, statusCode: appError.statusCode }, "API request failed");
  res.status(appError.statusCode).json({
    error: {
      code: appError.code,
      message: appError.message,
      requestId: req.id,
      ...(appError.details === undefined ? {} : { details: appError.details }),
    },
  });
};
