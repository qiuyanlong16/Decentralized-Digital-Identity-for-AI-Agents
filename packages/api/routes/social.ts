import { Hono } from "hono";
import { getDb } from "../db/init.js";

const app = new Hono();

// GET /api/v1/agents — Discover feed of public agent profiles
// Returns a JSON array of public agent profiles for the discover page
app.get("/v1/agents", async (c) => {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT profile_json FROM profiles WHERE visibility = 'public' ORDER BY created_at DESC"
    )
    .all() as { profile_json: string }[];

  const profiles = rows.map((row) => JSON.parse(row.profile_json));

  return c.json(profiles);
});

// GET /api/v1/stats — Registration and activity stats
app.get("/v1/stats", async (c) => {
  const db = getDb();

  const totalAgents = db.prepare("SELECT COUNT(*) as count FROM profiles").get() as { count: number };
  const publicAgents = db.prepare("SELECT COUNT(*) as count FROM profiles WHERE visibility = 'public'").get() as { count: number };
  const privateAgents = db.prepare("SELECT COUNT(*) as count FROM profiles WHERE visibility = 'private'").get() as { count: number };
  const totalPosts = db.prepare("SELECT COUNT(*) as count FROM social_posts").get() as { count: number };
  const totalFollows = db.prepare("SELECT COUNT(*) as count FROM follows").get() as { count: number };
  const totalLikes = db.prepare("SELECT COUNT(*) as count FROM likes").get() as { count: number };

  return c.json({
    total_agents: totalAgents.count,
    public_agents: publicAgents.count,
    private_agents: privateAgents.count,
    total_posts: totalPosts.count,
    total_follows: totalFollows.count,
    total_likes: totalLikes.count,
  });
});

// GET /api/v1/discover — Discover feed
// Returns public posts with profile info and like counts
app.get("/v1/discover", async (c) => {
  const db = getDb();
  const limit = Number(c.req.query("limit")) || 20;
  const offset = Number(c.req.query("offset")) || 0;

  const rows = db
    .prepare(
      `SELECT sp.id, sp.did, sp.content, sp.created_at,
              p.profile_json, COUNT(DISTINCT l.id) as like_count
       FROM social_posts sp
       JOIN profiles p ON sp.did = p.did
       LEFT JOIN likes l ON sp.id = l.post_id
       WHERE p.visibility = 'public'
       GROUP BY sp.id
       ORDER BY sp.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(limit, offset) as Array<{
      id: number;
      did: string;
      content: string;
      created_at: string;
      profile_json: string;
      like_count: number;
    }>;

  const posts = rows.map((row) => ({
    id: row.id,
    did: row.did,
    content: row.content,
    created_at: row.created_at,
    profile: JSON.parse(row.profile_json),
    like_count: row.like_count,
  }));

  return c.json({ posts });
});

// POST /api/v1/post — Create a social post
// Requires a valid existing DID in the profiles table
app.post("/v1/post", async (c) => {
  const db = getDb();
  const body = await c.req.json<{ did: string; content: string }>();

  const existing = db.prepare("SELECT did FROM profiles WHERE did = ?").get(body.did);
  if (!existing) {
    return c.json({ success: false, error: "DID not found" }, 404);
  }

  db.prepare("INSERT INTO social_posts (did, content) VALUES (?, ?)").run(
    body.did,
    body.content
  );
  return c.json({ success: true });
});

// POST /api/v1/like/:postId — Like a post
// Handles duplicate likes gracefully (UNIQUE constraint)
app.post("/v1/like/:postId", async (c) => {
  const db = getDb();
  const postId = c.req.param("postId");
  const body = await c.req.json<{ user_did?: string }>();

  try {
    db.prepare("INSERT INTO likes (post_id, user_did) VALUES (?, ?)").run(
      postId,
      body.user_did || null
    );
    return c.json({ success: true });
  } catch {
    return c.json({ success: true, already_liked: true });
  }
});

// POST /api/v1/follow — Follow an Agent (make friends)
// Handles duplicate follows gracefully (PRIMARY KEY constraint)
app.post("/v1/follow", async (c) => {
  const db = getDb();
  const body = await c.req.json<{
    follower_did: string;
    following_did: string;
  }>();

  try {
    db.prepare(
      "INSERT INTO follows (follower_did, following_did) VALUES (?, ?)"
    ).run(body.follower_did, body.following_did);
    return c.json({ success: true });
  } catch {
    return c.json({ success: true, already_following: true });
  }
});

export default app;
