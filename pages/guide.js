import Link from "next/link";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { getUserFromContext } from "../lib/auth";
import { useTour } from "../context/TourContext";

export async function getServerSideProps(context) {
  const user = getUserFromContext(context);
  if (!user) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  return { props: { fullname: user.fullname } };
}

const SECTIONS = [
  {
    icon: "fa-house",
    title: "Dashboard",
    href: "/dashboard",
    summary: "Your at-a-glance overview when you log in.",
    points: [
      "See total, pending and completed tasks, plus your cumulative CGPA.",
      "Use the quick action buttons to add a task, add a semester, open the calendar or set a goal.",
      "The Upcoming Deadlines list shows your next 5 pending tasks — overdue ones are flagged in red.",
    ],
  },
  {
    icon: "fa-list-check",
    title: "Tasks",
    href: "/tasks",
    summary: "Add, edit and track every assignment or deadline.",
    points: [
      "Click Add Task and fill in the title, subject, due date and priority.",
      "Mark a task Completed once you're done — this updates your dashboard and calendar automatically.",
      "Use Edit to fix a mistake, or Delete to remove a task you no longer need.",
    ],
  },
  {
    icon: "fa-calendar",
    title: "Calendar",
    href: "/calendar",
    summary: "See deadlines laid out by day and month.",
    points: [
      "Click any date with a task badge to see that day's tasks in detail.",
      "Use the arrows to move between months.",
      "The Upcoming Deadlines table below the calendar only lists tasks that are still pending, so completed work won't clutter it.",
    ],
  },
  {
    icon: "fa-calculator",
    title: "CGPA Calculator",
    href: "/cgpa",
    summary: "Record each semester and track your cumulative CGPA.",
    points: [
      "Pick your grading system (or set up a Custom one) before entering subjects.",
      "Add each subject's name, credit hours and grade — use + Add Subject for more rows.",
      "On mobile, each subject row has its own Remove button below it, spaced apart from the next row, so you don't tap it by accident.",
      "Save the semester to see it added to your Semester History and your overall CGPA.",
    ],
  },
  {
    icon: "fa-bullseye",
    title: "Goals",
    href: "/goals",
    summary: "Set a target CGPA and track how close you are.",
    points: [
      "Enter the CGPA you're aiming for.",
      "Your Dashboard and Statistics pages will show your progress toward that target.",
    ],
  },
  {
    icon: "fa-chart-pie",
    title: "Statistics",
    href: "/statistics",
    summary: "Visualise your productivity and academic trends.",
    points: [
      "Review charts on task completion, priorities and CGPA trends over time.",
    ],
  },
  {
    icon: "fa-user",
    title: "Profile & Settings",
    href: "/profile",
    summary: "Manage your account details and notification preferences.",
    points: [
      "Update your name, avatar or password from Profile.",
      "Turn on reminder notifications for upcoming deadlines from Settings.",
    ],
  },
];

export default function Guide({ fullname }) {
  const [openIndex, setOpenIndex] = useState(0);
  const tour = useTour();

  return (
    <>
      <Sidebar />
      <div className="main">
        <Header fullname={fullname} />
        <div className="content">
          <h1>
            <i className="fa-solid fa-circle-question"></i> Getting Started Guide
          </h1>
          <p className="subtitle">
            A quick walkthrough of every page in Smart Student Planner. Tap a
            section to expand it, or jump straight to a page below.
          </p>
          <br />

          <div className="sdg-banner">
            <h2>Welcome, {fullname || "there"}!</h2>
            <p>
              This guide covers the basics of each feature. You can revisit
              it any time from the Guide link in the sidebar.
            </p>
            <br />
            <button className="btn save-btn" onClick={() => tour.startTour()}>
              <i className="fa-solid fa-wand-magic-sparkles"></i> Start Interactive Tour
            </button>
          </div>
          <br />

          <div className="guide-list">
            {SECTIONS.map((section, i) => {
              const open = openIndex === i;
              return (
                <div className={`guide-item ${open ? "open" : ""}`} key={section.title}>
                  <button
                    type="button"
                    className="guide-item-header"
                    onClick={() => setOpenIndex(open ? -1 : i)}
                  >
                    <span className="guide-item-title">
                      <i className={`fa-solid ${section.icon}`}></i>
                      {section.title}
                    </span>
                    <i className={`fa-solid fa-chevron-${open ? "up" : "down"}`}></i>
                  </button>
                  {open && (
                    <div className="guide-item-body">
                      <p className="subtitle">{section.summary}</p>
                      <ul className="guide-points">
                        {section.points.map((p, pi) => (
                          <li key={pi}>{p}</li>
                        ))}
                      </ul>
                      <Link href={section.href} className="btn">
                        Go to {section.title} <i className="fa-solid fa-arrow-right"></i>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
