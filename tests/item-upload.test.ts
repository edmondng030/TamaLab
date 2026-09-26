import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ObservableTransport } from "@/lib/transport/Transport";
import { ParadiseProtocol } from "@/lib/paradise/protocol/protocol";
import {
  encodeItemChunk,
  crc16Arc,
  parseProtocolKey,
} from "@/lib/paradise/protocol/item-packet";
import { uploadItem } from "@/lib/paradise/protocol/item-upload";
const item = new Uint8Array(
  readFileSync(new URL("./fixtures/tamacat/pa-tomaquet.bin", import.meta.url)),
);
const key = new TextEncoder().encode("synthetic-test-key-not-a-device-key");
const text = (bytes: Uint8Array) => new TextDecoder().decode(bytes);
class Peer extends ObservableTransport {
  writes: Uint8Array[] = [];
  respond: (bytes: Uint8Array, n: number) => void = () => this.reply("ACK\r\n");
  async connect() {
    this.connected = true;
  }
  async disconnect() {
    this.emitDisconnect("test unplug");
  }
  getInfo() {
    return { label: "synthetic test peer" };
  }
  reply(line: string) {
    this.emitData(new TextEncoder().encode(line));
  }
  async write(bytes: Uint8Array) {
    this.writes.push(bytes.slice());
    if (text(bytes) !== "CAN\r\n") this.respond(bytes, this.writes.length - 1);
  }
}
async function peer() {
  const p = new Peer();
  await p.connect();
  return p;
}
// Independent Node SHA implementation checks encrypted wire data.
function decodeWire(bytes: Uint8Array) {
  const stream = createHash("sha256")
    .update(bytes.subarray(0, 4))
    .update(key)
    .digest();
  return bytes.slice(4).map((b, i) => {
    const k = i % 32;
    const output = b ^ stream[k];
    stream[k] = (stream[k] * 2 + 1) % 256;
    return output;
  });
}
describe("download chunk format", () => {
  it("uses the CRC16/ARC check value", () =>
    expect(crc16Arc(new TextEncoder().encode("123456789"))).toBe(0xbb3d));
  it("matches header fields and preserves payload through encryption", async () => {
    const payload = Uint8Array.from({ length: 4096 }, (_, i) => i % 251);
    const packet = await encodeItemChunk(
      payload,
      2,
      key,
      Uint8Array.of(1, 2, 3, 4),
    );
    const decoded = decodeWire(packet);
    const view = new DataView(decoded.buffer);
    expect(packet.length).toBe(4112);
    expect(view.getUint32(0, true)).toBe(0);
    expect([...decoded.subarray(4, 10)]).toEqual([84, 67, 80, 3, 2, 253]);
    expect(view.getUint16(10, true)).toBe(crc16Arc(payload));
    expect(decoded.slice(12)).toEqual(payload);
  });
  it("accepts bounded key files without reflecting invalid secret text", () => {
    expect([...parseProtocolKey('{"keyHex":"0102aF"}')]).toEqual([1, 2, 175]);
    for (const value of [
      "private-key-text",
      '{"keyHex":"x"}',
      '{"keyHex":""}',
      JSON.stringify({ keyHex: "00".repeat(257) }),
    ])
      expect(() => parseProtocolKey(value)).toThrow(/Choose|Invalid/);
  });
});
describe("bounded unchanged item upload", () => {
  it("does not clear the caller's key when passed a Node Buffer", async () => {
    const p = await peer();
    const originalKey = Buffer.from(key);
    await uploadItem(p, Buffer.from(item), originalKey, () => {});
    expect(new Uint8Array(originalKey)).toEqual(key);
  });
  it("sends the original file in four sequential type-3 chunks with progress", async () => {
    const p = await peer();
    const original = item.slice();
    const progress: number[] = [];
    await uploadItem(p, item, key, () => {}, {
      onProgress: (n) => progress.push(n),
    });
    expect(text(p.writes[0])).toBe("PKT 16384\r\n");
    expect(p.writes).toHaveLength(5);
    for (let i = 0; i < 4; i++) {
      const decoded = decodeWire(p.writes[i + 1]);
      expect(decoded[8]).toBe(i);
      expect(decoded.slice(12)).toEqual(item.slice(i * 4096, (i + 1) * 4096));
    }
    expect(progress).toEqual([0, 4096, 8192, 12288, 16384]);
    expect(item).toEqual(original);
  });
  it("handles split lines, echoes and duplicate acknowledgements", async () => {
    const p = await peer();
    p.respond = (bytes, n) => {
      if (text(bytes) === "ECHO REP\r\n") return;
      if (n === 0) p.reply("ECHO REQ\r\n");
      p.reply("A");
      p.reply("CK\r\nACK\r\n");
    };
    await uploadItem(p, item, key, () => {});
    expect(p.writes.filter((b) => text(b) === "ECHO REP\r\n")).toHaveLength(1);
    expect(p.writes.filter((b) => b.length === 4112)).toHaveLength(4);
  });
  it("resends the same encrypted chunk on NAK", async () => {
    const p = await peer();
    p.respond = (_, n) => p.reply(n === 1 ? "NAK\r\n" : "ACK\r\n");
    await uploadItem(p, item, key, () => {});
    expect(p.writes[1]).toEqual(p.writes[2]);
  });
  it("honors a rewind to an already sent chunk", async () => {
    const p = await peer();
    p.respond = (_, n) => p.reply(n === 2 ? "ENQ 0\r\n" : "ACK\r\n");
    await uploadItem(p, item, key, () => {});
    expect(p.writes[1]).toEqual(p.writes[3]);
  });
  it.each(["ENQ 3", "ENQ -1", "ENQ x", "ENQ 999"])(
    "rejects invalid or forward request %s",
    async (line) => {
      const p = await peer();
      p.respond = (_, n) => p.reply(n ? line + "\r\n" : "ACK\r\n");
      await expect(uploadItem(p, item, key, () => {})).rejects.toThrow(
        "Invalid",
      );
      expect(text(p.writes.at(-1)!)).toBe("CAN\r\n");
    },
  );
  it("bounds repeated ENQ requests", async () => {
    const p = await peer();
    p.respond = (_, n) => p.reply(n ? "ENQ 0\r\n" : "ACK\r\n");
    await expect(uploadItem(p, item, key, () => {})).rejects.toThrow(
      "repeated",
    );
    expect(p.writes.length).toBeLessThan(15);
  });
  it("limits initiation retries and missing chunk replies", async () => {
    for (const initialAck of [false, true]) {
      const p = await peer();
      p.respond = (_, n) => {
        if (initialAck && n === 0) p.reply("ACK\r\n");
      };
      await expect(
        uploadItem(p, item, key, () => {}, {
          commandTimeoutMs: 5,
          chunkTimeoutMs: 5,
        }),
      ).rejects.toThrow("three");
      expect(p.writes).toHaveLength(initialAck ? 5 : 4);
      expect(text(p.writes.at(-1)!)).toBe("CAN\r\n");
    }
  });
  it.each(["CAN\r\n", "PKT 2\r\n", "x".repeat(1025)])(
    "fails closed on cancellation, collisions and overflow",
    async (line) => {
      const p = await peer();
      p.respond = () => p.reply(line);
      await expect(uploadItem(p, item, key, () => {})).rejects.toThrow();
      expect(p.writes).toHaveLength(2);
    },
  );
  it("cancels during a chunk and releases the operation lock", async () => {
    const p = await peer();
    const controller = new AbortController();
    const protocol = new ParadiseProtocol(p);
    p.respond = (_, n) => {
      if (n === 0) p.reply("ACK\r\n");
      else controller.abort();
    };
    await expect(
      protocol.sendItem(item, key, { signal: controller.signal }),
    ).rejects.toThrow("cancelled");
    p.respond = () => p.reply("ECHO REP\r\n");
    await expect(protocol.echo()).resolves.toBeUndefined();
  });
  it("rejects overlapping operations and detects unplug", async () => {
    const p = await peer();
    p.respond = () => {};
    const protocol = new ParadiseProtocol(p);
    const pending = protocol.echo(100);
    const rejected = expect(pending).rejects.toThrow("disconnected");
    await expect(protocol.sendItem(item, key)).rejects.toThrow(
      "already running",
    );
    await p.disconnect();
    await rejected;
    await p.connect();
    p.respond = () => {
      void p.disconnect();
    };
    await expect(protocol.sendItem(item, key)).rejects.toThrow("disconnected");
  });
  it("rejects invalid archives, oversized items and missing keys before transmitting", async () => {
    const p = await peer();
    for (const bytes of [
      new Uint8Array(0),
      new Uint8Array(16385),
      item.slice(1),
    ])
      await expect(uploadItem(p, bytes, key, () => {})).rejects.toThrow();
    await expect(
      uploadItem(p, item, new Uint8Array(), () => {}),
    ).rejects.toThrow("key");
    expect(p.writes).toHaveLength(0);
  });
});
