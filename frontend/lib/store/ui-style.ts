import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultUIStyleId } from "@/lib/ui-styles";

interface UIStyleState {
  uiStyle: string;
  setUIStyle: (style: string) => void;
}

export const useUIStyleStore = create<UIStyleState>()(
  persist(
    (set) => ({
      uiStyle: defaultUIStyleId,
      setUIStyle: (uiStyle: string) => set({ uiStyle }),
    }),
    {
      name: "app-ui-style",
    }
  )
);
