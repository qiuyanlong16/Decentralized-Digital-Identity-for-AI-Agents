import initSqlJs from "sql.js";
import type { Database } from "sql.js";
import { TABLES } from "./schema.js";

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    const SQL = await initSqlJs();
    db = new SQL.Database();
    for (const sql of Object.values(TABLES)) {
      db.run(sql);
    }
  }
  return db;
}
