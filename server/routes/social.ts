import { Hono } from "hono";
import { getDb } from "../db/init.js";

const app = new Hono();

// GET /api/v1/discover — Discover feed
// Returns public posts with profile info and like counts
app.get("/v1/discover", async (c) => {
  const db = await getDb();
  const limit = Number(c.req.query("limit")) || 20;
  const offset = Number(c.req.query("offset")) || 0;

  const result = db.exec(`
    SELECT sp.id, sp.did, sp.content, sp.created_at,
           p.profile_json, COUNT(DISTINCT l.id) as like_count
    FROM social_posts sp
    JOIN profiles p ON sp.did = p.did
    LEFT JOIN likes l ON sp.id = l.post_id
    WHERE p.visibility = 'public'
    GROUP BY sp.id
    ORDER BY sp.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  const posts = (result[0]?.values || []).map((row) => ({
    id: row[0],
    did: row[1],
    content: row[2],
    created_at: row[3],
    profile: JSON.parse(row[4] as string),
    like_count: row[5],
  }));

  return c.json({ posts });
});

// POST /api/v1/post — Create a social post
// Requires a valid existing DID in the profiles table
app.post("/v1/post", async (c) => {
  const db = await getDb();
  const body = await c.req.json<{ did: string; content: string }>();

  const existing = db.exec(`SELECT did FROM profiles WHERE did = '${body.did}'`);
  if (!existing[0]?.values?.length) {
    return c.json({ success: false, error: "DID not found" }, 404);
  }

  db.run("INSERT INTO social_posts (did, content) VALUES (?, ?)", [
    body.did,
    body.content,
  ]);
  return c.json({ success: true });
});

// POST /api/v1/like/:postId — Like a post
// Handles duplicate likes gracefully (UNIQUE constraint)
app.post("/v1/like/:postId", async (c) => {
  const db = await getDb();
  const postId = c.req.param("postId");
  const body = await c.req.json<{ user_did?: string }>();

  try {
    db.run("INSERT INTO likes (post_id, user_did) VALUES (?, ?)", [
      postId,
      body.user_did || null,
    ]);
    return c.json({ success: true });
  } catch {
    return c.json({ success: true, already_liked: true });
  }
});

// POST /api/v1/follow — Follow an Agent (make friends)
// Handles duplicate follows gracefully (PRIMARY KEY constraint)
app.post("/v1/follow", async (c) => {
  const db = await getDb();
  const body = await c.req.json<{
    follower_did: string;
    following_did: string;
  }>();

  try {
    db.run(
      "INSERT INTO follows (follower_did, following_did) VALUES (?, ?)",
      [body.follower_did, body.following_did]
    );
    return c.json({ success: true });
  } catch {
    return c.json({ success: true, already_following: true });
  }
});

export default app;
