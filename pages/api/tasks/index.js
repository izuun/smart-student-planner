import { getDb } from "../../../lib/mongodb";
import { getUserFromRequest } from "../../../lib/auth";

export default async function handler(req, res) {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const db = await getDb();
  const tasks = db.collection("tasks");

  if (req.method === "GET") {
    const search = req.query.search || "";

    const query = { user_id: user.id };
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const results = await tasks
      .find(query)
      .sort({ due_date: 1 })
      .toArray();

    return res.status(200).json({ tasks: results });
  }

  if (req.method === "POST") {
    const { title, subject, priority, due_date } = req.body;

    if (!title || !subject || !priority || !due_date) {
      return res.status(400).json({ error: "All fields are required." });
    }

    await tasks.insertOne({
      user_id: user.id,
      title,
      subject,
      priority,
      due_date,
      status: "Pending",
      createdAt: new Date(),
    });

    return res.status(201).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
