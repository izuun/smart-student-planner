import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb } from "../../lib/mongodb";
import { getUserFromRequest } from "../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authUser = getUserFromRequest(req);
  if (!authUser) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { current_password, new_password, confirm_password } = req.body;

  if (!current_password || !new_password || !confirm_password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  if (new_password !== confirm_password) {
    return res.status(400).json({ error: "New passwords do not match." });
  }

  const db = await getDb();
  const users = db.collection("users");
  const userId = new ObjectId(authUser.id);

  const user = await users.findOne({ _id: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const valid = await bcrypt.compare(current_password, user.password);
  if (!valid) {
    return res.status(400).json({ error: "Current password is incorrect." });
  }

  const hashed = await bcrypt.hash(new_password, 10);
  await users.updateOne({ _id: userId }, { $set: { password: hashed } });

  return res.status(200).json({ success: true });
}
