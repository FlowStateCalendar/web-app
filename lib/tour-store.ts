"use client";

import { create } from "zustand";

type TourState = {
  /** When set, tour runner will call moveTo(this index) after route matches */
  pendingStepIndex: number | null;
  /** When true, tour runner will call drive(0) once pathname is /dashboard */
  startOnDashboard: boolean;
  setPendingStepIndex: (index: number | null) => void;
  setStartOnDashboard: (value: boolean) => void;
};

export const useTourStore = create<TourState>((set) => ({
  pendingStepIndex: null,
  startOnDashboard: false,
  setPendingStepIndex: (index) => set({ pendingStepIndex: index }),
  setStartOnDashboard: (value) => set({ startOnDashboard: value }),
}));
