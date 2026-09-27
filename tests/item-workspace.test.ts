import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fittedRect } from "@/lib/image/process";
import { prepareItemAlpha, itemFilename } from "@/lib/image/item-art";
import { ParadiseService } from "@/lib/device/ParadiseService";
import { useUploadItem } from "@/lib/device/upload-item-store";

describe("image to complete item workflow", () => {
  it("fits wide and tall artwork without stretching or clipping", () => {
    expect(fittedRect(80, 40, 32, 32, "contain")).toEqual({
      x: 0,
      y: 8,
      width: 32,
      height: 16,
    });
    expect(fittedRect(40, 80, 32, 32, "contain")).toEqual({
      x: 8,
      y: 0,
      width: 16,
      height: 32,
    });
    expect(fittedRect(80, 40, 32, 32, "stretch")).toEqual({
      x: 0,
      y: 0,
      width: 32,
      height: 32,
    });
    expect(fittedRect(24000000, 1, 32, 32, "contain").height).toBe(1);
  });
  it("converts partial alpha at the selected cutoff without changing the source", () => {
    const source = {
      width: 3,
      height: 1,
      rgba: new Uint8ClampedArray([
        255, 0, 0, 0, 0, 255, 0, 127, 0, 0, 255, 128,
      ]),
    };
    const original = source.rgba.slice();
    const output = prepareItemAlpha(source, true);
    expect([output.rgba[3], output.rgba[7], output.rgba[11]]).toEqual([
      0, 0, 255,
    ]);
    expect(source.rgba).toEqual(original);
    expect(prepareItemAlpha(source, true, 200).rgba[11]).toBe(0);
    expect(() => prepareItemAlpha(source, true, 0)).toThrow("cutoff");
  });
  it("composites on white for opaque item templates", () => {
    const output = prepareItemAlpha(
      {
        width: 2,
        height: 1,
        rgba: new Uint8ClampedArray([0, 0, 0, 0, 255, 0, 0, 128]),
      },
      false,
    );
    expect([...output.rgba]).toEqual([255, 255, 255, 255, 255, 127, 127, 255]);
  });
  it("keeps Unicode names and removes file path characters", () => {
    expect(itemFilename("舞台.png")).toBe("舞台.item.bin");
    expect(itemFilename("../test:name.webp")).not.toMatch(/[/:\\]/);
    expect(itemFilename("  ")).toBe("my-item.item.bin");
  });
  it("validates, hashes and snapshots item bytes for a handoff, without a send", async () => {
    const original = new Uint8Array(
      readFileSync(
        new URL("./fixtures/tamacat/pa-tomaquet.bin", import.meta.url),
      ),
    );
    const input = original.slice();
    const prepared = await ParadiseService.prepareUpload(
      input,
      "my-item.bin",
      "studio",
    );
    input.fill(0);
    expect(prepared.hash).toBe(
      createHash("sha256").update(original).digest("hex"),
    );
    expect(prepared.bytes).toEqual(original);
    useUploadItem.getState().select(prepared);
    prepared.bytes.fill(0);
    expect(useUploadItem.getState().item?.bytes).toEqual(original);
    expect(useUploadItem.getState().item?.origin).toBe("studio");
    useUploadItem.getState().clear();
    expect(useUploadItem.getState().item).toBeUndefined();
    await expect(
      ParadiseService.prepareUpload(new Uint8Array([1]), "bad.bin", "studio"),
    ).rejects.toThrow();
  });
});
