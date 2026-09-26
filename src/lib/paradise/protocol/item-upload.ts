import type { Transport } from "@/lib/transport/Transport";
import { inspectItemTemplate } from "../item/template";
import { encodeItemChunk } from "./item-packet";
export interface UploadOptions {
  signal?: AbortSignal;
  onProgress?: (acknowledged: number, total: number) => void;
  commandTimeoutMs?: number;
  chunkTimeoutMs?: number;
}
const ascii = (line: string) => new TextEncoder().encode(line + "\r\n");
class CommandChannel {
  private buffered = "";
  private waiting?: {
    resolve: (line: string) => void;
    reject: (error: Error) => void;
  };
  private failure?: Error;
  private received = 0;
  private offData: () => void;
  private offDisconnect: () => void;
  constructor(
    private transport: Transport,
    private write: (bytes: Uint8Array) => Promise<void>,
    private signal?: AbortSignal,
  ) {
    this.offData = transport.onData((data) => this.receive(data));
    this.offDisconnect = transport.onDisconnect(() =>
      this.fail(new Error("Device disconnected during item upload.")),
    );
    signal?.addEventListener("abort", this.abort);
    if (signal?.aborted) this.abort();
  }
  private abort = () =>
    this.fail(
      new Error("Item upload cancelled. Reconnect before trying again."),
    );
  assertActive() {
    if (this.failure) throw this.failure;
  }
  private fail(error: Error) {
    this.failure = error;
    this.waiting?.reject(error);
  }
  private receive(data: Uint8Array) {
    if (this.failure) return;
    this.received += data.length;
    if (
      this.received > 16384 ||
      data.some((b) => b > 127 || (b < 32 && ![9, 10, 13].includes(b)))
    )
      return this.fail(new Error("Unexpected or excessive upload response."));
    this.buffered += new TextDecoder().decode(data);
    if (this.buffered.length > 1024)
      return this.fail(new Error("Upload response buffer exceeded its limit."));
    let end: number;
    while ((end = this.buffered.indexOf("\r\n")) >= 0) {
      const line = this.buffered.slice(0, end).trim().replace(/\s+/g, " ");
      this.buffered = this.buffered.slice(end + 2);
      if (line.length > 128)
        return this.fail(new Error("Upload response line is too long."));
      if (line === "ECHO REQ") {
        void this.write(ascii("ECHO REP")).catch((error: unknown) =>
          this.fail(
            error instanceof Error ? error : new Error("Echo reply failed."),
          ),
        );
        continue;
      }
      if (line === "CAN")
        return this.fail(new Error("Device cancelled the item upload."));
      if (line.startsWith("PKT"))
        return this.fail(
          new Error(
            "Device started a different transfer. Reconnect in the download screen.",
          ),
        );
      if (/^ACK(?: 1)?$|^NAK$|^ENQ(?: |$)/.test(line)) {
        const waiting = this.waiting;
        this.waiting = undefined;
        waiting?.resolve(line);
      }
    }
  }
  async exchange(bytes: Uint8Array, timeout: number) {
    if (this.failure) throw this.failure;
    if (!this.transport.isConnected())
      throw new Error("Device disconnected during item upload.");
    // Discard any unsolicited partial response before sending a new chunk.
    this.buffered = "";
    return new Promise<string>((resolve, reject) => {
      const finish = (line?: string, error?: Error) => {
        clearTimeout(timer);
        this.waiting = undefined;
        if (error) reject(error);
        else resolve(line!);
      };
      const timer = setTimeout(
        () => finish(undefined, new Error("Upload response timed out.")),
        timeout,
      );
      this.waiting = {
        resolve: (line) => finish(line),
        reject: (error) => finish(undefined, error),
      };
      void this.write(bytes).catch((error: unknown) =>
        this.fail(
          error instanceof Error
            ? error
            : new Error("Serial upload write failed."),
        ),
      );
    });
  }
  close() {
    this.offData();
    this.offDisconnect();
    this.signal?.removeEventListener("abort", this.abort);
  }
}
export async function uploadItem(
  transport: Transport,
  data: Uint8Array,
  key: Uint8Array,
  transmit: (bytes: Uint8Array) => void,
  options: UploadOptions = {},
) {
  if (!transport.isConnected())
    throw new Error("Connect a device before uploading an item.");
  const payload = new Uint8Array(data);
  inspectItemTemplate(payload);
  const secret = new Uint8Array(key);
  const chunks: Uint8Array[] = [];
  try {
    for (let i = 0; i * 4096 < payload.length; i++)
      chunks.push(
        await encodeItemChunk(
          payload.slice(i * 4096, (i + 1) * 4096),
          i,
          secret,
        ),
      );
  } finally {
    secret.fill(0);
  }
  if (options.signal?.aborted) throw new Error("Item upload cancelled.");
  const write = async (bytes: Uint8Array) => {
    transmit(bytes);
    await transport.write(bytes);
  };
  const channel = new CommandChannel(transport, write, options.signal);
  const exchange = async (bytes: Uint8Array, timeout: number) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const reply = await channel.exchange(bytes, timeout);
        channel.assertActive();
        if (reply !== "NAK") return reply;
      } catch (error) {
        if (
          !(error instanceof Error) ||
          error.message !== "Upload response timed out."
        )
          throw error;
      }
    }
    throw new Error(
      "Item upload stopped after three unsuccessful attempts. Reconnect and check the device screen.",
    );
  };
  try {
    options.onProgress?.(0, payload.length);
    const initial = await exchange(
      ascii(`PKT ${payload.length}`),
      options.commandTimeoutMs ?? 2000,
    );
    if (!initial.startsWith("ACK"))
      throw new Error("Unexpected response to the upload request.");
    let index = 0;
    let rewinds = 0;
    while (index < chunks.length) {
      const reply = await exchange(
        chunks[index],
        options.chunkTimeoutMs ?? 5000,
      );
      if (reply.startsWith("ACK")) {
        index++;
        options.onProgress?.(
          Math.min(index * 4096, payload.length),
          payload.length,
        );
      } else {
        const match = /^ENQ ([0-9]{1,3})$/.exec(reply);
        const requested = match ? Number(match[1]) : -1;
        if (requested < 0 || requested > index || ++rewinds > 8)
          throw new Error("Invalid or repeated chunk request from the device.");
        index = requested;
        options.onProgress?.(index * 4096, payload.length);
      }
    }
  } catch (error) {
    if (transport.isConnected()) {
      try {
        await write(ascii("CAN"));
      } catch {
        /* Original failure is more useful. */
      }
    }
    throw error;
  } finally {
    channel.close();
  }
}
