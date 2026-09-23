import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { TOUR_STEPS } from "../lib/tourSteps";

const STORAGE_KEY = "ssp_tour_progress";
const TourContext = createContext(null);

export function TourProvider({ children }) {
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Restore an in-progress tour (e.g. after a page navigation reload).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.active && typeof saved.stepIndex === "number") {
          setActive(true);
          setStepIndex(Math.min(saved.stepIndex, TOUR_STEPS.length - 1));
        }
      }
    } catch (err) {}
  }, []);

  const persist = useCallback((nextActive, nextIndex) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ active: nextActive, stepIndex: nextIndex }));
    } catch (err) {}
  }, []);

  const goToStepIndex = useCallback(
    (index) => {
      const step = TOUR_STEPS[index];
      if (!step) return;
      setStepIndex(index);
      persist(true, index);
      if (router.pathname !== step.page) {
        router.push(step.page);
      }
    },
    [router, persist]
  );

  const startTour = useCallback(() => {
    setActive(true);
    goToStepIndex(0);
  }, [goToStepIndex]);

  const stopTour = useCallback(() => {
    setActive(false);
    persist(false, 0);
  }, [persist]);

  const next = useCallback(() => {
    if (stepIndex >= TOUR_STEPS.length - 1) {
      stopTour();
      return;
    }
    goToStepIndex(stepIndex + 1);
  }, [stepIndex, goToStepIndex, stopTour]);

  const back = useCallback(() => {
    if (stepIndex <= 0) return;
    goToStepIndex(stepIndex - 1);
  }, [stepIndex, goToStepIndex]);

  const value = useMemo(
    () => ({
      active,
      stepIndex,
      total: TOUR_STEPS.length,
      currentStep: TOUR_STEPS[stepIndex] || null,
      isFirst: stepIndex === 0,
      isLast: stepIndex === TOUR_STEPS.length - 1,
      startTour,
      stopTour,
      next,
      back,
    }),
    [active, stepIndex, startTour, stopTour, next, back]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  return useContext(TourContext);
}
