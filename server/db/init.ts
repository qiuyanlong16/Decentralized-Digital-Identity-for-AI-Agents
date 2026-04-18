import initSqlJs, { Database } from "sql.js";
import { TABLES } from "./schema.js";

let db: Database | null = null;
let dbPromise: Promise<Database> | null = null;

export function getDb(): Promise<Database> {
  if (!db) {
    dbPromise ??= (async () => {
      const SQL = await initSqlJs();
      db = new SQL.Database();
      for (const sql of Object.values(TABLES)) {
        db.run(sql);
      }
      return db;
    })();
  }
  return dbPromise;
}
