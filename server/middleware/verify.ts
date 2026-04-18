import nacl from "tweetnacl";
import { decodeBase64 } from "tweetnacl-util";

/**
 * 验证 Profile JSON 的 Ed25519 签名
 */
export function verifySignature(
  profileJson: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const sigBytes = decodeBase64(signature.replace(/^sig:/, ""));
    const pkBytes = decodeBase64(publicKey.replace(/^ed25519:/, ""));
    return nacl.sign.detached.verify(
      new TextEncoder().encode(profileJson),
      sigBytes,
      pkBytes
    );
  } catch {
    return false;
  }
}
