// Each step highlights one real element (matched by data-tour="...") on one
// real page. The tour overlay navigates the user between pages automatically
// as they move through the steps.
export const TOUR_STEPS = [
  {
    page: "/dashboard",
    target: "dash-stats",
    title: "Your Dashboard",
    text: "This is your home base. See your total, pending and completed tasks, plus your cumulative CGPA at a glance every time you log in.",
  },
  {
    page: "/dashboard",
    target: "dash-quick-actions",
    title: "Quick Actions",
    text: "Jump straight into adding a task, adding a semester, viewing the calendar, or setting a goal — no need to hunt through the sidebar.",
  },
  {
    page: "/dashboard",
    target: "dash-upcoming",
    title: "Upcoming Deadlines",
    text: "Your next 5 pending tasks show up here automatically, so you always know what's due soonest.",
  },
  {
    page: "/tasks",
    target: "tasks-add-form",
    title: "Add a Task",
    text: "Fill in a title, subject, priority and due date, then press Add Task. Go ahead and try adding your first task now!",
  },
  {
    page: "/tasks",
    target: "tasks-table",
    title: "Manage Your Tasks",
    text: "Tap the check button to mark a task complete, or the trash button to remove it. Completed tasks update your dashboard and calendar instantly.",
  },
  {
    page: "/calendar",
    target: "calendar-grid",
    title: "Academic Calendar",
    text: "Any date with a coloured badge has tasks due. Tap a date to see exactly what's scheduled for that day.",
  },
  {
    page: "/calendar",
    target: "calendar-upcoming",
    title: "Upcoming Deadlines Table",
    text: "This table only shows tasks that are still pending — completed work won't clutter your view.",
  },
  {
    page: "/cgpa",
    target: "cgpa-grading-system",
    title: "Choose Your Grading System",
    text: "Pick your institution's grading scale here, or choose Custom if your institution uses a different point system.",
  },
  {
    page: "/cgpa",
    target: "cgpa-subjects",
    title: "Add Your Subjects",
    text: "Enter each subject's name, credit hours and grade. Tap + Add Subject for more rows — each row has its own spaced-out Remove button on mobile, so you won't tap it by mistake.",
  },
  {
    page: "/cgpa",
    target: "cgpa-save",
    title: "Save the Semester",
    text: "Once your subjects are filled in, save the semester. Your cumulative CGPA at the top of the page updates right away.",
  },
  {
    page: "/goals",
    target: "goals-form",
    title: "Set a Target CGPA",
    text: "Enter the CGPA you're aiming for. Your progress bar and dashboard will track how close you are automatically.",
  },
  {
    page: "/statistics",
    target: "stats-cards",
    title: "Statistics Overview",
    text: "Check your productivity percentage and task breakdown here any time you want a progress check-in.",
  },
  {
    page: "/profile",
    target: "profile-card",
    title: "Your Profile",
    text: "Update your username, avatar and password from this page.",
  },
  {
    page: "/settings",
    target: "settings-notifications",
    title: "Push Notifications",
    text: "Turn this on to get reminded on your device before a deadline hits. That's the full tour — you're ready to go!",
  },
];
