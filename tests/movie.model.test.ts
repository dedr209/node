import { describe, expect, it, beforeAll, afterAll, afterEach } from "@jest/globals";
import { MovieModel } from "../src/models/movie.model";
import { startTestDB, stopTestDB, clearCollections } from "./setup";

describe("MovieModel Unit Tests", () => {
  beforeAll(async () => {
    await startTestDB();
  });

  afterAll(async () => {
    await stopTestDB();
  });

  afterEach(async () => {
    await clearCollections();
  });

  it("should set default _id with randomUUID", async () => {
    const doc = await MovieModel.create({
      title: "Test Movie",
      genre: "Drama",
      releaseYear: 2020,
    });

    expect(doc._id).toBeDefined();
    expect(typeof doc._id).toBe("string");
    // UUID format: 8-4-4-4-12 hex chars
    expect(doc._id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it("should include createdAt and updatedAt timestamps", async () => {
    const now = new Date();
    const doc = await MovieModel.create({
      title: "Timestamp Test",
      genre: "Action",
      releaseYear: 2022,
    });

    expect(doc.createdAt).toBeDefined();
    expect(doc.updatedAt).toBeDefined();
    expect(new Date(doc.createdAt!).getTime()).toBeGreaterThanOrEqual(now.getTime() - 100);
    expect(new Date(doc.updatedAt!).getTime()).toBeGreaterThanOrEqual(now.getTime() - 100);
  });

  it("should compute releaseAge virtual correctly", async () => {
    const currentYear = new Date().getFullYear();
    const doc = await MovieModel.create({
      title: "Release Age Test",
      genre: "Drama",
      releaseYear: currentYear - 10,
    });

    const json = doc.toJSON({ virtuals: true });
    expect((json as any).releaseAge).toBe(10);
  });

  it("should map _id to id in toJSON output", async () => {
    const doc = await MovieModel.create({
      title: "ID Map Test",
      genre: "Comedy",
      releaseYear: 2021,
    });

    const json = doc.toJSON();
    expect((json as any).id).toBe(doc._id);
    expect((json as any)._id).toBeUndefined();
  });

  it("should validate title does not contain numbers", async () => {
    const invalidDoc = MovieModel.create({
      title: "Movie 123",
      genre: "Action",
      releaseYear: 2020,
    });

    await expect(invalidDoc).rejects.toThrow(/Title cannot contain numbers/);
  });

  it("should validate title minlength of 1", async () => {
    const invalidDoc = MovieModel.create({
      title: "",
      genre: "Drama",
      releaseYear: 2021,
    });

    await expect(invalidDoc).rejects.toThrow(/required/);
  });

  it("should enforce genre enum constraint", async () => {
    const invalidDoc = MovieModel.create({
      title: "Invalid Genre",
      genre: "Horror" as any,
      releaseYear: 2020,
    });

    await expect(invalidDoc).rejects.toThrow();
  });

  it("should enforce releaseYear min constraint (1888)", async () => {
    const invalidDoc = MovieModel.create({
      title: "Too Old",
      genre: "Drama",
      releaseYear: 1800,
    });

    await expect(invalidDoc).rejects.toThrow();
  });

  it("should enforce releaseYear max constraint (2100)", async () => {
    const invalidDoc = MovieModel.create({
      title: "Too New",
      genre: "Action",
      releaseYear: 2150,
    });

    await expect(invalidDoc).rejects.toThrow();
  });

  it("should trim whitespace from title and director", async () => {
    const doc = await MovieModel.create({
      title: "  Trimmed Title  ",
      director: "  Director Name  ",
      genre: "Drama",
      releaseYear: 2020,
    });

    expect(doc.title).toBe("Trimmed Title");
    expect(doc.director).toBe("Director Name");
  });

  it("should allow optional description and director fields", async () => {
    const docWithoutOptional = await MovieModel.create({
      title: "Minimal Movie",
      genre: "Comedy",
      releaseYear: 2019,
    });

    expect(docWithoutOptional.description).toBeUndefined();
    expect(docWithoutOptional.director).toBeUndefined();

    const docWithOptional = await MovieModel.create({
      title: "Full Movie",
      description: "A full movie",
      director: "Someone",
      genre: "Action",
      releaseYear: 2020,
    });

    expect(docWithOptional.description).toBe("A full movie");
    expect(docWithOptional.director).toBe("Someone");
  });
});


