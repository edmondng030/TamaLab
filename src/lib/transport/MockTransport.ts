import { ObservableTransport } from "./Transport";
export type MockBehavior = "success" | "error" | "timeout";
export class MockTransport extends ObservableTransport {
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private remainingUploadBytes = 0;
  constructor(
    public behavior: MockBehavior = "success",
    private delayMs = 80,
  ) {
    super();
  }
  async connect() {
    this.connected = true;
  }
  async disconnect() {
    this.remainingUploadBytes = 0;
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
    this.emitDisconnect("Mock disconnected.");
  }
  getInfo() {
    return { label: "Simulated adapter · no hardware" };
  }
  async write(data: Uint8Array) {
    if (!this.connected)
      throw new Error("Connect the mock device before sending.");
    if (this.behavior === "timeout") return;
    const behavior = this.behavior;
    const command = new TextDecoder().decode(data);
    if (command === "CAN\r\n") {
      this.remainingUploadBytes = 0;
      return;
    }
    let uploadReply: string | undefined;
    if (/^PKT [0-9]+\r\n$/.test(command)) {
      const size = Number(command.trim().split(" ")[1]);
      this.remainingUploadBytes = size > 0 && size <= 16384 ? size : 0;
      uploadReply = this.remainingUploadBytes ? "ACK\r\n" : "CAN\r\n";
    } else if (this.remainingUploadBytes && command !== "ECHO REP\r\n") {
      const expected = Math.min(4096, this.remainingUploadBytes);
      uploadReply = data.length === expected + 16 ? "ACK\r\n" : "NAK\r\n";
      if (uploadReply.startsWith("ACK")) this.remainingUploadBytes -= expected;
    }
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      // MOCK ERROR is synthetic test data, never a Paradise command.
      const response = uploadReply
        ? behavior === "error"
          ? "CAN\r\n"
          : uploadReply
        : behavior === "error"
          ? "MOCK ERROR\r\n"
          : command === "ECHO REQ\r\n"
            ? "ECHO REP\r\n"
            : "MOCK UNKNOWN\r\n";
      this.emitData(new TextEncoder().encode(response));
    }, this.delayMs);
    this.timers.add(timer);
  }
}
