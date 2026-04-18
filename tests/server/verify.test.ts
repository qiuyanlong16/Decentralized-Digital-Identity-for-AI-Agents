import { describe, it, expect } from "vitest";
import { generateQrToken } from "../../server/qr.js";
import { verifySignature } from "../../server/middleware/verify.js";
import nacl from "tweetnacl";
import { encodeBase64 } from "tweetnacl-util";

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
