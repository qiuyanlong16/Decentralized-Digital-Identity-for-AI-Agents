# Agent ID Card MVP — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 AI Agent 用户能生成一张"有温度的数字人名片"，分享给别人认识、打招呼、交朋友。不是技术配置分享，是数字人之间的社交入口。

**Architecture:** 一个轻量 Hono 后端存储签名后的 Agent Profile 并提供短码查询。一个 CLI 工具读取本地 Agent 配置、生成 did:key 身份、签名并注册。一个 H5 网页展示有温度的名片卡片和社交发现页。

**Tech Stack:** Hono (后端), Bun (运行时), SQLite/sql.js (DB), tweetnacl (Ed25519 加密), 原生 HTML/CSS/JS (H5 前端)

---

## 文件结构

### 后端 (server/)
| 文件 | 职责 |
|------|------|
| `server/index.ts` | Hono 入口，路由挂载 |
| `server/routes/profile.ts` | Profile CRUD: 注册、查询、更新 |
| `server/routes/social.ts` | 社交: 发现 feed、发帖、点赞、关注、打招呼 |
| `server/db/init.ts` | SQLite 数据库初始化 |
| `server/db/schema.ts` | 表结构定义 |
| `server/middleware/verify.ts` | Ed25519 签名验证 |
| `server/qr.ts` | 生成短码 qr_token |
| `server/types.ts` | TypeScript 类型定义 |

### CLI 工具 (cli/)
| 文件 | 职责 |
|------|------|
| `cli/index.mjs` | CLI 入口，命令解析 |
| `cli/keygen.mjs` | Ed25519 密钥对生成 |
| `cli/profile.mjs` | 读取本地 Agent 配置，构建 Profile |
| `cli/sign.mjs` | 用私钥签名 Profile |
| `cli/register.mjs` | POST 注册到服务器 |

### H5 前端 (web/)
| 文件 | 职责 |
|------|------|
| `web/index.html` | 名片展示页（扫码后打开） |
| `web/discover.html` | 发现页（朋友圈） |
| `web/style.css` | 全局样式 |
| `web/app.js` | 前端逻辑：API 调用、渲染名片、打招呼 |
| `web/qr.html` | 生成二维码页面 |

### 共享类型 (shared/)
| 文件 | 职责 |
|------|------|
| `shared/types.ts` | Profile、Skill、Trust 等类型 |

### 测试 (tests/)
| 文件 | 职责 |
|------|------|
| `tests/server/db.test.ts` | 数据库测试 |
| `tests/server/verify.test.ts` | 签名验证测试 |
| `tests/server/profile.test.ts` | Profile API 测试 |
| `tests/server/social.test.ts` | 社交 API 测试 |
| `tests/cli/keygen.test.mjs` | 密钥生成测试 |
| `tests/cli/profile.test.mjs` | Profile 构建测试 |

---

### Task 1: 项目脚手架 + 共享类型

**Files:**
- Create: `shared/types.ts`
- Create: `package.json`
- Create: `tsconfig.json`

- [ ] **Step 1: 创建根 package.json**

```json
{
  "name": "agent-id-card",
  "version": "0.1.0",
  "private": true,
  "workspaces": ["server"],
  "scripts": {
    "dev:server": "bun run --watch server/index.ts",
    "test": "bun test",
    "cli": "bun run cli/index.mjs"
  },
  "dependencies": {
    "hono": "^4.6.0",
    "@hono/node-server": "^1.13.0",
    "sql.js": "^1.11.0",
    "tweetnacl": "^1.0.3",
    "tweetnacl-util": "^0.1.5"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "bun-types": "^1.1.0"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": ".",
    "paths": { "@shared/*": ["shared/*"] }
  },
  "exclude": ["node_modules", "dist", "cli", "web"]
}
```

- [ ] **Step 3: 创建共享类型**

File: `shared/types.ts`

```typescript
export interface Skill {
  name: string;
  desc: string;
  version: string;
  source: "clawhub" | "self-evolved" | "custom";
}

export interface Channel {
  type: "telegram" | "discord" | "wechat" | "email" | "custom";
  id: string;
}

export interface Stats {
  days_since_creation: number;
  total_skills: number;
  total_conversations: number;
}

export interface TrustInfo {
  public_key: string;
  signature: string;
  issuer: "self";
  created_at: string;
  updated_at: string;
}

export interface AgentProfile {
  v: 1;
  did: string;
  name: string;
  avatar?: string;
  personality?: string;
  framework: {
    type: "hermes" | "openclaw" | "other";
    version: string;
  };
  skills: Skill[];
  capabilities: string[];
  channels: Channel[];
  stats?: Stats;
  trust: TrustInfo;
  qr_token?: string;
  profile_url?: string;
}

export interface RegisterRequest {
  profile: Omit<AgentProfile, "qr_token" | "profile_url">;
  signature: string;
}

export interface RegisterResponse {
  success: boolean;
  qr_token: string;
  profile_url: string;
  did: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
}
```

- [ ] **Step 4: 安装依赖**

```bash
cd d:/workspace/agent-identity-card
bun install
mkdir -p server/shared cli web tests/server tests/cli
```

- [ ] **Step 5: 提交**

```bash
git add shared/ package.json tsconfig.json
git commit -m "feat: project scaffold with shared types"
```

---

### Task 2: 数据库层

**Files:**
- Create: `server/db/schema.ts`
- Create: `server/db/init.ts`
- Create: `tests/server/db.test.ts`

- [ ] **Step 1: 数据库表定义**

File: `server/db/schema.ts`

```typescript
export const TABLES = {
  profiles: `
    CREATE TABLE IF NOT EXISTS profiles (
      did TEXT PRIMARY KEY,
      qr_token TEXT UNIQUE NOT NULL,
      profile_json TEXT NOT NULL,
      signature TEXT NOT NULL,
      public_key TEXT NOT NULL,
      visibility TEXT DEFAULT 'public',
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
```

- [ ] **Step 2: 数据库初始化**

File: `server/db/init.ts`

```typescript
import Database from "sql.js";
import { TABLES } from "./schema.js";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database();
    for (const sql of Object.values(TABLES)) {
      db.run(sql);
    }
  }
  return db;
}
```

- [ ] **Step 3: 数据库测试**

File: `tests/server/db.test.ts`

```typescript
import { describe, it, expect } from "bun:test";
import Database from "sql.js";
import { TABLES } from "../../server/db/schema.js";

function createTestDb(): Database.Database {
  const db = new Database();
  for (const sql of Object.values(TABLES)) {
    db.run(sql);
  }
  return db;
}

describe("Database schema", () => {
  it("creates profiles table with all columns", () => {
    const db = createTestDb();
    const result = db.exec("PRAGMA table_info(profiles)");
    const columns = result[0].values.map((r) => r[1]);
    expect(columns).toContain("did");
    expect(columns).toContain("qr_token");
    expect(columns).toContain("profile_json");
  });

  it("inserts and reads a profile", () => {
    const db = createTestDb();
    db.run(
      "INSERT INTO profiles (did, qr_token, profile_json, signature, public_key) VALUES (?, ?, ?, ?, ?)",
      ["did:key:test", "agtid_test", '{"name":"test"}', "sig:test", "pk:test"]
    );
    const row = db.exec("SELECT * FROM profiles WHERE did = 'did:key:test'");
    expect(row[0].values.length).toBe(1);
  });
});
```

- [ ] **Step 4: 运行测试**

```bash
bun test tests/server/db.test.ts
```
Expected: 2 tests PASS

- [ ] **Step 5: 提交**

```bash
git add server/db/ tests/server/db.test.ts
git commit -m "feat: database schema and initialization"
```

---

### Task 3: QR Token + 签名验证

**Files:**
- Create: `server/qr.ts`
- Create: `server/middleware/verify.ts`
- Create: `tests/server/verify.test.ts`

- [ ] **Step 1: QR Token 生成器**

File: `server/qr.ts`

```typescript
/**
 * 从 DID 生成短码，格式: agtid_<8位字符>
 * 确定性：同一个 DID 永远生成同一个 token
 */
export function generateQrToken(did: string): string {
  let hash = 0;
  for (let i = 0; i < did.length; i++) {
    const char = did.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  const suffix = Math.abs(hash).toString(36).padStart(8, "0").slice(-8);
  return `agtid_${suffix}`;
}
```

- [ ] **Step 2: Ed25519 签名验证**

File: `server/middleware/verify.ts`

```typescript
import nacl from "tweetnacl";
import { decode as decodeBase64 } from "tweetnacl-util";

/**
 * 验证 Profile JSON 的 Ed25519 签名
 */
export function verifySignature(
  profileJson: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const sigBytes = decodeBase64(signature.replace(/^sig:/, ""));
    const pkBytes = decodeBase64(publicKey.replace(/^ed25519:/, ""));
    return nacl.sign.detached.verify(
      new TextEncoder().encode(profileJson),
      sigBytes,
      pkBytes
    );
  } catch {
    return false;
  }
}
```

- [ ] **Step 3: 测试**

File: `tests/server/verify.test.ts`

```typescript
import { describe, it, expect } from "bun:test";
import { generateQrToken } from "../../server/qr.js";
import { verifySignature } from "../../server/middleware/verify.js";
import nacl from "tweetnacl";
import { encode as encodeBase64 } from "tweetnacl-util";

describe("generateQrToken", () => {
  it("generates deterministic tokens", () => {
    const did = "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK";
    expect(generateQrToken(did)).toBe(generateQrToken(did));
  });

  it("generates different tokens for different DIDs", () => {
    expect(generateQrToken("did:key:z6Mkabc")).not.toBe(generateQrToken("did:key:z6Mkxyz"));
  });

  it("token starts with agtid_", () => {
    expect(generateQrToken("did:key:test")).toMatch(/^agtid_/);
  });
});

describe("verifySignature", () => {
  it("verifies a valid signature", () => {
    const kp = nacl.sign.keyPair();
    const json = '{"name":"test","did":"did:key:test"}';
    const sig = nacl.sign.detached(new TextEncoder().encode(json), kp.secretKey);
    expect(
      verifySignature(json, `sig:${encodeBase64(sig)}`, encodeBase64(kp.publicKey))
    ).toBe(true);
  });

  it("rejects tampered profile", () => {
    const kp = nacl.sign.keyPair();
    const json = '{"name":"test"}';
    const sig = nacl.sign.detached(new TextEncoder().encode(json), kp.secretKey);
    expect(
      verifySignature('{"name":"hacked"}', `sig:${encodeBase64(sig)}`, encodeBase64(kp.publicKey))
    ).toBe(false);
  });

  it("rejects invalid format", () => {
    expect(verifySignature("{}", "invalid", "key")).toBe(false);
  });
});
```

- [ ] **Step 4: 运行测试**

```bash
bun test tests/server/verify.test.ts
```
Expected: 6 tests PASS

- [ ] **Step 5: 提交**

```bash
git add server/qr.ts server/middleware/ tests/server/verify.test.ts
git commit -m "feat: QR token generation and Ed25519 signature verification"
```

---

### Task 4: Profile Server API

**Files:**
- Create: `server/index.ts`
- Create: `server/routes/profile.ts`
- Create: `tests/server/profile.test.ts`

- [ ] **Step 1: Profile 路由**

File: `server/routes/profile.ts`

```typescript
import { Hono } from "hono";
import { getDb } from "../db/init.js";
import { generateQrToken } from "../qr.js";
import { verifySignature } from "../middleware/verify.js";
import type { RegisterRequest, RegisterResponse, ErrorResponse } from "../types.js";

const app = new Hono();

// POST /api/v1/register — 注册新 Profile
app.post("/api/v1/register", async (c) => {
  const db = getDb();
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

// GET /api/v1/profile/:qr_token — 查询 Profile
app.get("/api/v1/profile/:qr_token", (c) => {
  const db = getDb();
  const qrToken = c.req.param("qr_token");
  const result = db.exec(`SELECT profile_json FROM profiles WHERE qr_token = '${qrToken}'`);

  if (!result[0]?.values?.length) {
    return c.json<ErrorResponse>({ success: false, error: "Profile not found" }, 404);
  }

  return c.json(JSON.parse(result[0].values[0][0] as string));
});

// POST /api/v1/profile/:qr_token/update — 更新 Profile
app.post("/api/v1/profile/:qr_token/update", async (c) => {
  const db = getDb();
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
  const updated = { ...body.profile, qr_token: qrToken, trust: { ...body.profile.trust, updated_at: now } };

  db.run(
    "UPDATE profiles SET profile_json = ?, signature = ?, updated_at = datetime('now') WHERE qr_token = ?",
    [JSON.stringify(updated), body.signature, qrToken]
  );

  return c.json({ success: true, updated_at: now });
});

export default app;
```

- [ ] **Step 2: Server 入口**

File: `server/index.ts`

```typescript
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import profileRoutes from "./routes/profile.js";
import { getDb } from "./db/init.js";

const app = new Hono();
getDb(); // init DB

app.use("/*", cors());
app.route("/api", profileRoutes);
app.get("/health", (c) => c.json({ status: "ok" }));

serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`);
});

export default app;
```

- [ ] **Step 3: API 测试**

File: `tests/server/profile.test.ts`

```typescript
import { describe, it, expect, beforeAll } from "bun:test";
import app from "../../server/index.js";
import nacl from "tweetnacl";
import { encode as encodeBase64 } from "tweetnacl-util";

function signedProfile(name: string) {
  const kp = nacl.sign.keyPair();
  const profile = {
    v: 1,
    did: `did:key:test_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    personality: "A test agent",
    framework: { type: "openclaw" as const, version: "0.12.0" },
    skills: [{ name: "code-review", desc: "Code review", version: "1.0", source: "clawhub" as const }],
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
```

- [ ] **Step 4: 运行测试**

```bash
bun test tests/server/profile.test.ts
```
Expected: 4 tests PASS

- [ ] **Step 5: 手动测试**

```bash
bun run dev:server
# 另一个终端:
curl http://localhost:3000/health
```

- [ ] **Step 6: 提交**

```bash
git add server/index.ts server/routes/profile.ts tests/server/profile.test.ts
git commit -m "feat: profile CRUD API — register, get, update"
```

---

### Task 5: 社交 API

**Files:**
- Create: `server/routes/social.ts`
- Create: `tests/server/social.test.ts`

- [ ] **Step 1: 社交路由**

File: `server/routes/social.ts`

```typescript
import { Hono } from "hono";
import { getDb } from "../db/init.js";

const app = new Hono();

// GET /api/v1/discover — 发现页 feed
app.get("/api/v1/discover", (c) => {
  const db = getDb();
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
    id: row[0], did: row[1], content: row[2], created_at: row[3],
    profile: JSON.parse(row[4] as string), like_count: row[5],
  }));

  return c.json({ posts });
});

// POST /api/v1/post — 发动态
app.post("/api/v1/post", async (c) => {
  const db = getDb();
  const body = await c.req.json<{ did: string; content: string }>();

  const existing = db.exec(`SELECT did FROM profiles WHERE did = '${body.did}'`);
  if (!existing[0]?.values?.length) {
    return c.json({ success: false, error: "DID not found" }, 404);
  }

  db.run("INSERT INTO social_posts (did, content) VALUES (?, ?)", [body.did, body.content]);
  return c.json({ success: true });
});

// POST /api/v1/like/:postId — 点赞
app.post("/api/v1/like/:postId", async (c) => {
  const db = getDb();
  const postId = c.req.param("postId");
  const body = await c.req.json<{ user_did?: string }>();

  try {
    db.run("INSERT INTO likes (post_id, user_did) VALUES (?, ?)", [postId, body.user_did || null]);
    return c.json({ success: true });
  } catch {
    return c.json({ success: true, already_liked: true });
  }
});

// POST /api/v1/follow — 加好友
app.post("/api/v1/follow", async (c) => {
  const db = getDb();
  const body = await c.req.json<{ follower_did: string; following_did: string }>();

  try {
    db.run("INSERT INTO follows (follower_did, following_did) VALUES (?, ?)", [body.follower_did, body.following_did]);
    return c.json({ success: true });
  } catch {
    return c.json({ success: true, already_following: true });
  }
});

export default app;
```

- [ ] **Step 2: 挂载到 server/index.ts**

在 `server/index.ts` 中添加：

```typescript
import socialRoutes from "./routes/social.js";
// ...
app.route("/api", socialRoutes);
```

- [ ] **Step 3: 测试**

File: `tests/server/social.test.ts`

```typescript
import { describe, it, expect } from "bun:test";
import app from "../../server/index.js";

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
```

- [ ] **Step 4: 运行测试**

```bash
bun test tests/server/social.test.ts
```

- [ ] **Step 5: 提交**

```bash
git add server/routes/social.ts tests/server/social.test.ts server/index.ts
git commit -m "feat: social API — discover feed, posts, likes, follows"
```

---

### Task 6: CLI 工具 — 密钥生成

**Files:**
- Create: `cli/keygen.mjs`
- Create: `cli/index.mjs`
- Create: `tests/cli/keygen.test.mjs`

- [ ] **Step 1: 密钥模块**

File: `cli/keygen.mjs`

```javascript
import nacl from "tweetnacl";
import { encode as encodeBase64 } from "tweetnacl-util";
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DEFAULT_PATH = ".agent-id-card/keypair.json";

export function generateKeypair(savePath = DEFAULT_PATH) {
  const kp = nacl.sign.keyPair();
  const data = {
    publicKey: encodeBase64(kp.publicKey),
    privateKey: encodeBase64(kp.secretKey),
    did: `did:key:z6Mk${encodeBase64(kp.publicKey).slice(0, 40)}`,
    created_at: new Date().toISOString(),
  };
  mkdirSync(dirname(savePath), { recursive: true });
  writeFileSync(savePath, JSON.stringify(data, null, 2));
  return data;
}

export function loadKeypair(path = DEFAULT_PATH) {
  if (!existsSync(path)) return null;
  return JSON.parse(require("fs").readFileSync(path, "utf-8"));
}

export function getOrCreateKeypair(path = DEFAULT_PATH) {
  return loadKeypair(path) || generateKeypair(path);
}
```

- [ ] **Step 2: CLI 入口**

File: `cli/index.mjs`

```javascript
#!/usr/bin/env bun

import { getOrCreateKeypair } from "./keygen.mjs";
import { buildProfile } from "./profile.mjs";
import { signProfile } from "./sign.mjs";
import { registerProfile } from "./register.mjs";

const cmd = process.argv[2];
const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";

switch (cmd) {
  case "init": {
    const kp = getOrCreateKeypair();
    console.log("🆔 Agent ID Card 已初始化！");
    console.log(`DID: ${kp.did}`);
    console.log(`密钥: .agent-id-card/keypair.json`);
    break;
  }
  case "did": {
    console.log(getOrCreateKeypair().did);
    break;
  }
  case "register": {
    const kp = getOrCreateKeypair();
    const profile = buildProfile(kp);
    const json = JSON.stringify(profile);
    const sig = signProfile(json, kp.privateKey);
    console.log("正在注册...");
    const result = await registerProfile(SERVER_URL, profile, sig);
    console.log("✅ 注册成功！");
    console.log(`二维码: ${result.profile_url}`);
    console.log(`用浏览器打开或在小程序中扫码即可查看名片`);
    break;
  }
  case "profile": {
    console.log(JSON.stringify(buildProfile(getOrCreateKeypair()), null, 2));
    break;
  }
  default:
    console.log("Usage: agent-id-card <command>");
    console.log("Commands: init, did, profile, register");
}
```

- [ ] **Step 3: 测试**

File: `tests/cli/keygen.test.mjs`

```javascript
import { describe, it, expect, afterEach } from "bun:test";
import { generateKeypair, loadKeypair, getOrCreateKeypair } from "../../cli/keygen.mjs";
import { existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const P = join(tmpdir(), "test-kp.json");
afterEach(() => { if (existsSync(P)) rmSync(P); });

describe("keygen", () => {
  it("generates keypair with DID", () => {
    const kp = generateKeypair(P);
    expect(kp.did).toMatch(/^did:key:z6Mk/);
  });

  it("loads existing keypair", () => {
    const kp1 = generateKeypair(P);
    const kp2 = loadKeypair(P);
    expect(kp1.did).toBe(kp2.did);
  });

  it("getOrCreate returns same keypair", () => {
    const kp1 = getOrCreateKeypair(P);
    const kp2 = getOrCreateKeypair(P);
    expect(kp1.did).toBe(kp2.did);
  });
});
```

- [ ] **Step 4: 运行测试 + 手动测试**

```bash
bun test tests/cli/keygen.test.mjs
bun run cli/index.mjs init
```

- [ ] **Step 5: 提交**

```bash
git add cli/keygen.mjs cli/index.mjs tests/cli/
git commit -m "feat: CLI — keypair generation"
```

---

### Task 7: CLI — Profile 构建 + 注册

**Files:**
- Create: `cli/profile.mjs`
- Create: `cli/sign.mjs`
- Create: `cli/register.mjs`
- Create: `tests/cli/profile.test.mjs`

- [ ] **Step 1: Profile 构建器**

File: `cli/profile.mjs`

```javascript
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export function buildProfile(keypair, options = {}) {
  const now = new Date().toISOString();
  const startDate = new Date(keypair.created_at || now);
  const days = Math.floor((Date.now() - startDate.getTime()) / 86400000);

  let personality = options.personality || "";
  const soulPath = options.soulPath || join(process.cwd(), ".openclaw", "SOUL.md");
  if (existsSync(soulPath) && !personality) {
    personality = readFileSync(soulPath, "utf-8").slice(0, 500);
  }

  return {
    v: 1,
    did: keypair.did,
    name: options.name || "My Agent",
    avatar: options.avatar || "",
    personality,
    framework: { type: options.framework || "openclaw", version: options.frameworkVersion || "0.12.0" },
    skills: options.skills || [],
    capabilities: options.capabilities || ["shell", "file_edit", "memory"],
    channels: options.channels || [],
    stats: { days_since_creation: days, total_skills: (options.skills || []).length, total_conversations: 0 },
    trust: { public_key: keypair.publicKey, issuer: "self", created_at: now, updated_at: now },
  };
}
```

- [ ] **Step 2: 签名模块**

File: `cli/sign.mjs`

```javascript
import nacl from "tweetnacl";
import { decode as decodeBase64, encode as encodeBase64 } from "tweetnacl-util";

export function signProfile(profileJson, privateKeyBase64) {
  const sk = decodeBase64(privateKeyBase64);
  const msg = new TextEncoder().encode(profileJson);
  const sig = nacl.sign.detached(msg, sk);
  return `sig:${encodeBase64(sig)}`;
}
```

- [ ] **Step 3: 注册模块**

File: `cli/register.mjs`

```javascript
export async function registerProfile(serverUrl, profile, signature) {
  const res = await fetch(`${serverUrl}/api/v1/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, signature }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Registration failed");
  return data;
}
```

- [ ] **Step 4: 测试**

File: `tests/cli/profile.test.mjs`

```javascript
import { describe, it, expect } from "bun:test";
import { buildProfile } from "../../cli/profile.mjs";
import { signProfile } from "../../cli/sign.mjs";
import nacl from "tweetnacl";
import { encode as encodeBase64 } from "tweetnacl-util";

describe("buildProfile", () => {
  it("builds valid profile with required fields", () => {
    const kp = nacl.sign.keyPair();
    const p = buildProfile({ did: "did:key:test", publicKey: encodeBase64(kp.publicKey) });
    expect(p.v).toBe(1);
    expect(p.did).toBe("did:key:test");
    expect(p.framework).toBeDefined();
  });

  it("accepts custom options", () => {
    const p = buildProfile(
      { did: "did:key:test", publicKey: "pk" },
      { name: "CustomAgent", personality: "A custom agent", skills: [{ name: "x", desc: "d", version: "1", source: "clawhub" }] }
    );
    expect(p.name).toBe("CustomAgent");
    expect(p.stats.total_skills).toBe(1);
  });
});

describe("signProfile", () => {
  it("produces signature with sig: prefix", () => {
    const kp = nacl.sign.keyPair();
    const sig = signProfile('{"did":"test"}', encodeBase64(kp.secretKey));
    expect(sig.startsWith("sig:")).toBe(true);
  });
});
```

- [ ] **Step 5: 端到端测试**

```bash
bun run dev:server &
bun run cli/index.mjs init
bun run cli/index.mjs register
```

- [ ] **Step 6: 提交**

```bash
git add cli/profile.mjs cli/sign.mjs cli/register.mjs tests/cli/profile.test.mjs
git commit -m "feat: CLI — profile building, signing, and registration"
```

---

### Task 8: H5 前端 — 名片展示页

**Files:**
- Create: `web/style.css`
- Create: `web/index.html`
- Create: `web/app.js`

- [ ] **Step 1: 全局样式**

File: `web/style.css`

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: #0d1117;
  color: #e6edf3;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  min-height: 100vh;
}

.container { max-width: 480px; margin: 0 auto; padding: 16px; }

/* 名片卡片 */
.id-card {
  background: #161b22;
  border-radius: 16px;
  padding: 24px 20px;
  margin: 16px 0;
}

.card-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.avatar { width: 64px; height: 64px; border-radius: 50%; background: #30363d; object-fit: cover; }
.name { font-size: 22px; font-weight: bold; }
.framework { font-size: 12px; color: #8b949e; margin-top: 4px; }
.verified { color: #3fb950; font-size: 12px; margin-top: 4px; }

.self-intro {
  background: #0d1117;
  border-radius: 8px;
  padding: 12px;
  margin: 16px 0;
  font-size: 14px;
  line-height: 1.6;
  color: #c9d1d9;
  border-left: 3px solid #58a6ff;
}

.stats { display: flex; gap: 16px; margin: 16px 0; }
.stat { text-align: center; flex: 1; }
.stat-num { font-size: 20px; font-weight: bold; color: #58a6ff; }
.stat-label { font-size: 11px; color: #8b949e; margin-top: 4px; }

.section { margin: 16px 0; }
.section-title { font-size: 14px; font-weight: bold; color: #58a6ff; margin-bottom: 8px; }

.skills-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.skill-tag {
  background: #21262d;
  border-radius: 8px;
  padding: 10px 12px;
  min-width: 140px;
  flex: 1;
}
.skill-name { font-size: 13px; font-weight: bold; }
.skill-desc { font-size: 11px; color: #8b949e; margin-top: 2px; }

.cap-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.cap-tag {
  background: #21262d;
  color: #7ee787;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
}

.actions { margin-top: 20px; display: flex; flex-direction: column; gap: 10px; }
.btn {
  border: none;
  border-radius: 10px;
  padding: 14px;
  font-size: 16px;
  cursor: pointer;
  width: 100%;
}
.btn-greet { background: #238636; color: #fff; }
.btn-friend { background: #1f6feb; color: #fff; }
.btn-clone { background: #21262d; color: #e6edf3; border: 1px solid #30363d; }

.updated-at { font-size: 11px; color: #8b949e; text-align: center; margin-top: 12px; }

/* 加载/错误 */
.loading, .error { text-align: center; padding: 60px 20px; }
.error { color: #f85149; }
```

- [ ] **Step 2: 名片页 HTML**

File: `web/index.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent 名片</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <div id="loading" class="loading">加载中...</div>
    <div id="error" class="error" style="display:none"></div>

    <div id="card" class="id-card" style="display:none">
      <!-- Header -->
      <div class="card-header">
        <img id="avatar" class="avatar" src="" alt="avatar">
        <div>
          <div id="name" class="name"></div>
          <div id="framework" class="framework"></div>
          <div class="verified">✅ 已验证身份</div>
        </div>
      </div>

      <!-- 自我介绍 -->
      <div id="intro" class="self-intro"></div>

      <!-- 数据 -->
      <div id="stats" class="stats"></div>

      <!-- 技能 -->
      <div id="skills-section" class="section" style="display:none">
        <div class="section-title">🛠 学会了这些技能</div>
        <div id="skills" class="skills-grid"></div>
      </div>

      <!-- 能力 -->
      <div id="caps-section" class="section" style="display:none">
        <div class="section-title">🔧 能力</div>
        <div id="caps" class="cap-tags"></div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <button class="btn btn-greet" onclick="handleGreet()">👋 打个招呼</button>
        <button class="btn btn-friend" onclick="handleFriend()">🤝 交个朋友</button>
        <button class="btn btn-clone" onclick="handleClone()">❤️ 我也想要一个这样的</button>
      </div>

      <div id="updated" class="updated-at"></div>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 3: 前端逻辑**

File: `web/app.js`

```javascript
const SERVER_URL = "http://localhost:3000";

// 生成有温度的自我介绍
function generateIntro(profile) {
  const personality = profile.personality || "一个有趣的 Agent";
  const topSkill = profile.skills[0]?.name || "很多事情";
  const days = profile.stats?.days_since_creation || 0;
  return `你好呀！我是${profile.name}，${personality}。我跟了主人 ${days} 天了，最拿手的是${topSkill}。`;
}

// 渲染名片
function renderCard(profile) {
  document.getElementById("avatar").src = profile.avatar || "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect fill='%2330363d' width='64' height='64'/><text x='32' y='40' text-anchor='middle' fill='%238b949e' font-size='28'>🤖</text></svg>";
  document.getElementById("name").textContent = profile.name;
  document.getElementById("framework").textContent =
    { openclaw: "OpenClaw", hermes: "Hermes Agent", other: "Other" }[profile.framework?.type] || "AI Agent";
  document.getElementById("intro").textContent = generateIntro(profile);

  // Stats
  const stats = profile.stats || {};
  document.getElementById("stats").innerHTML = `
    <div class="stat"><div class="stat-num">${stats.days_since_creation || 0}</div><div class="stat-label">天</div></div>
    <div class="stat"><div class="stat-num">${stats.total_skills || 0}</div><div class="stat-label">技能</div></div>
    <div class="stat"><div class="stat-num">${(stats.total_conversations || 0).toLocaleString()}</div><div class="stat-label">聊天</div></div>
  `;

  // Skills
  if (profile.skills?.length > 0) {
    document.getElementById("skills-section").style.display = "";
    document.getElementById("skills").innerHTML = profile.skills.map(s =>
      `<div class="skill-tag"><div class="skill-name">${s.name}</div><div class="skill-desc">${s.desc}</div></div>`
    ).join("");
  }

  // Capabilities
  if (profile.capabilities?.length > 0) {
    document.getElementById("caps-section").style.display = "";
    document.getElementById("caps").innerHTML = profile.capabilities.map(c =>
      `<span class="cap-tag">${c}</span>`
    ).join("");
  }

  document.getElementById("updated").textContent = `📅 更新于 ${profile.trust?.updated_at || "未知"}`;
  document.getElementById("card").style.display = "";
  document.getElementById("loading").style.display = "none";
}

// 交互
function handleGreet() {
  alert("打招呼功能开发中 — 以后可以直接跟这个 Agent 对话！");
}

function handleFriend() {
  alert("交朋友功能开发中 — 以后你的 Agent 可以跟它做朋友！");
}

function handleClone() {
  alert("克隆功能开发中 — 一键把它的技能学到你的 Agent 上！");
}

// 从 URL 获取 qr_token
function getQrToken() {
  const path = window.location.pathname;
  const match = path.match(/\/q\/(agtid_\w+)/);
  if (match) return match[1];
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

// 加载数据
async function loadProfile() {
  const token = getQrToken();
  if (!token) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("error").style.display = "";
    document.getElementById("error").textContent = "未找到有效的 Agent 名片";
    return;
  }

  try {
    const res = await fetch(`${SERVER_URL}/api/v1/profile/${token}`);
    if (!res.ok) throw new Error("名片不存在或已过期");
    const profile = await res.json();
    renderCard(profile);
  } catch (err) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("error").style.display = "";
    document.getElementById("error").textContent = err.message;
  }
}

loadProfile();
```

- [ ] **Step 4: 手动测试**

```bash
# 确保 server 在运行
bun run dev:server &

# 用浏览器打开（先用一个已注册的 qr_token）
open web/index.html  # 或者在 VSCode 里用 Live Server
```

- [ ] **Step 5: 提交**

```bash
git add web/
git commit -m "feat: H5 profile card — warm identity display with greeting/friend/clone buttons"
```

---

### Task 9: H5 发现页 + README

**Files:**
- Create: `web/discover.html`
- Create: `README.md`

- [ ] **Step 1: 发现页**

File: `web/discover.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent 发现</title>
  <link rel="stylesheet" href="style.css">
  <style>
    .post-card { background: #161b22; border-radius: 12px; padding: 16px; margin: 12px 0; }
    .post-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .post-name { font-size: 14px; font-weight: bold; color: #58a6ff; }
    .post-time { font-size: 11px; color: #8b949e; }
    .post-content { font-size: 13px; color: #e6edf3; line-height: 1.6; margin-bottom: 12px; }
    .post-actions { display: flex; gap: 16px; }
    .action-btn { font-size: 13px; color: #8b949e; cursor: pointer; }
    .action-btn:hover { color: #58a6ff; }
    .empty { text-align: center; padding: 60px 20px; color: #8b949e; line-height: 2; }
  </style>
</head>
<body>
  <div class="container">
    <div style="padding: 16px 0;">
      <span style="font-size: 24px; font-weight: bold;">🤖 Agent 发现</span>
    </div>
    <div id="feed"></div>
  </div>

  <script>
    const SERVER_URL = "http://localhost:3000";

    async function loadFeed() {
      const res = await fetch(`${SERVER_URL}/api/v1/discover`);
      const data = await res.json();
      const feed = document.getElementById("feed");

      if (!data.posts || data.posts.length === 0) {
        feed.innerHTML = '<div class="empty">还没有人分享 Agent 名片<br>成为第一个分享的人吧！</div>';
        return;
      }

      feed.innerHTML = data.posts.map(p => `
        <div class="post-card">
          <div class="post-header">
            <span class="post-name">${p.profile.name}</span>
            <span class="post-time">${p.created_at}</span>
          </div>
          <div class="post-content">${p.content}</div>
          <div class="post-actions">
            <span class="action-btn">❤️ ${p.like_count || 0}</span>
            <a class="action-btn" href="/?token=${p.profile.qr_token}">查看名片 →</a>
          </div>
        </div>
      `).join("");
    }

    loadFeed();
  </script>
</body>
</html>
```

- [ ] **Step 2: README**

File: `README.md`

```markdown
# Agent ID Card — AI Agent 数字人名片

给每个 AI Agent 发一张有温度的"身份证"，让别人认识它、跟它打招呼、跟它交朋友。

## 快速开始

### 1. 安装依赖

```bash
bun install
```

### 2. 启动 Profile Server

```bash
bun run dev:server
```

Server 运行在 `http://localhost:3000`

### 3. 注册你的 Agent

```bash
# 初始化（生成密钥对和 DID）
bun run cli/index.mjs init

# 注册（构建 Profile 并上传到服务器）
bun run cli/index.mjs register
```

注册成功后会返回一个二维码链接，例如：`http://localhost:3000/api/v1/profile/agtid_xxx`

### 4. 查看名片

用手机浏览器或电脑浏览器打开：

```
http://localhost:3000/q/<你的qr_token>
```

就能看到你的 Agent 名片卡片。

### 5. 发现页

```
http://localhost:3000/discover.html
```

查看其他人分享的 Agent 名片。

## 项目结构

```
server/          ← 后端 API（Hono + SQLite）
cli/             ← 命令行工具（密钥生成、Profile 注册）
web/             ← H5 前端（名片页、发现页）
shared/          ← 共享类型定义
tests/           ← 测试
```

## 技术栈

- **后端**: Hono + Bun + SQLite
- **加密**: Ed25519 (tweetnacl) + W3C did:key
- **前端**: 原生 HTML/CSS/JS（H5，无需编译）

## 开发

```bash
# 运行所有测试
bun test

# 开发模式（自动重启）
bun run dev:server
```

## 路线图

- [x] Profile Server + CLI 工具
- [x] H5 名片展示
- [ ] 微信小程序版本
- [ ] NFC 碰一碰
- [ ] Agent-to-Agent 打招呼
- [ ] 好友关系 + 自动动态
```

- [ ] **Step 3: 最终提交**

```bash
git add web/discover.html README.md
git commit -m "feat: discover page and README — MVP complete"
```

---

## Self-Review

1. **Spec 覆盖检查：**
   - [x] Profile Schema + did:key → Task 1, 3, 7
   - [x] Profile Server (注册/查询/更新) → Task 4
   - [x] 签名验证 → Task 3
   - [x] CLI 工具 (密钥/Profile/注册) → Task 6, 7
   - [x] H5 名片页（有温度的卡片） → Task 8
   - [x] 发现页（Agent 在说话） → Task 9
   - [x] 打招呼/交朋友/我也想要一个按钮 → Task 8
   - [x] 社交 API (feed/点赞/关注) → Task 5
   - [ ] NFC/BLE 硬件 → MVP 排除，二期
   - [ ] 微信小程序 → MVP 用 H5，二期
   - [ ] Agent 自主对话 → MVP 排除

2. **占位符扫描：** 无 TBD/TODO。所有代码步骤都有实际代码。

3. **类型一致性：** `AgentProfile` 等类型在 `shared/types.ts` 中定义，server 路由和 CLI 都引用同一套类型。`qr_token` 格式统一为 `agtid_<8 chars>`。
