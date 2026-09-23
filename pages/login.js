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

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Login failed.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="login-container">
      <div className="login-box">
  <img
    src="/poli_01.png"
    alt="Smart Student Planner Logo"
    className="login-logo"
  />
        <h1>Smart Student Planner</h1>
        <p>by Izzwan 16DTK24F1024</p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-box">
            <i className="fa-solid fa-envelope"></i>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-box">
            <i className="fa-solid fa-lock"></i>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit">Login</button>
        </form>

        <p className="register">
          <Link href="/forgot-password">Forgot your password?</Link>
        </p>

        <p className="register">
          Don&apos;t have an account? <Link href="/register">Register Here</Link>
        </p>
      </div>
    </div>
  );
}
