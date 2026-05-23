import type { ErrorRequestHandler } from "express";
import { Error as MongooseError } from "mongoose";
import { MongoServerError } from "mongodb";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      issues: err.issues,
    });
  }

  if (err instanceof MongooseError.CastError) {
    return res.status(400).json({
      message: "Invalid id format",
    });
  }

  if (err instanceof MongooseError.ValidationError) {
    return res.status(400).json({
      message: "Validation failed",
      issues: Object.values(err.errors).map((validationError) => ({
        path: validationError.path,
        message: validationError.message,
      })),
    });
  }

  if (err instanceof MongoServerError && err.code === 11000) {
    return res.status(409).json({
      message: "Duplicate key conflict",
    });
  }

  return res.status(500).json({
    message: "Internal server error",
  });
};

