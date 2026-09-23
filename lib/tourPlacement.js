// Picks a spot for the tour card that does not cover the highlighted element.
// All numbers are in CSS pixels relative to the viewport.
//
//   rect     – { top, left, width, height } of the highlighted element (or null)
//   size     – { w, h } of the card
//   vw, vh   – viewport width / height
//   opts     – { margin, gap, pad, topSafe }
//
// Every candidate position (below / above / right / left of the target, then
// the screen edges and corners) is clamped into the viewport and scored by how
// much it overlaps the target. The first zero-overlap candidate wins; if none
// exist, the least-overlapping one is used.
export function computePlacement(rect, size, vw, vh, opts = {}) {
  const margin = opts.margin ?? 10;
  const gap = opts.gap ?? 14;
  const pad = opts.pad ?? 12;
  const topSafe = opts.topSafe ?? margin;

  const w = Math.min(size.w, vw - margin * 2);
  const h = Math.min(size.h, vh - topSafe - margin);

  const minX = margin;
  const maxX = Math.max(margin, vw - w - margin);
  const minY = topSafe;
  const maxY = Math.max(topSafe, vh - h - margin);

  const clampX = (v) => Math.min(maxX, Math.max(minX, v));
  const clampY = (v) => Math.min(maxY, Math.max(minY, v));
  const centerX = (vw - w) / 2;

  if (!rect) {
    return { left: Math.round(clampX(centerX)), top: Math.round(maxY) };
  }

  const t = {
    l: rect.left - pad,
    r: rect.left + rect.width + pad,
    t: rect.top - pad,
    b: rect.top + rect.height + pad,
  };
  const cx = rect.left + rect.width / 2 - w / 2;
  const cy = rect.top + rect.height / 2 - h / 2;

  const candidates = [
    { left: cx, top: t.b + gap }, // below the target
    { left: cx, top: t.t - gap - h }, // above the target
    { left: t.r + gap, top: cy }, // right of the target
    { left: t.l - gap - w, top: cy }, // left of the target
    { left: centerX, top: maxY }, // bottom of the screen
    { left: centerX, top: minY }, // top of the screen
    { left: maxX, top: maxY },
    { left: minX, top: maxY },
    { left: maxX, top: minY },
    { left: minX, top: minY },
  ];

  let best = null;
  for (const c of candidates) {
    const left = clampX(c.left);
    const top = clampY(c.top);
    const ox = Math.max(0, Math.min(left + w, t.r) - Math.max(left, t.l));
    const oy = Math.max(0, Math.min(top + h, t.b) - Math.max(top, t.t));
    const overlap = ox * oy;
    if (!best || overlap < best.overlap) best = { left, top, overlap };
  }
  return { left: Math.round(best.left), top: Math.round(best.top) };
}
