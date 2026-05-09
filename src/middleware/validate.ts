import type { Request, RequestHandler, Response } from "express";
import type { ZodTypeAny } from "zod";

export const validate = (schema: ZodTypeAny): RequestHandler => {
  return (req: Request, res: Response, next) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        issues: parsed.error.issues,
      });
    }

    req.body = parsed.data;
    return next();
  };
};

