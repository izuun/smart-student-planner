import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { getUserFromContext } from "../lib/auth";
import { getDb } from "../lib/mongodb";

export async function getServerSideProps(context) {
  const user = getUserFromContext(context);
  if (!user) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const db = await getDb();
  const tasks = await db
    .collection("tasks")
    .find({ user_id: user.id })
    .toArray();

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "Completed").length;
  const pending = total - completed;
  const high = tasks.filter((t) => t.priority === "High").length;
  const medium = tasks.filter((t) => t.priority === "Medium").length;
  const low = tasks.filter((t) => t.priority === "Low").length;
  const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    props: {
      fullname: user.fullname,
      total,
      completed,
      pending,
      high,
      medium,
      low,
      productivity,
    },
  };
}

export default function Statistics({
  fullname,
  total,
  completed,
  pending,
  high,
  medium,
  low,
  productivity,
}) {
  const completedPct = total > 0 ? (completed / total) * 100 : 0;
  const maxPriority = Math.max(high, medium, low, 1);

  return (
    <>
      <Sidebar />
      <div className="main">
        <Header fullname={fullname} />
        <div className="content">
          <h1>Statistics Dashboard</h1>
          <br />

          <div className="cards" data-tour="stats-cards">
            <div className="card">
              <i className="fa-solid fa-list"></i>
              <h3>Total Tasks</h3>
              <p>{total}</p>
            </div>
            <div className="card">
              <i className="fa-solid fa-check"></i>
              <h3>Completed</h3>
              <p>{completed}</p>
            </div>
            <div className="card">
              <i className="fa-solid fa-clock"></i>
              <h3>Pending</h3>
              <p>{pending}</p>
            </div>
            <div className="card">
              <i className="fa-solid fa-chart-line"></i>
              <h3>Productivity</h3>
              <p>{productivity}%</p>
            </div>
          </div>
          <br />

          <div className="stats-grid">
            <div className="chart-card">
              <h2>Task Completion</h2>
              <div className="donut-wrap">
                <div
                  className="donut"
                  style={{
                    background: `conic-gradient(#10b981 0% ${completedPct}%, #f59e0b ${completedPct}% 100%)`,
                  }}
                >
                  <div className="donut-center">
                    <strong>{productivity}%</strong>
                    <span>done</span>
                  </div>
                </div>
                <div className="legend">
                  <div className="legend-item">
                    <span
                      className="legend-dot"
                      style={{ background: "#10b981" }}
                    ></span>
                    Completed ({completed})
                  </div>
                  <div className="legend-item">
                    <span
                      className="legend-dot"
                      style={{ background: "#f59e0b" }}
                    ></span>
                    Pending ({pending})
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <h2>Priority Distribution</h2>
              <div className="bar-row">
                <span className="bar-label">High</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(high / maxPriority) * 100}%`,
                      background: "#ef4444",
                    }}
                  ></div>
                </div>
                <span className="bar-value">{high}</span>
              </div>
              <div className="bar-row">
                <span className="bar-label">Medium</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(medium / maxPriority) * 100}%`,
                      background: "#f59e0b",
                    }}
                  ></div>
                </div>
                <span className="bar-value">{medium}</span>
              </div>
              <div className="bar-row">
                <span className="bar-label">Low</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(low / maxPriority) * 100}%`,
                      background: "#10b981",
                    }}
                  ></div>
                </div>
                <span className="bar-value">{low}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
