import { z } from "zod";

export const createMovieSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  genre: z.enum(["Action", "Comedy", "Drama"]),
  releaseYear: z.number().min(1888).max(2100),
});

export const updateMovieSchema = createMovieSchema.partial();
void updateMovieSchema;

export type CreateMovieInput = z.infer<typeof createMovieSchema>;
export type MovieEntity = CreateMovieInput & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

void (null as unknown as MovieEntity);


