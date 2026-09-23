import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Missing or invalid reset link. Request a new one.");
      return;
    }

    setSubmitting(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        password,
        confirm_password: confirmPassword,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Reset Password</h1>
        <p>Choose a new password for your account.</p>

        {error && <div className="error">{error}</div>}
        {success && (
          <div className="success">
            Password updated! Redirecting you to login...
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            <div className="input-box">
              <i className="fa-solid fa-lock"></i>
              <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="input-box">
              <i className="fa-solid fa-lock"></i>
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={submitting}>
              {submitting ? "Updating..." : "Reset Password"}
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
