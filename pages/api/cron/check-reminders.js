import { getDb } from "../../../lib/mongodb";
import webpush from "../../../lib/webpush";
import { ObjectId } from "mongodb";

function localParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone, hour:"2-digit", minute:"2-digit", hour12:false,
  }).formatToParts(date);
  return Object.fromEntries(parts.filter(p => ["hour","minute"].includes(p.type)).map(p => [p.type,p.value]));
}

export default async function handler(req,res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).json({error:"Unauthorized"});

  const db = await getDb();
  const tasks = db.collection("tasks");
  const subs = db.collection("push_subscriptions");
  const users = db.collection("users");
  const now = new Date();

  const today = new Date(now); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
  const todayStr = today.toISOString().slice(0,10);
  const tomorrowStr = tomorrow.toISOString().slice(0,10);

  const dueSoon = await tasks.find({status:{$ne:"Completed"},due_date:{$in:[todayStr,tomorrowStr]}}).toArray();
  let sent=0, removed=0, skipped=0;

  const userIds = [...new Set(dueSoon.map(t => t.user_id))];
  for (const userId of userIds) {
    let user;
    try { user = await users.findOne({_id:new ObjectId(userId)}); } catch { user = null; }
    if (!user) { skipped++; continue; }

    const settings = {
      enabled:true, frequency:"daily", time:"08:00", timezone:"Asia/Kuala_Lumpur",
      ...(user.notificationSettings || {}),
    };
    if (!settings.enabled) { skipped++; continue; }

    const lp = localParts(now, settings.timezone);
    const [targetHour,targetMinute] = String(settings.time).split(":").map(Number);
    const currentHour = Number(lp.hour), currentMinute = Number(lp.minute);

    // How many minutes past the target minute we currently are, wrapping
    // around the hour (e.g. target :50, current :05 -> 15 minutes past).
    const minutesPastTarget = ((currentMinute - targetMinute) + 60) % 60;
    const withinWindow = minutesPastTarget <= 5; // allow for cron drift

    const matchesSchedule =
      settings.frequency === "hourly"
        // Fires every hour, at the same minute the user picked in Push time
        // (e.g. Push time 5:30 -> fires at :30 past every hour).
        ? withinWindow
        // Fires once a day, at the exact hour and minute the user picked.
        : currentHour === targetHour && withinWindow;

    if (!matchesSchedule) { skipped++; continue; }

    const userTasks = dueSoon.filter(t => t.user_id === userId);
    const userSubs = await subs.find({user_id:userId}).toArray();

    for (const task of userTasks) {
      const isToday = task.due_date === todayStr;
      const payload = JSON.stringify({
        title: isToday ? "Task due today" : "Task due tomorrow",
        body: `${task.title}${task.subject ? ` · ${task.subject}` : ""}`,
        url: "/tasks",
      });
      for (const sub of userSubs) {
        try {
          await webpush.sendNotification({endpoint:sub.endpoint,keys:sub.keys},payload);
          sent++;
        } catch (err) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await subs.deleteOne({_id:sub._id}); removed++;
          }
        }
      }
    }
  }
  return res.status(200).json({checked:dueSoon.length,sent,removed,skipped});
}
