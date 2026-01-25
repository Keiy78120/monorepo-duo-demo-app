"use client";

import { create } from "zustand";
import type { TelegramWebApp } from "@/lib/telegram/types";

interface TelegramState {
  webApp: TelegramWebApp | null;
  isReady: boolean;
  isInTelegram: boolean;
  userId: number | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  initData: string | null;
  setWebApp: (webApp: TelegramWebApp) => void;
  initialize: () => void;
  enablePreview: (data?: {
    userId?: number | null;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  }) => void;
}

export const useTelegramStore = create<TelegramState>((set, get) => ({
  webApp: null,
  isReady: false,
  isInTelegram: false,
  userId: null,
  username: null,
  firstName: null,
  lastName: null,
  initData: null,

  setWebApp: (webApp: TelegramWebApp) => {
    const user = webApp.initDataUnsafe?.user;
    set({
      webApp,
      isReady: true,
      isInTelegram: true,
      userId: user?.id || null,
      username: user?.username || null,
      firstName: user?.first_name || null,
      lastName: user?.last_name || null,
      initData: webApp.initData || null,
    });
  },

  initialize: () => {
    if (typeof window === "undefined") return;

    // DEV MODE: Bypass Telegram check in development
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      set({
        isReady: true,
        isInTelegram: true,
        userId: 123456789,
        username: "dev_user",
        firstName: "Dev",
        lastName: "User",
        initData: null,
      });
      return;
    }

    let attempts = 0;
    const maxAttempts = 12;
    const retryDelay = 200;

    const tryInit = () => {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        // Initialize Telegram WebApp
        tg.ready();
        tg.expand();

        // Set theme colors (light theme)
        tg.setHeaderColor("#ffffff");
        tg.setBackgroundColor("#ffffff");

        // Disable vertical swipes for better UX
        if (tg.disableVerticalSwipes) {
          tg.disableVerticalSwipes();
        }

        get().setWebApp(tg);

        // Notify server for verification + logging
        if (tg.initData) {
          fetch("/api/telegram/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData: tg.initData }),
          }).catch(() => {
            // Ignore logging failures to avoid blocking the UI
          });
        }
        return;
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        set({ isReady: true, isInTelegram: false });
        return;
      }

      setTimeout(tryInit, retryDelay);
    };

    tryInit();
  },

  enablePreview: (data) => {
    set({
      isReady: true,
      isInTelegram: true,
      userId: data?.userId ?? null,
      username: data?.username ?? null,
      firstName: data?.firstName ?? null,
      lastName: data?.lastName ?? null,
      initData: null,
    });
  },
}));

// Hook for haptic feedback
export function useHapticFeedback() {
  const webApp = useTelegramStore((state) => state.webApp);

  return {
    impact: (style: "light" | "medium" | "heavy" | "rigid" | "soft" = "light") => {
      webApp?.HapticFeedback?.impactOccurred(style);
    },
    notification: (type: "error" | "success" | "warning") => {
      webApp?.HapticFeedback?.notificationOccurred(type);
    },
    selection: () => {
      webApp?.HapticFeedback?.selectionChanged();
    },
  };
}
