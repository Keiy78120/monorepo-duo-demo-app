import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TourState {
  hasCompletedTour: boolean;
  shouldShowTour: boolean;
  completeTour: () => void;
  skipTour: () => void;
  resetTour: () => void;
  startTour: () => void;
}

export const useTourStore = create<TourState>()(
  persist(
    (set) => ({
      hasCompletedTour: false,
      shouldShowTour: false,

      completeTour: () =>
        set({
          hasCompletedTour: true,
          shouldShowTour: false,
        }),

      skipTour: () =>
        set({
          hasCompletedTour: true,
          shouldShowTour: false,
        }),

      resetTour: () =>
        set({
          hasCompletedTour: false,
          shouldShowTour: true,
        }),

      startTour: () =>
        set({
          shouldShowTour: true,
        }),
    }),
    {
      name: "demo-tour-storage",
    }
  )
);
