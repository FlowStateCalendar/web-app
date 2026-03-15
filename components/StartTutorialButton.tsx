"use client";

import { useTour } from "@/components/TourProvider";

export function StartTutorialButton() {
  const { startTour } = useTour();

  return (
    <button
      type="button"
      onClick={startTour}
      className="rounded-md border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
    >
      How it works
    </button>
  );
}
