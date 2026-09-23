import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { getUserFromContext } from "../lib/auth";
import { useTour } from "../context/TourContext";

export async function getServerSideProps(context) {
  const user = getUserFromContext(context);
  if (!user) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  return { props: { fullname: user.fullname } };
}

export default function Tasks({ fullname }) {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    title: "",
    subject: "",
    priority: "High",
    due_date: "",
  });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const tour = useTour();

  const loadTasks = useCallback(async (q = "") => {
    const res = await fetch(`/api/tasks${q ? `?search=${encodeURIComponent(q)}` : ""}`);
    const data = await res.json();
    setTasks(data.tasks || []);
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function handleAdd(e) {
    e.preventDefault();
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", subject: "", priority: "High", due_date: "" });
    loadTasks(search);
    // Unlocks the guided tour's "Add a Task" step (does nothing outside the tour).
    if (res.ok && tour) tour.markDone("task-added");
  }

  async function handleComplete(id) {
    await fetch(`/api/tasks/${id}`, { method: "PATCH" });
    loadTasks(search);
  }

  function askDelete(task) {
    setConfirmDelete(task);
  }

  async function confirmDeleteTask() {
    if (!confirmDelete) return;
    await fetch(`/api/tasks/${confirmDelete._id}`, { method: "DELETE" });
    setConfirmDelete(null);
    loadTasks(search);
  }

  function handleSearch(e) {
    e.preventDefault();
    loadTasks(search);
  }

  return (
    <>
      <Sidebar />
      <div className="main">
        <Header fullname={fullname} />
        <div className="content">
          <h1>Task Management</h1>
          <p className="subtitle">Create, search and organise your academic tasks.</p>
          <br />

          <div className="task-header">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search task..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="btn"><i className="fa-solid fa-magnifying-glass"></i> Search</button>
            </form>
          </div>
          <br />

          <div className="form-box" data-tour="tasks-add-form">
            <h2>Add New Task</h2>
            <form onSubmit={handleAdd}>
              <input
                type="text"
                placeholder="Task Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
              />
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
              <div className="date-field">
                <label htmlFor="due-date-input">Due Date</label>
                <input
                  id="due-date-input"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  required
                />
              </div>
              <button type="submit"><i className="fa-solid fa-plus"></i> Add Task</button>
            </form>
          </div>
          <br />

          <div className="table-wrap" data-tour="tasks-table">
          <table>
            <tbody>
              <tr>
                <th>Task</th>
                <th>Subject</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>

              {tasks.map((task) => (
                <tr key={task._id}>
                  <td data-label="Task">{task.title}</td>
                  <td data-label="Subject">{task.subject}</td>
                  <td data-label="Priority">
                    <span
                      className={`badge ${task.priority.toLowerCase()}`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td data-label="Due Date">{task.due_date}</td>
                  <td data-label="Status">
                    {task.status === "Completed" ? (
                      <span className="complete">Completed</span>
                    ) : (
                      <span className="pending">Pending</span>
                    )}
                  </td>
                  <td>
                    <div className="action-btns">
                      {task.status !== "Completed" && (
                        <button
                          className="btn complete-btn"
                          onClick={() => handleComplete(task._id)}
                        >
                          <i className="fa-solid fa-check"></i>
                        </button>
                      )}
                      <button
                        className="btn delete-btn"
                        onClick={() => askDelete(task)}
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box modal-sm" onClick={(e) => e.stopPropagation()}>
            <i
              className="fa-solid fa-triangle-exclamation"
              style={{ fontSize: "2rem", color: "#dc2626", marginBottom: 12 }}
            ></i>
            <h2 style={{ marginTop: 0 }}>Delete "{confirmDelete.title}"?</h2>
            <p className="subtitle">This task will be permanently removed. This can't be undone.</p>
            <div className="modal-actions center">
              <button className="btn" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button className="btn delete-btn" onClick={confirmDeleteTask}>
                <i className="fa-solid fa-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
