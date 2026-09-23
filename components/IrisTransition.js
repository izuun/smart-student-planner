import { useEffect, useRef } from "react";
import { registerIris } from "../lib/iris";

const COLOR = "#0b1020";
const CLEAR = "rgba(11,16,32,0)";
const CLOSE_MS = 460;
const OPEN_MS = 620;

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Full-screen cover with a circular hole. The hole shrinks to nothing (screen
// "closes"), then grows back out. The page underneath is visible through the hole.
export default function IrisTransition() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let raf = 0;
    let stopCurrent = null;

    const maxRadius = () => {
      const r = el.getBoundingClientRect();
      return Math.hypot(r.width, r.height) / 2 + 4;
    };

    const paint = (radius) => {
      el.style.background =
        radius <= 0.5
          ? COLOR
          : `radial-gradient(circle at 50% 50%, ${CLEAR} ${radius}px, ${COLOR} ${radius + 1.5}px)`;
    };

    // Animates the hole radius. Also resolves on a timer, so a background tab
    // (where animation frames pause) can never leave a navigation stuck.
    const run = (from, to, ms) =>
      new Promise((resolve) => {
        let finished = false;
        const finish = () => {
          if (finished) return;
          finished = true;
          cancelAnimationFrame(raf);
          clearTimeout(timer);
          paint(to);
          stopCurrent = null;
          resolve();
        };
        const timer = setTimeout(finish, ms + 120);
        stopCurrent = finish;
        const t0 = performance.now();
        const step = (now) => {
          if (finished) return;
          const p = Math.min(1, (now - t0) / ms);
          paint(from + (to - from) * easeInOutCubic(p));
          if (p < 1) raf = requestAnimationFrame(step);
          else finish();
        };
        raf = requestAnimationFrame(step);
      });

    const api = {
      async close() {
        if (stopCurrent) stopCurrent();
        el.classList.remove("holding");
        el.style.display = "block";
        const start = maxRadius();
        paint(start);
        await run(start, 0, CLOSE_MS);
        el.classList.add("holding"); // logo fades in only if loading takes a moment
      },
      async open() {
        if (stopCurrent) stopCurrent();
        el.classList.remove("holding");
        // Let the new page paint under the cover before revealing it.
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        await run(0, maxRadius(), OPEN_MS);
        el.style.display = "none";
      },
    };

    const unregister = registerIris(api);
    return () => {
      unregister();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="iris-cover" aria-hidden="true">
      <img className="iris-logo" src="/icon-192.png" alt="" />
    </div>
  );
}
