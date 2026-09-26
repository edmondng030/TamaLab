"use client";
import { useRef, useState } from "react";
import { ParadiseService } from "@/lib/device/ParadiseService";
import { Button } from "@/components/ui/button";
import { ImageCanvas } from "@/components/sprite/image-canvas";
import { downloadBlob } from "@/lib/download";

async function pixels(blob: Blob) {
  const image = await createImageBitmap(blob);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    return {
      width: image.width,
      height: image.height,
      rgba: ctx.getImageData(0, 0, image.width, image.height).data,
    };
  } finally {
    image.close();
  }
}
async function preview(output: {
  rgba: Uint8ClampedArray;
  width: number;
  height: number;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = output.width;
  canvas.height = output.height;
  const ctx = canvas.getContext("2d")!;
  const data = ctx.createImageData(output.width, output.height);
  data.data.set(output.rgba);
  ctx.putImageData(data, 0, 0);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Preview failed."))),
      "image/png",
    ),
  );
}
export function BinaryExport({ image }: { image?: Blob }) {
  const [template, setTemplate] = useState<{
    bytes: Uint8Array;
    info: ReturnType<typeof ParadiseService.inspectItem>;
    name: string;
  }>();
  const [index, setIndex] = useState(0);
  const [frame, setFrame] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    "Build an experimental binary to inspect and export locally.",
  );
  const [output, setOutput] = useState<{
    source: Blob;
    template: typeof template;
    index: number;
    frame: number;
    bytes: Uint8Array;
    preview: Blob;
    filename: string;
  }>();
  const importVersion = useRef(0);
  const valid =
    output &&
    output.source === image &&
    output.template === template &&
    output.index === index &&
    output.frame === frame
      ? output
      : undefined;
  const selected = template?.info.sprites[index];
  async function load(file: File) {
    const version = ++importVersion.current;
    setTemplate(undefined);
    setOutput(undefined);
    setBusy(true);
    try {
      if (file.size > 16384)
        throw new Error(
          "Item templates must be at most 16,384 bytes. Patch files are not supported.",
        );
      const bytes = new Uint8Array(await file.arrayBuffer());
      const info = ParadiseService.inspectItem(bytes);
      if (version !== importVersion.current) return;
      setTemplate({ bytes, info, name: file.name });
      setIndex(0);
      setFrame(0);
      setMessage(
        "Template inspected. Choose the frame to replace; match its dimensions.",
      );
    } catch (e) {
      if (version === importVersion.current)
        setMessage(
          e instanceof Error ? e.message : "Template could not be read.",
        );
    } finally {
      if (version === importVersion.current) setBusy(false);
    }
  }
  async function build(item: boolean) {
    if (!image) return;
    setBusy(true);
    setOutput(undefined);
    try {
      const resource = await pixels(image);
      const result =
        item && template
          ? ParadiseService.prepareItem(template.bytes, index, frame, resource)
          : await ParadiseService.prepareSprite(resource);
      const png = await preview(result);
      setOutput({
        source: image,
        template,
        index,
        frame,
        bytes: result.bytes,
        preview: png,
        filename: item
          ? "tama-experimental.item.bin"
          : "tama-experimental.sprite.bin",
      });
      setMessage(
        `Built ${result.bytes.length.toLocaleString()} bytes. Preview shows the decoded binary colors. Not device verified.`,
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Binary generation failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="panel"
      style={{ marginTop: 24 }}
      aria-label="Experimental binary export"
    >
      <div className="panel-heading">
        <h2>Binary export</h2>
        <span className="badge amber">Experimental</span>
      </div>
      <p>
        Standalone sprites use indexed RGB565 colors, sizes 1–255, and fully
        opaque or transparent pixels.
      </p>
      <div className="button-row">
        <Button disabled={!image || busy} onClick={() => void build(false)}>
          Build sprite binary
        </Button>
      </div>
      <h3>Reskin an existing item</h3>
      <p>
        Import a known working item .bin. Only the selected frame changes; the
        original palette, other frames, behavior and names are preserved. Your
        editor name and category are not applied.
      </p>
      <label className="field">
        Item template (.bin)
        <input
          type="file"
          accept=".bin"
          disabled={busy}
          onChange={(e) => {
            if (e.target.files?.[0]) void load(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </label>
      {template && (
        <>
          <p>
            {template.name} · {template.info.size.toLocaleString()} bytes
          </p>
          <div className="field-grid">
            <label className="field">
              Template sprite
              <select
                disabled={busy}
                value={index}
                onChange={(e) => {
                  setIndex(Number(e.target.value));
                  setFrame(0);
                }}
              >
                {template.info.sprites.map((s) => (
                  <option key={s.index} value={s.index}>
                    Sprite {s.index + 1}
                    {s.decoded
                      ? ` · ${s.decoded.width} × ${s.decoded.height}`
                      : " · unsupported"}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Template frame
              <select
                value={frame}
                disabled={busy || !selected?.decoded}
                onChange={(e) => setFrame(Number(e.target.value))}
              >
                {Array.from(
                  { length: selected?.decoded?.count ?? 0 },
                  (_, n) => (
                    <option key={n} value={n}>
                      Frame {n + 1}
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>
          {selected?.issue && <p>{selected.issue}</p>}
          <Button
            disabled={!image || busy || !selected?.decoded || !!selected.issue}
            onClick={() => void build(true)}
          >
            Build item binary
          </Button>
        </>
      )}
      <p aria-live="polite" data-testid="binary-message">
        {busy ? "Building…" : message}
      </p>
      {valid && (
        <>
          <div
            className="checkerboard"
            style={{ width: "fit-content", padding: 16 }}
          >
            <ImageCanvas
              blob={valid.preview}
              label="Decoded binary preview"
              zoom={4}
            />
          </div>
          <Button
            onClick={() =>
              downloadBlob(
                new Blob([new Uint8Array(valid.bytes)], {
                  type: "application/octet-stream",
                }),
                valid.filename,
              )
            }
          >
            Export binary
          </Button>
        </>
      )}
      <p className="field-help">
        Exported files can be selected in Device lab’s existing-item uploader.
        Generated output remains experimental until checked on the device.
      </p>
    </section>
  );
}
