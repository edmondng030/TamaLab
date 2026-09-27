"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import {
  ParadiseService,
  type PreparedUploadItem,
} from "@/lib/device/ParadiseService";
import { useUploadItem } from "@/lib/device/upload-item-store";
import { useDevice } from "@/lib/device/store";
import { Button } from "@/components/ui/button";
import { ImageCanvas } from "@/components/sprite/image-canvas";
import { FramePreview } from "@/components/sprite/frame-preview";
import { downloadBlob } from "@/lib/download";
import {
  imagePixels,
  itemFilename,
  pixelsPng,
  prepareItemAlpha,
} from "@/lib/image/item-art";

export function BinaryExport({
  image,
  name,
  onMatchSize,
}: {
  image?: Blob;
  name: string;
  onMatchSize: (width: number, height: number) => void;
}) {
  const [template, setTemplate] = useState<{
    bytes: Uint8Array;
    info: ReturnType<typeof ParadiseService.inspectItem>;
    name: string;
  }>();
  const [index, setIndex] = useState(0);
  const [frame, setFrame] = useState(0);
  const [threshold, setThreshold] = useState(128);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    "Add your image above, then choose a working item .bin as the base.",
  );
  const [output, setOutput] = useState<{
    source: Blob;
    template: typeof template;
    index: number;
    frame: number;
    threshold: number;
    name: string;
    preview: Blob;
    item: PreparedUploadItem;
  }>();
  const [spriteOutput, setSpriteOutput] = useState<{
    source: Blob;
    bytes: Uint8Array;
  }>();
  const importVersion = useRef(0);
  const deviceBusy = useDevice((s) => s.busy);
  const selected = template?.info.sprites[index];
  const valid =
    output &&
    output.source === image &&
    output.template === template &&
    output.index === index &&
    output.frame === frame &&
    output.threshold === threshold &&
    output.name === name
      ? output
      : undefined;
  function selectSprite(next: number, info = template?.info) {
    setIndex(next);
    setFrame(0);
    setOutput(undefined);
    const sprite = info?.sprites[next];
    if (sprite?.decoded && !sprite.issue)
      onMatchSize(sprite.decoded.width, sprite.decoded.height);
  }
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
      const first = info.sprites.find((s) => s.decoded && !s.issue)?.index ?? 0;
      selectSprite(first, info);
      setMessage(
        "Template loaded. Image size matched automatically; choose the sprite and frame your artwork should replace.",
      );
    } catch (error) {
      if (version === importVersion.current)
        setMessage(
          error instanceof Error ? error.message : "Could not read template.",
        );
    } finally {
      if (version === importVersion.current) setBusy(false);
    }
  }
  async function build() {
    if (!image || !template || !selected?.decoded || selected.issue) return;
    setBusy(true);
    setOutput(undefined);
    try {
      const resource = prepareItemAlpha(
        await imagePixels(image),
        selected.decoded.transparentIndex !== undefined,
        threshold,
      );
      const result = ParadiseService.prepareItem(
        template.bytes,
        index,
        frame,
        resource,
      );
      const preview = await pixelsPng(result);
      const item = await ParadiseService.prepareUpload(
        result.bytes,
        itemFilename(name),
        "studio",
      );
      setOutput({
        source: image,
        template,
        index,
        frame,
        threshold,
        name,
        preview,
        item,
      });
      setMessage(
        `Item .bin ready · ${item.bytes.length.toLocaleString()} bytes. Inspect the converted colors before downloading or continuing to the uploader.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Item conversion failed.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function buildStandalone() {
    if (!image) return;
    setBusy(true);
    setSpriteOutput(undefined);
    try {
      const result = await ParadiseService.prepareSprite(
        prepareItemAlpha(await imagePixels(image), true),
      );
      setSpriteOutput({ source: image, bytes: result.bytes });
      setMessage(
        "Standalone sprite ready. It is not a complete item and cannot be sent through the item uploader.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Sprite conversion failed.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="panel item-builder"
      id="create-item"
      aria-label="Create item bin"
    >
      <div className="panel-heading">
        <div>
          <div className="eyebrow">02 · PACKAGE YOUR ARTWORK</div>
          <h2>Create item .bin</h2>
        </div>
        <span className="badge amber">Experimental output</span>
      </div>
      <p>
        An image supplies the artwork. A working item .bin supplies the behavior
        and structure needed by the Tamagotchi.
      </p>
      <label className="field">
        Item template (.bin)
        <input
          type="file"
          accept=".bin"
          disabled={busy}
          onChange={(event) => {
            if (event.target.files?.[0]) void load(event.target.files[0]);
            event.target.value = "";
          }}
        />
      </label>
      <p className="field-help">
        Choose a template with the behavior you want. Its item identity,
        in-device name, behavior and other frames stay the same. This does not
        allocate a separate new item ID; uploading may replace a download that
        uses the same identity.
      </p>
      {template && (
        <>
          <p className="template-summary">
            {template.name} · {template.info.sprites.length} sprites ·{" "}
            {template.info.size.toLocaleString()} bytes
          </p>
          <div
            className="template-gallery"
            aria-label="Template sprite previews"
          >
            {template.info.sprites.slice(0, 24).map((sprite) => (
              <button
                type="button"
                key={sprite.index}
                disabled={busy || !sprite.decoded || !!sprite.issue}
                aria-pressed={index === sprite.index}
                onClick={() => selectSprite(sprite.index)}
                title={sprite.issue || `Choose sprite ${sprite.index + 1}`}
              >
                <div className="checkerboard">
                  {sprite.decoded ? (
                    <FramePreview
                      sprite={sprite.decoded}
                      label={`Template sprite ${sprite.index + 1} thumbnail`}
                    />
                  ) : (
                    <span>?</span>
                  )}
                </div>
                <strong>Sprite {sprite.index + 1}</strong>
                <small>
                  {sprite.decoded
                    ? `${sprite.decoded.width} × ${sprite.decoded.height} · ${sprite.decoded.count} frame${sprite.decoded.count === 1 ? "" : "s"}`
                    : "Unsupported"}
                </small>
                {sprite.issue && <small>Not editable</small>}
              </button>
            ))}
          </div>
          {template.info.sprites.length > 24 && (
            <p className="field-help">
              First 24 previews shown. All sprites are listed below.
            </p>
          )}
          <div className="field-grid">
            <label className="field">
              Template sprite
              <select
                disabled={busy}
                value={index}
                onChange={(event) => selectSprite(Number(event.target.value))}
              >
                {template.info.sprites.map((sprite) => (
                  <option key={sprite.index} value={sprite.index}>
                    Sprite {sprite.index + 1}
                    {sprite.decoded
                      ? ` · ${sprite.decoded.width} × ${sprite.decoded.height}`
                      : " · unsupported"}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Template frame
              <select
                disabled={busy || !selected?.decoded}
                value={frame}
                onChange={(event) => {
                  setFrame(Number(event.target.value));
                  setOutput(undefined);
                }}
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
          {selected?.issue ? (
            <p className="studio-status">
              {selected.issue} Choose another sprite to continue.
            </p>
          ) : (
            selected?.decoded && (
              <>
                <p className="field-help">
                  Replaces only sprite {index + 1}, frame {frame + 1}. The
                  original {selected.decoded.palette.length}-color palette is
                  preserved, so your artwork’s colors may change. Other frames
                  keep the template artwork.
                </p>
                <div className="conversion-settings">
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      onMatchSize(
                        selected.decoded!.width,
                        selected.decoded!.height,
                      )
                    }
                  >
                    Match template size ({selected.decoded.width} ×{" "}
                    {selected.decoded.height})
                  </Button>
                  {selected.decoded.transparentIndex !== undefined ? (
                    <label className="field">
                      Transparency cutoff
                      <input
                        aria-label="Transparency cutoff"
                        type="number"
                        min={1}
                        max={255}
                        value={threshold}
                        disabled={busy}
                        onChange={(event) => {
                          setThreshold(Number(event.target.value));
                          setOutput(undefined);
                        }}
                      />
                      <small>
                        Below this alpha value becomes transparent; the rest
                        becomes opaque.
                      </small>
                    </label>
                  ) : (
                    <p className="field-help">
                      This template is opaque. Transparent areas will be filled
                      with white before palette conversion.
                    </p>
                  )}
                </div>
                <div className="item-comparison">
                  <figure>
                    <div className="checkerboard">
                      <FramePreview
                        sprite={selected.decoded}
                        frame={frame}
                        label="Original template frame"
                      />
                    </div>
                    <figcaption>Original template frame</figcaption>
                  </figure>
                  <figure>
                    <div className="checkerboard">
                      {valid ? (
                        <ImageCanvas
                          blob={valid.preview}
                          label="Converted item preview"
                          zoom={3}
                        />
                      ) : (
                        <span>
                          Convert to see the actual
                          <br />
                          binary colors and transparency
                        </span>
                      )}
                    </div>
                    <figcaption>Converted item preview</figcaption>
                  </figure>
                </div>
              </>
            )
          )}
        </>
      )}
      <div className="button-row">
        <Button
          disabled={!image || !selected?.decoded || !!selected.issue || busy}
          onClick={() => void build()}
        >
          {busy ? "Converting…" : "Convert image to item .bin"}
        </Button>
      </div>
      <p aria-live="polite" data-testid="binary-message">
        {message}
      </p>
      {valid && (
        <div className="item-ready">
          <div>
            <strong>{valid.item.name}</strong>
            <p>
              {valid.item.bytes.length.toLocaleString()} bytes · Complete item
              archive · Not device verified
            </p>
          </div>
          <div className="button-row">
            <Button
              variant="outline"
              onClick={() =>
                downloadBlob(
                  new Blob([new Uint8Array(valid.item.bytes)], {
                    type: "application/octet-stream",
                  }),
                  valid.item.name,
                )
              }
            >
              <Download size={16} />
              Download item .bin
            </Button>
            {deviceBusy ? (
              <Button disabled>Device operation in progress</Button>
            ) : (
              <Button asChild>
                <Link
                  href="/device#item-upload"
                  onClick={() => useUploadItem.getState().select(valid.item)}
                >
                  Use in uploader
                  <ArrowRight size={16} />
                </Link>
              </Button>
            )}
          </div>
          <p className="field-help">
            Use in uploader selects this exact file for review. You choose when
            to upload. Download a copy to keep it after refreshing the page.
          </p>
        </div>
      )}
      <details className="sprite-advanced">
        <summary>Advanced: standalone sprite export</summary>
        <p>
          A sprite-only binary is a building block, not a downloadable item. Use
          the item conversion above for device uploads.
        </p>
        <Button
          variant="outline"
          disabled={!image || busy}
          onClick={() => void buildStandalone()}
        >
          Build sprite binary
        </Button>
        {spriteOutput?.source === image && spriteOutput && (
          <Button
            variant="ghost"
            onClick={() =>
              downloadBlob(
                new Blob([new Uint8Array(spriteOutput.bytes)]),
                "tama-experimental.sprite.bin",
              )
            }
          >
            Download sprite only
          </Button>
        )}
      </details>
    </section>
  );
}
