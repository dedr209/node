import { Router, Response } from "express";
import { z } from "zod";

import { asyncHandler } from "../middleware/asyncHandler";
import { validate } from "../middleware/validate";
import { createMovieSchema, updateMovieSchema } from "../schemas/movie.schema";
import { storage } from "../storage/movie.storage";
import { requireAuth } from "../middleware/requireAuth";

const movieRouter = Router();

const movieIdParamsSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ID format"),
});

const moviesQuerySchema = z
    .object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(10),
        sortBy: z.enum(["createdAt", "releaseYear", "title"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        genre: z.enum(["Action", "Comedy", "Drama"]).optional(),
        director: z.string().min(1).optional(),
        title: z.string().min(1).optional(),
        releaseYearMin: z.coerce.number().int().min(1888).max(2100).optional(),
        releaseYearMax: z.coerce.number().int().min(1888).max(2100).optional(),
    })
    .refine(
        (query) =>
            query.releaseYearMin === undefined ||
            query.releaseYearMax === undefined ||
            query.releaseYearMin <= query.releaseYearMax,
        {
            message: "releaseYearMin must be less than or equal to releaseYearMax",
            path: ["releaseYearMin"],
        }
    );

async function checkMovieOwnership(id: string, userId: string | undefined, res: Response) {
    const movie = await storage.getById(id);

    if (!movie) {
        res.status(404).json({ message: "Movie not found" });
        return null;
    }

    if (movie.ownerId?.toString() !== userId) {
        res.status(403).json({ message: "Forbidden: You do not own this resource" });
        return null;
    }

    return movie;
}

// GET routes remain public
movieRouter.get("/", asyncHandler(async (req, res) => {
    const listFilters = moviesQuerySchema.parse(req.query);
    const movies = await storage.getAll(listFilters);

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

movieRouter.post("/", requireAuth, validate(createMovieSchema), asyncHandler(async (req, res) => {
    const moviePayload = {
        ...req.body,
        ownerId: req.userId,
    };

    const createdMovie = await storage.create(moviePayload);
    return res.status(201).json(createdMovie);
}));

movieRouter.patch("/:id", requireAuth, validate(updateMovieSchema), asyncHandler(async (req, res) => {
    const { id } = movieIdParamsSchema.parse(req.params);

    const movie = await checkMovieOwnership(id, req.userId, res);
    if (!movie) return;

    // 3. Execute Update
    const updatedMovie = await storage.update(id, req.body);
    return res.status(200).json(updatedMovie);
}));

movieRouter.delete("/:id", requireAuth, asyncHandler(async (req, res) => {
    const { id } = movieIdParamsSchema.parse(req.params);

    const movie = await checkMovieOwnership(id, req.userId, res);
    if (!movie) return;

    await storage.delete(id);
    return res.status(204).send();
}));

export { movieRouter };