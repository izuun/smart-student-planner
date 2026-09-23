import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import { irisPush } from "../lib/iris";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const links = [
    { href: "/dashboard", icon: "fa-house", label: "Dashboard" },
    { href: "/tasks", icon: "fa-list-check", label: "Tasks" },
    { href: "/calendar", icon: "fa-calendar", label: "Calendar" },
    { href: "/cgpa", icon: "fa-calculator", label: "CGPA Calculator" },
    { href: "/goals", icon: "fa-bullseye", label: "Goals" },
    { href: "/statistics", icon: "fa-chart-pie", label: "Statistics" },
    { href: "/profile", icon: "fa-user", label: "Profile" },
    { href: "/settings", icon: "fa-gear", label: "Settings" },
    { href: "/sdg", icon: "fa-globe", label: "SDG 4" },
    { href: "/guide", icon: "fa-circle-question", label: "Guide" },
  ];

  return (
    <>
      <button
        className="mobile-menu-btn"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        <i className="fa-solid fa-bars"></i>
      </button>

      <div
        className={`sidebar-overlay ${open ? "active" : ""}`}
        onClick={() => setOpen(false)}
      ></div>

      <div className={`sidebar ${open ? "active" : ""}`}>
        <div className="logo">
          <i className="fa-solid fa-graduation-cap"></i>
          Smart Planner
        </div>

        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            data-tour-nav={link.href}
            onClick={() => setOpen(false)}
            className={router.pathname === link.href ? "active-link" : ""}
          >
            <i className={`fa-solid ${link.icon}`}></i>
            {link.label}
          </Link>
        ))}

        <a
          href="#"
          onClick={async (e) => {
            e.preventDefault();
            // The circle closes while the logout request runs, then opens onto the login page.
            await irisPush(router, "/login", () => fetch("/api/auth/logout", { method: "POST" }));
          }}
        >
          <i className="fa-solid fa-right-from-bracket"></i>
          Logout
        </a>
      </div>
    </>
  );
}
