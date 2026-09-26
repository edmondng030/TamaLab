import type { ParadiseEncoder } from "../encoder";
import { align4, view } from "../binary";
import { decodeSprite } from "./decoder";
import { encodeRle, from565, packIndices, rgb565, xorPixels } from "./pixels";
export interface SpriteResource {
  width: number;
  height: number;
  rgba: Uint8ClampedArray;
}
export function validateResource(resource: SpriteResource) {
  const { width, height, rgba } = resource;
  if (![width, height].every((n) => Number.isInteger(n) && n >= 1 && n <= 255))
    throw new Error("Paradise binary sprite dimensions must be 1–255 pixels.");
  if (rgba.length !== width * height * 4)
    throw new Error("RGBA length does not match sprite dimensions.");
  for (let i = 3; i < rgba.length; i += 4)
    if (rgba[i] !== 0 && rgba[i] !== 255)
      throw new Error(
        "Paradise supports fully transparent or opaque pixels. Remove partial transparency before binary export.",
      );
}
export class ParadiseSpriteEncoder implements ParadiseEncoder<SpriteResource> {
  async encode(resource: SpriteResource): Promise<Uint8Array> {
    validateResource(resource);
    const { width, height, rgba } = resource;
    const transparent = rgba.some((value, i) => i % 4 === 3 && value === 0);
    const palette: number[] = transparent ? [0] : [];
    const lookup = new Map<number, number>();
    const indices = new Uint8Array(width * height);
    for (let i = 0; i < indices.length; i++) {
      if (rgba[i * 4 + 3] === 0) continue;
      const color = rgb565(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]);
      let index = lookup.get(color);
      if (index === undefined) {
        index = palette.length;
        if (index >= 256)
          throw new Error(
            "Sprite needs more than 256 palette slots including transparency. Reduce the palette first.",
          );
        palette.push(color);
        lookup.set(color, index);
      }
      indices[i] = index;
    }
    const code =
      palette.length <= 2
        ? 0
        : palette.length <= 4
          ? 1
          : palette.length <= 16
            ? 2
            : 3;
    const pixels = packIndices(indices, 2 ** code);
    const pixelOffset = 24 + 2 * 2 ** (2 ** code);
    const out = new Uint8Array(pixelOffset + pixels.length);
    const dv = view(out);
    dv.setUint32(0, out.length, true);
    out[4] = 3 | (transparent ? 4 : 0);
    out[5] = code;
    dv.setUint16(6, 1, true);
    out[8] = width;
    out[9] = height;
    out[12] = out[13] = 1;
    out[14] = 0x11;
    out[15] = 1;
    dv.setUint16(18, 24, true);
    dv.setUint16(20, pixelOffset, true);
    palette.forEach((color, i) => dv.setUint16(24 + 2 * i, color, true));
    out.set(pixels, pixelOffset);
    decodeSprite(out);
    return out;
  }
}
// Replace ONE frame, retaining the palette, anchors, grid and other frames.
export function replaceSpriteFrame(
  template: Uint8Array,
  frame: number,
  resource: SpriteResource,
) {
  validateResource(resource);
  const sprite = decodeSprite(template);
  if (!Number.isInteger(frame) || frame < 0 || frame >= sprite.count)
    throw new Error("Select a valid sprite frame.");
  if (sprite.paletteSets !== 1)
    throw new Error(
      "Templates with multiple palette sets are not supported for replacement.",
    );
  if (resource.width !== sprite.width || resource.height !== sprite.height)
    throw new Error(
      `Set sprite size to ${sprite.width} × ${sprite.height} before rebuilding this template.`,
    );
  const palette = sprite.palette.map(from565);
  const indices = new Uint8Array(resource.width * resource.height);
  for (let i = 0; i < indices.length; i++) {
    if (!resource.rgba[i * 4 + 3]) {
      if (sprite.transparentIndex === undefined)
        throw new Error(
          "This template has no transparency. Use an opaque image.",
        );
      indices[i] = sprite.transparentIndex;
      continue;
    }
    let nearest = -1;
    let distance = Infinity;
    palette.forEach((color, index) => {
      if (index === sprite.transparentIndex) return;
      const d = color.reduce(
        (sum, channel, c) => sum + (channel - resource.rgba[i * 4 + c]) ** 2,
        0,
      );
      if (d < distance) {
        distance = d;
        nearest = index;
      }
    });
    indices[i] = nearest;
  }
  const packed = packIndices(indices, sprite.bits);
  if (!(sprite.flags & 32)) {
    const out = template.slice();
    out.set(
      sprite.flags & 128 ? xorPixels(packed) : packed,
      sprite.pixelOffset + frame * packed.length,
    );
    decodeSprite(out);
    return out;
  }
  const rle = encodeRle(packed);
  const raw = rle.length >= packed.length;
  let data = raw ? packed : rle;
  if (sprite.flags & 128) data = xorPixels(data);
  const payloads = sprite.storedFrames.map((entry, i) =>
    i === frame ? { raw, data } : entry,
  );
  let cursor = sprite.pixelOffset + sprite.count * 8;
  const offsets = payloads.map((entry) => {
    cursor = align4(cursor);
    const offset = cursor;
    cursor += entry.data.length;
    return offset;
  });
  const tail = template.subarray(sprite.length);
  const out = new Uint8Array(cursor + tail.length);
  const dv = view(out);
  out.set(template.subarray(0, sprite.pixelOffset));
  dv.setUint32(0, cursor, true);
  payloads.forEach((entry, i) => {
    const offset = offsets[i] - sprite.pixelOffset;
    dv.setUint32(
      sprite.pixelOffset + i * 8,
      (offset | (entry.raw ? 0x80000000 : 0)) >>> 0,
      true,
    );
    dv.setUint32(sprite.pixelOffset + i * 8 + 4, entry.data.length, true);
    out.set(entry.data, offsets[i]);
  });
  out.set(tail, cursor);
  decodeSprite(out);
  return out;
}
