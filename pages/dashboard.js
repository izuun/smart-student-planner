import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { getUserFromContext } from "../lib/auth";
import { getDb } from "../lib/mongodb";
import { useTour } from "../context/TourContext";
import { LiveDate, LiveClock, useTodayKey } from "../components/LiveClock";

function dateKeyToday() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

export async function getServerSideProps(context) {
  const user = getUserFromContext(context);
  if (!user) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const db = await getDb();

  const [allTasks, semesters, goal] = await Promise.all([
    db.collection("tasks").find({ user_id: user.id }).toArray(),
    db
      .collection("gpa_semesters")
      .find({ user_id: user.id })
      .sort({ order: 1, createdAt: 1 })
      .toArray(),
    db.collection("goals").findOne({ user_id: user.id }),
  ]);

  const pending = allTasks.filter((t) => t.status !== "Completed").length;
  const completed = allTasks.filter((t) => t.status === "Completed").length;

  let totalCredits = 0;
  let totalPoints = 0;
  semesters.forEach((s) => {
    totalCredits += s.totalCredits || 0;
    totalPoints += (s.totalCredits || 0) * (s.gpa || 0);
  });
  const cgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

  const todayKey = dateKeyToday();
  const upcoming = allTasks
    .filter((t) => t.status !== "Completed")
    .sort((a, b) => (a.due_date > b.due_date ? 1 : -1))
    .slice(0, 5)
    .map((t) => ({
      id: String(t._id),
      title: t.title,
      subject: t.subject,
      priority: t.priority,
      due_date: t.due_date,
      dueLabel: new Date(`${t.due_date}T00:00:00`).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      status:
        t.due_date < todayKey ? "overdue" : t.due_date === todayKey ? "today" : "upcoming",
    }));

  const targetCgpa = goal?.targetCgpa ?? 0;

  return {
    props: {
      fullname: user.fullname,
      total: allTasks.length,
      pending,
      completed,
      cgpa,
      semesterCount: semesters.length,
      upcoming,
      targetCgpa,
      todayLabel: new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    },
  };
}

export default function Dashboard({
  fullname,
  total,
  pending,
  completed,
  cgpa,
  semesterCount,
  upcoming,
  targetCgpa,
  todayLabel,
}) {
  const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;
  const goalGap = targetCgpa > 0 ? targetCgpa - cgpa : 0;
  const goalPct = targetCgpa > 0 ? Math.min(100, (cgpa / targetCgpa) * 100) : 0;
  const router = useRouter();
  const tour = useTour();
  // Today on the visitor's own device. The server-side status is only used until this is known.
  const todayKey = useTodayKey();
  const upcomingRows = upcoming.map((t) => ({
    ...t,
    status: todayKey
      ? t.due_date < todayKey
        ? "overdue"
        : t.due_date === todayKey
        ? "today"
        : "upcoming"
      : t.status,
  }));
  const [showGuidePrompt, setShowGuidePrompt] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("ssp_new_user") === "1") {
        setShowGuidePrompt(true);
      }
    } catch (err) {}
  }, []);

  function dismissGuidePrompt() {
    try {
      localStorage.removeItem("ssp_new_user");
    } catch (err) {}
    setShowGuidePrompt(false);
  }

  function goToGuide() {
    dismissGuidePrompt();
    tour.startTour();
  }

  return (
    <>
      <Sidebar />

      {showGuidePrompt && (
        <div className="modal-overlay" onClick={dismissGuidePrompt}>
          <div className="modal-box modal-sm" onClick={(e) => e.stopPropagation()}>
            <i
              className="fa-solid fa-graduation-cap"
              style={{ fontSize: "2rem", color: "var(--primary)", marginBottom: 12 }}
            ></i>
            <h2 style={{ marginTop: 0 }}>Welcome to Smart Planner!</h2>
            <p className="subtitle">
              New here? Take a quick hands-on tour that highlights exactly
              what to do on each page — or skip it and dive straight in.
            </p>
            <div className="modal-actions center">
              <button className="btn" onClick={dismissGuidePrompt}>
                Skip for now
              </button>
              <button className="btn save-btn" onClick={goToGuide}>
                <i className="fa-solid fa-wand-magic-sparkles"></i> Start Tour
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="main">
        <Header fullname={fullname} />
        <div className="content">
          <div className="dash-head">
            <div>
              <h1>Welcome back, {fullname}</h1>
              <p className="subtitle">
                <LiveDate fallback={todayLabel} /> — here's where things stand.
              </p>
            </div>
            <LiveClock />
          </div>
          <br />

          <div className="stats-grid" data-tour="dash-stats">
            <div className="stat-card">
              <h3>Total Tasks</h3>
              <p>{total}</p>
            </div>
            <div className="stat-card">
              <h3>Pending</h3>
              <p>{pending}</p>
            </div>
            <div className="stat-card">
              <h3>Completed</h3>
              <p>{completed}</p>
            </div>
            <div className="stat-card">
              <h3>Cumulative CGPA</h3>
              <p>{semesterCount > 0 ? cgpa.toFixed(2) : "—"}</p>
            </div>
          </div>
          <br />

          <div className="quick-actions" data-tour="dash-quick-actions">
            <Link href="/tasks" className="btn">
              <i className="fa-solid fa-plus"></i> Add Task
            </Link>
            <Link href="/cgpa" className="btn">
              <i className="fa-solid fa-calculator"></i> Add Semester
            </Link>
            <Link href="/calendar" className="btn">
              <i className="fa-solid fa-calendar"></i> View Calendar
            </Link>
            <Link href="/goals" className="btn">
              <i className="fa-solid fa-bullseye"></i> Set Goal
            </Link>
          </div>
          <br />

          <div className="dashboard-grid">
            <div className="upcoming" data-tour="dash-upcoming">
              <h2>
                <i className="fa-solid fa-list-check"></i> Upcoming Deadlines
              </h2>
              {upcoming.length === 0 && (
                <p className="empty-state">
                  Nothing due — add a task to get started.
                </p>
              )}
              {upcomingRows.map((t) => (
                <div className="dash-task-row" key={t.id}>
                  <div>
                    <strong>{t.title}</strong>
                    <div className="subtitle">
                      {t.subject} · <span className={`badge ${t.priority.toLowerCase()}`}>{t.priority}</span>
                    </div>
                  </div>
                  <span className={`dash-due ${t.status}`}>
                    {t.status === "overdue"
                      ? `Overdue · ${t.dueLabel}`
                      : t.status === "today"
                      ? "Due today"
                      : t.dueLabel}
                  </span>
                </div>
              ))}
              {upcoming.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Link href="/tasks" className="btn">
                    View All Tasks
                  </Link>
                </div>
              )}
            </div>

            <div className="chart-card">
              <h2>
                <i className="fa-solid fa-graduation-cap"></i> Academic Snapshot
              </h2>
              {semesterCount === 0 ? (
                <p className="empty-state">
                  No semesters recorded yet — head to the CGPA Calculator to
                  add your first one.
                </p>
              ) : targetCgpa > 0 ? (
                <>
                  <div className="bar-row">
                    <span className="bar-label">CGPA</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${goalPct}%`,
                          background: goalGap > 0 ? "#f59e0b" : "#10b981",
                        }}
                      ></div>
                    </div>
                    <span className="bar-value">{goalPct.toFixed(0)}%</span>
                  </div>
                  <p className="subtitle" style={{ marginTop: 10 }}>
                    Currently <strong>{cgpa.toFixed(2)}</strong>, targeting{" "}
                    <strong>{targetCgpa.toFixed(2)}</strong>
                    {goalGap > 0 ? ` — ${goalGap.toFixed(2)} to go.` : " — target reached!"}
                  </p>
                </>
              ) : (
                <p className="subtitle">
                  You have {semesterCount} semester{semesterCount > 1 ? "s" : ""}{" "}
                  recorded with a {cgpa.toFixed(2)} CGPA so far. Set a target
                  on the Goals page to track your progress.
                </p>
              )}
              <p className="subtitle" style={{ marginTop: 14 }}>
                Productivity this term: <strong>{productivity}%</strong> of
                tasks completed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
