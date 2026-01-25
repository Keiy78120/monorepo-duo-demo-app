import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultNavbarStyleId } from "@/lib/navbar-styles";

interface NavbarState {
  style: string;
  setStyle: (style: string) => void;
}

export const useNavbarStore = create<NavbarState>()(
  persist(
    (set) => ({
      style: defaultNavbarStyleId,
      setStyle: (style: string) => set({ style }),
    }),
    {
      name: "app-navbar-style",
    }
  )
);
