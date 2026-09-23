import { ObjectId } from "mongodb";
import { getDb } from "../../../lib/mongodb";
import { getUserFromRequest } from "../../../lib/auth";

export default async function handler(req, res) {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { id } = req.query;
  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return res.status(400).json({ error: "Invalid task id" });
  }

  const db = await getDb();
  const tasks = db.collection("tasks");

  if (req.method === "PATCH") {
    // Mark complete
    await tasks.updateOne(
      { _id: objectId, user_id: user.id },
      { $set: { status: "Completed" } }
    );
    return res.status(200).json({ success: true });
  }

  if (req.method === "DELETE") {
    await tasks.deleteOne({ _id: objectId, user_id: user.id });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
