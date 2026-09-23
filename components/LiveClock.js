import { useEffect, useState } from "react";

// Everything here reads the visitor's own device clock. The server (Vercel) runs
// in UTC, so a date built on the server is wrong for hours every day in other
// time zones and never updates while the page is open.

function pad(n) {
  return String(n).padStart(2, "0");
}

export function localDateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatLongDate(d) {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatClock(d) {
  const h = d.getHours() % 12 || 12;
  return {
    time: `${h}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
    ampm: d.getHours() >= 12 ? "PM" : "AM",
  };
}

// Calls `read(new Date())` now and every `ms`, and also as soon as the tab becomes
// visible again (browsers slow timers down in background tabs). The result is kept
// in state, and React skips the re-render when the value hasn't changed.
function useTicker(read, ms) {
  const [value, setValue] = useState(null);
  useEffect(() => {
    const tick = () => setValue(read(new Date()));
    const onVisible = () => {
      if (!document.hidden) tick();
    };
    tick();
    const id = setInterval(tick, ms);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [read, ms]);
  return value;
}

const readDateKey = (d) => localDateKey(d);
const readLongDate = (d) => formatLongDate(d);
const readClock = (d) => {
  const c = formatClock(d);
  return `${c.time} ${c.ampm}`;
};

// "YYYY-MM-DD" for today on the visitor's device, or null before the page has loaded.
export function useTodayKey() {
  return useTicker(readDateKey, 15000);
}

// Today's date. `fallback` only reserves space until the real date is known.
export function LiveDate({ fallback }) {
  const label = useTicker(readLongDate, 15000);
  return <span style={label ? undefined : { visibility: "hidden" }}>{label || fallback || "Today"}</span>;
}

export function LiveClock() {
  const value = useTicker(readClock, 1000);
  const [time, ampm] = value ? value.split(" ") : ["0:00:00", "AM"];
  let zone = "";
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch (err) {}

  return (
    <div
      className="live-clock"
      title={zone ? `Your time zone: ${zone}` : undefined}
      style={value ? undefined : { visibility: "hidden" }}
    >
      <i className="fa-solid fa-clock"></i>
      <span className="live-clock-time">{time}</span>
      <span className="live-clock-ampm">{ampm}</span>
    </div>
  );
}
