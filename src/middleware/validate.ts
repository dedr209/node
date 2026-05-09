import type { Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";

export const validate = (schema: ZodType<unknown>): RequestHandler => {
  return (req: Request, _res: Response, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
};

