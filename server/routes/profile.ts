import { Hono } from "hono";
import { getDb } from "../db/init.js";
import { generateQrToken } from "../qr.js";
import { verifySignature } from "../middleware/verify.js";
import type { RegisterRequest, RegisterResponse, ErrorResponse } from "../../shared/types.js";

const app = new Hono();

// POST /api/v1/register — Register a new Agent profile
app.post("/v1/register", async (c) => {
  const db = await getDb();
  const body = await c.req.json<RegisterRequest>();

  const profileJson = JSON.stringify(body.profile);
  if (!verifySignature(profileJson, body.signature, body.profile.trust.public_key)) {
    return c.json<ErrorResponse>({ success: false, error: "Invalid signature" }, 401);
  }

  const existing = db.exec(`SELECT did FROM profiles WHERE did = '${body.profile.did}'`);
  if (existing[0]?.values?.length > 0) {
    return c.json<ErrorResponse>({ success: false, error: "DID already registered" }, 409);
  }

  const qrToken = generateQrToken(body.profile.did);
  const now = new Date().toISOString();
  const profileWithMeta = {
    ...body.profile,
    qr_token: qrToken,
    profile_url: `https://agent-id.card/q/${qrToken}`,
    trust: { ...body.profile.trust, created_at: now, updated_at: now },
  };

  db.run(
    "INSERT INTO profiles (did, qr_token, profile_json, signature, public_key) VALUES (?, ?, ?, ?, ?)",
    [body.profile.did, qrToken, JSON.stringify(profileWithMeta), body.signature, body.profile.trust.public_key]
  );

  return c.json<RegisterResponse>({
    success: true,
    qr_token: qrToken,
    profile_url: profileWithMeta.profile_url,
    did: body.profile.did,
  });
});

// GET /api/v1/profile/:qr_token — Get a profile by short token
app.get("/v1/profile/:qr_token", async (c) => {
  const db = await getDb();
  const qrToken = c.req.param("qr_token");

  const result = db.exec(`SELECT profile_json FROM profiles WHERE qr_token = '${qrToken}'`);

  if (!result[0]?.values?.length) {
    return c.json<ErrorResponse>({ success: false, error: "Profile not found" }, 404);
  }

  return c.json(JSON.parse(result[0].values[0][0] as string));
});

// POST /api/v1/profile/:qr_token/update — Update an existing profile
app.post("/v1/profile/:qr_token/update", async (c) => {
  const db = await getDb();
  const qrToken = c.req.param("qr_token");
  const body = await c.req.json<{ profile: any; signature: string }>();

  const profileJson = JSON.stringify(body.profile);
  if (!verifySignature(profileJson, body.signature, body.profile.trust.public_key)) {
    return c.json<ErrorResponse>({ success: false, error: "Invalid signature" }, 401);
  }

  const existing = db.exec(`SELECT did FROM profiles WHERE qr_token = '${qrToken}'`);
  if (!existing[0]?.values?.length) {
    return c.json<ErrorResponse>({ success: false, error: "Profile not found" }, 404);
  }

  const now = new Date().toISOString();
  const profileWithMeta = { ...body.profile, qr_token: qrToken, trust: { ...body.profile.trust, updated_at: now } };

  db.run(
    "UPDATE profiles SET profile_json = ?, signature = ?, updated_at = datetime('now') WHERE qr_token = ?",
    [JSON.stringify(profileWithMeta), body.signature, qrToken]
  );

  return c.json({ success: true, updated_at: now });
});

export default app;
