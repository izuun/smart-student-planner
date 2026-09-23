import bcrypt from "bcryptjs";
import { getDb } from "../../../lib/mongodb";
import { createSessionCookie } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const db = await getDb();
  const users = db.collection("users");

  const user = await users.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ error: "Email not found." });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: "Incorrect password." });
  }

  res.setHeader("Set-Cookie", createSessionCookie(user));
  return res.status(200).json({ success: true });
}
