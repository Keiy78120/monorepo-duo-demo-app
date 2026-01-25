import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultDisplayModeId } from "@/lib/display-modes";

interface DisplayModeState {
  mode: string;
  setMode: (mode: string) => void;
}

export const useDisplayModeStore = create<DisplayModeState>()(
  persist(
    (set) => ({
      mode: defaultDisplayModeId,
      setMode: (mode: string) => set({ mode }),
    }),
    {
      name: "app-display-mode",
    }
  )
);
