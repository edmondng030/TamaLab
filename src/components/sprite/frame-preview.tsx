"use client";
import { useEffect, useMemo, useRef } from "react";
import { ParadiseService } from "@/lib/device/ParadiseService";
import type { DecodedSprite } from "@/lib/paradise/sprite/decoder";
export function FramePreview({
  sprite,
  frame = 0,
  label,
}: {
  sprite: DecodedSprite;
  frame?: number;
  label: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const preview = useMemo(
    () => ParadiseService.previewFrame(sprite, frame),
    [sprite, frame],
  );
  useEffect(() => {
    const context = ref.current?.getContext("2d");
    if (!context) return;
    const image = context.createImageData(preview.width, preview.height);
    image.data.set(preview.rgba);
    context.putImageData(image, 0, 0);
  }, [preview]);
  return (
    <canvas
      ref={ref}
      width={preview.width}
      height={preview.height}
      className="frame-preview"
      role="img"
      aria-label={label}
    />
  );
}
