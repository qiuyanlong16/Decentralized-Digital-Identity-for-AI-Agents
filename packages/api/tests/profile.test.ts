import { describe, it, expect, beforeAll } from "vitest";
import app from "../index.js";
import nacl from "tweetnacl";
import { encodeBase64 } from "tweetnacl-util";

function signedProfile(name: string) {
  const kp = nacl.sign.keyPair();
  const profile = {
    v: 1,
    did: `did:key:test_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    personality: "A test agent",
    framework: { type: "openclaw" as const, version: "0.12.0" },
    skills: [{ name: "code-review", description: "Code review", version: "1.0", source: "clawhub" as const }],
    capabilities: ["shell", "file_edit"],
    channels: [{ type: "telegram" as const, id: "@test_bot" }],
    trust: { public_key: encodeBase64(kp.publicKey), issuer: "self" as const },
  };
  const json = JSON.stringify(profile);
  const sig = nacl.sign.detached(new TextEncoder().encode(json), kp.secretKey);
  return { profile, signature: `sig:${encodeBase64(sig)}` };
}

describe("POST /api/v1/register", () => {
  it("registers and returns qr_token", async () => {
    const { profile, signature } = signedProfile("TestAgent");
    const res = await app.request("/api/v1/register", {
      method: "POST",
      body: JSON.stringify({ profile, signature }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.qr_token).toMatch(/^agtid_/);
  });

  it("rejects invalid signature", async () => {
    const { profile } = signedProfile("BadAgent");
    const res = await app.request("/api/v1/register", {
      method: "POST",
      body: JSON.stringify({ profile, signature: "sig:invalid" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/profile/:qr_token", () => {
  it("returns registered profile", async () => {
    const { profile, signature } = signedProfile("LookupTest");
    const reg = await app.request("/api/v1/register", {
      method: "POST",
      body: JSON.stringify({ profile, signature }),
      headers: { "Content-Type": "application/json" },
    });
    const regData = await reg.json() as any;

    const res = await app.request(`/api/v1/profile/${regData.qr_token}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe("LookupTest");
  });

  it("404 for unknown token", async () => {
    const res = await app.request("/api/v1/profile/does_not_exist");
    expect(res.status).toBe(404);
  });
});
