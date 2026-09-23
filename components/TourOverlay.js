import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useTour } from "../context/TourContext";
import { PAGE_LABELS } from "../lib/tourSteps";
import { computePlacement } from "../lib/tourPlacement";

// useLayoutEffect warns during server rendering, so fall back to useEffect there.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const SPOT_PAD = 8;

function toRect(el) {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function sameRect(a, b) {
  return (
    !!a &&
    !!b &&
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

// Finds what the user should tap to reach `page`:
//  - desktop: the sidebar link
//  - mobile, menu closed: the hamburger button (link is off-screen)
//  - mobile, menu open: the sidebar link
function findNavTarget(page) {
  const menuBtn = document.querySelector(".mobile-menu-btn");
  const sidebar = document.querySelector(".sidebar");
  const link = document.querySelector(`.sidebar a[data-tour-nav="${page}"]`);
  const isMobile = !!menuBtn && window.getComputedStyle(menuBtn).display !== "none";

  if (isMobile) {
    const open = !!sidebar && sidebar.classList.contains("active");
    return open ? { el: link, hint: "link" } : { el: menuBtn, hint: "menu" };
  }
  return { el: link, hint: "link" };
}

export default function TourOverlay() {
  const tour = useTour();
  const router = useRouter();

  const [rect, setRect] = useState(null); // highlighted element
  const [navHint, setNavHint] = useState("link"); // "link" | "menu"
  const [navMissing, setNavMissing] = useState(false);
  const [size, setSize] = useState(null); // measured card size
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const [manualPos, setManualPos] = useState(null); // set while the user drags the card
  const [dragging, setDragging] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const cardRef = useRef(null);
  const dragRef = useRef(null);

  const active = tour?.active;
  const step = tour?.currentStep;
  const onStepPage = !!step && router.pathname === step.page;
  // The step lives on another page: guide the user to switch pages themselves.
  const navMode = !!step && !onStepPage;

  // Track viewport size.
  useEffect(() => {
    const set = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);

  // A new step (or switching between step / switch-page mode) goes back to auto placement.
  useEffect(() => {
    setManualPos(null);
    setCollapsed(false);
  }, [tour?.stepIndex, navMode]);

  // Once a required action is done, make sure the (now unlocked) Next button is visible.
  useEffect(() => {
    if (tour && !tour.locked) setCollapsed(false);
  }, [tour?.locked]);

  // On phones the on-screen keyboard eats the screen while the user fills in a required
  // form, so tuck the guide away as soon as they tap into the highlighted area.
  useEffect(() => {
    if (!active || !onStepPage || !step || !step.requires || !tour.locked) return undefined;
    const onFocus = (e) => {
      if (window.innerWidth > 700) return;
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el && el.contains(e.target)) setCollapsed(true);
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, [active, onStepPage, step, tour?.locked]);

  // Locate whatever should be highlighted right now.
  useEffect(() => {
    if (!active || !step) {
      setRect(null);
      setNavMissing(false);
      return undefined;
    }

    let cancelled = false;
    let timer = null;
    const update = (next) => setRect((prev) => (sameRect(prev, next) ? prev : next));

    if (onStepPage) {
      setNavMissing(false);
      let attempts = 0;
      const query = () => document.querySelector(`[data-tour="${step.target}"]`);

      const locate = () => {
        if (cancelled) return;
        const el = query();
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          // Give the smooth-scroll and the page slide-in a moment to settle before measuring.
          timer = setTimeout(() => {
            if (cancelled) return;
            const again = query();
            if (again) update(toRect(again));
          }, 420);
        } else if (attempts < 30) {
          attempts += 1;
          timer = setTimeout(locate, 150);
        }
      };
      locate();

      const reposition = () => {
        const el = query();
        if (el) update(toRect(el));
      };
      window.addEventListener("resize", reposition);
      window.addEventListener("scroll", reposition, true);
      return () => {
        cancelled = true;
        clearTimeout(timer);
        window.removeEventListener("resize", reposition);
        window.removeEventListener("scroll", reposition, true);
      };
    }

    // Switching-page mode: keep pointing at the sidebar link / menu button.
    let misses = 0;
    const check = () => {
      if (cancelled) return;
      const { el, hint } = findNavTarget(step.page);
      setNavHint(hint);
      if (el) {
        misses = 0;
        setNavMissing(false);
        update(toRect(el));
      } else {
        misses += 1;
        if (misses >= 2) {
          setNavMissing(true);
          update(null);
        }
      }
    };
    const loop = () => {
      check();
      timer = setTimeout(loop, 150);
    };
    loop();
    window.addEventListener("resize", check);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("resize", check);
    };
  }, [active, onStepPage, step]);

  // Measure the card so it can be placed without covering the highlight.
  useIsoLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setSize((prev) =>
      prev && Math.abs(prev.w - r.width) < 1 && Math.abs(prev.h - r.height) < 1
        ? prev
        : { w: r.width, h: r.height }
    );
  });

  // Dragging (mouse, touch and pen all go through pointer events).
  const onDragStart = (e) => {
    if (e.target.closest("button")) return;
    const card = cardRef.current;
    if (!card) return;
    const r = card.getBoundingClientRect();
    dragRef.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
    setDragging(true);
  };

  const onDragMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const w = size ? size.w : 300;
    const h = size ? size.h : 200;
    const left = Math.min(Math.max(4, e.clientX - d.dx), Math.max(4, window.innerWidth - w - 4));
    const top = Math.min(Math.max(4, e.clientY - d.dy), Math.max(4, window.innerHeight - h - 4));
    setManualPos({ left, top });
  };

  const onDragEnd = (e) => {
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    setDragging(false);
  };

  if (!active || !step) return null;
  // No sidebar on this page (e.g. the login screen): nothing to point at, so stay out of the way.
  if (navMode && navMissing) return null;

  const label = PAGE_LABELS[step.page] || "the next page";
  const nextIsNewPage = !!tour.nextStep && tour.nextStep.page !== step.page;

  const spotlightStyle = rect
    ? {
        top: rect.top - SPOT_PAD,
        left: rect.left - SPOT_PAD,
        width: rect.width + SPOT_PAD * 2,
        height: rect.height + SPOT_PAD * 2,
      }
    : undefined;

  // On narrow screens keep the card clear of the floating menu button.
  const topSafe = vp.w <= 900 ? 66 : 10;
  const auto =
    size && vp.w
      ? computePlacement(rect, size, vp.w, vp.h, { topSafe })
      : null;
  const pos = manualPos || auto;
  const cardStyle = pos ? { left: pos.left, top: pos.top } : { left: 0, top: 0, visibility: "hidden" };

  return (
    <>
      <div
        className={`tour-spotlight ${rect ? "" : "full"} ${navMode ? "nav" : ""}`}
        style={spotlightStyle}
      />

      <div
        ref={cardRef}
        className={`tour-card ${dragging ? "dragging" : ""}`}
        style={cardStyle}
        role="dialog"
        aria-live="polite"
      >
        <div
          className="tour-card-top"
          title="Drag to move this guide"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          <div className="tour-drag-label">
            <i className="fa-solid fa-grip tour-grip"></i>
            <span className="tour-step-count">
              Step {tour.stepIndex + 1} of {tour.total}
            </span>
            {collapsed && (
              <span className="tour-collapsed-title">
                {navMode ? `Go to ${label}` : step.title}
              </span>
            )}
          </div>
          <div className="tour-top-actions">
            {manualPos && (
              <button
                type="button"
                className="tour-icon-btn"
                title="Move out of the way automatically"
                aria-label="Move guide out of the way automatically"
                onClick={() => setManualPos(null)}
              >
                <i className="fa-solid fa-rotate-left"></i>
              </button>
            )}
            <button
              type="button"
              className="tour-icon-btn"
              title={collapsed ? "Expand guide" : "Minimise guide"}
              aria-label={collapsed ? "Expand guide" : "Minimise guide"}
              onClick={() => setCollapsed((c) => !c)}
            >
              <i className={`fa-solid ${collapsed ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
            </button>
            <button type="button" className="tour-skip" onClick={tour.stopTour}>
              Skip <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {!collapsed &&
          (navMode ? (
            <>
              <h3 className="tour-title">Next stop: {label}</h3>
              <p className="tour-text">
                {navHint === "menu" ? (
                  <>
                    Tap the <i className="fa-solid fa-bars"></i> menu button at the top-left, then
                    choose <strong>{label}</strong>.
                  </>
                ) : (
                  <>
                    Tap or click <strong>{label}</strong> in the sidebar to continue.
                  </>
                )}
              </p>
              <p className="tour-note">
                <i className="fa-solid fa-flag-checkered"></i> Coming up: {step.title}
              </p>
              <div className="tour-actions">
                <button type="button" className="btn" onClick={tour.back} disabled={tour.isFirst}>
                  <i className="fa-solid fa-arrow-left"></i> Back
                </button>
                <span className="tour-waiting">
                  <i className="fa-solid fa-hand-pointer"></i> Waiting for you…
                </span>
              </div>
            </>
          ) : (
            <>
              <h3 className="tour-title">{step.title}</h3>
              <p className="tour-text">{step.text}</p>
              {step.requires && (
                <p className={`tour-note ${tour.actionDone ? "tour-success" : "tour-locked"}`}>
                  <i className={`fa-solid ${tour.actionDone ? "fa-circle-check" : "fa-lock"}`}></i>{" "}
                  {tour.actionDone ? step.doneHint : step.requireHint}
                </p>
              )}
              {nextIsNewPage && !tour.locked && (
                <p className="tour-note">
                  <i className="fa-solid fa-route"></i> Up next: switch to{" "}
                  {PAGE_LABELS[tour.nextStep.page] || "another page"} yourself.
                </p>
              )}
              <div className="tour-progress-dots">
                {Array.from({ length: tour.total }, (_, i) => (
                  <span key={i} className={`tour-dot ${i === tour.stepIndex ? "active" : ""}`}></span>
                ))}
              </div>
              <div className="tour-actions">
                <button type="button" className="btn" onClick={tour.back} disabled={tour.isFirst}>
                  <i className="fa-solid fa-arrow-left"></i> Back
                </button>
                <button
                  type="button"
                  className="btn save-btn"
                  onClick={tour.next}
                  disabled={tour.locked}
                  title={tour.locked ? step.requireHint : undefined}
                >
                  {tour.isLast ? "Finish" : "Next"}{" "}
                  <i className={`fa-solid ${tour.locked ? "fa-lock" : "fa-arrow-right"}`}></i>
                </button>
              </div>
            </>
          ))}
      </div>
    </>
  );
}
