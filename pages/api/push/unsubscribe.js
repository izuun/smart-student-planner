import { getDb } from "../../../lib/mongodb";
import { getUserFromRequest } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { endpoint } = req.body;

  const db = await getDb();
  await db
    .collection("push_subscriptions")
    .deleteMany({ user_id: user.id, ...(endpoint ? { endpoint } : {}) });

  return res.status(200).json({ success: true });
}
