import { randomUUID } from "crypto";

import { beforeAll, afterAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";

import { app } from "../src/app";
import { connectDB, closeDB } from "../src/db/mongo";
import type { CreateMovieInput } from "../src/schemas/movie.schema";
import { storage } from "../src/storage/movie.storage";

const baseMovie = {
  title: "Interstellar",
  description: "Sci-fi movie",
  genre: "Drama",
  releaseYear: 2014,
};

describe("Movie API", () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    await storage.reset();
  });

  it("POST /api/movies - valid movie returns 201", async () => {
    const response = await request(app).post("/api/movies").send(baseMovie);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: baseMovie.title,
      description: baseMovie.description,
      genre: baseMovie.genre,
      releaseYear: baseMovie.releaseYear,
    });
    expect(response.body.id).toEqual(expect.any(String));
    expect(response.body.createdAt).toEqual(expect.any(String));
    expect(response.body.updatedAt).toEqual(expect.any(String));
  });

  it("POST /api/movies - invalid data returns 400", async () => {
    const response = await request(app).post("/api/movies").send({
      title: "",
      genre: "Drama",
      releaseYear: 1700,
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
    expect(Array.isArray(response.body.issues)).toBe(true);
  });

  it("GET /api/movies - returns array with 200", async () => {
    await request(app).post("/api/movies").send(baseMovie);
    await request(app).post("/api/movies").send({
      ...baseMovie,
      title: "The Dark Knight",
      genre: "Action",
      releaseYear: 2008,
    });

    const response = await request(app).get("/api/movies");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.pagination).toMatchObject({
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  it("GET /api/movies - filters by genre with 200", async () => {
    await request(app).post("/api/movies").send({
      ...baseMovie,
      title: "Mad Max: Fury Road",
      genre: "Action",
    });
    await request(app).post("/api/movies").send({
      ...baseMovie,
      title: "Forrest Gump",
      genre: "Drama",
      releaseYear: 1994,
    });

    const response = await request(app).get("/api/movies").query({ genre: "Action" });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].genre).toBe("Action");
  });

  it("GET /api/movies - filters by director with 200", async () => {
    await storage.create({
      title: "Inception",
      genre: "Action",
      releaseYear: 2010,
      director: "Christopher Nolan",
    } as unknown as CreateMovieInput);
    await storage.create({
      title: "Superbad",
      genre: "Comedy",
      releaseYear: 2007,
      director: "Greg Mottola",
    } as unknown as CreateMovieInput);

    const response = await request(app)
      .get("/api/movies")
      .query({ director: "Christopher Nolan" });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].title).toBe("Inception");
  });

  it("GET /api/movies - filters by title regex and releaseYear range with 200", async () => {
    await request(app).post("/api/movies").send({
      ...baseMovie,
      title: "Dune Part One",
      releaseYear: 2021,
      genre: "Action",
    });
    await request(app).post("/api/movies").send({
      ...baseMovie,
      title: "Dune Documentary",
      releaseYear: 2018,
      genre: "Drama",
    });

    const response = await request(app)
      .get("/api/movies")
      .query({ title: "dune", releaseYearMin: 2020, releaseYearMax: 2022 });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].title).toBe("Dune Part One");
  });

  it("GET /api/movies - sorts and paginates with 200", async () => {
    const scopedTitlePrefix = "Pagination Scope Alpha";

    await request(app).post("/api/movies").send({
      ...baseMovie,
      title: `${scopedTitlePrefix} One`,
      releaseYear: 2001,
      genre: "Action",
    });
    await request(app).post("/api/movies").send({
      ...baseMovie,
      title: `${scopedTitlePrefix} Two`,
      releaseYear: 2002,
      genre: "Action",
    });
    await request(app).post("/api/movies").send({
      ...baseMovie,
      title: `${scopedTitlePrefix} Three`,
      releaseYear: 2003,
      genre: "Action",
    });

    const response = await request(app)
      .get("/api/movies")
      .query({
        title: scopedTitlePrefix,
        page: 2,
        limit: 1,
        sortBy: "releaseYear",
        sortOrder: "asc",
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].releaseYear).toBe(2002);
    expect(response.body.pagination).toMatchObject({
      page: 2,
      limit: 1,
      total: 3,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it("GET /api/movies/:id - existing movie returns 200", async () => {
    const createResponse = await request(app).post("/api/movies").send(baseMovie);
    const movieId = createResponse.body.id;

    const response = await request(app).get(`/api/movies/${movieId}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(movieId);
  });

  it("GET /api/movies/:id - non-existing movie returns 404", async () => {
    const response = await request(app).get(`/api/movies/${randomUUID()}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Movie not found");
  });

  it("PATCH /api/movies/:id - valid update returns 200", async () => {
    const createResponse = await request(app).post("/api/movies").send(baseMovie);
    const movieId = createResponse.body.id;

    const response = await request(app)
      .patch(`/api/movies/${movieId}`)
      .send({ title: "Interstellar (Updated)" });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe("Interstellar (Updated)");
    expect(response.body.id).toBe(movieId);
  });

  it("PATCH /api/movies/:id - non-existing movie returns 404", async () => {
    const response = await request(app)
      .patch(`/api/movies/${randomUUID()}`)
      .send({ title: "Ghost movie" });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Movie not found");
  });

  it("PATCH /api/movies/:id - invalid update data returns 400", async () => {
    const createResponse = await request(app).post("/api/movies").send(baseMovie);
    const movieId = createResponse.body.id;

    const response = await request(app)
      .patch(`/api/movies/${movieId}`)
      .send({ releaseYear: 1700 });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });

  it("DELETE /api/movies/:id - existing movie returns 204", async () => {
    const createResponse = await request(app).post("/api/movies").send(baseMovie);
    const movieId = createResponse.body.id;

    const response = await request(app).delete(`/api/movies/${movieId}`);

    expect(response.status).toBe(204);

    const afterDelete = await request(app).get(`/api/movies/${movieId}`);
    expect(afterDelete.status).toBe(404);
  });

  it("DELETE /api/movies/:id - non-existing movie returns 404", async () => {
    const response = await request(app).delete(`/api/movies/${randomUUID()}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Movie not found");
  });

  it("GET /api/movies/top-rated - returns movies with releaseYear > 2020", async () => {
    await request(app).post("/api/movies").send({
      ...baseMovie,
      title: "Dune",
      genre: "Action",
      releaseYear: 2021,
    });
    await request(app).post("/api/movies").send({
      ...baseMovie,
      title: "Old classic",
      releaseYear: 1990,
    });

    const response = await request(app).get("/api/movies/top-rated");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe("Dune");
  });
});

