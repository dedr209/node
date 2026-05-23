import { randomUUID } from "crypto";

import { model, Schema, type HydratedDocument } from "mongoose";

import type { MovieEntity } from "../schemas/movie.schema";

export type MovieDocument = Omit<MovieEntity, "id"> & {
  _id: string;
};

export type MovieRecord = HydratedDocument<MovieDocument>;

type MovieJson = {
  _id?: string;
  id?: string;
  __v?: unknown;
} & Record<string, unknown>;

const movieSchema = new Schema<MovieDocument>(
  {
    _id: {
      type: String,
      default: (): string => randomUUID(),
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      validate: {
        validator: (value: string) => !/\d/.test(value),
        message: "Title cannot contain numbers",
      },
    },
    description: {
      type: String,
      maxlength: 500,
    },
    genre: {
      type: String,
      required: true,
      enum: ["Action", "Comedy", "Drama"],
    },
    releaseYear: {
      type: Number,
      required: true,
      min: 1888,
      max: 2100,
    },
  },
  {
    collection: "movies",
    timestamps: true,
    versionKey: false,
    id: false,
  }
);

movieSchema.virtual("releaseAge").get(function (this: MovieDocument) {
  return new Date().getFullYear() - this.releaseYear;
});

movieSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: MovieJson) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const MovieModel = model<MovieDocument>("Movie", movieSchema);

void MovieModel;

const movieRecordTypeReference = null as unknown as MovieRecord;
void movieRecordTypeReference;



