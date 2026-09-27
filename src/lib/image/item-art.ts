import type { SpriteResource } from "@/lib/paradise/sprite/encoder";
import { canvasBlob } from "./process";

export async function imagePixels(blob: Blob): Promise<SpriteResource> {
  const image = await createImageBitmap(blob);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D is unavailable in this browser.");
    context.drawImage(image, 0, 0);
    return {
      width: image.width,
      height: image.height,
      rgba: context.getImageData(0, 0, image.width, image.height).data,
    };
  } finally {
    image.close();
  }
}
export function prepareItemAlpha(
  resource: SpriteResource,
  transparent: boolean,
  threshold = 128,
): SpriteResource {
  if (!Number.isInteger(threshold) || threshold < 1 || threshold > 255)
    throw new Error("Transparency cutoff must be between 1 and 255.");
  const rgba = new Uint8ClampedArray(resource.rgba);
  for (let i = 0; i < rgba.length; i += 4) {
    if (transparent) rgba[i + 3] = rgba[i + 3] < threshold ? 0 : 255;
    else {
      const alpha = rgba[i + 3] / 255;
      for (let c = 0; c < 3; c++)
        rgba[i + c] = Math.round(rgba[i + c] * alpha + 255 * (1 - alpha));
      rgba[i + 3] = 255;
    }
  }
  return { ...resource, rgba };
}
export function pixelsPng(resource: SpriteResource) {
  const canvas = document.createElement("canvas");
  canvas.width = resource.width;
  canvas.height = resource.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable in this browser.");
  const pixels = context.createImageData(resource.width, resource.height);
  pixels.data.set(resource.rgba);
  context.putImageData(pixels, 0, 0);
  return canvasBlob(canvas);
}
export function itemFilename(name: string) {
  const base = name
    .replace(/\.(png|jpe?g|webp|bin)$/i, "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .trim()
    .replace(/[. ]+$/, "")
    .slice(0, 70);
  return `${base || "my-item"}.item.bin`;
}
