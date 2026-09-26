import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  decodeRle,
  encodeRle,
  packIndices,
  unpackIndices,
  rgb565,
} from "@/lib/paradise/sprite/pixels";
import {
  ParadiseSpriteEncoder,
  replaceSpriteFrame,
} from "@/lib/paradise/sprite/encoder";
import { decodeSprite, frameRgba } from "@/lib/paradise/sprite/decoder";
import {
  inspectItemTemplate,
  rebuildItemTemplate,
} from "@/lib/paradise/item/template";
import { readArchive, buildArchive } from "@/lib/paradise/item/archive";

const fixture = new Uint8Array(
  readFileSync(new URL("./fixtures/tamacat/pa-tomaquet.bin", import.meta.url)),
);
const solid = (width = 32, height = 32) => ({
  width,
  height,
  rgba: new Uint8ClampedArray(
    Array.from({ length: width * height }, () => [255, 0, 0, 255]).flat(),
  ),
});
describe("documented indexed sprite format", () => {
  it("matches independent bit-order vectors", () => {
    expect([...packIndices(Uint8Array.of(0, 1, 2, 3), 2)]).toEqual([0xd8]);
    expect([...packIndices(Uint8Array.of(1, 2), 4)]).toEqual([0x48]);
    expect([...packIndices(Uint8Array.of(1, 128), 8)]).toEqual([128, 1]);
    expect([...unpackIndices(Uint8Array.of(0xd8), 2, 4)]).toEqual([0, 1, 2, 3]);
    expect(rgb565(255, 0, 0)).toBe(0xf800);
  });
  it("keeps opaque black separate from transparency with a 24-byte header", async () => {
    const bytes = await new ParadiseSpriteEncoder().encode({
      width: 2,
      height: 1,
      rgba: new Uint8ClampedArray([0, 0, 0, 0, 0, 0, 0, 255]),
    });
    expect(bytes.length).toBe(29);
    expect(bytes[18]).toBe(24);
    expect(bytes[20]).toBe(28);
    expect(bytes[28]).toBe(2);
    expect([...frameRgba(decodeSprite(bytes), 0)]).toEqual([
      0, 0, 0, 0, 0, 0, 0, 255,
    ]);
  });
  it("rejects unrepresentable dimensions and partial alpha", async () => {
    await expect(
      new ParadiseSpriteEncoder().encode(solid(256, 1)),
    ).rejects.toThrow("1–255");
    const source = solid(1, 1);
    source.rgba[3] = 128;
    await expect(new ParadiseSpriteEncoder().encode(source)).rejects.toThrow(
      "partial transparency",
    );
  });
  it("decodes literal, repeat, no-op and terminator controls with strict bounds", () => {
    expect([...decodeRle(Uint8Array.of(0x80, 3, 7, 0x82, 1, 2, 0), 5)]).toEqual(
      [7, 7, 7, 1, 2],
    );
    expect(() => decodeRle(Uint8Array.of(127, 1), 5)).toThrow("bounds");
    expect(() => decodeRle(Uint8Array.of(0x82, 1), 2)).toThrow("Truncated");
    expect(() => decodeRle(Uint8Array.of(1), 1)).toThrow("Truncated");
    expect(() => decodeRle(Uint8Array.of(0), 1)).toThrow("expected");
    for (const data of [
      new Uint8Array(512),
      Uint8Array.from({ length: 512 }, (_, i) => i % 251),
    ])
      expect(decodeRle(encodeRle(data), data.length)).toEqual(data);
  });
});
describe("provenance-backed item template", () => {
  it("matches the pinned fixture hash and known header", () => {
    expect(createHash("sha256").update(fixture).digest("hex")).toBe(
      "3531ae51b4e9896aa9585ade63475215389f2e1a84709e8ba81f18dd609fc12c",
    );
    const item = inspectItemTemplate(fixture);
    const sprite = item.sprites[0].decoded;
    expect(item.entries).toHaveLength(3);
    expect(item.sprites[0].issue).toBe("");
    expect(sprite).toMatchObject({
      width: 32,
      height: 32,
      bits: 4,
      count: 3,
      flags: 0xa7,
      pixelOffset: 56,
    });
  });
  it("rebuilds one encrypted compressed frame, retaining behavior, names, palettes and other frames", () => {
    const before = inspectItemTemplate(fixture);
    const original = fixture.slice();
    const output = rebuildItemTemplate(fixture, 0, 1, solid());
    const after = inspectItemTemplate(output);
    expect(fixture).toEqual(original);
    expect(output.length).toBe(16384);
    expect(after.entries[0].data).toEqual(before.entries[0].data);
    expect(after.entries[2].data).toEqual(before.entries[2].data);
    const a = after.sprites[0].decoded!;
    const b = before.sprites[0].decoded!;
    expect(a.palette).toEqual(b.palette);
    for (const n of [0, 2]) {
      expect(a.storedFrames[n]).toEqual(b.storedFrames[n]);
      expect(a.frames[n]).toEqual(b.frames[n]);
    }
    expect(a.frames[1]).not.toEqual(b.frames[1]);
    expect(after.parts[0].slice(4, 56)).toEqual(before.parts[0].slice(4, 56));
  });
  it("rejects mismatched dimensions, frame selections, unsupported formats and damaged archives", () => {
    const item = inspectItemTemplate(fixture);
    expect(() => rebuildItemTemplate(fixture, 0, 0, solid(16, 16))).toThrow(
      "32 × 32",
    );
    expect(() => rebuildItemTemplate(fixture, 0, 3, solid())).toThrow(
      "valid sprite frame",
    );
    const unsupported = item.parts[0].slice();
    unsupported[5] = 0x10;
    expect(() => replaceSpriteFrame(unsupported, 0, solid())).toThrow(
      "indexed",
    );
    const corrupt = fixture.slice();
    corrupt[64] ^= 1;
    expect(() => readArchive(corrupt)).toThrow();
    expect(() => readArchive(fixture.slice(0, -1))).toThrow();
    expect(() => buildArchive([new Uint8Array(16384)])).toThrow();
  });
  it("rejects truncated sprite headers, tables and payloads", () => {
    const part = inspectItemTemplate(fixture).parts[0];
    for (const end of [0, 23, 24, 55, 79, part.length - 1])
      expect(() => decodeSprite(part.slice(0, end))).toThrow();
    const overlap = part.slice();
    new DataView(overlap.buffer).setUint32(56, 0, true);
    expect(() => decodeSprite(overlap)).toThrow("overlapping");
  });
});
