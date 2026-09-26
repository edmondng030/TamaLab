export type Unsubscribe = () => void;
export interface PortInfo {
  usbVendorId?: number;
  usbProductId?: number;
  label?: string;
}
export interface Transport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  write(data: Uint8Array): Promise<void>;
  onData(callback: (data: Uint8Array) => void): Unsubscribe;
  onDisconnect(callback: (reason: string) => void): Unsubscribe;
  getInfo(): PortInfo;
}
export abstract class ObservableTransport implements Transport {
  protected connected = false;
  private dataListeners = new Set<(data: Uint8Array) => void>();
  private disconnectListeners = new Set<(reason: string) => void>();
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract write(data: Uint8Array): Promise<void>;
  abstract getInfo(): PortInfo;
  isConnected() {
    return this.connected;
  }
  onData(callback: (data: Uint8Array) => void) {
    this.dataListeners.add(callback);
    return () => {
      this.dataListeners.delete(callback);
    };
  }
  onDisconnect(callback: (reason: string) => void) {
    this.disconnectListeners.add(callback);
    return () => {
      this.disconnectListeners.delete(callback);
    };
  }
  protected emitData(data: Uint8Array) {
    for (const callback of this.dataListeners) callback(data.slice());
  }
  protected emitDisconnect(reason: string) {
    this.connected = false;
    for (const callback of this.disconnectListeners) callback(reason);
  }
}
