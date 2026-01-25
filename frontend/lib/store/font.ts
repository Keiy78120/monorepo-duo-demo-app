import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultFontId } from "@/lib/fonts";

interface FontState {
  font: string;
  setFont: (font: string) => void;
}

export const useFontStore = create<FontState>()(
  persist(
    (set) => ({
      font: defaultFontId,
      setFont: (font: string) => set({ font }),
    }),
    {
      name: "app-font",
    }
  )
);
