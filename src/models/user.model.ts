import { randomUUID } from "crypto";

import bcrypt from "bcryptjs";
import { model, Schema, type HydratedDocument } from "mongoose";

import type { UserEntity } from "../schemas/user.schema";

export type UserDocument = Omit<UserEntity, "id"> & {
  _id: string;
};

export type UserRecord = HydratedDocument<UserDocument>;

type UserJson = {
  _id?: string;
  id?: string;
  __v?: unknown;
} & Record<string, unknown>;

const userSchema = new Schema<UserDocument>(
  {
    _id: {
      type: String,
      default: (): string => randomUUID(),
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    collection: "users",
    timestamps: { createdAt: true, updatedAt: true },
    versionKey: false,
    id: false,
  }
);

// Hash password before saving if modified
userSchema.pre("save", async function () {
  // `this` is the document being saved
  const doc = this as UserDocument & { password?: string };
  if (!doc.password) return;

  // If password is not modified, skip hashing
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyThis = this as any;
    if (typeof anyThis.isModified === "function" && !anyThis.isModified("password")) return;
  } catch {
    // ignore and proceed to hash
  }

  const salt = await bcrypt.genSalt(10);
  doc.password = await bcrypt.hash(doc.password, salt);
});

userSchema.set("toJSON", {
  versionKey: false,
  virtuals: true,
  transform: (_doc, ret: UserJson) => {
    // hide sensitive fields
    delete ret.password;
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const UserModel = model<UserDocument>("User", userSchema);

void UserModel;

const userRecordTypeReference = null as unknown as UserRecord;
void userRecordTypeReference;

