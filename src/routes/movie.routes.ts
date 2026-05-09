import { Router } from "express";
import { z } from "zod";

import { validate } from "../middleware/validate";
import { createMovieSchema, updateMovieSchema } from "../schemas/movie.schema";
import { MovieStorage } from "../storage/movie.storage";

const movieRouter = Router();
const movieStorage = new MovieStorage();

const movieIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const moviesQuerySchema = z.object({
  genre: z.enum(["Action", "Comedy", "Drama"]).optional(),
  director: z.string().min(1).optional(),
});

movieRouter.get("/", (req, res) => {
  const filtersResult = moviesQuerySchema.safeParse(req.query);
  if (!filtersResult.success) {
    return res.status(400).json({
      message: "Validation failed",
      issues: filtersResult.error.issues,
    });
  }

  const movies = movieStorage.getAll(filtersResult.data);

  return res.status(200).json(movies);
});

movieRouter.get("/top-rated", (_req, res) => {
  const movies = movieStorage.getTopRated();
  return res.status(200).json(movies);
});

movieRouter.get("/:id", (req, res) => {
  const idResult = movieIdParamsSchema.safeParse(req.params);
  if (!idResult.success) {
    return res.status(400).json({
      message: "Validation failed",
      issues: idResult.error.issues,
    });
  }

  const { id } = idResult.data;
  const movie = movieStorage.getById(id);

  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }

  return res.status(200).json(movie);
});

movieRouter.post("/", validate(createMovieSchema), (req, res) => {
  const createdMovie = movieStorage.create(req.body);
  return res.status(201).json(createdMovie);
});

movieRouter.patch("/:id", validate(updateMovieSchema), (req, res) => {
  const idResult = movieIdParamsSchema.safeParse(req.params);
  if (!idResult.success) {
    return res.status(400).json({
      message: "Validation failed",
      issues: idResult.error.issues,
    });
  }

  const { id } = idResult.data;
  const updatedMovie = movieStorage.update(id, req.body);

  if (!updatedMovie) {
    return res.status(404).json({ message: "Movie not found" });
  }

  return res.status(200).json(updatedMovie);
});

movieRouter.delete("/:id", (req, res) => {
  const idResult = movieIdParamsSchema.safeParse(req.params);
  if (!idResult.success) {
    return res.status(400).json({
      message: "Validation failed",
      issues: idResult.error.issues,
    });
  }

  const { id } = idResult.data;
  const wasDeleted = movieStorage.delete(id);

  if (!wasDeleted) {
    return res.status(404).json({ message: "Movie not found" });
  }

  return res.status(204).send();
});

export { movieRouter };

