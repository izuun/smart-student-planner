import { useEffect, useState } from "react";

export default function Header({ fullname }) {
  const [profile, setProfile] = useState({ username: fullname || "", avatar: "" });

  useEffect(() => {
    let active = true;
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        setProfile({
          username: data.username || data.fullname || fullname || "",
          avatar: data.avatar || "",
        });
      })
      .catch(() => {});
    return () => { active = false; };
  }, [fullname]);

  useEffect(() => {
    const onProfileUpdated = (event) => {
      const detail = event.detail || {};
      setProfile((current) => ({
        username: detail.username || detail.fullname || current.username,
        avatar: detail.avatar !== undefined ? detail.avatar : current.avatar,
      }));
    };
    window.addEventListener("profileUpdated", onProfileUpdated);
    return () => window.removeEventListener("profileUpdated", onProfileUpdated);
  }, []);

  return (
    <div className="topbar">
      <div className="left">
        <h2>Smart Student Planner</h2>
      </div>

      <div className="right">
        <div className="profile" title={profile.username || "Profile"}>
          <span className="header-avatar">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Profile avatar" />
            ) : (
              <i className="fa-solid fa-circle-user"></i>
            )}
          </span>
          <span className="header-username">{profile.username || "User"}</span>
        </div>
      </div>
    </div>
  );
}
