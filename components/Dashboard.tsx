"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { COLUMNS, TaskStatus } from "@/lib/types";
import { weekToWednesday } from "@/lib/report";
import { useToast } from "./Toast";

function iso(d: Date) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}
const todayISO = () => iso(new Date());
function daysUntil(isoDate: string) {
  const d = new Date(isoDate + "T00:00:00");
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - t.getTime()) / 86400000);
}
function dueLevel(isoDate: string): "overdue" | "soon" | "ok" {
  const n = daysUntil(isoDate);
  return n < 0 ? "overdue" : n <= 3 ? "soon" : "ok";
}
function dueText(isoDate: string) {
  const n = daysUntil(isoDate);
  if (n < 0) return `${Math.abs(n)}d overdue`;
  if (n === 0) return "due today";
  if (n === 1) return "due tomorrow";
  return `in ${n} days`;
}
function shortDate(isoDate: string) {
  return new Date(isoDate + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase();
}
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h} 52% 45%)`;
}

export default function Dashboard() {
  const { db } = useStore();
  const toast = useToast();
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPerm("unsupported");
      return;
    }
    setPerm(Notification.permission);
  }, []);

  const enableNotifs = () => {
    if (!("Notification" in window)) {
      toast("Notifications not supported on this browser");
      return;
    }
    Notification.requestPermission().then((p) => {
      setPerm(p);
      if (p === "granted") {
        toast("Reminders enabled ✓");
        new Notification("🔔 Reminders enabled", {
          body: "You'll get a daily reminder of due projects and today's tasks when you open this app.",
        });
      } else {
        toast("Notifications were blocked");
      }
    });
  };

  const projects = db.projects;
  const allTasks = projects.flatMap((p) => p.tasks);
  const countBy = (s: TaskStatus) => allTasks.filter((t) => t.status === s).length;
  const activeTasks = countBy("Pending") + countBy("Progress");

  // this week's achievements (current reporting week)
  const wk = weekToWednesday();
  const f = new Date(wk.from + "T00:00:00").getTime();
  const t = new Date(wk.to + "T23:59:59").getTime();
  const weekAch = db.logs.filter(
    (e) =>
      e.ts >= f && e.ts <= t && ["Achievement", "Task", "Meeting"].includes(e.cat)
  ).length;

  // reminders
  const reminders = projects
    .filter((p) => p.status !== "Completed" && p.due)
    .map((p) => ({ p, level: dueLevel(p.due) }))
    .filter((r) => r.level !== "ok")
    .sort((a, b) => daysUntil(a.p.due) - daysUntil(b.p.due));

  // recent achievements
  const recentAch = [...db.logs]
    .filter((e) => ["Achievement", "Task", "Meeting"].includes(e.cat))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 6);

  // today's agenda
  const today = todayISO();
  const todayItems = db.agenda.filter((a) => a.date === today);
  const todayDone = todayItems.filter((a) => a.done).length;
  const todayPct = todayItems.length
    ? Math.round((todayDone / todayItems.length) * 100)
    : 0;

  const stageCounts = COLUMNS.map((c) => ({
    ...c,
    count: projects.filter((p) => p.status === c.key).length,
  }));
  const maxStage = Math.max(1, ...stageCounts.map((s) => s.count));

  return (
    <>
      <div className="card">
        <h2 className="sec">📊 Department dashboard</h2>
        <p className="hint">
          A live overview of everything — projects, tasks, team workload, and your
          achievements this week.
        </p>
        <div className="notifbar">
          {perm === "granted" ? (
            <span className="notif-on">🔔 Reminders are on</span>
          ) : perm === "unsupported" ? (
            <span className="hint" style={{ margin: 0 }}>
              🔕 Notifications aren&apos;t supported on this browser.
            </span>
          ) : (
            <>
              <button className="btn sm" onClick={enableNotifs}>
                🔔 Enable reminders
              </button>
              <span className="hint" style={{ margin: 0 }}>
                Get a daily alert for overdue projects &amp; today&apos;s tasks.
              </span>
            </>
          )}
        </div>
        <div className="kpis">
          <div className="kpi">
            <div className="num">{projects.length}</div>
            <div className="lbl">📂 Projects</div>
            <div className="sub">
              {stageCounts.find((s) => s.key === "Completed")?.count || 0} completed
            </div>
          </div>
          <div className="kpi">
            <div className="num" style={{ color: "var(--brand)" }}>
              {activeTasks}
            </div>
            <div className="lbl">✅ Active tasks</div>
            <div className="sub">{countBy("Completed")} done</div>
          </div>
          <div className="kpi">
            <div className="num">{db.employees.length}</div>
            <div className="lbl">👥 Team members</div>
          </div>
          <div className="kpi">
            <div className="num" style={{ color: "var(--green)" }}>
              {weekAch}
            </div>
            <div className="lbl">🏆 Achievements</div>
            <div className="sub">this week</div>
          </div>
          <div className="kpi">
            <div
              className="num"
              style={{ color: reminders.length ? "var(--red)" : "var(--muted)" }}
            >
              {reminders.length}
            </div>
            <div className="lbl">🔔 Reminders</div>
            <div className="sub">overdue / due soon</div>
          </div>
          <div className="kpi">
            <div className="num">
              {todayDone}
              <span style={{ fontSize: 16, color: "var(--muted)" }}>
                /{todayItems.length}
              </span>
            </div>
            <div className="lbl">📅 Today&apos;s agenda</div>
            <div className="sub">{todayPct}% done</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="sec">📂 Projects by stage</h2>
        {projects.length === 0 ? (
          <div className="empty">No projects yet.</div>
        ) : (
          stageCounts.map((s) => (
            <div className="stagebar" key={s.key}>
              <span className="sb-label">
                <span className={"dot d-" + s.key}></span>
                {s.label}
              </span>
              <div className="sb-track">
                <div
                  className={"sb-fill d-" + s.key}
                  style={{ width: (s.count / maxStage) * 100 + "%" }}
                />
              </div>
              <span className="sb-count">{s.count}</span>
            </div>
          ))
        )}
      </div>

      {reminders.length > 0 && (
        <div className="card">
          <h2 className="sec">🔔 Needs attention</h2>
          {reminders.map(({ p, level }) => (
            <div className="rem-row" key={p.id}>
              <span className={"rem-dot lvl-" + level} />
              <span className="rem-name">{p.name}</span>
              <span className="rem-stage">
                {COLUMNS.find((c) => c.key === p.status)?.label}
              </span>
              <span className={"rem-when lvl-" + level}>
                {shortDate(p.due)} · {dueText(p.due)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2 className="sec">👥 Team workload</h2>
        {db.employees.length === 0 ? (
          <div className="empty">
            No team members yet. Add them in 📂 Projects → 👥 Manage team.
          </div>
        ) : (
          db.employees.map((e) => {
            const tasks = allTasks.filter((tk) => tk.assignee === e.id);
            const ip = tasks.filter((tk) => tk.status === "Progress").length;
            const pend = tasks.filter((tk) => tk.status === "Pending").length;
            const done = tasks.filter((tk) => tk.status === "Completed").length;
            return (
              <div className="teamrow" key={e.id}>
                <span
                  className="mini-ava"
                  style={{ background: avatarColor(e.name) }}
                >
                  {initials(e.name)}
                </span>
                <span className="teamrow-name">{e.name}</span>
                <span className="teamrow-stats">
                  <span className="stat ip">{ip} in progress</span>
                  <span className="stat pend">{pend} pending</span>
                  <span className="stat done">{done} done</span>
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="card">
        <h2 className="sec">🏆 My recent achievements</h2>
        {recentAch.length === 0 ? (
          <div className="empty">
            Nothing logged yet — add achievements in 📝 Daily Log.
          </div>
        ) : (
          recentAch.map((e) => (
            <div className="ach" key={e.id}>
              <span className={"badge b-" + e.cat}>{e.cat}</span>
              <span className="ach-text">{e.text}</span>
              <span className="ach-date">{fmtDate(e.ts)}</span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
