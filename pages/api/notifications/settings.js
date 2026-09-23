import { getDb } from "../../../lib/mongodb";
import { getUserFromRequest } from "../../../lib/auth";
import { ObjectId } from "mongodb";

const defaults = { enabled:true, frequency:"daily", time:"08:00", advanceMinutes:60, timezone:"Asia/Kuala_Lumpur" };

export default async function handler(req,res) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({error:"Not authenticated"});
  const db = await getDb();
  const users = db.collection("users");

  if (req.method === "GET") {
    const record = await users.findOne({_id: new ObjectId(user.id)}, {projection:{notificationSettings:1}});
    return res.status(200).json({settings:{...defaults,...(record?.notificationSettings || {})}});
  }
  if (req.method === "PUT") {
    const body = req.body || {};
    if (!["daily","hourly"].includes(body.frequency)) return res.status(400).json({error:"Invalid frequency."});
    if (!/^\d{2}:\d{2}$/.test(body.time || "")) return res.status(400).json({error:"Invalid reminder time."});
    const settings = {
      enabled: Boolean(body.enabled),
      frequency: body.frequency,
      time: body.time,
      advanceMinutes: Number(body.advanceMinutes) || 60,
      timezone: String(body.timezone || defaults.timezone),
      updatedAt: new Date(),
    };
    await users.updateOne({_id:new ObjectId(user.id)},{$set:{notificationSettings:settings}});
    return res.status(200).json({success:true,settings});
  }
  return res.status(405).json({error:"Method not allowed"});
}
