import { useState, useEffect, useCallback, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { getUserFromContext } from "../lib/auth";

export async function getServerSideProps(context) {
  const user = getUserFromContext(context);
  if (!user) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  return { props: { fullname: user.fullname } };
}

export default function Goals({ fullname }) {
  const [semesters, setSemesters] = useState([]);

  // Draft values bound to the form inputs - editing these does NOT affect
  // the cards/progress bar below until Save is actually clicked.
  const [targetCgpaInput, setTargetCgpaInput] = useState("");
  const [targetLabelInput, setTargetLabelInput] = useState("");

  // The last actually-saved target - this is what the cards/progress/table
  // are calculated from, so nothing changes until a save succeeds.
  const [savedTarget, setSavedTarget] = useState(null);
  const [savedLabel, setSavedLabel] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [semRes, goalRes] = await Promise.all([
      fetch("/api/cgpa/semesters"),
      fetch("/api/goals"),
    ]);
    const semData = await semRes.json();
    const goalData = await goalRes.json();

    setSemesters(semData.semesters || []);

    if (goalData.targetCgpa !== null && goalData.targetCgpa !== undefined) {
      setTargetCgpaInput(String(goalData.targetCgpa));
      setSavedTarget(goalData.targetCgpa);
    }
    setTargetLabelInput(goalData.targetLabel || "");
    setSavedLabel(goalData.targetLabel || "");
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const current = useMemo(() => {
    let totalCredits = 0;
    let totalPoints = 0;
    semesters.forEach((s) => {
      totalCredits += s.totalCredits || 0;
      totalPoints += (s.totalCredits || 0) * (s.gpa || 0);
    });
    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  }, [semesters]);

  const target = savedTarget || 0;
  const gap = target - current;
  const progressPct = target > 0 ? Math.min(100, (current / target) * 100) : 0;

  async function handleSave(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    const res = await fetch("/api/goals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetCgpa: targetCgpaInput,
        targetLabel: targetLabelInput,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to save goal.");
      return;
    }

    // Only now do the cards/progress bar actually update
    setSavedTarget(Number(targetCgpaInput));
    setSavedLabel(targetLabelInput);
    setMessage("Goal saved.");
  }

  return (
    <>
      <Sidebar />
      <div className="main">
        <Header fullname={fullname} />
        <div className="content">
          <h1>Goals</h1>
          <p className="subtitle">
            Set a target CGPA and track your progress against your actual results.
          </p>
          <br />

          {message && <div className="success-box">{message}</div>}
          {error && <div className="error-box">{error}</div>}

          <div className="cards">
            <div className="card">
              <i className="fa-solid fa-bullseye"></i>
              <h3>Target CGPA</h3>
              <p>{target > 0 ? target.toFixed(2) : "—"}</p>
              {target > 0 && savedLabel && (
                <p
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 400,
                    color: "var(--text-muted)",
                    marginTop: 4,
                  }}
                >
                  {savedLabel}
                </p>
              )}
            </div>
            <div className="card">
              <i className="fa-solid fa-chart-line"></i>
              <h3>Current CGPA</h3>
              <p>{current.toFixed(2)}</p>
            </div>
            <div className="card">
              <i className="fa-solid fa-arrow-trend-up"></i>
              <h3>Gap to Target</h3>
              <p style={{ color: gap > 0 ? "var(--warning)" : "var(--success)" }}>
                {target > 0 ? (gap > 0 ? `+${gap.toFixed(2)}` : "Reached") : "—"}
              </p>
            </div>
          </div>
          <br />

          {target > 0 && (
            <div className="chart-card">
              <h2>Progress Toward Target</h2>
              <div className="bar-row">
                <span className="bar-label">CGPA</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${progressPct}%`,
                      background: gap > 0 ? "#f59e0b" : "#10b981",
                    }}
                  ></div>
                </div>
                <span className="bar-value">{progressPct.toFixed(0)}%</span>
              </div>
            </div>
          )}
          <br />

          <div className="form-box" style={{ display: "block" }} data-tour="goals-form">
            <h2>Set Your Target</h2>
            {savedTarget > 0 && (
              <p className="subtitle" style={{ marginBottom: 12 }}>
                Currently saved: <strong>{savedTarget.toFixed(2)}</strong>
                {savedLabel ? ` — ${savedLabel}` : ""}
              </p>
            )}
            <form onSubmit={handleSave} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4"
                placeholder="Target CGPA (e.g. 3.50)"
                value={targetCgpaInput}
                onChange={(e) => setTargetCgpaInput(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Note (e.g. Dean's List, scholarship requirement)"
                value={targetLabelInput}
                onChange={(e) => setTargetLabelInput(e.target.value)}
                style={{ flex: 1, minWidth: 200 }}
              />
              <button type="submit">Save Target</button>
            </form>
          </div>
          <br />

          <div className="upcoming">
            <h2>Past Results</h2>
            <br />
            {!loading && semesters.length === 0 && (
              <p className="empty-state">
                No results yet — add semesters on the CGPA Calculator page first.
              </p>
            )}
            {semesters.length > 0 && (
              <div className="table-wrap">
                <table>
                  <tbody>
                    <tr>
                      <th>Semester</th>
                      <th>GPA</th>
                      <th>Credit Hours</th>
                      <th>vs Target</th>
                    </tr>
                    {semesters.map((s) => (
                      <tr key={s._id}>
                        <td data-label="Semester">{s.name}</td>
                        <td data-label="GPA">
                          <span className="badge low">{s.gpa.toFixed(2)}</span>
                        </td>
                        <td data-label="Credit Hours">{s.totalCredits}</td>
                        <td data-label="vs Target">
                          {target > 0 ? (
                            s.gpa >= target ? (
                              <span className="complete">On track</span>
                            ) : (
                              <span className="pending">Below target</span>
                            )
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
