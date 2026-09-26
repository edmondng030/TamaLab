import { describe, it, expect } from "vitest";
import { quantize } from "@/lib/sprite/quantize";
import { validateCrop, validateImage, validateSize } from "@/lib/image/process";
describe("device-independent sprite pipeline", () => {
  it("preserves a rare second color when the source already fits the palette", () => {
    const input = new Uint8ClampedArray([
      ...Array.from({ length: 99 }, () => [220, 130, 80, 255]).flat(),
      70,
      140,
      30,
      255,
    ]);
    expect(quantize(input, 2).pixels).toEqual(input);
  });
  it("preserves the original pixels and alpha while limiting colors", () => {
    const input = new Uint8ClampedArray([
      255, 0, 0, 255, 0, 255, 0, 128, 0, 0, 255, 255, 80, 90, 100, 0,
    ]);
    const copy = input.slice();
    const output = quantize(input, 2);
    expect(output.palette.length).toBeLessThanOrEqual(2);
    expect(input).toEqual(copy);
    expect(output.pixels[7]).toBe(128);
    expect(output.pixels[15]).toBe(0);
    expect(output.pixels.slice(12)).toEqual(input.slice(12));
    for (let i = 0; i < 12; i += 4)
      expect(output.palette).toContainEqual(
        Array.from(output.pixels.slice(i, i + 3)),
      );
  });
  it("handles transparent and single-color images", () => {
    expect(quantize(new Uint8ClampedArray(16), 16).palette).toEqual([]);
    expect(
      quantize(new Uint8ClampedArray([10, 20, 30, 255, 10, 20, 30, 255]), 256)
        .palette,
    ).toEqual([[10, 20, 30]]);
  });
  it("rejects malformed pixels and invalid palette sizes", () => {
    expect(() => quantize(new Uint8ClampedArray(3), 2)).toThrow(
      "complete pixels",
    );
    expect(() => quantize(new Uint8ClampedArray(4), 3)).toThrow("Choose");
  });
  it("rejects negative, fractional, empty, and out-of-bounds crops", () => {
    for (const crop of [
      { x: -1, y: 0, width: 1, height: 1 },
      { x: 0, y: 0, width: 0, height: 1 },
      { x: 0.5, y: 0, width: 1, height: 1 },
      { x: 9, y: 0, width: 2, height: 1 },
    ])
      expect(() => validateCrop(crop, 10, 10)).toThrow("Crop");
    expect(() =>
      validateCrop({ x: 0, y: 0, width: 10, height: 10 }, 10, 10),
    ).not.toThrow();
  });
  it("limits sprite size and upload input", () => {
    for (const size of [0, 257, -1, 1.5, NaN])
      expect(() => validateSize(size)).toThrow();
    expect(() =>
      validateImage(new Blob(["test"], { type: "image/svg+xml" })),
    ).toThrow("Choose");
    expect(() => validateImage(new Blob([], { type: "image/png" }))).toThrow(
      "non-empty",
    );
    expect(() =>
      validateImage(
        new Blob([new Uint8Array(10 * 1024 * 1024 + 1)], { type: "image/png" }),
      ),
    ).toThrow("10 MB");
  });
});
