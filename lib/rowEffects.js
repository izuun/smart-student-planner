// Row animations for the Tasks and Semester History tables.
//
//   flashRowGreen(row)          green light sweeps across the row, left to right, three times
//   vacuumDelete(row, opts)     a trash can pops up, opens its lid and vacuums the row's
//                               contents in; the rows below then slide up to close the gap
//
// Everything is drawn with the Web Animations API on transform / opacity only,
// so it stays on the GPU and remains smooth.

const CAN_SVG = `
<svg viewBox="0 0 64 84" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse cx="32" cy="80" rx="22" ry="3.5" fill="rgba(0,0,0,.2)"/>
  <path d="M11 27h42l-3.6 44.2a6 6 0 0 1-6 5.5H20.6a6 6 0 0 1-6-5.5z" fill="#64748b"/>
  <path d="M24 36v30M32 36v30M40 36v30" stroke="#e2e8f0" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>
  <g class="vac-lid" style="transform-origin:12px 22px">
    <rect x="8" y="17" width="48" height="8" rx="4" fill="#475569"/>
    <rect x="24" y="10" width="16" height="8" rx="4" fill="#475569"/>
  </g>
</svg>`;

function reducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const done = (anim) => anim.finished.catch(() => {});

/* ------------------------------------------------------------------ */
/* Completed task: green sweep                                        */
/* ------------------------------------------------------------------ */
export function flashRowGreen(row) {
  if (!row || reducedMotion()) return;
  const wrap = row.closest(".table-wrap");
  if (!wrap) return;

  const rr = row.getBoundingClientRect();
  const wr = wrap.getBoundingClientRect();

  const overlay = document.createElement("div");
  overlay.className = "row-flash";
  overlay.style.top = `${rr.top - wr.top + wrap.scrollTop}px`;
  overlay.style.left = `${rr.left - wr.left + wrap.scrollLeft}px`;
  overlay.style.width = `${rr.width}px`;
  overlay.style.height = `${rr.height}px`;
  overlay.style.borderRadius = window.getComputedStyle(row).borderRadius;

  const beam = document.createElement("div");
  beam.className = "row-flash-beam";
  overlay.appendChild(beam);
  wrap.appendChild(overlay);

  const passes = 1;
  const passMs = 200;
  const total = passes * passMs;

  // Soft green tint that fades in, holds, and fades out.
  overlay.animate(
    [{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 1, offset: 0.9 }, { opacity: 0 }],
    { duration: total, easing: "linear" }
  );
  // The bright band that travels left -> right on every pass.
  beam.animate(
    [{ transform: "translateX(-100%)" }, { transform: "translateX(290%)" }],
    { duration: passMs, iterations: passes, easing: "cubic-bezier(.45,0,.25,1)" }
  );

  setTimeout(() => overlay.remove(), total + 250);
}

/* ------------------------------------------------------------------ */
/* Delete: trash can vacuums the row                                  */
/* ------------------------------------------------------------------ */
// row     the <tr> being deleted
// action  async () => boolean   performs the delete request (true = it worked)
// commit  () => void            removes the item from React state; must apply synchronously
//                               (wrap the state update in flushSync)
// Resolves true if the item was deleted, false if the request failed (the row is restored).
export async function vacuumDelete(row, { action, commit }) {
  const runAction = async () => {
    try {
      return !!(await action());
    } catch (err) {
      return false;
    }
  };

  // No row on screen, or the user prefers reduced motion: just delete.
  if (!row || reducedMotion()) {
    const ok = await runAction();
    if (ok) commit();
    return ok;
  }

  row.style.pointerEvents = "none";

  const rect = row.getBoundingClientRect();
  const cells = Array.from(row.children);
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Where the can sits: inside the right end of the row.
  const cx = clamp(rect.right - 46, 44, vw - 44);
  const cy = clamp(rect.top + rect.height / 2, 60, vh - 60);
  const mouthY = cy - 12; // the opening of the can

  /* --- the trash can ------------------------------------------------ */
  const can = document.createElement("div");
  can.className = "vac-can";
  can.style.left = `${cx - 32}px`;
  can.style.top = `${cy - 34}px`;
  can.innerHTML = CAN_SVG;
  document.body.appendChild(can);
  const lid = can.querySelector(".vac-lid");

  can.animate(
    [
      { opacity: 0, transform: "translateY(14px) scale(.5)" },
      { opacity: 1, transform: "translateY(0) scale(1)" },
    ],
    { duration: 260, easing: "cubic-bezier(.34,1.56,.64,1)", fill: "forwards" }
  );
  lid.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(-72deg)" }], {
    duration: 320,
    delay: 90,
    easing: "cubic-bezier(.34,1.56,.64,1)",
    fill: "forwards",
  });

  /* --- suction rings around the mouth ------------------------------- */
  const START = 280;
  for (let i = 0; i < 3; i++) {
    const ring = document.createElement("span");
    ring.className = "vac-ring";
    can.appendChild(ring);
    ring.animate(
      [
        { opacity: 0, transform: "scale(2.7)" },
        { opacity: 0.55, offset: 0.4 },
        { opacity: 0, transform: "scale(.6)" },
      ],
      { duration: 600, delay: START - 40 + i * 170, iterations: 2, easing: "ease-in" }
    );
  }

  /* --- the row's contents get vacuumed in --------------------------- */
  const STAG = 38;
  const DUR = 540;
  const ordered = cells
    .map((el) => {
      const r = el.getBoundingClientRect();
      const mx = r.left + r.width / 2;
      const my = r.top + r.height / 2;
      return { el, mx, my, dist: Math.hypot(mx - cx, my - cy) };
    })
    .sort((a, b) => a.dist - b.dist); // closest bits go first, like a stream

  const cellAnims = ordered.map((o, i) => {
    const dx = cx - o.mx;
    const dy = mouthY - o.my;
    const spin = (i % 2 ? 1 : -1) * (24 + i * 7);
    return o.el.animate(
      [
        { transform: "translate(0px,0px) scale(1) rotate(0deg)", opacity: 1 },
        // small wind-up before the pull
        { transform: `translate(${-dx * 0.05}px,${-dy * 0.05}px) scale(1.05) rotate(0deg)`, opacity: 1, offset: 0.18 },
        { transform: `translate(${dx}px,${dy}px) scale(.04) rotate(${spin}deg)`, opacity: 0 },
      ],
      { duration: DUR, delay: START + i * STAG, easing: "cubic-bezier(.55,0,.8,.45)", fill: "both" }
    );
  });
  const cellsEnd = START + (ordered.length - 1) * STAG + DUR;

  /* --- rows below slide up into the gap ----------------------------- */
  const followers = [];
  for (let n = row.nextElementSibling; n; n = n.nextElementSibling) followers.push(n);
  const shift = rect.height + (parseFloat(window.getComputedStyle(row).marginBottom) || 0);
  const collapseAnims = followers.map((f) =>
    f.animate(
      [{ transform: "translateY(0px)" }, { transform: `translateY(${-shift}px)` }],
      { duration: 320, delay: Math.max(0, cellsEnd - 140), easing: "cubic-bezier(.4,0,.2,1)", fill: "both" }
    )
  );

  /* --- the delete request runs while all of that plays -------------- */
  const actionPromise = runAction();
  await Promise.all([...cellAnims.map(done), ...collapseAnims.map(done), sleep(cellsEnd + 180)]);
  const ok = await actionPromise;

  const closeCan = async (delay) => {
    await sleep(delay);
    // gulp
    can.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.12,.92)", offset: 0.4 }, { transform: "scale(1)" }],
      { duration: 260, easing: "ease-out" }
    );
    // lid closes
    lid.animate([{ transform: "rotate(-72deg)" }, { transform: "rotate(0deg)" }], {
      duration: 260,
      easing: "cubic-bezier(.5,0,.3,1.35)",
      fill: "forwards",
    });
    await sleep(380);
    const out = can.animate(
      [
        { opacity: 1, transform: "translateY(0) scale(1)" },
        { opacity: 0, transform: "translateY(10px) scale(.7)" },
      ],
      { duration: 240, easing: "ease-in", fill: "forwards" }
    );
    await done(out);
    can.remove();
  };

  if (ok) {
    // Remove the item for real and drop the temporary transforms in the same frame,
    // so the rows don't jump.
    commit();
    cellAnims.forEach((a) => a.cancel());
    collapseAnims.forEach((a) => a.cancel());
    closeCan(0);
    return true;
  }

  // The request failed: bring the row back.
  cellAnims.forEach((a) => a.cancel());
  collapseAnims.forEach((a) => a.cancel());
  row.style.pointerEvents = "";
  closeCan(0);
  return false;
}
