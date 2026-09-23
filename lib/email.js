import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Resend's shared "onboarding@resend.dev" sender works out of the box with
// no setup, but can only deliver to the email address you signed up to
// Resend with, until you verify your own domain. Set RESEND_FROM_EMAIL once
// you verify a domain to send to any address.
const FROM = process.env.RESEND_FROM_EMAIL || "Smart Student Planner <onboarding@resend.dev>";

export async function sendPasswordResetEmail(to, resetUrl) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your Smart Student Planner password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#2563eb;">Reset your password</h2>
        <p>We received a request to reset your Smart Student Planner password. Click the button below to choose a new one. This link expires in 1 hour.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
            Reset Password
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
