import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";
const { decodeBase64 } = naclUtil;

/**
 * Verify Ed25519 signature over Profile JSON.
 * Strips 'sig:' and 'ed25519:' prefixes if present.
 * Returns false for any invalid input.
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
