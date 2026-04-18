import { describe, it, expect, afterEach } from "vitest";
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
