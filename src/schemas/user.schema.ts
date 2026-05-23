import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(6).max(128),
});

export const updateUserSchema = createUserSchema.partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserEntity = CreateUserInput & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

