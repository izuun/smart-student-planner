import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useTour } from "../context/TourContext";

export default function TourOverlay() {
  const tour = useTour();
  const router = useRouter();
  const [rect, setRect] = useState(null);
  const pollRef = useRef(null);

  const active = tour?.active;
  const step = tour?.currentStep;
  const onStepPage = step && router.pathname === step.page;

  useEffect(() => {
    if (!active || !onStepPage) {
      setRect(null);
      return;
    }

    let cancelled = false;
    let attempts = 0;

    function locate() {
      if (cancelled) return;
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Give the smooth-scroll a moment to settle before measuring.
        setTimeout(() => {
          if (cancelled) return;
          const r = el.getBoundingClientRect();
          setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        }, 220);
      } else if (attempts < 30) {
        attempts += 1;
        pollRef.current = setTimeout(locate, 150);
      }
    }

    locate();

    function reposition() {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      }
    }
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);

    return () => {
      cancelled = true;
      clearTimeout(pollRef.current);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [active, onStepPage, step]);

  if (!active || !step) return null;

  const pad = 8;
  const spotlightStyle = rect
    ? {
        position: "fixed",
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
        borderRadius: 14,
        boxShadow: "0 0 0 4px var(--primary), 0 0 0 9999px rgba(8,10,20,0.72)",
        pointerEvents: "none",
        transition: "top .25s ease, left .25s ease, width .25s ease, height .25s ease",
        zIndex: 9998,
      }
    : {
        position: "fixed",
        inset: 0,
        background: "rgba(8,10,20,0.72)",
        pointerEvents: "none",
        zIndex: 9998,
      };

  return (
    <>
      <div style={spotlightStyle} />

      <div className="tour-card" role="dialog" aria-live="polite">
        <div className="tour-card-top">
          <span className="tour-step-count">
            Step {tour.stepIndex + 1} of {tour.total}
          </span>
          <button type="button" className="tour-skip" onClick={tour.stopTour}>
            Skip tour <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <h3 className="tour-title">{step.title}</h3>
        <p className="tour-text">{step.text}</p>
        <div className="tour-progress-dots">
          {Array.from({ length: tour.total }, (_, i) => (
            <span key={i} className={`tour-dot ${i === tour.stepIndex ? "active" : ""}`}></span>
          ))}
        </div>
        <div className="tour-actions">
          <button type="button" className="btn" onClick={tour.back} disabled={tour.isFirst}>
            <i className="fa-solid fa-arrow-left"></i> Back
          </button>
          <button type="button" className="btn save-btn" onClick={tour.next}>
            {tour.isLast ? "Finish" : "Next"} <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </>
  );
}
