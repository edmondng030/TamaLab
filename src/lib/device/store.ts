"use client";
import { create } from "zustand";
import { ParadiseService } from "./ParadiseService";
import {
  MockTransport,
  type MockBehavior,
} from "@/lib/transport/MockTransport";
import { WebSerialTransport } from "@/lib/transport/WebSerialTransport";
import { DEFAULT_SERIAL_CONFIG } from "@/lib/paradise/config";
import type { LogEntry } from "./log";
import type { PortInfo } from "@/lib/transport/Transport";
type Status = "disconnected" | "connecting" | "connected" | "disconnecting";
interface DeviceState {
  status: Status;
  mode: "mock" | "serial";
  baudRate: number;
  mockBehavior: MockBehavior;
  busy: boolean;
  message: string;
  info: PortInfo;
  logs: LogEntry[];
  capture: LogEntry[];
  capturing: boolean;
  captureFull: boolean;
  connect: (
    mode: "mock" | "serial",
    baudRate: number,
    behavior: MockBehavior,
  ) => Promise<void>;
  disconnect: () => Promise<void>;
  sendTest: () => Promise<void>;
  clearLog: () => void;
  startCapture: () => void;
  stopCapture: () => void;
}
let service: ParadiseService | undefined;
const describe = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Device operation failed. Reconnect and try again.";
export const useDevice = create<DeviceState>((set, get) => ({
  status: "disconnected",
  mode: "mock",
  baudRate: DEFAULT_SERIAL_CONFIG.baudRate,
  mockBehavior: "success",
  busy: false,
  message: "Ready when you are. Start with the mock device.",
  info: {},
  logs: [],
  capture: [],
  capturing: false,
  captureFull: false,
  connect: async (mode, baudRate, behavior) => {
    if (get().status !== "disconnected") return;
    set({
      status: "connecting",
      mode,
      baudRate,
      mockBehavior: behavior,
      message: "Opening connection…",
    });
    try {
      await service?.dispose();
      const transport =
        mode === "mock"
          ? new MockTransport(behavior)
          : new WebSerialTransport({ ...DEFAULT_SERIAL_CONFIG, baudRate });
      service = new ParadiseService(
        transport,
        (entry) =>
          set((state) => {
            const capture = state.capturing
              ? [...state.capture, entry]
              : state.capture;
            return {
              logs: [...state.logs, entry].slice(-1000),
              capture,
              capturing: state.capturing && capture.length < 10000,
              captureFull: capture.length >= 10000,
            };
          }),
        (reason) => set({ status: "disconnected", info: {}, message: reason }),
      );
      await service.connect();
      set({
        status: service.isConnected() ? "connected" : "disconnected",
        info: service.getInfo(),
        message:
          mode === "mock"
            ? `Mock connected · ${behavior} response selected.`
            : "Serial port open. A Paradise device has not yet been verified.",
      });
    } catch (error) {
      set({ status: "disconnected", info: {}, message: describe(error) });
    }
  },
  disconnect: async () => {
    if (get().status !== "connected" || get().busy) return;
    set({ status: "disconnecting" });
    try {
      await service?.dispose();
      set({ message: "Disconnected." });
    } catch (error) {
      set({ message: describe(error) });
    } finally {
      service = undefined;
      set({ status: "disconnected", info: {} });
    }
  },
  sendTest: async () => {
    if (get().busy || get().status !== "connected" || !service) return;
    set({ busy: true, message: "Waiting for echo response…" });
    try {
      await service.sendTest();
      set({
        message:
          get().mode === "mock"
            ? "Mock echo received. Simulation passed; no hardware was tested."
            : "Echo reply received. This confirms a responding connection, not item compatibility.",
      });
    } catch (error) {
      set({ message: describe(error) });
    } finally {
      set({ busy: false });
    }
  },
  clearLog: () => set({ logs: [] }),
  startCapture: () => set({ capturing: true, capture: [], captureFull: false }),
  stopCapture: () => set({ capturing: false }),
}));
