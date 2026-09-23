import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { getUserFromContext } from "../lib/auth";
import { GRADING_SYSTEMS, getGradeOptions } from "../lib/grading";

export async function getServerSideProps(context) {
  const user = getUserFromContext(context);
  if (!user) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  return { props: { fullname: user.fullname } };
}

const emptySubject = () => ({ name: "", credit: "", grade: "" });

export default function CgpaCalculator({ fullname }) {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [gradingSystem, setGradingSystem] = useState("politeknik");
  const [customPoints, setCustomPoints] = useState({});
  const [semesterName, setSemesterName] = useState("");
  const [subjects, setSubjects] = useState([emptySubject()]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const formRef = useRef(null);

  const gradeOptions = useMemo(
    () =>
      gradingSystem === "custom"
        ? Object.keys(customPoints)
        : getGradeOptions(gradingSystem),
    [gradingSystem, customPoints]
  );

  const loadSemesters = useCallback(async () => {
    const res = await fetch("/api/cgpa/semesters");
    const data = await res.json();
    setSemesters(data.semesters || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSemesters();
  }, [loadSemesters]);

  // Cumulative CGPA across every saved semester
  const cumulative = useMemo(() => {
    let totalCredits = 0;
    let totalPoints = 0;
    semesters.forEach((s) => {
      totalCredits += s.totalCredits || 0;
      totalPoints += (s.totalCredits || 0) * (s.gpa || 0);
    });
    return {
      cgpa: totalCredits > 0 ? totalPoints / totalCredits : 0,
      totalCredits,
    };
  }, [semesters]);

  function updateSubject(index, field, value) {
    const next = [...subjects];
    next[index] = { ...next[index], [field]: value };
    setSubjects(next);
  }

  function addSubjectRow() {
    setSubjects([...subjects, emptySubject()]);
  }

  function removeSubjectRow(index) {
    setSubjects(subjects.filter((_, i) => i !== index));
  }

  function updateCustomPoint(grade, value) {
    setCustomPoints({ ...customPoints, [grade]: Number(value) });
  }

  function addCustomGrade() {
    const grade = prompt("Enter a new grade label (e.g. A+, B2):");
    if (!grade) return;
    setCustomPoints({ ...customPoints, [grade]: 0 });
  }

  function resetForm() {
    setEditingId(null);
    setSemesterName("");
    setSubjects([emptySubject()]);
    setGradingSystem("politeknik");
    setCustomPoints({});
    setError("");
  }

  async function handleSaveSemester(e) {
    e.preventDefault();
    setError("");

    const validSubjects = subjects.filter((s) => s.name && s.credit && s.grade);
    if (!semesterName || validSubjects.length === 0) {
      setError("Give the semester a name and at least one complete subject row.");
      return;
    }

    const url = editingId ? `/api/cgpa/${editingId}` : "/api/cgpa/semesters";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: semesterName,
        gradingSystem,
        customPoints,
        subjects: validSubjects,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to save semester.");
      return;
    }

    resetForm();
    loadSemesters();
  }

  function handleEditClick(s) {
    setError("");
    setEditingId(s._id);
    setSemesterName(s.name);
    setGradingSystem(s.gradingSystem || "politeknik");
    setCustomPoints(s.gradingSystem === "custom" ? s.customPoints || {} : {});
    setSubjects(
      s.subjects.map((sub) => ({
        name: sub.name,
        credit: String(sub.credit),
        grade: sub.grade,
      }))
    );
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function askDelete(s) {
    setConfirmDelete({ id: s._id, name: s.name });
  }

  async function confirmDeleteSemester() {
    if (!confirmDelete) return;
    await fetch(`/api/cgpa/${confirmDelete.id}`, { method: "DELETE" });
    if (editingId === confirmDelete.id) resetForm();
    setConfirmDelete(null);
    loadSemesters();
  }

  return (
    <>
      <Sidebar />
      <div className="main">
        <Header fullname={fullname} />
        <div className="content">
          <h1>CGPA Calculator</h1>
          <p className="subtitle">
            Track each semester's GPA and see your cumulative CGPA update automatically.
          </p>
          <br />

          <div className="cards">
            <div className="card">
              <i className="fa-solid fa-graduation-cap"></i>
              <h3>Cumulative CGPA</h3>
              <p>{cumulative.cgpa.toFixed(2)}</p>
            </div>
            <div className="card">
              <i className="fa-solid fa-layer-group"></i>
              <h3>Semesters Recorded</h3>
              <p>{semesters.length}</p>
            </div>
            <div className="card">
              <i className="fa-solid fa-book"></i>
              <h3>Total Credit Hours</h3>
              <p>{cumulative.totalCredits}</p>
            </div>
          </div>
          <br />

          <div className="form-box" id="cgpa-semester-form" style={{ display: "block" }} ref={formRef}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ margin: 0 }}>
                {editingId ? `Edit Semester — ${semesterName || ""}` : "Add a Semester"}
              </h2>
              {editingId && (
                <button type="button" className="btn" onClick={resetForm}>
                  <i className="fa-solid fa-xmark"></i> Cancel Edit
                </button>
              )}
            </div>

            {error && <div className="error-box">{error}</div>}

            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>
              Grading System
            </label>
            <select
              value={gradingSystem}
              onChange={(e) => setGradingSystem(e.target.value)}
              style={{ marginBottom: 14 }}
              data-tour="cgpa-grading-system"
            >
              {Object.entries(GRADING_SYSTEMS).map(([key, sys]) => (
                <option key={key} value={key}>
                  {sys.label}
                </option>
              ))}
              <option value="custom">Custom (my institution differs)</option>
            </select>

            {gradingSystem === "custom" && (
              <div style={{ marginBottom: 16 }}>
                <p className="subtitle" style={{ marginBottom: 8 }}>
                  Set your own grade points (check your institution's official scale):
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {Object.entries(customPoints).map(([grade, point]) => (
                    <div key={grade} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{grade}</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="4"
                        value={point}
                        onChange={(e) => updateCustomPoint(grade, e.target.value)}
                        style={{ width: 70 }}
                      />
                    </div>
                  ))}
                  <button type="button" onClick={addCustomGrade}>
                    + Add Grade
                  </button>
                </div>
              </div>
            )}

            <input
              type="text"
              placeholder="Semester name (e.g. Semester 3)"
              value={semesterName}
              onChange={(e) => setSemesterName(e.target.value)}
              style={{ width: "100%", marginBottom: 14 }}
            />

            <div className="subject-row-labels">
              <span style={{ flex: 2, minWidth: 140 }}>Subject</span>
              <span style={{ flex: 1, minWidth: 90 }}>Credit Hrs</span>
              <span style={{ flex: 1, minWidth: 90 }}>Grade</span>
            </div>

            <div data-tour="cgpa-subjects">
            {subjects.map((s, i) => (
              <div
                key={i}
                className="subject-row"
                style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}
              >
                <input
                  type="text"
                  placeholder="Subject name"
                  value={s.name}
                  onChange={(e) => updateSubject(i, "name", e.target.value)}
                  style={{ flex: 2, minWidth: 140 }}
                />
                <input
                  type="number"
                  placeholder="Credit hrs"
                  min="0"
                  value={s.credit}
                  onChange={(e) => updateSubject(i, "credit", e.target.value)}
                  style={{ flex: 1, minWidth: 90 }}
                />
                <select
                  value={s.grade}
                  onChange={(e) => updateSubject(i, "grade", e.target.value)}
                  style={{ flex: 1, minWidth: 90 }}
                >
                  <option value="">Grade</option>
                  {gradeOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                {subjects.length > 1 && (
                  <button
                    type="button"
                    className="delete-btn subject-row-delete-btn"
                    onClick={() => removeSubjectRow(i)}
                  >
                    <i className="fa-solid fa-trash"></i> <span className="subject-row-delete-label">Remove</span>
                  </button>
                )}
              </div>
            ))}
            </div>

            <div className="subject-actions">
              <button type="button" className="btn-add" onClick={addSubjectRow}>
                + Add Subject
              </button>
              <button type="button" className="save-btn" onClick={handleSaveSemester} data-tour="cgpa-save">
                {editingId ? "Update Semester" : "Save Semester"}
              </button>
            </div>
          </div>
          <br />

          <div className="upcoming">
            <h2>Semester History</h2>
            <br />
            {!loading && semesters.length === 0 && (
              <p className="empty-state">No semesters recorded yet.</p>
            )}
            {semesters.length > 0 && (
              <div className="table-wrap">
                <table>
                  <tbody>
                    <tr>
                      <th>Semester</th>
                      <th>Credit Hours</th>
                      <th>GPA</th>
                      <th>Subjects</th>
                      <th>Action</th>
                    </tr>
                    {semesters.map((s) => (
                      <tr key={s._id}>
                        <td data-label="Semester">{s.name}</td>
                        <td data-label="Credit Hours">{s.totalCredits}</td>
                        <td data-label="GPA">
                          <span className="badge low">{s.gpa.toFixed(2)}</span>
                        </td>
                        <td data-label="Subjects">{s.subjects.map((sub) => sub.name).join(", ")}</td>
                        <td>
                          <div className="action-btns">
                            <button
                              className="btn"
                              onClick={() => setSelectedSemester(s)}
                            >
                              <i className="fa-solid fa-eye"></i> View
                            </button>
                            <button
                              className="btn edit-btn"
                              onClick={() => handleEditClick(s)}
                            >
                              <i className="fa-solid fa-pen"></i> Edit
                            </button>
                            <button
                              className="btn delete-btn"
                              onClick={() => askDelete(s)}
                            >
                              <i className="fa-solid fa-trash"></i> Delete
                            </button>
                          </div>
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

      {selectedSemester && (
        <div className="modal-overlay" onClick={() => setSelectedSemester(null)}>
          <div
            className="modal-box modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{selectedSemester.name}</h2>
              <button
                className="btn modal-close"
                onClick={() => setSelectedSemester(null)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="cards" style={{ marginBottom: 18 }}>
              <div className="stat-card">
                <h3>GPA</h3>
                <p>{selectedSemester.gpa.toFixed(2)}</p>
              </div>
              <div className="stat-card">
                <h3>Credit Hours</h3>
                <p>{selectedSemester.totalCredits}</p>
              </div>
              <div className="stat-card">
                <h3>Subjects</h3>
                <p>{selectedSemester.subjects.length}</p>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <tbody>
                  <tr>
                    <th>Subject</th>
                    <th>Credit</th>
                    <th>Grade</th>
                    <th>Points</th>
                  </tr>
                  {selectedSemester.subjects.map((sub, i) => (
                    <tr key={i}>
                      <td data-label="Subject">{sub.name}</td>
                      <td data-label="Credit">{sub.credit}</td>
                      <td data-label="Grade">
                        <span className="badge low">{sub.grade}</span>
                      </td>
                      <td data-label="Points">{sub.point.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="subtitle" style={{ marginTop: 14 }}>
              Grading system:{" "}
              {selectedSemester.gradingSystem === "custom"
                ? "Custom"
                : GRADING_SYSTEMS[selectedSemester.gradingSystem]?.label ||
                  selectedSemester.gradingSystem}
            </p>

            <div className="modal-actions">
              <button
                className="btn"
                onClick={() => {
                  const s = selectedSemester;
                  setSelectedSemester(null);
                  handleEditClick(s);
                }}
              >
                <i className="fa-solid fa-pen"></i> Edit This Semester
              </button>
              <button className="btn" onClick={() => setSelectedSemester(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box modal-sm" onClick={(e) => e.stopPropagation()}>
            <i
              className="fa-solid fa-triangle-exclamation"
              style={{ fontSize: "2rem", color: "#dc2626", marginBottom: 12 }}
            ></i>
            <h2 style={{ marginTop: 0 }}>Delete "{confirmDelete.name}"?</h2>
            <p className="subtitle">
              This will permanently remove this semester and recalculate your
              CGPA. This can't be undone.
            </p>
            <div className="modal-actions center">
              <button className="btn" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button className="btn delete-btn" onClick={confirmDeleteSemester}>
                <i className="fa-solid fa-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
