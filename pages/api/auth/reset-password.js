import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getDb } from "../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token, password, confirm_password } = req.body;

  if (!token || !password || !confirm_password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  if (password !== confirm_password) {
    return res.status(400).json({ error: "Passwords do not match." });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const db = await getDb();
  const users = db.collection("users");

  const user = await users.findOne({
    resetTokenHash: hashedToken,
    resetTokenExpires: { $gt: new Date() },
  });

  if (!user) {
    return res
      .status(400)
      .json({ error: "This reset link is invalid or has expired. Request a new one." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await users.updateOne(
    { _id: user._id },
    {
      $set: { password: hashedPassword },
      $unset: { resetTokenHash: "", resetTokenExpires: "" },
    }
  );

  return res.status(200).json({ success: true });
}
