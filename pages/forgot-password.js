import { useState } from "react";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }

    setMessage(data.message || "If that email is registered, a reset link has been sent.");
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Forgot Password</h1>
        <p>Enter your email and we&apos;ll send you a reset link.</p>

        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}

        {!message && (
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

            <button type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="register">
          <Link href="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
