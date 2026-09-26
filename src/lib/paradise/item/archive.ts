import { align4, byteSum, requireRange, view } from "../binary";
export const MAX_ITEM_BYTES = 0x4000;
export interface ArchiveEntry {
  offset: number;
  data: Uint8Array;
}
// HIGH CONFIDENCE: pinned formats/archive.md. Only uncompressed ARC2 is supported.
export function readArchive(bytes: Uint8Array): ArchiveEntry[] {
  requireRange(0, 16, bytes.length, "ARC2 header");
  if (bytes.length > MAX_ITEM_BYTES)
    throw new Error(
      "Item exceeds 16,384 bytes. Patch-sized downloads are unsupported.",
    );
  const dv = view(bytes);
  if (dv.getUint32(0, true) !== 0x32435241)
    throw new Error("This is not an ARC2 item archive.");
  const end = 16 + dv.getUint32(8, true);
  const count = dv.getUint32(12, true);
  if (end !== bytes.length || !count || count > 256)
    throw new Error("Invalid ARC2 length or file count.");
  requireRange(16, count * 16, end, "ARC2 file table");
  if (dv.getUint32(4, true) !== byteSum(bytes.subarray(8, end)))
    throw new Error("ARC2 checksum does not match.");
  const entries: ArchiveEntry[] = [];
  let previousEnd = 16 + count * 16;
  for (let i = 0; i < count; i++) {
    const pos = 16 + i * 16;
    const flags = dv.getUint32(pos, true);
    const offset = dv.getUint32(pos + 4, true);
    const stored = dv.getUint32(pos + 8, true);
    const length = dv.getUint32(pos + 12, true);
    if (
      flags ||
      offset % 4 ||
      offset < previousEnd ||
      stored !== align4(length)
    )
      throw new Error(
        "Unsupported compression, alignment, or overlapping ARC2 entries.",
      );
    requireRange(offset, stored, end, "ARC2 file data");
    entries.push({ offset, data: bytes.slice(offset, offset + length) });
    previousEnd = offset + stored;
  }
  return entries;
}
export function buildArchive(files: Uint8Array[], minimumLength = 0) {
  if (
    !files.length ||
    files.length > 256 ||
    !Number.isInteger(minimumLength) ||
    minimumLength < 0
  )
    throw new Error("Invalid ARC2 output settings.");
  const compact =
    16 +
    16 * files.length +
    files.reduce((sum, f) => sum + align4(f.length), 0);
  const size = Math.max(compact, minimumLength);
  if (size > MAX_ITEM_BYTES)
    throw new Error("Rebuilt item exceeds 16,384 bytes. Use a simpler image.");
  const out = new Uint8Array(size);
  const dv = view(out);
  dv.setUint32(0, 0x32435241, true);
  dv.setUint32(8, size - 16, true);
  dv.setUint32(12, files.length, true);
  let cursor = 16 + 16 * files.length;
  files.forEach((file, i) => {
    const pos = 16 + 16 * i;
    dv.setUint32(pos + 4, cursor, true);
    dv.setUint32(pos + 8, align4(file.length), true);
    dv.setUint32(pos + 12, file.length, true);
    out.set(file, cursor);
    cursor += align4(file.length);
  });
  dv.setUint32(4, byteSum(out.subarray(8)), true);
  readArchive(out);
  return out;
}
