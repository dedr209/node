import { describe, expect, it, beforeAll, afterAll, afterEach } from "@jest/globals";
import request from "supertest";

import { app } from "../src/app";
import { startTestDB, stopTestDB, clearCollections } from "./setup";

function parseCookieValue(setCookieHeader: string[] | undefined, name: string): string | undefined {
  if (!setCookieHeader) return undefined;
  for (const header of setCookieHeader) {
    if (header.startsWith(`${name}=`)) {
      const parts = header.split(";");
      const [nameValue] = parts[0].split("=");
      const value = parts[0].substring(name.length + 1);
      return value;
    }
  }
  return undefined;
}

describe("Auth Tokens (login/refresh/logout)", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
    await startTestDB();
  });

  afterAll(async () => {
    await stopTestDB();
  });

  afterEach(async () => {
    await clearCollections();
  });

  it("POST /api/auth/login sets httpOnly secure cookies and does not expose tokens in body", async () => {
    const agent = request.agent(app);
    const payload = { email: "tokentest@example.com", password: "strongpass" };

    // register first
    await agent.post("/api/auth/register").send(payload);

    const res = await agent.post("/api/auth/login").send(payload);
    expect(res.status).toBe(200);
    // body should not contain tokens
    expect(res.body).toEqual({});

    const setCookies = res.headers["set-cookie"] as unknown as string[] | undefined;
    expect(setCookies).toBeDefined();
    // should set accessToken and refreshToken cookies
    const access = parseCookieValue(setCookies, "accessToken");
    const refresh = parseCookieValue(setCookies, "refreshToken");
    expect(access).toBeDefined();
    expect(refresh).toBeDefined();

    // cookies should have HttpOnly, Secure, SameSite=Strict
    const joined = setCookies!.join(";");
    expect(joined).toContain("HttpOnly");
    expect(joined).toContain("SameSite=Strict");
    expect(joined).toContain("Secure");
  });

  it("POST /api/auth/refresh rotates refresh token and issues new cookies", async () => {
    const agent = request.agent(app);
    const payload = { email: "rotate@example.com", password: "rotatepass" };
    await agent.post("/api/auth/register").send(payload);
    const loginRes = await agent.post("/api/auth/login").send(payload);
    const loginCookies = loginRes.headers["set-cookie"] as unknown as string[] | undefined;
    const oldRefresh = parseCookieValue(loginCookies, "refreshToken");
    expect(oldRefresh).toBeDefined();

    // include the login set-cookie header explicitly to ensure cookie is sent
    const refreshRes = await agent.post("/api/auth/refresh").set("Cookie", loginCookies || []).send();
    expect(refreshRes.status).toBe(200);
    const refreshCookies = refreshRes.headers["set-cookie"] as unknown as string[] | undefined;
    const newRefresh = parseCookieValue(refreshCookies, "refreshToken");
    expect(newRefresh).toBeDefined();
    // Expect the refresh token to be rotated (different value)
    expect(newRefresh).not.toBe(oldRefresh);
  });

  it("POST /api/auth/logout clears cookies", async () => {
    const agent = request.agent(app);
    const payload = { email: "logout@example.com", password: "logoutpass" };
    await agent.post("/api/auth/register").send(payload);
    await agent.post("/api/auth/login").send(payload);

    const res = await agent.post("/api/auth/logout").send();
    expect(res.status).toBe(204);

    const setCookies = res.headers["set-cookie"] as unknown as string[] | undefined;
    expect(setCookies).toBeDefined();
    // cookies should be cleared (empty value or expired)
    const joined = setCookies!.join(";");
    expect(joined).toMatch(/(Expires=Thu, 01 Jan 1970|Max-Age=0)/);
  });

  it("POST /api/auth/login with invalid credentials returns 401 without revealing specifics", async () => {
    const agent = request.agent(app);
    // use a valid-length password so validation middleware does not reject
    const payload = { email: "doesnotexist@example.com", password: "nope123" };
    const res = await agent.post("/api/auth/login").send(payload);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });
});

