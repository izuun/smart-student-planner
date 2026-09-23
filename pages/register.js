import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { getUserFromContext } from "../lib/auth";

export async function getServerSideProps(context) {
  const user = getUserFromContext(context);
  if (user) {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }
  return { props: {} };
}

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Registration failed.");
      return;
    }

    setSuccess("Registration successful! Redirecting to login...");
    try {
      localStorage.setItem("ssp_new_user", "1");
    } catch (err) {}
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Create Account</h1>
        <p>Join Smart Student Planner</p>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-box">
            <i className="fa-solid fa-user"></i>
            <input
              type="text"
              placeholder="Username"
              value={form.fullname}
              onChange={update("fullname")}
              required
            />
          </div>

          <div className="input-box">
            <i className="fa-solid fa-envelope"></i>
            <input
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={update("email")}
              required
            />
          </div>

          <div className="input-box">
            <i className="fa-solid fa-lock"></i>
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={update("password")}
              required
            />
          </div>

          <div className="input-box">
            <i className="fa-solid fa-lock"></i>
            <input
              type="password"
              placeholder="Confirm Password"
              value={form.confirm_password}
              onChange={update("confirm_password")}
              required
            />
          </div>

          <button type="submit">Create Account</button>
        </form>

        <p className="register">
          Already have an account? <Link href="/login">Login Here</Link>
        </p>
      </div>
    </div>
  );
}
