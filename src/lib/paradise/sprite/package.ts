import { requireRange, view } from "../binary";
export function readSpritePackage(bytes: Uint8Array) {
  requireRange(0, 4, bytes.length, "Sprite package");
  const dv = view(bytes);
  const tableSize = dv.getUint32(0, true);
  if (
    !tableSize ||
    tableSize % 4 ||
    tableSize / 4 > 256 ||
    tableSize > bytes.length
  )
    throw new Error("Invalid sprite package offset table.");
  const count = tableSize / 4;
  const parts: Uint8Array[] = [];
  for (let i = 0; i < count; i++) {
    const start = dv.getUint32(i * 4, true);
    const end = i + 1 < count ? dv.getUint32((i + 1) * 4, true) : bytes.length;
    if (start < tableSize || end <= start)
      throw new Error("Overlapping or unordered sprite offsets.");
    requireRange(start, end - start, bytes.length, "Packaged sprite");
    parts.push(bytes.slice(start, end));
  }
  return parts;
}
export function buildSpritePackage(parts: Uint8Array[]) {
  if (!parts.length || parts.length > 256 || parts.some((p) => p.length < 24))
    throw new Error("Invalid sprite package parts.");
  const size =
    parts.length * 4 + parts.reduce((sum, part) => sum + part.length, 0);
  if (size > 1048576)
    throw new Error("Sprite package exceeds the application limit.");
  const out = new Uint8Array(size);
  const dv = view(out);
  let cursor = parts.length * 4;
  parts.forEach((part, i) => {
    dv.setUint32(i * 4, cursor, true);
    out.set(part, cursor);
    cursor += part.length;
  });
  return out;
}
