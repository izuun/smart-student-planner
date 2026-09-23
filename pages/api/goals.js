import { getDb } from "../../lib/mongodb";
import { getUserFromRequest } from "../../lib/auth";

export default async function handler(req, res) {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const db = await getDb();
  const goals = db.collection("goals");

  if (req.method === "GET") {
    const goal = await goals.findOne({ user_id: user.id });
    return res.status(200).json({
      targetCgpa: goal?.targetCgpa ?? null,
      targetLabel: goal?.targetLabel ?? "",
    });
  }

  if (req.method === "PUT") {
    const { targetCgpa, targetLabel } = req.body;

    const value = Number(targetCgpa);
    if (Number.isNaN(value) || value < 0 || value > 4) {
      return res
        .status(400)
        .json({ error: "Target CGPA must be a number between 0 and 4." });
    }

    await goals.updateOne(
      { user_id: user.id },
      {
        $set: {
          user_id: user.id,
          targetCgpa: value,
          targetLabel: targetLabel || "",
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
