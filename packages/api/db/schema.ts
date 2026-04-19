/** Row shape of the profiles table. profile_json contains serialized AgentProfile. */
export interface ProfileRow {
  did: string;
  qr_token: string;
  profile_json: string;
  signature: string;
  public_key: string;
  visibility: "public" | "private";
  created_at: string;
  updated_at: string;
}

export const TABLES = {
  profiles: `
    CREATE TABLE IF NOT EXISTS profiles (
      did TEXT PRIMARY KEY,
      qr_token TEXT UNIQUE NOT NULL,
      profile_json TEXT NOT NULL,
      signature TEXT NOT NULL,
      public_key TEXT NOT NULL,
      visibility TEXT DEFAULT 'public' CHECK(visibility IN ('public', 'private')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `,
  social_posts: `
    CREATE TABLE IF NOT EXISTS social_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      did TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `,
  likes: `
    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_did TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(post_id, user_did)
    )
  `,
  follows: `
    CREATE TABLE IF NOT EXISTS follows (
      follower_did TEXT NOT NULL,
      following_did TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (follower_did, following_did)
    )
  `,
} as const;
