import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultThemeId } from "@/lib/themes";

interface ThemeState {
  theme: string;
  setTheme: (theme: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: defaultThemeId,
      setTheme: (theme: string) => set({ theme }),
    }),
    {
      name: "demo-app-theme",
    }
  )
);
