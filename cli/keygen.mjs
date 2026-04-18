import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";
const { encodeBase64 } = naclUtil;
import { writeFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
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
  return JSON.parse(readFileSync(path, "utf-8"));
}

export function getOrCreateKeypair(path = DEFAULT_PATH) {
  return loadKeypair(path) || generateKeypair(path);
}
