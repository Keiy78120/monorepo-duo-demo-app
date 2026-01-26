"use client";

import { create } from "zustand";

interface DemoSessionStore {
  sessionId: string | null;
  isDemoMode: boolean;
  initDemoSession: () => string;
  clearDemoSession: () => void;
  loadDemoSession: () => void;
}

const STORAGE_KEY = "demo-session-id";

// Generate UUID v4
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const useDemoSessionStore = create<DemoSessionStore>((set, get) => ({
  sessionId: null,
  isDemoMode: false,

  initDemoSession: () => {
    const uuid = generateUUID();
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, uuid);
    }
    set({ sessionId: uuid, isDemoMode: true });
    return uuid;
  },

  clearDemoSession: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    set({ sessionId: null, isDemoMode: false });
  },

  loadDemoSession: () => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      set({ sessionId: stored, isDemoMode: true });
    } else {
      set({ sessionId: null, isDemoMode: false });
    }
  },
}));
