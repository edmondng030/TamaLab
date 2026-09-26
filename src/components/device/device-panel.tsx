"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Cable,
  FlaskConical,
  ArrowRight,
  Download,
  Trash2,
  Radio,
  PlugZap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDevice } from "@/lib/device/store";
import { useSettings } from "@/lib/storage/settings";
import { decodeLog, exportLog, toAscii } from "@/lib/device/log";
import { downloadBlob } from "@/lib/download";
import type { MockBehavior } from "@/lib/transport/MockTransport";
import { ItemUploadPanel } from "./item-upload-panel";

export function DevicePanel() {
  const device = useDevice();
  const developerMode = useSettings((s) => s.developerMode);
  const [mode, setMode] = useState<"mock" | "serial">(device.mode);
  const [baud, setBaud] = useState(device.baudRate);
  const [behavior, setBehavior] = useState<MockBehavior>(device.mockBehavior);
  const [tab, setTab] = useState<"HEX" | "ASCII" | "Decoded">("HEX");
  const locked = device.status !== "disconnected";
  const connected = device.status === "connected";
  function save(format: "json" | "txt") {
    downloadBlob(
      new Blob([exportLog(device.capture, format)], {
        type: format === "json" ? "application/json" : "text/plain",
      }),
      `tama-capture-${Date.now()}.${format}`,
    );
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">CONNECT · OBSERVE · EXPLORE</div>
          <h1>
            Device lab<span className="title-spark">✳</span>
          </h1>
          <p>A small connection. A world of possibilities.</p>
        </div>
        <span className="badge amber">Hardware verification pending</span>
      </div>
      <div className="device-grid">
        <section className="panel connection-panel">
          <div className="panel-heading">
            <h2>
              <Cable size={19} /> Connection
            </h2>
            <span className="step-number">01</span>
          </div>
          <div className="segmented">
            <button
              disabled={locked}
              aria-pressed={mode === "mock"}
              onClick={() => setMode("mock")}
            >
              <FlaskConical size={16} />
              Mock device
            </button>
            <button
              disabled={locked}
              aria-pressed={mode === "serial"}
              onClick={() => setMode("serial")}
            >
              <PlugZap size={16} />
              USB serial
            </button>
          </div>
          <div className="connection-illustration" aria-hidden="true">
            <div className="device-shape">
              <div className="device-screen">
                <span>•ᴗ•</span>
              </div>
              <div className="device-buttons">
                <i />
                <i />
                <i />
              </div>
            </div>
            <span className="connection-dashes">······</span>
            <div className="adapter-shape">
              <Cable size={30} />
            </div>
          </div>
          <h3 className="center-title">
            {mode === "mock"
              ? "Your practice companion"
              : "Connect your own device"}
          </h3>
          <p className="center-description">
            {mode === "mock"
              ? "Explore the connection flow with a simulated adapter. No hardware needed."
              : "Choose a UART adapter in desktop Chrome or Edge. Use localhost or HTTPS."}
          </p>
          <label className="field">
            Baud rate
            <div className="input-with-unit">
              <input
                aria-label="Baud rate"
                type="number"
                min={300}
                max={3000000}
                value={baud}
                disabled={locked || !developerMode}
                onChange={(e) => setBaud(Number(e.target.value))}
              />
              <span>bps · 8-N-1</span>
            </div>
          </label>
          {!developerMode && (
            <p className="field-help">
              Manual rate available in{" "}
              <Link href="/settings">Developer Mode</Link>.
            </p>
          )}
          {mode === "mock" && (
            <label className="field">
              Simulated response
              <select
                value={behavior}
                disabled={locked}
                onChange={(e) => setBehavior(e.target.value as MockBehavior)}
              >
                <option value="success">Success · echo reply</option>
                <option value="error">Error · synthetic reply</option>
                <option value="timeout">Timeout · no reply</option>
              </select>
            </label>
          )}
          <div className="button-row">
            <Button
              disabled={locked}
              onClick={() => void device.connect(mode, baud, behavior)}
            >
              <Cable size={16} />
              {device.status === "connecting"
                ? "Connecting…"
                : "Connect device"}
            </Button>
            <Button
              variant="outline"
              disabled={!connected || device.busy}
              onClick={() => void device.disconnect()}
            >
              Disconnect
            </Button>
          </div>
        </section>
        <div className="device-side">
          <section className="panel">
            <div className="panel-heading">
              <h2>
                <Radio size={18} /> Connection status
              </h2>
              <span className={`badge ${connected ? "green" : "neutral"}`}>
                {device.status}
              </span>
            </div>
            <dl className="detail-list">
              <div>
                <dt>Transport</dt>
                <dd>
                  {connected
                    ? device.mode === "mock"
                      ? "Mock transport"
                      : "Web Serial"
                    : "Not connected"}
                </dd>
              </div>
              <div>
                <dt>Serial port</dt>
                <dd>
                  {device.info.label ??
                    (device.info.usbVendorId !== undefined
                      ? `VID ${device.info.usbVendorId.toString(16).padStart(4, "0")} / PID ${device.info.usbProductId?.toString(16).padStart(4, "0") ?? "UNKNOWN"}`
                      : "No adapter selected")}
                </dd>
              </div>
              <div>
                <dt>Resource transfer</dt>
                <dd>Existing item upload · experimental</dd>
              </div>
            </dl>
            <div role="status" className="status-message">
              {device.message}
            </div>
            <Button
              variant="outline"
              disabled={!connected || device.busy}
              onClick={() => void device.sendTest()}
            >
              {device.busy ? "Waiting for reply…" : "Send test · ECHO"}
              <ArrowRight size={16} />
            </Button>
            <p className="field-help">
              Documented connection echo only. Does not upload an item.
            </p>
          </section>
          <section className="note-card">
            <span className="eyebrow">FIRST, A GOOD CONNECTION</span>
            <h3>Little steps. Real progress.</h3>
            <p>
              Connect an adapter, capture the conversation, then verify the
              format. Every resource stays <strong>Preview Only</strong> until
              tested on hardware.
            </p>
            <Link href="/studio">
              Visit the sprite workspace <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </div>
      <section className="panel console-panel">
        <div className="panel-heading">
          <div>
            <h2>
              UART console{" "}
              <span className="badge neutral">{device.logs.length} chunks</span>
            </h2>
            <p className="field-help">
              Raw stream chunks · timestamps in UTC · latest 1,000 shown · TX
              records write attempts
            </p>
          </div>
          <div className="button-row compact">
            <Button variant="ghost" size="sm" onClick={device.clearLog}>
              <Trash2 size={14} />
              Clear log
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={
                device.capturing ? device.stopCapture : device.startCapture
              }
            >
              <span
                className={
                  device.capturing ? "status-dot recording" : "status-dot"
                }
              />
              {device.capturing ? "Stop capture" : "Start capture"}
            </Button>
          </div>
        </div>
        <div className="console-toolbar">
          <div className="console-tabs" role="tablist" aria-label="Log format">
            {(["HEX", "ASCII", "Decoded"] as const).map((value) => (
              <button
                role="tab"
                aria-selected={tab === value}
                key={value}
                onClick={() => setTab(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <span>
            {device.capturing ? "Recording" : "Capture stopped"} ·{" "}
            {device.capture.length} captured
          </span>
        </div>
        <div
          className="console-output"
          role="tabpanel"
          aria-label={`${tab} log`}
        >
          <div className="log-row log-heading">
            <span>TIME (UTC)</span>
            <span>DIR</span>
            <span>{tab === "HEX" ? "DATA / HEX" : tab.toUpperCase()}</span>
            <span>BYTES</span>
          </div>
          {device.logs.length ? (
            device.logs.map((entry, i) => (
              <div className="log-row" key={i}>
                <time>{entry.timestamp.slice(11, 23)}</time>
                <b className={entry.direction === "TX" ? "tx" : "rx"}>
                  {entry.direction}
                </b>
                <code>
                  {tab === "HEX"
                    ? entry.hex
                    : tab === "ASCII"
                      ? toAscii(entry.hex)
                      : decodeLog(entry)}
                </code>
                <span>{entry.length}</span>
              </div>
            ))
          ) : (
            <div className="console-empty">
              <span>⌁</span>
              <p>A quiet little channel.</p>
              <small>
                Connect a device and send a test to see its conversation here.
              </small>
            </div>
          )}
        </div>
        <div className="console-bottom">
          <span>
            {device.captureFull
              ? "Capture stopped at 10,000 chunks. Export before starting again."
              : "Starting a capture replaces the previous capture. Clearing the log keeps it."}
          </span>
          <div className="button-row compact">
            <Button
              variant="ghost"
              size="sm"
              disabled={!device.capture.length}
              onClick={() => save("json")}
            >
              <Download size={14} />
              JSON
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!device.capture.length}
              onClick={() => save("txt")}
            >
              TXT
            </Button>
          </div>
        </div>
      </section>
      <ItemUploadPanel />
    </>
  );
}
