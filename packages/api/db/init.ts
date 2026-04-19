import Database from "better-sqlite3";
import { join } from "node:path";
import { mkdirSync } from "node:fs";
import { TABLES } from "./schema.js";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    if (process.env.DB_IN_MEMORY) {
      db = new Database(":memory:");
    } else {
      const DB_DIR = join(process.cwd(), ".agent-id-card");
      mkdirSync(DB_DIR, { recursive: true });
      db = new Database(join(DB_DIR, "agents.db"));
      db.pragma("journal_mode = WAL");
    }
    for (const sql of Object.values(TABLES)) {
      db.exec(sql);
    }
  }
  return db;
}
