"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { ToastProvider, useToast } from "@/components/Toast";
import { DB } from "@/lib/types";
import Dashboard from "@/components/Dashboard";
import DailyLog from "@/components/DailyLog";
import Agenda from "@/components/Agenda";
import Projects from "@/components/Projects";
import Team from "@/components/Team";
import WeeklyReport from "@/components/WeeklyReport";

type Tab = "dashboard" | "log" | "agenda" | "projects" | "team" | "report";

function Header() {
  const { db, setMeta } = useStore();
  return (
    <header className="app-header">
      <div className="head-row">
        <div className="logo">📋</div>
        <div>
          <h1>Department Organizer</h1>
          <div className="sub">
            Log your day in seconds · Generate a polished weekly report · Track
            every project
          </div>
        </div>
        <div className="head-spacer"></div>
        <div className="head-fields">
          <input
            placeholder="Department name"
            value={db.meta.dept}
            onChange={(e) => setMeta({ dept: e.target.value })}
          />
          <input
            placeholder="Your name"
            value={db.meta.user}
            onChange={(e) => setMeta({ user: e.target.value })}
          />
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const { db, replaceAll } = useStore();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "department-backup.json";
    a.click();
    toast("Backup downloaded");
  };

  const importBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(String(reader.result)) as Partial<DB>;
        replaceAll({
          logs: d.logs ?? [],
          projects: (d.projects ?? []).map((p) => ({
            ...p,
            status: (p.status as string) === "Done" ? "Completed" : p.status,
            due: p.due ?? "",
            tasks: (p.tasks ?? []).map((t) => ({
              id: t.id,
              text: t.text,
              status: t.status ?? (t.done ? "Completed" : "Pending"),
              assignee: t.assignee ?? "",
            })),
            issues: p.issues ?? [],
            assignees: p.assignees ?? [],
          })),
          agenda: d.agenda ?? [],
          reports: d.reports ?? [],
          employees: d.employees ?? [],
          meta: d.meta ?? { dept: "", user: "" },
        });
        toast("Backup restored");
      } catch {
        toast("Invalid file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <footer className="app-footer">
      <span className="note">
        💾 Your data is saved automatically in this browser on this computer.
        Back it up regularly with Export — and use the same browser each time.
      </span>
      <button className="btn ghost sm" onClick={exportBackup}>
        ⬇️ Export backup
      </button>
      <button className="btn ghost sm" onClick={() => fileRef.current?.click()}>
        ⬆️ Import backup
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importBackup(f);
          e.target.value = "";
        }}
      />
    </footer>
  );
}

function todayISO() {
  const d = new Date();
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

function Shell() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const { db, loaded } = useStore();

  // Daily reminder notification (once per day, when the app is open & permission granted)
  useEffect(() => {
    if (!loaded) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const today = todayISO();
    const key = "dept_notified_" + today;
    if (localStorage.getItem(key)) return;

    const overdue = db.projects.filter(
      (p) => p.status !== "Completed" && p.due && p.due < today
    ).length;
    const dueToday = db.projects.filter(
      (p) => p.status !== "Completed" && p.due === today
    ).length;
    const agendaToday = db.agenda.filter(
      (a) => a.date === today && !a.done
    ).length;

    const parts: string[] = [];
    if (overdue) parts.push(`${overdue} project${overdue > 1 ? "s" : ""} overdue`);
    if (dueToday) parts.push(`${dueToday} due today`);
    if (agendaToday)
      parts.push(`${agendaToday} agenda task${agendaToday > 1 ? "s" : ""} for today`);

    if (parts.length) {
      new Notification("🔔 Department reminders", { body: parts.join(" · ") });
      localStorage.setItem(key, "1");
    }
  }, [loaded, db]);

  return (
    <>
      <Header />
      <div className="wrap">
        <div className="tabs">
          <button
            className={"tab" + (tab === "dashboard" ? " active" : "")}
            onClick={() => setTab("dashboard")}
          >
            📊 Dashboard
          </button>
          <button
            className={"tab" + (tab === "log" ? " active" : "")}
            onClick={() => setTab("log")}
          >
            📝 Daily Log
          </button>
          <button
            className={"tab" + (tab === "agenda" ? " active" : "")}
            onClick={() => setTab("agenda")}
          >
            📅 Agenda
          </button>
          <button
            className={"tab" + (tab === "projects" ? " active" : "")}
            onClick={() => setTab("projects")}
          >
            📂 Projects
          </button>
          <button
            className={"tab" + (tab === "team" ? " active" : "")}
            onClick={() => setTab("team")}
          >
            👥 Team
          </button>
          <button
            className={"tab" + (tab === "report" ? " active" : "")}
            onClick={() => setTab("report")}
          >
            📄 Weekly Report
          </button>
        </div>

        {!loaded ? (
          <div className="card">
            <div className="empty">Loading your data…</div>
          </div>
        ) : tab === "dashboard" ? (
          <Dashboard />
        ) : tab === "log" ? (
          <DailyLog />
        ) : tab === "agenda" ? (
          <Agenda />
        ) : tab === "projects" ? (
          <Projects />
        ) : tab === "team" ? (
          <Team />
        ) : (
          <WeeklyReport />
        )}
      </div>
      <Footer />
    </>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  );
}
