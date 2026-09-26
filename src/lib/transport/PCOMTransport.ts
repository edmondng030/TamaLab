import { ObservableTransport } from "./Transport";
export class PCOMTransport extends ObservableTransport {
  async connect(): Promise<void> {
    throw new Error(
      "PCOM support is UNKNOWN. Its adapter interface must be verified first.",
    );
  }
  async disconnect() {
    this.emitDisconnect("Disconnected.");
  }
  async write(): Promise<void> {
    throw new Error("PCOM writes are not implemented.");
  }
  getInfo() {
    return { label: "PCOM · unsupported" };
  }
}
