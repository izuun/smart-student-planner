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

  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "Invalid subscription." });
  }

  const db = await getDb();
  const subs = db.collection("push_subscriptions");

  // One subscription per (user, endpoint) - upsert so re-subscribing doesn't duplicate
  await subs.updateOne(
    { user_id: user.id, endpoint: subscription.endpoint },
    { $set: { user_id: user.id, ...subscription, updatedAt: new Date() } },
    { upsert: true }
  );

  return res.status(200).json({ success: true });
}
