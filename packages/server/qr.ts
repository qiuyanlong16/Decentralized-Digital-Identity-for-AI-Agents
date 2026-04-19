/**
 * Generate a short code from a DID. Format: agtid_<8 chars>.
 * Deterministic: same DID always produces the same token.
 * Note: Uses djb2 hash (31-bit), suitable for display tokens up to ~50k DIDs.
 */
export function generateQrToken(did: string): string {
  let hash = 0;
  for (let i = 0; i < did.length; i++) {
    const char = did.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  const suffix = Math.abs(hash).toString(36).padStart(8, "0").slice(-8);
  return `agtid_${suffix}`;
}
