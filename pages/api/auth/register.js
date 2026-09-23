import bcrypt from "bcryptjs";
import { getDb } from "../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { fullname, email, password, confirm_password } = req.body;

  if (!fullname || !email || !password || !confirm_password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  if (password !== confirm_password) {
    return res.status(400).json({ error: "Passwords do not match." });
  }

  const db = await getDb();
  const users = db.collection("users");

  const existing = await users.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: "Email already exists." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await users.insertOne({
    fullname,
    email: email.toLowerCase(),
    password: hashedPassword,
    createdAt: new Date(),
  });

  return res.status(201).json({ success: true });
}
