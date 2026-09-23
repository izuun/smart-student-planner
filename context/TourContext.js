import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { TOUR_STEPS } from "../lib/tourSteps";

const STORAGE_KEY = "ssp_tour_progress";
const TourContext = createContext(null);

export function TourProvider({ children }) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  // Hands-on actions the user has completed during the tour, e.g. { "task-added": true }.
  const [done, setDone] = useState({});
  const [hydrated, setHydrated] = useState(false);

  // Restore an in-progress tour (e.g. after a full page reload).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.active && typeof saved.stepIndex === "number") {
          setActive(true);
          setStepIndex(Math.min(saved.stepIndex, TOUR_STEPS.length - 1));
          if (saved.done && typeof saved.done === "object") setDone(saved.done);
        }
      }
    } catch (err) {}
    setHydrated(true);
  }, []);

  // Save progress (only after the restore above, so it can't be overwritten).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ active, stepIndex, done }));
    } catch (err) {}
  }, [hydrated, active, stepIndex, done]);

  const step = TOUR_STEPS[stepIndex] || null;
  // A step can require the user to do something real before "Next" unlocks.
  const locked = !!(step && step.requires && !done[step.requires]);

  // Pages call this after the user really does the action (e.g. a saved task).
  // It only counts while the tour is sitting on the step that asked for it.
  const markDone = useCallback(
    (key) => {
      if (!active || !step || step.requires !== key) return;
      setDone((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
    },
    [active, step]
  );

  const startTour = useCallback(() => {
    setDone({});
    setStepIndex(0);
    setActive(true);
  }, []);

  const stopTour = useCallback(() => {
    setActive(false);
    setStepIndex(0);
    setDone({});
  }, []);

  // Steps only change the index. They never navigate: if a step is on another
  // page, the overlay shows a switching-page guide and the user opens it.
  const next = useCallback(() => {
    if (locked) return;
    if (stepIndex >= TOUR_STEPS.length - 1) {
      stopTour();
      return;
    }
    setStepIndex(stepIndex + 1);
  }, [stepIndex, locked, stopTour]);

  const back = useCallback(() => {
    if (stepIndex <= 0) return;
    setStepIndex(stepIndex - 1);
  }, [stepIndex]);

  const value = useMemo(
    () => ({
      active,
      stepIndex,
      total: TOUR_STEPS.length,
      currentStep: step,
      nextStep: TOUR_STEPS[stepIndex + 1] || null,
      isFirst: stepIndex === 0,
      isLast: stepIndex === TOUR_STEPS.length - 1,
      locked,
      actionDone: !!(step && step.requires && done[step.requires]),
      startTour,
      stopTour,
      next,
      back,
      markDone,
    }),
    [active, stepIndex, step, locked, done, startTour, stopTour, next, back, markDone]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  return useContext(TourContext);
}
