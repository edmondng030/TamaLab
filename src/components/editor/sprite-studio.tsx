"use client";
import { useRef, useState, useEffect } from "react";
import {
  Upload,
  Download,
  Save,
  FolderOpen,
  Scan,
  WandSparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCanvas } from "@/components/sprite/image-canvas";
import { decodeImage, processImage, type Crop } from "@/lib/image/process";
import { db } from "@/lib/storage/db";
import { downloadBlob } from "@/lib/download";
import { BinaryExport } from "./binary-export";

export function SpriteStudio() {
  const [original, setOriginal] = useState<Blob>();
  const [filename, setFilename] = useState("");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState<Crop>({ x: 0, y: 0, width: 1, height: 1 });
  const [width, setWidth] = useState(32);
  const [height, setHeight] = useState(32);
  const [colors, setColors] = useState(16);
  const [zoom, setZoom] = useState(8);
  const [result, setResult] =
    useState<Awaited<ReturnType<typeof processImage>>>();
  const [name, setName] = useState("My first tiny thing");
  const [category, setCategory] = useState("toy");
  const [message, setMessage] = useState(
    "Your original image stays untouched. Everything happens in this browser.",
  );
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const importVersion = useRef(0);
  async function importFile(file: File) {
    const version = ++importVersion.current;
    setBusy(true);
    try {
      const image = await decodeImage(file);
      if (version !== importVersion.current) {
        image.close();
        return;
      }
      setDimensions({ width: image.width, height: image.height });
      setCrop({ x: 0, y: 0, width: image.width, height: image.height });
      image.close();
      setOriginal(file);
      setFilename(file.name);
      setResult(undefined);
      setMessage("Image imported. Adjust your crop and sprite settings below.");
    } catch (error) {
      if (version === importVersion.current)
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not decode this image.",
        );
    } finally {
      if (version === importVersion.current) setBusy(false);
    }
  }
  useEffect(() => {
    if (!original) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setProcessing(true);
      setResult(undefined);
      void processImage(original, crop, width, height, colors)
        .then((output) => {
          if (!cancelled) {
            setResult(output);
            setMessage(
              "Preview updated · unsaved changes. Palette and dimensions are editor choices, not device requirements.",
            );
          }
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            setResult(undefined);
            setMessage(
              error instanceof Error
                ? error.message
                : "Could not create the preview.",
            );
          }
        })
        .finally(() => {
          if (!cancelled) setProcessing(false);
        });
    }, 100);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [original, crop, width, height, colors]);
  async function saveDraft() {
    if (!original || !result) return;
    setBusy(true);
    try {
      await db.drafts.put({
        id: "current",
        name,
        category,
        filename,
        originalImage: original,
        ...result,
        crop,
        width,
        height,
        colors,
        modifiedAt: new Date().toISOString(),
      });
      setMessage(
        "Saved locally in this browser. Your original, resized image, and sprite are stored separately.",
      );
    } catch {
      setMessage(
        "Could not save locally. Browser storage may be unavailable or full. Export your PNG to keep it.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function loadDraft() {
    setBusy(true);
    try {
      const draft = await db.drafts.get("current");
      if (!draft) {
        setMessage(
          "No local draft yet. Import an image and choose Save draft.",
        );
        return;
      }
      const image = await decodeImage(draft.originalImage);
      setDimensions({ width: image.width, height: image.height });
      image.close();
      setOriginal(draft.originalImage);
      setFilename(draft.filename);
      setCrop(draft.crop);
      setWidth(draft.width);
      setHeight(draft.height);
      setColors(draft.colors);
      setName(draft.name);
      setCategory(draft.category);
      setResult(undefined);
      setMessage("Local draft opened.");
    } catch {
      setMessage(
        "Could not open the local draft. Your browser storage may be unavailable.",
      );
    } finally {
      setBusy(false);
    }
  }
  function updateCrop(key: keyof Crop, value: number) {
    setResult(undefined);
    setCrop((old) => ({ ...old, [key]: value }));
  }
  return (
    <div
      onPaste={(e) => {
        const file = Array.from(e.clipboardData.files).find((f) =>
          f.type.startsWith("image/"),
        );
        if (file && !busy) {
          e.preventDefault();
          void importFile(file);
        }
      }}
    >
      <div className="page-heading">
        <div>
          <div className="eyebrow">SMALL CANVAS · BIG IMAGINATION</div>
          <h1>
            Sprite workspace<span className="title-spark">✳</span>
          </h1>
          <p>Give an everyday image a tiny new life.</p>
        </div>
        <span className="badge amber">Preview Only</span>
      </div>
      <div className="studio-toolbar">
        <span>
          <Scan size={17} /> Image → Crop → Pixels
        </span>
        <div className="button-row compact">
          <Button
            variant="outline"
            disabled={busy || processing}
            onClick={() => void loadDraft()}
          >
            <FolderOpen size={15} />
            Open draft
          </Button>
          <Button
            variant="outline"
            disabled={!result || busy || processing}
            onClick={() => void saveDraft()}
          >
            <Save size={15} />
            Save draft
          </Button>
          <Button
            disabled={!result || busy || processing}
            onClick={() =>
              result &&
              downloadBlob(result.spriteImage, "tama-sprite-preview.png")
            }
          >
            <Download size={15} />
            Export PNG
          </Button>
        </div>
      </div>
      <div className="studio-grid">
        <section className="panel studio-assets">
          <h2>Source image</h2>
          <button
            className="upload-zone"
            disabled={busy}
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files[0] && !busy)
                void importFile(e.dataTransfer.files[0]);
            }}
          >
            <Upload size={25} />
            <strong>{original ? "Replace image" : "Add an image"}</strong>
            <span>Drop, click, or paste</span>
            <small>PNG, JPG, WEBP · up to 10 MB</small>
          </button>
          <input
            ref={fileInput}
            aria-label="Upload image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => {
              if (e.target.files?.[0]) void importFile(e.target.files[0]);
              e.target.value = "";
            }}
          />
          {original && (
            <>
              <div className="asset-filename">
                {filename}
                <small>
                  {dimensions.width} × {dimensions.height} px · original
                  preserved
                </small>
              </div>
              <div className="source-preview checkerboard">
                <ImageCanvas
                  blob={original}
                  label="Original image with crop boundary"
                  crop={crop}
                />
              </div>
              <h3 className="section-label">CROP · SOURCE PIXELS</h3>
              <div className="field-grid">
                {(["x", "y", "width", "height"] as const).map((key) => (
                  <label className="field" key={key}>
                    {key}
                    <input
                      disabled={busy}
                      type="number"
                      min={key === "x" || key === "y" ? 0 : 1}
                      aria-label={`Crop ${key}`}
                      value={crop[key]}
                      onChange={(e) => updateCrop(key, Number(e.target.value))}
                    />
                  </label>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => {
                  setResult(undefined);
                  setCrop({ x: 0, y: 0, ...dimensions });
                }}
              >
                Reset crop
              </Button>
            </>
          )}
        </section>
        <section className="panel preview-panel">
          <div className="panel-heading">
            <h2>Pixel preview</h2>
            <span className="badge neutral">
              {width} × {height}
            </span>
          </div>
          <div className="pixel-stage checkerboard">
            {result ? (
              <ImageCanvas
                blob={result.spriteImage}
                label="Pixel sprite preview"
                zoom={zoom}
              />
            ) : (
              <div className="preview-empty">
                <WandSparkles size={36} />
                <h3>
                  {processing ? "Making tiny pixels…" : "A fresh little canvas"}
                </h3>
                <p>
                  {original
                    ? "Check your crop and dimensions to build a preview."
                    : "Add an image to start creating."}
                </p>
              </div>
            )}
          </div>
          <div className="preview-footer">
            <span>Smoothing off · transparent background</span>
            <label>
              Zoom{" "}
              <select
                aria-label="Preview zoom"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              >
                {[1, 2, 4, 8, 16].map((v) => (
                  <option key={v} value={v}>
                    {v}×
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
        <section className="panel properties">
          <h2>Make it yours</h2>
          <label className="field">
            Item name
            <input
              value={name}
              maxLength={80}
              disabled={busy}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="field">
            Category
            <select
              value={category}
              disabled={busy}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="toy">Toy</option>
              <option value="food">Food</option>
              <option value="gift">Gift</option>
              <option value="decoration">Decoration</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
          <hr />
          <h3 className="section-label">SPRITE SIZE</h3>
          <div className="field-grid">
            <label className="field">
              Width
              <input
                aria-label="Sprite width"
                type="number"
                min={1}
                max={256}
                disabled={busy}
                value={width}
                onChange={(e) => {
                  setResult(undefined);
                  setWidth(Number(e.target.value));
                }}
              />
            </label>
            <label className="field">
              Height
              <input
                aria-label="Sprite height"
                type="number"
                min={1}
                max={256}
                disabled={busy}
                value={height}
                onChange={(e) => {
                  setResult(undefined);
                  setHeight(Number(e.target.value));
                }}
              />
            </label>
          </div>
          <p className="field-help">
            Crop is fitted to this size. Match its aspect ratio to avoid
            stretching.
          </p>
          <label className="field">
            Palette limit
            <select
              value={colors}
              disabled={busy}
              onChange={(e) => {
                setResult(undefined);
                setColors(Number(e.target.value));
              }}
            >
              {[2, 4, 16, 256].map((v) => (
                <option key={v} value={v}>
                  {v} colors
                </option>
              ))}
            </select>
          </label>
          <div className="palette" aria-label="Generated palette">
            {result?.palette.map((color, i) => (
              <span
                key={i}
                title={`rgb(${color.join(", ")})`}
                style={{ backgroundColor: `rgb(${color.join(",")})` }}
              />
            ))}
          </div>
          <p className="field-help">
            Median cut · {result?.palette.length ?? 0} colors used
          </p>
          <hr />
          <span className="badge amber">Preview Only</span>
          <p className="field-help">
            Paradise sprite and item encoding are not verified. PNG export is
            for your artwork.
          </p>
          <Button variant="outline" disabled className="w-full">
            Send to Tamagotchi
          </Button>
        </section>
      </div>
      <div className="studio-status" role="status">
        {busy ? "Working…" : message}
      </div>
      <BinaryExport image={busy || processing ? undefined : result?.spriteImage} />
    </div>
  );
}
