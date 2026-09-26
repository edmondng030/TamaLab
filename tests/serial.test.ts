import { describe, it, expect, vi } from "vitest";
import { WebSerialTransport } from "@/lib/transport/WebSerialTransport";
import { DEFAULT_SERIAL_CONFIG } from "@/lib/paradise/config";
function fakeSerial() {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const readable = new ReadableStream<Uint8Array>({
    start(value) {
      controller = value;
    },
  });
  const written: Uint8Array[] = [];
  const writable = new WritableStream<Uint8Array>({
    write(bytes) {
      written.push(bytes);
    },
  });
  const port = {
    readable,
    writable,
    open: vi.fn(async () => {}),
    close: vi.fn(async () => {
      expect(readable.locked).toBe(false);
      expect(writable.locked).toBe(false);
    }),
    getInfo: () => ({ usbVendorId: 0x1234, usbProductId: 0x5678 }),
  };
  const serial = { requestPort: vi.fn(async () => port) } as unknown as Serial;
  return { port, serial, written, controller };
}
describe("WebSerialTransport lifecycle", () => {
  it("uses configured baud, receives bytes, serializes writes, releases locks, and reconnects", async () => {
    const fake = fakeSerial();
    const transport = new WebSerialTransport(
      { ...DEFAULT_SERIAL_CONFIG, baudRate: 115200 },
      fake.serial,
    );
    const received: number[] = [];
    transport.onData((bytes) => received.push(...bytes));
    await transport.connect();
    expect(fake.port.open).toHaveBeenCalledWith(
      expect.objectContaining({ baudRate: 115200 }),
    );
    expect(transport.getInfo().usbVendorId).toBe(0x1234);
    fake.controller.enqueue(new Uint8Array([7, 8]));
    await Promise.all([
      transport.write(new Uint8Array([1])),
      transport.write(new Uint8Array([2])),
    ]);
    expect(received).toEqual([7, 8]);
    expect(fake.written.map((b) => b[0])).toEqual([1, 2]);
    await transport.disconnect();
    expect(fake.port.close).toHaveBeenCalledOnce();
    expect(transport.isConnected()).toBe(false);
    await expect(transport.write(new Uint8Array([1]))).rejects.toThrow(
      "Connect",
    );
    const next = fakeSerial();
    vi.mocked(fake.serial.requestPort).mockResolvedValue(
      next.port as unknown as SerialPort,
    );
    await transport.connect();
    expect(transport.isConnected()).toBe(true);
    await transport.disconnect();
  });
  it("cleans up a physical unplug / failed read", async () => {
    const fake = fakeSerial();
    const transport = new WebSerialTransport(
      DEFAULT_SERIAL_CONFIG,
      fake.serial,
    );
    const disconnected = vi.fn();
    transport.onDisconnect(disconnected);
    await transport.connect();
    fake.controller.error(new Error("unplugged"));
    await vi.waitFor(() => expect(fake.port.close).toHaveBeenCalledOnce());
    expect(transport.isConnected()).toBe(false);
    expect(disconnected).toHaveBeenCalledWith(
      expect.stringContaining("unplugged"),
    );
  });
  it("does not treat permission cancellation or port-open failure as connected", async () => {
    const fake = fakeSerial();
    const transport = new WebSerialTransport(
      DEFAULT_SERIAL_CONFIG,
      fake.serial,
    );
    vi.mocked(fake.serial.requestPort).mockRejectedValueOnce(
      new Error("No port selected"),
    );
    await expect(transport.connect()).rejects.toThrow("No port selected");
    fake.port.open.mockRejectedValueOnce(new Error("In use"));
    await expect(transport.connect()).rejects.toThrow("Close other apps");
    expect(transport.isConnected()).toBe(false);
  });
  it("rejects invalid baud before opening the browser chooser", async () => {
    const fake = fakeSerial();
    const transport = new WebSerialTransport({ baudRate: 0 }, fake.serial);
    await expect(transport.connect()).rejects.toThrow("baud rate");
    expect(fake.serial.requestPort).not.toHaveBeenCalled();
  });
});
