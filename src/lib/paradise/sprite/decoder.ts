import { requireRange, view } from "../binary";
import { decodeRle, from565, unpackIndices, xorPixels } from "./pixels";
export const SPRITE_HEADER_SIZE = 24;
export interface DecodedSprite {
  width: number;
  height: number;
  bits: number;
  flags: number;
  count: number;
  gridWidth: number;
  gridHeight: number;
  palette: number[];
  paletteSets: number;
  transparentIndex?: number;
  pixelOffset: number;
  length: number;
  frames: Uint8Array[];
  storedFrames: { data: Uint8Array; raw: boolean }[];
}
// Restricted to indexed sprites and bytewise/uncompressed frames. Unsupported
// formats fail closed. Application limits are not claimed device limits.
export function decodeSprite(bytes: Uint8Array): DecodedSprite {
  requireRange(0, SPRITE_HEADER_SIZE, bytes.length, "Sprite header");
  if (bytes.length > 1048576)
    throw new Error("Sprite exceeds the application size limit.");
  const dv = view(bytes);
  const length = dv.getUint32(0, true) || bytes.length;
  if (length < 24 || length > bytes.length)
    throw new Error("Invalid sprite length.");
  const flags = bytes[4];
  const code = bytes[5];
  if (code > 3) throw new Error("Only indexed Paradise sprites are supported.");
  if (flags & 0x58)
    throw new Error(
      "Wordwise compression or unknown sprite flags are unsupported.",
    );
  const bits = 2 ** code;
  const count = dv.getUint16(6, true);
  const width = bytes[8];
  const height = bytes[9];
  const gridWidth = bytes[12];
  const gridHeight = bytes[13];
  const paletteSets = bytes[15];
  if (
    !width ||
    !height ||
    !gridWidth ||
    !gridHeight ||
    !count ||
    count > 256 ||
    count % (gridWidth * gridHeight) ||
    count * width * height > 1048576
  )
    throw new Error("Invalid or oversized sprite dimensions/grid.");
  if (bytes[14] !== 0x11 || !paletteSets)
    throw new Error("Unsupported palette format.");
  const paletteOffset = dv.getUint16(18, true);
  const pixelOffset = dv.getUint16(20, true);
  const paletteSize = 2 ** bits;
  const paletteBytes = paletteSets * paletteSize * 2;
  if (paletteOffset < 24 || pixelOffset < paletteOffset + paletteBytes)
    throw new Error("Sprite palette and pixel regions overlap.");
  requireRange(paletteOffset, paletteBytes, length, "Sprite palette");
  requireRange(pixelOffset, 0, length, "Sprite pixels");
  const transparentIndex = flags & 4 ? dv.getUint16(16, true) : undefined;
  if (transparentIndex !== undefined && transparentIndex >= paletteSize)
    throw new Error("Transparent palette index is out of range.");
  const palette = Array.from({ length: paletteSize }, (_, i) =>
    dv.getUint16(paletteOffset + i * 2, true),
  );
  const frameSize = Math.ceil((width * height * bits) / 8);
  const frames: Uint8Array[] = [];
  const storedFrames: DecodedSprite["storedFrames"] = [];
  let previousEnd = pixelOffset + count * 8;
  if (flags & 32) requireRange(pixelOffset, count * 8, length, "Frame table");
  for (let i = 0; i < count; i++) {
    let start = pixelOffset + i * frameSize;
    let storedLength = frameSize;
    let raw = true;
    if (flags & 32) {
      const entry = pixelOffset + i * 8;
      const offset = dv.getUint32(entry, true);
      start = pixelOffset + (offset & 0x7fffffff);
      storedLength = dv.getUint32(entry + 4, true);
      raw = !!(offset & 0x80000000);
      if (start < previousEnd || start % 4 || !storedLength)
        throw new Error("Invalid, overlapping, or unaligned frame offsets.");
      previousEnd = start + storedLength;
    }
    requireRange(start, storedLength, length, "Frame data");
    const stored = bytes.slice(start, start + storedLength);
    storedFrames.push({ data: stored, raw });
    const decrypted = flags & 128 ? xorPixels(stored) : stored;
    if (raw && decrypted.length !== frameSize)
      throw new Error("Raw frame has an unexpected length.");
    frames.push(
      unpackIndices(
        raw ? decrypted : decodeRle(decrypted, frameSize),
        bits,
        width * height,
      ),
    );
  }
  return {
    width,
    height,
    bits,
    flags,
    count,
    gridWidth,
    gridHeight,
    palette,
    paletteSets,
    transparentIndex,
    pixelOffset,
    length,
    frames,
    storedFrames,
  };
}
export function frameRgba(sprite: DecodedSprite, frame: number) {
  if (!Number.isInteger(frame) || frame < 0 || frame >= sprite.count)
    throw new Error("Select a valid sprite frame.");
  const rgba = new Uint8ClampedArray(sprite.width * sprite.height * 4);
  sprite.frames[frame].forEach((index, i) => {
    rgba.set(from565(sprite.palette[index]), i * 4);
    rgba[i * 4 + 3] = index === sprite.transparentIndex ? 0 : 255;
  });
  return rgba;
}
