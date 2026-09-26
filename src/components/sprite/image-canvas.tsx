"use client";
import { useEffect, useRef } from "react";
import type { Crop } from "@/lib/image/process";
export function ImageCanvas({
  blob,
  label,
  zoom,
  crop,
}: {
  blob: Blob;
  label: string;
  zoom?: number;
  crop?: Crop;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    void createImageBitmap(blob)
      .then((image) => {
        const canvas = ref.current;
        if (!cancelled && canvas) {
          // Original canvas is scaled for display; crop coordinates remain source pixels.
          const scale = zoom
            ? 1
            : Math.min(1, 1000 / Math.max(image.width, image.height));
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext("2d");
          if (context) {
            context.imageSmoothingEnabled = false;
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            if (crop) {
              context.strokeStyle = "#0f766e";
              context.lineWidth = Math.max(2, canvas.width / 180);
              context.strokeRect(
                crop.x * scale,
                crop.y * scale,
                crop.width * scale,
                crop.height * scale,
              );
            }
          }
          canvas.style.width = zoom ? `${image.width * zoom}px` : "";
          canvas.style.height = zoom ? `${image.height * zoom}px` : "";
        }
        image.close();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [blob, zoom, crop]);
  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={label}
      className={zoom ? "sprite-canvas" : "original-canvas"}
    />
  );
}
