"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { COLUMNS, Status } from "@/lib/types";
import { useToast } from "./Toast";
import { useLang } from "@/lib/i18n";

/* ---------- icons ---------- */
const ICONS: Record<string, string> = {
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  board:
    '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  users:
    '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  alert:
    '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  report:
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>',
  pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  share:
    '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5"/>',
  arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  flag: '<path d="M4 22V4M4 4h11l-1.5 4L15 12H4"/>',
  msg: '<path d="M21 11.5a8.38 8.38 0 0 1-9 8.3 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z"/>',
  note: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
};
function Icon({ name, size = 16, sw = 2 }: { name: string; size?: number; sw?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: ICONS[name] || "" }}
    />
  );
}

function initials(name: string) {
  const a = name.trim().split(/\s+/);
  return ((a[0]?.[0] || "") + (a[1]?.[0] || "")).toUpperCase();
}
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h} 52% 45%)`;
}
function todayISO() {
  const d = new Date();
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

// stage tone (bg, fg) for the status strip
const STAGE_TONE: Record<Status, [string, string]> = {
  Upcoming: ["var(--accent-secondary-tint)", "var(--accent-secondary)"],
  Progress: ["var(--status-progress-bg)", "var(--status-progress-fg)"],
  Pending: ["var(--status-pending-bg)", "var(--status-pending-fg)"],
  Testing: ["var(--status-info-bg)", "var(--status-info-fg)"],
  Issues: ["var(--status-issue-bg)", "var(--status-issue-fg)"],
  Completed: ["var(--status-done-bg)", "var(--status-done-fg)"],
};

/* ---------- donut ring ---------- */
function Ring({ value, max, size = 120, stroke = 12 }: { value: number; max: number; size?: number; stroke?: number }) {
  const { t } = useLang();
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-sunken)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="ring-center">
        <span className="ring-pct">{Math.round(pct * 100)}%</span>
        <span className="ring-lbl">{t("db.complete")}</span>
      </div>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  bg,
  fg,
}: {
  icon: string;
  label: string;
  value: string;
  bg: string;
  fg: string;
}) {
  return (
    <div className="card dtile">
      <span className="dtile-icon" style={{ background: bg, color: fg }}>
        <Icon name={icon} size={20} />
      </span>
      <div>
        <div className="dtile-num">{value}</div>
        <div className="dtile-lbl">{label}</div>
      </div>
    </div>
  );
}

function relTime(ts: number, t: (k: string, v?: Record<string, string | number>) => string) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return t("db.ago", { t: s + "s" });
  const m = Math.floor(s / 60);
  if (m < 60) return t("db.ago", { t: m + "m" });
  const h = Math.floor(m / 60);
  if (h < 24) return t("db.ago", { t: h + "h" });
  return t("db.ago", { t: Math.floor(h / 24) + "d" });
}

export default function Dashboard({ onNav }: { onNav?: (tab: string) => void }) {
  const { db } = useStore();
  const { t, locale } = useLang();
  const toast = useToast();
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const [filter, setFilter] = useState<Status | "all">("all");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPerm("unsupported");
      return;
    }
    setPerm(Notification.permission);
  }, []);
  const enableNotifs = () => {
    if (!("Notification" in window)) return;
    Notification.requestPermission().then((p) => {
      setPerm(p);
      if (p === "granted") {
        toast(t("toast.remindersOn"));
        new Notification("🔔 Reminders enabled", {
          body: "You'll get a daily reminder of due projects and today's tasks.",
        });
      }
    });
  };

  const projects = db.projects;
  const allTasks = projects.flatMap((p) => p.tasks);
  const today = todayISO();
  const todayItems = db.agenda.filter((a) => a.date === today);
  const todayDone = todayItems.filter((a) => a.done).length;

  const activeProjects = projects.filter((p) => p.status !== "Completed").length;
  const openIssues = projects.reduce(
    (n, p) => n + p.issues.filter((i) => !i.resolved).length,
    0
  );

  // projects overview
  const stageCount = (k: Status) => projects.filter((p) => p.status === k).length;
  const shown = filter === "all" ? projects : projects.filter((p) => p.status === filter);
  const ownerName = (p: (typeof projects)[number]) => {
    const id = p.assignees[0];
    return id ? db.employees.find((e) => e.id === id)?.name || "—" : "—";
  };
  const projTaskStats = (p: (typeof projects)[number]) => {
    const done = p.tasks.filter((x) => x.status === "Completed").length;
    return { done, total: p.tasks.length };
  };

  // team active tasks (in progress)
  const activeTaskRows = projects
    .flatMap((p) => p.tasks.map((tk) => ({ tk, projectName: p.name })))
    .filter((r) => r.tk.status === "Progress")
    .slice(0, 6);

  // recent activity from the daily log
  const CAT_ICON: Record<string, string> = {
    Achievement: "check",
    Task: "flag",
    Meeting: "users",
    Issue: "alert",
    Note: "note",
  };
  const CAT_TONE: Record<string, [string, string]> = {
    Achievement: ["var(--status-done-bg)", "var(--status-done-fg)"],
    Task: ["var(--status-info-bg)", "var(--status-info-fg)"],
    Meeting: ["var(--accent-secondary-tint)", "var(--accent-secondary)"],
    Issue: ["var(--status-issue-bg)", "var(--status-issue-fg)"],
    Note: ["var(--surface-sunken)", "var(--text-secondary)"],
  };
  const activity = [...db.logs].sort((a, b) => b.ts - a.ts).slice(0, 6);

  return (
    <div className="dash">
      {/* notifications */}
      <div className="notifbar">
        {perm === "granted" ? (
          <span className="notif-on">🔔 {t("db.notifOn")}</span>
        ) : perm === "unsupported" ? null : (
          <>
            <button className="btn sm" onClick={enableNotifs}>
              🔔 {t("db.enable")}
            </button>
            <span className="hint" style={{ margin: 0 }}>
              {t("db.enableHint")}
            </span>
          </>
        )}
      </div>

      {/* stat tiles */}
      <div className="dtiles">
        <StatTile
          icon="calendar"
          label={t("db.tasksToday")}
          value={String(todayItems.length)}
          bg="var(--accent-tint)"
          fg="var(--text-accent)"
        />
        <StatTile
          icon="board"
          label={t("db.activeProjects")}
          value={String(activeProjects)}
          bg="var(--status-info-bg)"
          fg="var(--status-info-fg)"
        />
        <StatTile
          icon="users"
          label={t("db.kTeam")}
          value={String(db.employees.length)}
          bg="var(--status-done-bg)"
          fg="var(--status-done-fg)"
        />
        <StatTile
          icon="alert"
          label={t("db.openIssues")}
          value={String(openIssues)}
          bg="var(--status-issue-bg)"
          fg="var(--status-issue-fg)"
        />
      </div>

      {/* hero: today ring + quick actions */}
      <div className="hero-grid">
        <div className="card hero-today">
          <Ring value={todayDone} max={todayItems.length} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="hero-h">{t("db.todayProgress")}</h2>
            <p className="hero-sub">
              {t("db.doneRemaining", {
                done: todayDone,
                total: todayItems.length,
                rem: todayItems.length - todayDone,
              })}
            </p>
            <div className="hero-actions">
              <button className="btn" onClick={() => onNav?.("agenda")}>
                <Icon name="plus" size={17} /> {t("db.addTask")}
              </button>
              <button className="btn ghost" onClick={() => onNav?.("report")}>
                <Icon name="report" size={17} /> {t("db.openReport")}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="sec">{t("db.quickActions")}</h2>
          <div className="qa-grid">
            {[
              ["pencil", t("db.qaLog"), "log"],
              ["calendar", t("db.qaPlan"), "agenda"],
              ["board", t("db.qaProject"), "projects"],
              ["share", t("db.qaShare"), "report"],
            ].map(([ic, lb, tab]) => (
              <button key={lb} className="qa-btn" onClick={() => onNav?.(tab)}>
                <span className="qa-ic">
                  <Icon name={ic} size={20} />
                </span>
                {lb}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* projects overview */}
      <div className="card">
        <div className="dsec-head">
          <h2 className="sec" style={{ margin: 0 }}>
            {t("db.allProjects")} · {projects.length}
          </h2>
          <button className="btn ghost sm" onClick={() => onNav?.("projects")}>
            {t("db.openBoard")} <Icon name="arrowRight" size={15} />
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="empty">{t("db.noProjects")}</div>
        ) : (
          <>
            <div className="povr-strip">
              {COLUMNS.map(({ key }) => {
                const [bg, fg] = STAGE_TONE[key];
                const on = filter === key;
                return (
                  <button
                    key={key}
                    className={"povr-stat" + (on ? " on" : "")}
                    style={{ background: bg, borderColor: on ? fg : "transparent" }}
                    onClick={() => setFilter(on ? "all" : key)}
                  >
                    <span className="povr-stat-top">
                      <span className="dot" style={{ background: fg }} />
                      <span className="povr-stat-num" style={{ color: fg }}>
                        {stageCount(key)}
                      </span>
                    </span>
                    <span className="povr-stat-lbl">{t("stage." + key)}</span>
                  </button>
                );
              })}
            </div>

            <div className="povr-pills">
              <button
                className={"povr-pill" + (filter === "all" ? " on" : "")}
                onClick={() => setFilter("all")}
              >
                {t("db.all")} <span className="num">{projects.length}</span>
              </button>
              {COLUMNS.map(({ key }) => (
                <button
                  key={key}
                  className={"povr-pill" + (filter === key ? " on" : "")}
                  onClick={() => setFilter(key)}
                >
                  {t("stage." + key)} <span className="num">{stageCount(key)}</span>
                </button>
              ))}
            </div>

            <div className="povr-list">
              {shown.map((p) => {
                const { done, total } = projTaskStats(p);
                const pct = total ? Math.round((done / total) * 100) : 0;
                const issues = p.issues.filter((i) => !i.resolved).length;
                const [, fg] = STAGE_TONE[p.status];
                return (
                  <div className="povr-row" key={p.id}>
                    <span className="povr-bar" style={{ background: fg }} />
                    <div className="povr-main">
                      <div className="povr-name">{p.name}</div>
                      <div className="povr-meta">
                        <span className="povr-frac">
                          <Icon name="check" size={12} /> {done}/{total}
                        </span>
                        <span>·</span>
                        <span>{ownerName(p)}</span>
                      </div>
                    </div>
                    <div className="povr-prog">
                      <div className="povr-prog-fill" style={{ width: pct + "%", background: fg }} />
                    </div>
                    {issues > 0 ? (
                      <span className="badge b-Issue">{t("db.issuesN", { n: issues })}</span>
                    ) : (
                      <span className="stage-badge">
                        <span className={"dot d-" + p.status} />
                        {t("stage." + p.status)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* team active tasks + recent activity */}
      <div className="hero-grid wide">
        <div className="card">
          <div className="dsec-head">
            <h2 className="sec" style={{ margin: 0 }}>
              {t("db.activeTasksTitle")}
            </h2>
            <button className="btn ghost sm" onClick={() => onNav?.("team")}>
              {t("db.viewAll")} <Icon name="arrowRight" size={15} />
            </button>
          </div>
          {activeTaskRows.length === 0 ? (
            <div className="empty">{t("db.noActiveTasks")}</div>
          ) : (
            <div className="act-tasks">
              {activeTaskRows.map(({ tk, projectName }) => {
                const emp = db.employees.find((e) => e.id === tk.assignee);
                return (
                  <div className="act-task" key={tk.id}>
                    <span
                      className="mini-ava"
                      style={{ background: emp ? avatarColor(emp.name) : "#94a3b8" }}
                    >
                      {emp ? initials(emp.name) : "—"}
                    </span>
                    <div className="act-task-main">
                      <div className="act-task-title">{tk.text}</div>
                      <div className="act-task-sub">
                        📂 {projectName}
                        {emp ? " · " + emp.name : ""}
                      </div>
                    </div>
                    <span className="aw-etc__live" style={{ color: "var(--status-progress-fg)" }} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="sec">{t("db.recentActivity")}</h2>
          {activity.length === 0 ? (
            <div className="empty">{t("db.noActivity")}</div>
          ) : (
            <div className="act-feed">
              {activity.map((a) => {
                const [bg, fg] = CAT_TONE[a.cat] || CAT_TONE.Note;
                return (
                  <div className="act-row" key={a.id}>
                    <span className="act-icon" style={{ background: bg, color: fg }}>
                      <Icon name={CAT_ICON[a.cat] || "note"} size={15} />
                    </span>
                    <div className="act-body">
                      <span className="act-who">{t("db.you")}</span>{" "}
                      <span className="act-act">{t("db.logged")}</span>{" "}
                      <span className="act-obj">{a.text}</span>
                      <div className="act-time">
                        {t("cat." + a.cat)} ·{" "}
                        {new Date(a.ts).toLocaleDateString(locale, {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        · {relTime(a.ts, t)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
