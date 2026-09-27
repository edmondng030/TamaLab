"use client";
import { create } from "zustand";
import type { PreparedUploadItem } from "./ParadiseService";
// A prepared snapshot survives client-side navigation, but never starts a send.
// No protocol key is stored here. Reloading requires selecting the exported file.
export const useUploadItem = create<{
  item?: PreparedUploadItem;
  select: (item: PreparedUploadItem) => void;
  clear: () => void;
}>((set) => ({
  select: (item) =>
    set({ item: { ...item, bytes: new Uint8Array(item.bytes) } }),
  clear: () => set({ item: undefined }),
}));
