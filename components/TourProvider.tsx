"use client";

import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { driver, type Driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { TOUR_STEPS } from "@/lib/tour-steps";
import { useTourStore } from "@/lib/tour-store";
import { enhanceMascotTourPopover } from "@/lib/tour-mascot";

const TourContext = createContext<{ startTour: () => void } | null>(null);

const NAVIGATION_DELAY_MS = 400;

function toDriveSteps(): DriveStep[] {
  return TOUR_STEPS.map((step) => ({
    element: step.element,
    popover: {
      title: step.popover.title,
      description: step.popover.description,
    },
  }));
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const driverRef = useRef<Driver | null>(null);
  const pathnameRef = useRef(pathname);
  const routerRef = useRef(router);
  pathnameRef.current = pathname;
  routerRef.current = router;

  const { pendingStepIndex, startOnDashboard, setPendingStepIndex, setStartOnDashboard } = useTourStore();

  const startTour = useCallback(() => {
    if (!driverRef.current) return;
    setPendingStepIndex(null);
    if (pathnameRef.current !== "/dashboard") {
      setStartOnDashboard(true);
      routerRef.current.push("/dashboard");
    } else {
      driverRef.current.drive(0);
    }
  }, [setPendingStepIndex, setStartOnDashboard]);

  useEffect(() => {
    const steps = toDriveSteps();
    const driverObj = driver({
      popoverClass: "sh-mascot-tour",
      showProgress: true,
      progressText: "{{current}} of {{total}}",
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Done",
      onPopoverRender: (popover) => {
        enhanceMascotTourPopover(popover);
      },
      steps,
      onNextClick: (element, step, opts) => {
        const idx = opts.driver.getActiveIndex() ?? 0;
        const nextIdx = idx + 1;
        if (nextIdx >= steps.length) {
          opts.driver.destroy();
          setPendingStepIndex(null);
          return;
        }
        const nextRoute = TOUR_STEPS[nextIdx]?.route;
        if (nextRoute && nextRoute !== pathnameRef.current) {
          setPendingStepIndex(nextIdx);
          routerRef.current.push(nextRoute);
        } else {
          opts.driver.moveNext();
        }
      },
      onPrevClick: (element, step, opts) => {
        const idx = opts.driver.getActiveIndex() ?? 0;
        const prevIdx = idx - 1;
        if (prevIdx < 0) return;
        const prevRoute = TOUR_STEPS[prevIdx]?.route;
        if (prevRoute && prevRoute !== pathnameRef.current) {
          setPendingStepIndex(prevIdx);
          routerRef.current.push(prevRoute);
        } else {
          opts.driver.movePrevious();
        }
      },
      onCloseClick: () => {
        setPendingStepIndex(null);
        setStartOnDashboard(false);
      },
      onDestroyed: () => {
        setPendingStepIndex(null);
        setStartOnDashboard(false);
      },
    });
    driverRef.current = driverObj;
    return () => {
      driverObj.destroy();
      driverRef.current = null;
    };
  }, [setPendingStepIndex, setStartOnDashboard]);

  useEffect(() => {
    const d = driverRef.current;
    if (!d) return;

    if (startOnDashboard && pathname === "/dashboard") {
      const t = setTimeout(() => {
        d.drive(0);
        setStartOnDashboard(false);
      }, NAVIGATION_DELAY_MS);
      return () => clearTimeout(t);
    }

    if (pendingStepIndex !== null && TOUR_STEPS[pendingStepIndex]?.route === pathname) {
      const t = setTimeout(() => {
        d.moveTo(pendingStepIndex);
        setPendingStepIndex(null);
      }, NAVIGATION_DELAY_MS);
      return () => clearTimeout(t);
    }
  }, [pathname, pendingStepIndex, startOnDashboard, setPendingStepIndex, setStartOnDashboard]);

  return (
    <TourContext.Provider value={{ startTour }}>{children}</TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  return ctx ?? { startTour: () => {} };
}
