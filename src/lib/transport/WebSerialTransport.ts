import { DEFAULT_SERIAL_CONFIG, validateBaudRate } from "@/lib/paradise/config";
import { ObservableTransport, type PortInfo } from "./Transport";

export class WebSerialTransport extends ObservableTransport {
  private port?: SerialPort;
  private reader?: ReadableStreamDefaultReader<Uint8Array>;
  private readTask?: Promise<void>;
  private closing = false;
  private closeTask?: Promise<void>;
  private writes: Promise<void> = Promise.resolve();
  constructor(
    private options = DEFAULT_SERIAL_CONFIG,
    private serial?: Serial,
  ) {
    super();
  }
  static isSupported() {
    return (
      typeof navigator !== "undefined" &&
      "serial" in navigator &&
      window.isSecureContext
    );
  }
  async connect() {
    if (this.connected || this.port)
      throw new Error("This serial port is already open.");
    validateBaudRate(this.options.baudRate);
    const serial =
      this.serial ??
      (typeof navigator !== "undefined" ? navigator.serial : undefined);
    if (!serial)
      throw new Error(
        "Web Serial requires desktop Chrome or Edge on localhost or HTTPS.",
      );
    const port = await serial.requestPort();
    try {
      await port.open(this.options);
    } catch (error) {
      throw new Error(
        "Could not open serial port. Close other apps using this adapter and check the baud rate.",
        { cause: error },
      );
    }
    this.port = port;
    this.closing = false;
    this.connected = true;
    this.readTask = this.readLoop(port);
  }
  private async readLoop(port: SerialPort) {
    let reason = "The serial input stream closed. Reconnect the adapter.";
    try {
      if (!port.readable)
        throw new Error("The adapter has no readable stream.");
      this.reader = port.readable.getReader();
      while (!this.closing) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value?.length) this.emitData(value);
      }
    } catch (error) {
      reason = `Serial input stopped: ${error instanceof Error ? error.message : "adapter disconnected"}`;
    } finally {
      this.reader?.releaseLock();
      this.reader = undefined;
    }
    if (!this.closing) {
      this.connected = false;
      // Run after readTask settles so disconnect does not await itself.
      queueMicrotask(() => {
        void this.disconnect()
          .catch(() => {})
          .finally(() => this.emitDisconnect(reason));
      });
    }
  }
  async write(data: Uint8Array) {
    if (!this.connected || this.closing || !this.port?.writable)
      throw new Error("Connect a serial adapter before sending.");
    const port = this.port;
    const bytes = data.slice();
    const operation = this.writes.then(async () => {
      if (!port.writable)
        throw new Error("Serial output is unavailable. Reconnect the adapter.");
      const writer = port.writable.getWriter();
      try {
        await writer.write(bytes);
      } finally {
        writer.releaseLock();
      }
    });
    this.writes = operation.catch(() => {});
    return operation;
  }
  async disconnect() {
    if (this.closeTask) return this.closeTask;
    this.closeTask = this.closePort();
    try {
      await this.closeTask;
    } finally {
      this.closeTask = undefined;
    }
  }
  private async closePort() {
    this.closing = true;
    this.connected = false;
    try {
      await this.reader?.cancel().catch(() => {});
      await this.readTask;
      await this.writes;
      await this.port?.close();
    } finally {
      this.port = undefined;
      this.readTask = undefined;
      this.emitDisconnect("Disconnected.");
    }
  }
  getInfo(): PortInfo {
    return this.port?.getInfo() ?? {};
  }
}
