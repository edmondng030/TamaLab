import type { Transport, Unsubscribe } from "@/lib/transport/Transport";
import { ParadiseProtocol } from "@/lib/paradise/protocol/protocol";
import { logEntry, type LogEntry } from "./log";
export class ParadiseService {
  private protocol: ParadiseProtocol;
  private subscriptions: Unsubscribe[];
  constructor(
    private transport: Transport,
    onLog: (entry: LogEntry) => void,
    onDisconnect: (reason: string) => void,
  ) {
    this.protocol = new ParadiseProtocol(transport, (bytes) =>
      onLog(logEntry("TX", bytes)),
    );
    this.subscriptions = [
      transport.onData((bytes) => onLog(logEntry("RX", bytes))),
      transport.onDisconnect(onDisconnect),
    ];
  }
  connect() {
    return this.transport.connect();
  }
  disconnect() {
    return this.transport.disconnect();
  }
  isConnected() {
    return this.transport.isConnected();
  }
  getInfo() {
    return this.transport.getInfo();
  }
  sendTest() {
    return this.protocol.echo();
  }
  async dispose() {
    this.subscriptions.forEach((off) => off());
    await this.transport.disconnect();
  }
}
