import { quantize } from "@/lib/sprite/quantize";
export interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}
export type ImageFit = "contain" | "stretch";
export function fittedRect(
  sourceWidth: number,
  sourceHeight: number,
  width: number,
  height: number,
  fit: ImageFit,
) {
  if (fit === "stretch") return { x: 0, y: 0, width, height };
  const scale = Math.min(width / sourceWidth, height / sourceHeight);
  const w = Math.max(1, Math.round(sourceWidth * scale));
  const h = Math.max(1, Math.round(sourceHeight * scale));
  return {
    x: Math.floor((width - w) / 2),
    y: Math.floor((height - h) / 2),
    width: w,
    height: h,
  };
}
export const ACCEPTED_IMAGES = ["image/png", "image/jpeg", "image/webp"];
export function validateImage(file: Blob) {
  if (!ACCEPTED_IMAGES.includes(file.type))
    throw new Error("Choose a PNG, JPG, or WEBP image.");
  if (!file.size || file.size > 10 * 1024 * 1024)
    throw new Error("Images must be non-empty and no larger than 10 MB.");
}
export function validateCrop(crop: Crop, width: number, height: number) {
  if (
    Object.values(crop).some((v) => !Number.isInteger(v)) ||
    crop.x < 0 ||
    crop.y < 0 ||
    crop.width < 1 ||
    crop.height < 1 ||
    crop.x + crop.width > width ||
    crop.y + crop.height > height
  )
    throw new Error(
      "Crop must use whole pixels and stay inside the original image.",
    );
}
export function validateSize(size: number) {
  if (!Number.isInteger(size) || size < 1 || size > 256)
    throw new Error(
      "Sprite dimensions must be whole numbers between 1 and 256.",
    );
}
export function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Could not export the canvas.")),
      "image/png",
    ),
  );
}
export async function decodeImage(blob: Blob) {
  validateImage(blob);
  const bitmap = await createImageBitmap(blob, {
    imageOrientation: "from-image",
  });
  if (bitmap.width * bitmap.height > 24000000) {
    bitmap.close();
    throw new Error(
      "Please resize this image below 24 megapixels before importing.",
    );
  }
  return bitmap;
}
export async function processImage(
  original: Blob,
  crop: Crop,
  width: number,
  height: number,
  colors: number,
  fit: ImageFit = "stretch",
) {
  validateSize(width);
  validateSize(height);
  const image = await decodeImage(original);
  try {
    validateCrop(crop, image.width, image.height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D is unavailable in this browser.");
    context.imageSmoothingEnabled = false;
    const rect = fittedRect(crop.width, crop.height, width, height, fit);
    context.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
    );
    const processedImage = await canvasBlob(canvas);
    const input = context.getImageData(0, 0, width, height);
    const { pixels, palette } = quantize(input.data, colors);
    input.data.set(pixels);
    context.putImageData(input, 0, 0);
    return { processedImage, spriteImage: await canvasBlob(canvas), palette };
  } finally {
    image.close();
  }
}
