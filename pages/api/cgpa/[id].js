import { ObjectId } from "mongodb";
import { getDb } from "../../../lib/mongodb";
import { getUserFromRequest } from "../../../lib/auth";
import { getGradePoint } from "../../../lib/grading";

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
    return res.status(400).json({ error: "Invalid semester id" });
  }

  const db = await getDb();
  const semesters = db.collection("gpa_semesters");

  if (req.method === "DELETE") {
    await semesters.deleteOne({ _id: objectId, user_id: user.id });
    return res.status(200).json({ success: true });
  }

  if (req.method === "PUT") {
    const { name, gradingSystem, customPoints, subjects } = req.body;

    if (!name || !Array.isArray(subjects) || subjects.length === 0) {
      return res
        .status(400)
        .json({ error: "Semester name and at least one subject are required." });
    }

    const existing = await semesters.findOne({ _id: objectId, user_id: user.id });
    if (!existing) {
      return res.status(404).json({ error: "Semester not found." });
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

    await semesters.updateOne(
      { _id: objectId, user_id: user.id },
      {
        $set: {
          name,
          gradingSystem: gradingSystem || "politeknik",
          customPoints: gradingSystem === "custom" ? customPoints || {} : null,
          subjects: computedSubjects,
          totalCredits,
          gpa,
          updatedAt: new Date(),
        },
      }
    );

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
