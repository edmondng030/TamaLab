"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
export const useSettings = create<{
  developerMode: boolean;
  setDeveloperMode: (enabled: boolean) => void;
}>()(
  persist(
    (set) => ({
      developerMode: false,
      setDeveloperMode: (developerMode) => set({ developerMode }),
    }),
    { name: "tama-studio-settings" },
  ),
);
