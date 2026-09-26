import { describe, it, expect } from "vitest";
import { MockTransport } from "@/lib/transport/MockTransport";
import { ParadiseProtocol } from "@/lib/paradise/protocol/protocol";
import { ParadiseItemEncoder } from "@/lib/paradise/item/encoder";
import { ParadiseSpriteEncoder } from "@/lib/paradise/sprite/encoder";
import { PCOMTransport } from "@/lib/transport/PCOMTransport";
import { exportLog, logEntry } from "@/lib/device/log";

class ScriptedTransport extends MockTransport {
  constructor(private chunks: string[]) {
    super("timeout");
  }
  async write() {
    for (const chunk of this.chunks)
      this.emitData(new TextEncoder().encode(chunk));
  }
}
describe("documented echo diagnostic", () => {
  it("rejects disconnected sends", async () => {
    await expect(
      new ParadiseProtocol(new MockTransport()).echo(),
    ).rejects.toThrow("Connect a device");
  });
  it("accepts mock success and logs documented TX", async () => {
    const transport = new MockTransport("success", 1);
    await transport.connect();
    const tx: Uint8Array[] = [];
    await new ParadiseProtocol(transport, (bytes) => tx.push(bytes)).echo(100);
    expect(new TextDecoder().decode(tx[0])).toBe("ECHO REQ\r\n");
    await transport.disconnect();
  });
  it("handles a reply split across serial reads", async () => {
    const transport = new ScriptedTransport([
      "unrelated\r\nE",
      "CHO RE",
      "P\r",
      "\n",
    ]);
    await transport.connect();
    await expect(
      new ParadiseProtocol(transport).echo(),
    ).resolves.toBeUndefined();
  });
  it("does not accept a partial or embedded echo reply", async () => {
    const transport = new ScriptedTransport(["NOT ECHO REP\r\nECHO REP"]);
    await transport.connect();
    await expect(new ParadiseProtocol(transport).echo(5)).rejects.toThrow(
      "No echo reply",
    );
  });
  it("rejects an oversized diagnostic response", async () => {
    const transport = new ScriptedTransport(["x".repeat(1025)]);
    await transport.connect();
    await expect(new ParadiseProtocol(transport).echo()).rejects.toThrow(
      "buffer limit",
    );
  });
  it("reports the synthetic mock error", async () => {
    const transport = new MockTransport("error", 1);
    await transport.connect();
    await expect(new ParadiseProtocol(transport).echo(100)).rejects.toThrow(
      "Simulated error",
    );
    await transport.disconnect();
  });
  it("times out without a reply", async () => {
    const transport = new MockTransport("timeout");
    await transport.connect();
    await expect(new ParadiseProtocol(transport).echo(5)).rejects.toThrow(
      "No echo reply",
    );
  });
  it("rejects overlapping requests and clears pending on disconnect", async () => {
    const transport = new MockTransport("timeout");
    await transport.connect();
    const protocol = new ParadiseProtocol(transport);
    const first = protocol.echo();
    const rejection = expect(first).rejects.toThrow("disconnected during");
    await expect(protocol.echo()).rejects.toThrow("already running");
    await transport.disconnect();
    await rejection;
    await transport.connect();
    transport.behavior = "success";
    await expect(protocol.echo()).resolves.toBeUndefined();
    await transport.disconnect();
  });
  it("cancels mock responses on disconnect", async () => {
    const transport = new MockTransport("success", 5);
    await transport.connect();
    let received = false;
    transport.onData(() => {
      received = true;
    });
    await transport.write(new TextEncoder().encode("ECHO REQ\r\n"));
    await transport.disconnect();
    await new Promise((r) => setTimeout(r, 10));
    expect(received).toBe(false);
  });
});
describe("unverified features fail closed", () => {
  const sprite = { width: 1, height: 1, rgba: new Uint8ClampedArray(4) };
  it("allows offline sprites but blocks invented item behavior", async () => {
    expect(
      (await new ParadiseSpriteEncoder().encode(sprite)).length,
    ).toBeGreaterThan(24);
    await expect(
      new ParadiseItemEncoder().encode({
        name: "Test",
        category: "toy",
        sprite,
      }),
    ).rejects.toThrow("UNKNOWN");
  });
  it("blocks PCOM access", async () => {
    const pcom = new PCOMTransport();
    await expect(pcom.connect()).rejects.toThrow("UNKNOWN");
    await expect(pcom.write()).rejects.toThrow("not implemented");
  });
  it("exports byte-accurate JSON and text logs", () => {
    const entry = logEntry("RX", new Uint8Array([0, 127, 255]));
    expect(entry.hex).toBe("00 7F FF");
    expect(entry.length).toBe(3);
    expect(JSON.parse(exportLog([entry], "json"))).toEqual([entry]);
    expect(exportLog([entry], "txt")).toContain("RX 00 7F FF (3 bytes)");
  });
});
