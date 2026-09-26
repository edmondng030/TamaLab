"use client";
import { useSettings } from "@/lib/storage/settings";
export default function SettingsPage() {
  const { developerMode, setDeveloperMode } = useSettings();
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">MAKE YOURSELF AT HOME</div>
          <h1>Settings</h1>
          <p>A few controls for your workspace.</p>
        </div>
      </div>
      <section className="panel settings-panel">
        <h2>Developer Mode</h2>
        <p>
          Enable manual baud rate configuration in the Device lab. Existing-item
          uploads require 460800 baud and a locally imported protocol key.
        </p>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={developerMode}
            onChange={(e) => setDeveloperMode(e.target.checked)}
          />{" "}
          Enable Developer Mode
        </label>
        <p className="field-help">Saved locally in this browser.</p>
      </section>
    </>
  );
}
