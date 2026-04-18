import { describe, it, expect } from "vitest";
import { buildProfile } from "../../cli/profile.mjs";
import { signProfile } from "../../cli/sign.mjs";
import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";
const { encodeBase64 } = naclUtil;

describe("buildProfile", () => {
  it("builds valid profile with required fields", () => {
    const kp = nacl.sign.keyPair();
    const p = buildProfile({
      did: "did:key:test",
      publicKey: encodeBase64(kp.publicKey),
    });
    expect(p.v).toBe(1);
    expect(p.did).toBe("did:key:test");
    expect(p.framework).toBeDefined();
  });

  it("accepts custom options", () => {
    const p = buildProfile(
      { did: "did:key:test", publicKey: "pk" },
      {
        name: "CustomAgent",
        personality: "A custom agent",
        skills: [{ name: "x", desc: "d", version: "1", source: "clawhub" }],
      }
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
