"use client";

import { create } from "zustand";

export type AppMode = "simple" | "advanced";

interface AppModeState {
  mode: AppMode | null;
  isReady: boolean;
  setMode: (mode: AppMode) => void;
  clearMode: () => void;
  loadMode: () => void;
}

const STORAGE_KEY = "app-mode";

export const useAppModeStore = create<AppModeState>((set) => ({
  mode: null,
  isReady: false,
  setMode: (mode) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, mode);
    }
    set({ mode, isReady: true });
  },
  clearMode: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    set({ mode: null, isReady: true });
  },
  loadMode: () => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "simple" || stored === "advanced") {
      set({ mode: stored, isReady: true });
      return;
    }
    set({ mode: null, isReady: true });
  },
}));
