import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { getUserFromContext } from "../lib/auth";
import { subscribeToPush, unsubscribeFromPush, getExistingSubscription } from "../lib/push-client";

export async function getServerSideProps(context) {
  const user = getUserFromContext(context);
  if (!user) return { redirect: { destination: "/login", permanent: false } };
  return { props: { fullname: user.fullname } };
}

export default function Settings({ fullname }) {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState("");
  const [notice, setNotice] = useState({ enabled: true, frequency: "daily", time: "08:00", advanceMinutes: 60, timezone: "" });
  const [noticeSaved, setNoticeSaved] = useState(false);
  const [form, setForm] = useState({ current_password:"", new_password:"", confirm_password:"" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
    document.body.classList.toggle("dark", saved);
    document.documentElement.classList.toggle("dark-preload", saved);
    getExistingSubscription().then(sub => { if (sub) setNotifications(true); });
    fetch("/api/notifications/settings").then(r => r.json()).then(data => {
      if (data.settings) setNotice(data.settings);
    }).catch(() => {});
    if (typeof Intl !== "undefined") {
      setNotice(n => ({ ...n, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "" }));
    }
  }, []);

  async function toggleNotifications() {
    setPushError(""); setPushBusy(true);
    try {
      if (notifications) { await unsubscribeFromPush(); setNotifications(false); }
      else { await subscribeToPush(); setNotifications(true); }
    } catch (err) { setPushError(err.message || "Something went wrong."); }
    finally { setPushBusy(false); }
  }

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    document.body.classList.toggle("dark", next);
    document.documentElement.classList.toggle("dark-preload", next);
    localStorage.setItem("darkMode", String(next));
  }

  async function saveNotificationSchedule(e) {
    e.preventDefault(); setPushError(""); setNoticeSaved(false);
    const res = await fetch("/api/notifications/settings", {
      method:"PUT", headers:{"Content-Type":"application/json"},
      body:JSON.stringify(notice),
    });
    const data = await res.json();
    if (!res.ok) return setPushError(data.error || "Could not save notification schedule.");
    setNotice(data.settings); setNoticeSaved(true);
  }

  async function handleSave(e) {
    e.preventDefault(); setMessage(""); setError("");
    const res = await fetch("/api/password", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Failed to update password.");
    setMessage("Password updated successfully.");
    setForm({current_password:"",new_password:"",confirm_password:""});
  }

  return (
    <>
      <Sidebar />
      <div className="main">
        <Header fullname={fullname} />
        <div className="content">
          <h1>Settings</h1>
          <p className="subtitle">Control appearance, reminders and account security.</p><br />
          {message && <div className="success-box">{message}</div>}
          {error && <div className="error-box">{error}</div>}

          <div className="settings-grid">
            <div className="setting-card">
              <h2><i className="fa-solid fa-moon"></i> Appearance</h2>
              <label className="switch"><input type="checkbox" checked={darkMode} onChange={toggleDark}/><span className="slider"></span></label>
              <p>{darkMode ? "Dark mode is enabled." : "Use a brighter interface."}</p>
            </div>

            <div className="setting-card" data-tour="settings-notifications">
              <h2><i className="fa-solid fa-bell"></i> Push Notifications</h2>
              <label className="switch"><input type="checkbox" checked={notifications} disabled={pushBusy} onChange={toggleNotifications}/><span className="slider"></span></label>
              <p>{notifications ? "Push reminders are enabled on this device." : "Enable reminders for upcoming tasks."}</p>
              {pushError && <p style={{color:"var(--danger)",fontSize:".8rem"}}>{pushError}</p>}
            </div>
          </div>

          <br />
          <div className="setting-card">
            <h2><i className="fa-solid fa-clock"></i> Reminder Schedule</h2>
            <p>Choose how often and when you want your task reminders.</p>
            <form className="notification-options" onSubmit={saveNotificationSchedule}>
              <div className="notification-row">
                <label><strong>Frequency</strong></label>
                <select className="notification-time" value={notice.frequency} onChange={e=>setNotice({...notice,frequency:e.target.value})}>
                  <option value="daily">Every day</option>
                  <option value="hourly">Every hour</option>
                </select>
              </div>
              <div className="notification-row">
                <label><strong>Push time</strong></label>
                <input className="notification-time" type="time" value={notice.time} onChange={e=>setNotice({...notice,time:e.target.value})}/>
              </div>
              <p className="subtitle timezone-note">Time zone: {notice.timezone || "device local time"}</p>
              <p className="subtitle" style={{ marginTop: "4px", marginBottom: "12px" }}>
                {notice.frequency === "hourly"
                  ? `With "Every hour" selected, reminders fire every hour at the :${String(notice.time?.split(":")[1] || "00").padStart(2,"0")} mark (the hour above is ignored).`
                  : `With "Every day" selected, you'll get one reminder daily at exactly ${notice.time || "the time above"}.`}
              </p>
              <div className="notification-row">
                <label><strong>Remind me</strong></label>
                <select className="notification-time" value={notice.advanceMinutes} onChange={e=>setNotice({...notice,advanceMinutes:Number(e.target.value)})}>
                  <option value={15}>15 minutes before</option><option value={30}>30 minutes before</option>
                  <option value={60}>1 hour before</option><option value={120}>2 hours before</option>
                  <option value={1440}>1 day before</option>
                </select>
              </div>
              <div className="notification-row">
                <button type="submit"><i className="fa-solid fa-clock"></i> Save Reminder Settings</button>
                {noticeSaved && <span className="complete">Saved ✓</span>}
              </div>
            </form>
          </div>

          <br />
          <div className="password-card">
            <h2><i className="fa-solid fa-lock"></i> Change Password</h2>
            <form onSubmit={handleSave}>
              <input type="password" placeholder="Current Password" value={form.current_password} onChange={e=>setForm({...form,current_password:e.target.value})} required/>
              <input type="password" placeholder="New Password" value={form.new_password} onChange={e=>setForm({...form,new_password:e.target.value})} required/>
              <input type="password" placeholder="Confirm Password" value={form.confirm_password} onChange={e=>setForm({...form,confirm_password:e.target.value})} required/>
              <button type="submit">Save Changes</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
