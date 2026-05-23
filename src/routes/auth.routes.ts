import { Router } from "express";

import { asyncHandler } from "../middleware/asyncHandler";
import { validate } from "../middleware/validate";
import { createUserSchema } from "../schemas/user.schema";
import { UserModel } from "../models/user.model";

const authRouter = Router();

authRouter.post(
  "/register",
  validate(createUserSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };

    const existing = await UserModel.findOne({ email }).lean();
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const user = new UserModel({ email, password });
    const created = await user.save();

    return res.status(201).json(created.toJSON());
  })
);

export { authRouter };

