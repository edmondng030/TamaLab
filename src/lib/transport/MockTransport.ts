import { ObservableTransport } from "./Transport";
export type MockBehavior = "success" | "error" | "timeout";
export class MockTransport extends ObservableTransport {
  private timers = new Set<ReturnType<typeof setTimeout>>();
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
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      // MOCK ERROR is synthetic test data, never a Paradise command.
      const response =
        behavior === "error"
          ? "MOCK ERROR\r\n"
          : command === "ECHO REQ\r\n"
            ? "ECHO REP\r\n"
            : "MOCK UNKNOWN\r\n";
      this.emitData(new TextEncoder().encode(response));
    }, this.delayMs);
    this.timers.add(timer);
  }
}
