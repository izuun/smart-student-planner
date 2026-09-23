import { useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { getUserFromContext } from "../lib/auth";
import { ObjectId } from "mongodb";
import { getDb } from "../lib/mongodb";

export async function getServerSideProps(context) {
  const user = getUserFromContext(context);
  if (!user) return { redirect: { destination: "/login", permanent: false } };

  const db = await getDb();
  const dbUser = await db.collection("users").findOne(
    { _id: new ObjectId(user.id) },
    { projection: { username: 1, fullname: 1, email: 1, avatar: 1 } }
  );

  if (!dbUser) return { redirect: { destination: "/login", permanent: false } };

  return {
    props: {
      initialUsername: dbUser.username || dbUser.fullname || "",
      initialEmail: dbUser.email || "",
      initialAvatar: dbUser.avatar || "",
    },
  };
}

export default function Profile({ initialUsername, initialEmail, initialAvatar }) {
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  async function handleAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setMessage("");

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Please choose an image smaller than 15 MB.");
      return;
    }

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = dataUrl;
      });

      const maxSize = 400;
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      let compressed = canvas.toDataURL("image/jpeg", 0.72);
      if (compressed.length > 450000) compressed = canvas.toDataURL("image/jpeg", 0.55);
      if (compressed.length > 650000) {
        setError("That image could not be compressed enough. Please choose another photo.");
        return;
      }

      setAvatar(compressed);
    } catch {
      setError("Could not process that image. Please try another photo.");
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername || !cleanEmail) {
      setError("Username and email are required.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername, email: cleanEmail, avatar }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Update failed. Please try again.");
        setSaving(false);
        return;
      }

      const saved = data.user || {};
      setUsername(saved.username || cleanUsername);
      setEmail(saved.email || cleanEmail);
      setAvatar(saved.avatar || "");
      setMessage("Profile updated successfully!");

      window.dispatchEvent(new CustomEvent("profileUpdated", {
        detail: {
          username: saved.username || cleanUsername,
          avatar: saved.avatar || "",
        },
      }));
    } catch {
      setError("Unable to save your profile. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Sidebar />
      <div className="main">
        <Header fullname={username} />
        <div className="content">
          <h1>My Profile</h1>
          <p className="subtitle">Personalise your planner profile.</p><br />
          {message && <div className="success-box">{message}</div>}
          {error && <div className="error-box">{error}</div>}

          <div className="profile-container">
            <div className="profile-card" data-tour="profile-card">
              <div className="avatar">
                {avatar ? <img src={avatar} alt="Profile avatar" /> : <i className="fa-solid fa-user"></i>}
              </div>
              <h2>{username || "Your Username"}</h2>
              <p>{email}</p>
              <div className="avatar-actions">
                <button type="button" onClick={() => fileRef.current?.click()} disabled={saving}>
                  <i className="fa-solid fa-image"></i> Change Avatar
                </button>
                {avatar && (
                  <button type="button" className="delete-btn" onClick={() => setAvatar("")} disabled={saving}>
                    Remove
                  </button>
                )}
              </div>
              <input ref={fileRef} className="file-input" type="file" accept="image/*" onChange={handleAvatar} />
            </div>

            <div className="edit-profile">
              <h2>Edit Profile</h2>
              <form onSubmit={handleUpdate}>
                <label>Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                <label>Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <button className="save-profile-btn" type="submit" disabled={saving}>
                  <i className="fa-solid fa-floppy-disk"></i> {saving ? "Saving..." : "Save Profile"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
