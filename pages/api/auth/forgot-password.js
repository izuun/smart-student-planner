import crypto from "crypto";
import { getDb } from "../../../lib/mongodb";
import { sendPasswordResetEmail } from "../../../lib/email";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  const db = await getDb();
  const users = db.collection("users");
  const user = await users.findOne({ email: email.toLowerCase() });

  // Always respond the same way whether or not the email exists, so this
  // endpoint can't be used to check which emails are registered.
  const genericResponse = {
    success: true,
    message: "If that email is registered, a reset link has been sent.",
  };

  if (!user) {
    return res.status(200).json(genericResponse);
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await users.updateOne(
    { _id: user._id },
    { $set: { resetTokenHash: hashedToken, resetTokenExpires: expiresAt } }
  );

  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host;
  const resetUrl = `${protocol}://${host}/reset-password?token=${rawToken}`;

  try {
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (err) {
    // Don't leak email-sending failures to the client - log server-side only
    console.error("Failed to send reset email:", err);
  }

  return res.status(200).json(genericResponse);
}
