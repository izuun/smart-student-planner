import { useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { getUserFromContext } from "../lib/auth";
import { getDb } from "../lib/mongodb";

export async function getServerSideProps(context) {
  const user = getUserFromContext(context);
  if (!user) return { redirect: { destination: "/login", permanent: false } };
  const tasks = await getDb().then(db => db.collection("tasks").find({ user_id: user.id }).sort({ due_date: 1 }).toArray());
  return { props: { fullname: user.fullname, tasks: JSON.parse(JSON.stringify(tasks)) } };
}

function pad(n) { return String(n).padStart(2, "0"); }

export default function CalendarPage({ fullname, tasks }) {
  const now = new Date();
  const [cursor, setCursor] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selected, setSelected] = useState(null);
  const year = cursor.getFullYear();
  const monthIndex = cursor.getMonth();
  const month = cursor.toLocaleString("en-US", { month: "long" });

  const days = useMemo(() => {
    const first = new Date(year, monthIndex, 1).getDay();
    const total = new Date(year, monthIndex + 1, 0).getDate();
    const cells = Array(first).fill(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [year, monthIndex]);

  const taskMap = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      const key = t.due_date;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  const pendingTasks = useMemo(() => tasks.filter(t => t.status !== "Completed"), [tasks]);

  const dateKey = d => `${year}-${pad(monthIndex + 1)}-${pad(d)}`;
  const selectedTasks = selected ? (taskMap[selected] || []) : [];
  const goMonth = delta => { setCursor(new Date(year, monthIndex + delta, 1)); setSelected(null); };
  const todayKey = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;

  return (
    <>
      <Sidebar />
      <div className="main">
        <Header fullname={fullname} />
        <div className="content">
          <h1>Academic Calendar</h1>
          <p className="subtitle">Plan deadlines, assignments and study days at a glance.</p><br />

          <div className="calendar-card" data-tour="calendar-grid">
            <div className="calendar-header">
              <div>
                <h2>{month} {year}</h2>
                <p className="subtitle">{Object.keys(taskMap).filter(k => k.startsWith(`${year}-${pad(monthIndex+1)}`)).length} active date(s)</p>
              </div>
              <div className="calendar-nav">
                <button aria-label="Previous month" onClick={() => goMonth(-1)}><i className="fa-solid fa-chevron-left"></i></button>
                <button aria-label="Next month" onClick={() => goMonth(1)}><i className="fa-solid fa-chevron-right"></i></button>
              </div>
            </div>
            <table className="calendar">
              <thead><tr>{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <th key={d}>{d}</th>)}</tr></thead>
              <tbody>
                {Array.from({ length: days.length / 7 }, (_, wi) => (
                  <tr key={wi}>{days.slice(wi*7, wi*7+7).map((day, di) => {
                    const key = day ? dateKey(day) : "";
                    const dayTasks = key ? (taskMap[key] || []) : [];
                    const isToday = key === todayKey;
                    const isSelected = key === selected;
                    return (
                      <td key={di}
                        className={`${!day ? "empty-day" : ""} ${isToday ? "today" : ""} ${dayTasks.length ? "has-task" : ""} ${isSelected ? "selected-day" : ""}`}
                        onClick={() => day && setSelected(key)}>
                        {day || ""}
                        {dayTasks.length > 0 && <span className="calendar-task-count">{dayTasks.length} task{dayTasks.length > 1 ? "s" : ""}</span>}
                      </td>
                    );
                  })}</tr>
                ))}
              </tbody>
            </table>

            {selected && (
              <div className="day-details">
                <h2><i className="fa-solid fa-calendar-day"></i> {new Date(`${selected}T00:00:00`).toLocaleDateString("en-GB", {day:"numeric", month:"long", year:"numeric"})}</h2>
                {selectedTasks.length ? selectedTasks.map(t => (
                  <div className="day-task" key={t._id}>
                    <div><strong>{t.title}</strong><div className="subtitle">{t.subject} · {t.priority}</div></div>
                    <span className={t.status === "Completed" ? "complete" : "pending"}>{t.status}</span>
                  </div>
                )) : <p className="subtitle">No tasks scheduled for this day.</p>}
              </div>
            )}
          </div>

          <br />
          <div className="upcoming" data-tour="calendar-upcoming">
            <h2><i className="fa-solid fa-calendar-check"></i> Upcoming Deadlines</h2>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Task</th><th>Subject</th><th>Due Date</th><th>Priority</th><th>Status</th></tr></thead>
                <tbody>
                  {pendingTasks.length === 0 && <tr><td colSpan={5} className="empty-state">No pending tasks. You're all caught up!</td></tr>}
                  {pendingTasks.map(t => <tr key={t._id}>
                    <td data-label="Task">{t.title}</td><td data-label="Subject">{t.subject}</td>
                    <td data-label="Due Date">{new Date(`${t.due_date}T00:00:00`).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}</td>
                    <td data-label="Priority"><span className={`badge ${String(t.priority).toLowerCase()}`}>{t.priority}</span></td>
                    <td data-label="Status"><span className={t.status === "Completed" ? "complete" : "pending"}>{t.status}</span></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
