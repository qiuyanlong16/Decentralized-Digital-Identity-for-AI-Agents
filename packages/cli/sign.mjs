import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";
const { decodeBase64, encodeBase64 } = naclUtil;

export function signProfile(profileJson, privateKeyBase64) {
  const sk = decodeBase64(privateKeyBase64);
  const msg = new TextEncoder().encode(profileJson);
  const sig = nacl.sign.detached(msg, sk);
  return `sig:${encodeBase64(sig)}`;
}
