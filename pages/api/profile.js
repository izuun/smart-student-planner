import { ObjectId } from "mongodb";
import { getDb } from "../../lib/mongodb";
import { getUserFromRequest, createSessionCookie } from "../../lib/auth";

export default async function handler(req, res) {
  const authUser = getUserFromRequest(req);
  if (!authUser) return res.status(401).json({ error: "Not authenticated" });

  const db = await getDb();
  const users = db.collection("users");
  const userId = new ObjectId(authUser.id);

  if (req.method === "GET") {
    const user = await users.findOne({ _id: userId });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.status(200).json({
      username: user.username || user.fullname || "",
      fullname: user.fullname || "",
      email: user.email || "",
      avatar: user.avatar || "",
    });
  }

  if (req.method === "PUT") {
    const { username, email, avatar = "" } = req.body || {};
    const cleanUsername = typeof username === "string" ? username.trim() : "";
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!cleanUsername || !cleanEmail) {
      return res.status(400).json({ error: "Username and email are required." });
    }
    if (typeof avatar !== "string" || avatar.length > 700000) {
      return res.status(400).json({ error: "Avatar is too large." });
    }

    const duplicate = await users.findOne({ email: cleanEmail, _id: { $ne: userId } });
    if (duplicate) return res.status(409).json({ error: "Email already exists." });

    await users.updateOne(
      { _id: userId },
      { $set: { username: cleanUsername, email: cleanEmail, avatar } }
    );

    const updated = await users.findOne({ _id: userId });
    res.setHeader("Set-Cookie", createSessionCookie(updated));
    return res.status(200).json({
      success: true,
      user: {
        username: updated.username || updated.fullname || "",
        fullname: updated.fullname || "",
        email: updated.email || "",
        avatar: updated.avatar || "",
      },
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
