import { randomUUID } from "crypto";

import type {
  CreateMovieInput,
  MovieEntity,
  UpdateMovieInput,
} from "../schemas/movie.schema";

type Movie = MovieEntity;

export class MovieStorage {
  private movies = new Map<string, Movie>();

  create(data: CreateMovieInput): Movie {
    const now = new Date();
    const movie: Movie = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      ...data,
    };

    this.movies.set(movie.id, movie);
    return movie;
  }

  getById(id: string): Movie | undefined {
    return this.movies.get(id);
  }

  update(id: string, data: UpdateMovieInput): Movie | undefined {
    const existing = this.movies.get(id);
    if (!existing) {
      return undefined;
    }

    const updated: Movie = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };

    this.movies.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.movies.delete(id);
  }

  reset(): void {
    this.movies.clear();
  }

  getTopRated(): Movie[] {
    return [...this.movies.values()].filter((movie) => movie.releaseYear > 2020);
  }
}

