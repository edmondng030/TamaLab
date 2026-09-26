import type { Transport } from "@/lib/transport/Transport";
import { ECHO_TIMEOUT_MS } from "../config";
import { echoRequest, ECHO_REPLY } from "./commands";

// Only the documented ASCII echo is implemented. No resource packets are encoded.
export class ParadiseProtocol {
  private pending = false;
  constructor(
    private transport: Transport,
    private onTransmit: (data: Uint8Array) => void = () => {},
  ) {}
  async echo(timeoutMs = ECHO_TIMEOUT_MS): Promise<void> {
    if (!this.transport.isConnected())
      throw new Error("Connect a device before running the echo test.");
    if (this.pending) throw new Error("An echo test is already running.");
    this.pending = true;
    try {
      await new Promise<void>((resolve, reject) => {
        let buffered = "";
        let settled = false;
        const finish = (error?: Error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          offData();
          offDisconnect();
          if (error) reject(error);
          else resolve();
        };
        const offData = this.transport.onData((data) => {
          buffered += new TextDecoder().decode(data);
          if (buffered.length > 1024)
            return finish(
              new Error("Echo response exceeded the diagnostic buffer limit."),
            );
          let end: number;
          while ((end = buffered.indexOf("\r\n")) >= 0) {
            const line = buffered.slice(0, end);
            buffered = buffered.slice(end + 2);
            if (line === ECHO_REPLY) return finish();
            if (line === "MOCK ERROR")
              return finish(
                new Error("Simulated error reply from the mock device."),
              );
          }
        });
        const offDisconnect = this.transport.onDisconnect(() =>
          finish(new Error("Device disconnected during the echo test.")),
        );
        const timer = setTimeout(
          () =>
            finish(
              new Error(
                `No echo reply within ${timeoutMs} ms. Check the connection, baud rate, and device connection screen.`,
              ),
            ),
          timeoutMs,
        );
        const request = echoRequest();
        this.onTransmit(request);
        void this.transport
          .write(request)
          .catch((error: unknown) =>
            finish(
              error instanceof Error
                ? error
                : new Error("Serial write failed."),
            ),
          );
      });
    } finally {
      this.pending = false;
    }
  }
}
