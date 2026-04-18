/**
 * 从 DID 生成短码，格式: agtid_<8位字符>
 * 确定性：同一个 DID 永远生成同一个 token
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
