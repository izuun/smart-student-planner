// Circle ("iris") transition used for login -> dashboard and logout -> login.
//
//   irisPush(router, "/dashboard")
//     1. the screen closes to a circle in the middle
//     2. the route changes while the screen is covered
//     3. the circle opens back out onto the new page
//
// components/IrisTransition.js registers the controller that draws the circle.
let controller = null;
let active = false;

export function registerIris(c) {
  controller = c;
  return () => {
    if (controller === c) controller = null;
  };
}

// True while an iris navigation is running (the page slide is skipped then).
export function isIrisActive() {
  return active;
}

export async function irisPush(router, url, beforeNavigate) {
  const reduced =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // No overlay yet, reduced motion, or already mid-transition: just navigate.
  if (!controller || reduced || active) {
    if (beforeNavigate) {
      try {
        await beforeNavigate();
      } catch (err) {}
    }
    return router.push(url);
  }

  active = true;
  const c = controller;
  try {
    // Anything that must happen first (e.g. the logout request) runs while the circle closes.
    const before = beforeNavigate
      ? Promise.resolve().then(beforeNavigate).catch(() => {})
      : Promise.resolve();
    await Promise.all([c.close(), before]);
    await router.push(url);
  } finally {
    active = false;
    c.open();
  }
}
