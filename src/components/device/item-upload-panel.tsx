"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ParadiseService } from "@/lib/device/ParadiseService";
import { useDevice } from "@/lib/device/store";

export function ItemUploadPanel() {
  const device = useDevice();
  const [item, setItem] = useState<{
    bytes: Uint8Array;
    name: string;
    hash: string;
  }>();
  const [key, setKey] = useState<Uint8Array>();
  const [message, setMessage] = useState(
    "Choose an existing item file to send unchanged.",
  );
  const [loading, setLoading] = useState(false);
  const version = useRef(0);
  async function loadItem(file: File) {
    const current = ++version.current;
    setItem(undefined);
    setLoading(true);
    try {
      if (file.size > 16384)
        throw new Error(
          "Choose an item of at most 16,384 bytes. Patch files are not supported.",
        );
      const bytes = new Uint8Array(await file.arrayBuffer());
      ParadiseService.inspectItem(bytes);
      const digest = new Uint8Array(
        await crypto.subtle.digest("SHA-256", bytes),
      );
      if (version.current !== current) return;
      setItem({
        bytes,
        name: file.name,
        hash: Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join(
          "",
        ),
      });
      setMessage(
        "Item archive validated. Original file bytes will be sent without edits.",
      );
    } catch (error) {
      if (version.current === current)
        setMessage(
          error instanceof Error ? error.message : "Could not read item.",
        );
    } finally {
      if (version.current === current) setLoading(false);
    }
  }
  async function loadKey(file: File) {
    setLoading(true);
    key?.fill(0);
    setKey(undefined);
    try {
      if (file.size > 2048)
        throw new Error("Choose the local protocol-key JSON file.");
      setKey(ParadiseService.parseProtocolKey(await file.text()));
      setMessage("Protocol key loaded for this page session.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not read protocol key.",
      );
    } finally {
      setLoading(false);
    }
  }
  const locked = loading || device.busy;
  return (
    <section
      className="panel"
      style={{ marginTop: 24, marginBottom: 24 }}
      aria-label="Existing item upload"
    >
      <div className="panel-heading">
        <h2>Upload an existing item</h2>
        <span className="badge amber">Experimental</span>
      </div>
      <p>
        Send a downloadable item .bin, such as 舞台.bin. The file keeps its
        original content and identity; check the device result after sending.
      </p>
      <div className="field-grid">
        <label className="field">
          Item file (.bin)
          <input
            disabled={locked}
            type="file"
            accept=".bin"
            onChange={(e) => {
              if (e.target.files?.[0]) void loadItem(e.target.files[0]);
              e.target.value = "";
            }}
          />
        </label>
        <label className="field">
          Local protocol key (.json)
          <input
            disabled={locked}
            type="file"
            accept=".json"
            onChange={(e) => {
              if (e.target.files?.[0]) void loadKey(e.target.files[0]);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <p className="field-help">
        Import .local/patchi-protocol-key.json from your project folder. The key
        stays in browser memory for this page session and is not uploaded or
        saved.
      </p>
      {key && (
        <Button
          variant="ghost"
          disabled={locked}
          onClick={() => {
            key.fill(0);
            setKey(undefined);
            setMessage(
              "Protocol key forgotten. Import it again before uploading.",
            );
          }}
        >
          Forget protocol key
        </Button>
      )}
      {item && (
        <p style={{ overflowWrap: "anywhere" }}>
          {item.name} · {item.bytes.length.toLocaleString()} bytes
          <br />
          <small>SHA-256: {item.hash}</small>
        </p>
      )}
      <p data-testid="upload-file-message" aria-live="polite">
        {message}
      </p>
      <p>
        Close Patchi Lab and other apps using the port. Select USB serial,
        connect at 460800 baud, and put your Tamagotchi on the download
        connection screen used with Patchi Lab.
      </p>
      <div className="button-row">
        <Button
          disabled={
            locked ||
            !item ||
            !key ||
            device.status !== "connected" ||
            (device.mode === "serial" && device.baudRate !== 460800)
          }
          onClick={() => item && key && void device.sendItem(item.bytes, key)}
        >
          {device.mode === "mock"
            ? "Simulate item upload"
            : "Upload item unchanged"}
        </Button>
        {device.uploading && (
          <Button variant="outline" onClick={device.cancelUpload}>
            Cancel upload
          </Button>
        )}
      </div>
      {device.uploadTotal > 0 && (
        <div aria-live="polite">
          <p>
            Acknowledged: {device.uploadProgress.toLocaleString()} /{" "}
            {device.uploadTotal.toLocaleString()} bytes
          </p>
          <p>{device.message}</p>
        </div>
      )}
      <p className="field-help">
        Start capture above before sending to keep a TX/RX record.
        Acknowledgement alone does not verify that the item appears on the
        device. TamaLab hardware upload testing is pending.
      </p>
    </section>
  );
}
