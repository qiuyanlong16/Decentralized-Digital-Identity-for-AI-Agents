import { describe, it, expect } from "vitest";
import initSqlJs from "sql.js";
import { TABLES } from "../db/schema.js";

async function createTestDb() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  for (const sql of Object.values(TABLES)) {
    db.run(sql);
  }
  return db;
}

describe("Database schema", () => {
  it("creates profiles table with all columns", async () => {
    const db = await createTestDb();
    const result = db.exec("PRAGMA table_info(profiles)");
    const columns = result[0].values.map((r: any) => r[1]);
    expect(columns).toContain("did");
    expect(columns).toContain("qr_token");
    expect(columns).toContain("profile_json");
    expect(columns).toContain("visibility");
  });

  it("rejects duplicate did", async () => {
    const db = await createTestDb();
    db.run(
      "INSERT INTO profiles (did, qr_token, profile_json, signature, public_key) VALUES (?, ?, ?, ?, ?)",
      ["did:test", "agtid_1", "{}", "sig", "pk"]
    );
    expect(() => db.run(
      "INSERT INTO profiles (did, qr_token, profile_json, signature, public_key) VALUES (?, ?, ?, ?, ?)",
      ["did:test", "agtid_2", "{}", "sig", "pk"]
    )).toThrow();
  });

  it("rejects duplicate qr_token", async () => {
    const db = await createTestDb();
    db.run(
      "INSERT INTO profiles (did, qr_token, profile_json, signature, public_key) VALUES (?, ?, ?, ?, ?)",
      ["did:test1", "agtid_same", "{}", "sig", "pk"]
    );
    expect(() => db.run(
      "INSERT INTO profiles (did, qr_token, profile_json, signature, public_key) VALUES (?, ?, ?, ?, ?)",
      ["did:test2", "agtid_same", "{}", "sig", "pk"]
    )).toThrow();
  });

  it("inserts and reads a profile", async () => {
    const db = await createTestDb();
    db.run(
      "INSERT INTO profiles (did, qr_token, profile_json, signature, public_key) VALUES (?, ?, ?, ?, ?)",
      ["did:key:test", "agtid_test", '{"name":"test"}', "sig:test", "pk:test"]
    );
    const row = db.exec("SELECT * FROM profiles WHERE did = 'did:key:test'");
    expect(row[0].values.length).toBe(1);
  });
});
