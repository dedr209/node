import { describe, expect, it, beforeAll, afterAll, afterEach } from "@jest/globals";
import request from "supertest";
import bcrypt from "bcryptjs";

import { app } from "../src/app";
import { UserModel } from "../src/models/user.model";
import { startTestDB, stopTestDB, clearCollections } from "./setup";

describe("Auth API", () => {
  beforeAll(async () => {
    await startTestDB();
  });

  afterAll(async () => {
    await stopTestDB();
  });

  afterEach(async () => {
    await clearCollections();
  });

  it("POST /api/auth/register - successful registration returns 201 and hides password", async () => {
    const payload = { email: "user@example.com", password: "secret123" };

    const res = await request(app).post("/api/auth/register").send(payload);

    expect(res.status).toBe(201);
    expect(res.body.email).toBe(payload.email);
    expect(res.body.id).toEqual(expect.any(String));
    expect(res.body.createdAt).toEqual(expect.any(String));
    expect(res.body.password).toBeUndefined();

    const stored = await UserModel.findOne({ email: payload.email }).lean();
    expect(stored).toBeTruthy();
    expect((stored as any).password).toBeDefined();
    expect((stored as any).password).not.toBe(payload.password);

    const match = await bcrypt.compare(payload.password, (stored as any).password);
    expect(match).toBe(true);
  });

  it("POST /api/auth/register - duplicate email returns 409", async () => {
    const payload = { email: "dup@example.com", password: "password1" };
    await request(app).post("/api/auth/register").send(payload);

    const res = await request(app).post("/api/auth/register").send(payload);
    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Email already in use");
  });

  it("POST /api/auth/register - invalid input returns 400", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "not-an-email", password: "1" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed");
  });

  it("POST /api/auth/register - concurrent registrations result in one success and one conflict", async () => {
    const payload = { email: "race@example.com", password: "racepass" };

    // fire two requests concurrently to simulate a race
    const [r1, r2] = await Promise.all([
      request(app).post("/api/auth/register").send(payload),
      request(app).post("/api/auth/register").send(payload),
    ]);

    const statuses = [r1.status, r2.status].sort();
    // expecting one 201 and one 409 in either order
    expect(statuses).toEqual([201, 409]);
  });
});

