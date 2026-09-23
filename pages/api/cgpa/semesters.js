import { getDb } from "../../../lib/mongodb";
import { getUserFromRequest } from "../../../lib/auth";
import { getGradePoint } from "../../../lib/grading";

export default async function handler(req, res) {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const db = await getDb();
  const semesters = db.collection("gpa_semesters");

  if (req.method === "GET") {
    const results = await semesters
      .find({ user_id: user.id })
      .sort({ order: 1, createdAt: 1 })
      .toArray();

    return res.status(200).json({ semesters: results });
  }

  if (req.method === "POST") {
    const { name, gradingSystem, customPoints, subjects } = req.body;

    if (!name || !Array.isArray(subjects) || subjects.length === 0) {
      return res
        .status(400)
        .json({ error: "Semester name and at least one subject are required." });
    }

    let totalCredits = 0;
    let totalPoints = 0;

    const computedSubjects = subjects.map((s) => {
      const credit = Number(s.credit) || 0;
      const point = getGradePoint(gradingSystem, s.grade, customPoints);
      totalCredits += credit;
      totalPoints += credit * point;
      return {
        name: s.name || "Untitled",
        credit,
        grade: s.grade,
        point,
      };
    });

    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

    const count = await semesters.countDocuments({ user_id: user.id });

    const doc = {
      user_id: user.id,
      name,
      gradingSystem: gradingSystem || "politeknik",
      customPoints: gradingSystem === "custom" ? customPoints || {} : null,
      subjects: computedSubjects,
      totalCredits,
      gpa,
      order: count,
      createdAt: new Date(),
    };

    const result = await semesters.insertOne(doc);

    return res.status(201).json({ success: true, id: result.insertedId });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
