import { Router } from "express";
import { z } from "zod";

import { asyncHandler } from "../middleware/asyncHandler";
import { validate } from "../middleware/validate";
import { createMovieSchema, updateMovieSchema } from "../schemas/movie.schema";
import { storage } from "../storage/movie.storage";

const movieRouter = Router();

const movieIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const moviesQuerySchema = z.object({
  genre: z.enum(["Action", "Comedy", "Drama"]).optional(),
  director: z.string().min(1).optional(),
});

movieRouter.get("/", asyncHandler(async (req, res) => {
  const filters = moviesQuerySchema.parse(req.query);
  const movies = await storage.getAll(filters);

  return res.status(200).json(movies);
}));

movieRouter.get("/top-rated", asyncHandler(async (_req, res) => {
  const movies = await storage.getTopRated();
  return res.status(200).json(movies);
}));

movieRouter.get("/:id", asyncHandler(async (req, res) => {
  const { id } = movieIdParamsSchema.parse(req.params);
  const movie = await storage.getById(id);

  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }

  return res.status(200).json(movie);
}));

movieRouter.post("/", validate(createMovieSchema), asyncHandler(async (req, res) => {
  const createdMovie = await storage.create(req.body);
  return res.status(201).json(createdMovie);
}));

movieRouter.patch("/:id", validate(updateMovieSchema), asyncHandler(async (req, res) => {
  const { id } = movieIdParamsSchema.parse(req.params);
  const updatedMovie = await storage.update(id, req.body);

  if (!updatedMovie) {
    return res.status(404).json({ message: "Movie not found" });
  }

  return res.status(200).json(updatedMovie);
}));

movieRouter.delete("/:id", asyncHandler(async (req, res) => {
  const { id } = movieIdParamsSchema.parse(req.params);
  const wasDeleted = await storage.delete(id);

  if (!wasDeleted) {
    return res.status(404).json({ message: "Movie not found" });
  }

  return res.status(204).send();
}));

export { movieRouter };

