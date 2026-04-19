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
    stats: {
      days_since_creation: days,
      total_skills: (options.skills || []).length,
      total_conversations: 0,
    },
    trust: {
      public_key: keypair.publicKey,
      issuer: "self",
      created_at: now,
      updated_at: now,
    },
  };
}
