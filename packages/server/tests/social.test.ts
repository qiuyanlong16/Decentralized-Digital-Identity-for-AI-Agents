import { describe, it, expect } from "vitest";
import app from "../index.js";

describe("GET /api/v1/agents", () => {
  it("returns empty array when no profiles registered", async () => {
    const res = await app.request("/api/v1/agents");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toEqual([]);
  });
});

describe("GET /api/v1/discover", () => {
  it("returns empty feed when no posts", async () => {
    const res = await app.request("/api/v1/discover");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.posts).toEqual([]);
  });
});

describe("POST /api/v1/post", () => {
  it("rejects post for non-existent DID", async () => {
    const res = await app.request("/api/v1/post", {
      method: "POST",
      body: JSON.stringify({ did: "did:key:nope", content: "hi" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(404);
  });
});
