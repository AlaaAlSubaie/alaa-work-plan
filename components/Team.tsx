"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { TaskStatus } from "@/lib/types";
import { useToast } from "./Toast";
import { useLang } from "@/lib/i18n";

const TASK_ORDER: TaskStatus[] = ["Pending", "Progress", "Completed"];

/* ---------- inline icons (Lucide-style, from the design) ---------- */
const ICONS: Record<string, string> = {
  deploy: '<path d="M12 2 4 7v10l8 5 8-5V7z"/><path d="m4 7 8 5 8-5M12 12v10"/>',
  design:
    '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13 13.5 8.5"/><path d="M2 2l7.5 7.5"/><circle cx="11" cy="11" r="2"/>',
  review:
    '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  meeting:
    '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  fix: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.8 2.8-2.4-2.4z"/>',
  research: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  subtask: '<path d="M9 11l3 3L22 4"/><path d="M3 6h13M3 12h6M3 18h9"/>',
  folder:
    '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
};
const CAT_KEYS = ["deploy", "design", "review", "meeting", "fix", "research"];
const CAT_TONE: Record<string, [string, string]> = {
  deploy: ["var(--status-done-bg)", "var(--status-done-fg)"],
  design: ["var(--accent-tint)", "var(--text-accent)"],
  review: ["var(--accent-secondary-tint)", "var(--accent-secondary)"],
  meeting: ["var(--status-info-bg)", "var(--status-info-fg)"],
  fix: ["var(--status-progress-bg)", "var(--status-progress-fg)"],
  research: ["var(--status-pending-bg)", "var(--status-pending-fg)"],
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
      dangerouslySetInnerHTML={{ __html: ICONS[name] || ICONS.design }}
    />
  );
}

function initials(name: string) {
  const a = name.trim().split(/\s+/);
  return ((a[0]?.[0] || "") + (a[1]?.[0] || "")).toUpperCase();
}
const AVA_BG = ["#0071e3", "#5e5ce6", "#d97706", "#1d8a4e", "#be3455"];
function avaBg(name: string) {
  return AVA_BG[(name.charCodeAt(0) || 0) % AVA_BG.length];
}
function hashPick<T>(arr: T[], key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

/* ---------- live clock for the header ---------- */
function LiveClock() {
  const { t } = useLang();
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="tboard-live">
      <span className="dot" />
      <span className="lbl">{t("tb.live")}</span>
      <span className="clock">{now}</span>
    </div>
  );
}

interface FlatTask {
  id: string;
  text: string;
  status: TaskStatus;
  assignee: string;
  projectId: string;
  projectName: string;
}

function TaskCard({
  task,
  index,
  projDone,
  projTotal,
  due,
  empName,
  empRole,
  onCycle,
  onDelete,
}: {
  task: FlatTask;
  index: number;
  projDone: number;
  projTotal: number;
  due: string;
  empName: string;
  empRole: string;
  onCycle: () => void;
  onDelete: () => void;
}) {
  const { t } = useLang();
  const cat = hashPick(CAT_KEYS, task.projectName || task.id);
  const [catBg, catFg] = CAT_TONE[cat];

  const STATUS: Record<
    TaskStatus,
    { label: string; bg: string; fg: string; on: string; live: boolean }
  > = {
    Pending: { label: t("tb.pending"), bg: "var(--status-pending-bg)", fg: "var(--status-pending-fg)", on: "off", live: false },
    Progress: { label: t("tb.active"), bg: "var(--status-progress-bg)", fg: "var(--status-progress-fg)", on: "busy", live: true },
    Completed: { label: t("tb.completed"), bg: "var(--status-done-bg)", fg: "var(--status-done-fg)", on: "on", live: false },
  };
  const st = STATUS[task.status];
  const projPct = projTotal ? Math.round((projDone / projTotal) * 100) : 0;

  return (
    <article
      className="aw-etc"
      style={{
        animationDelay: index * 80 + "ms",
        ["--aw-pulse" as string]: `color-mix(in srgb, ${st.fg} 50%, transparent)`,
      }}
    >
      <span className="aw-etc__accent" style={{ background: st.fg }} />

      <div className="aw-etc__top">
        <div className="aw-etc__ava">
          <span
            className="aw-etc__avacircle"
            style={{ background: empName ? avaBg(empName) : "#94a3b8" }}
          >
            {empName ? initials(empName) : "—"}
          </span>
          <span className={"aw-etc__on aw-etc__on--" + st.on} />
        </div>
        <div className="aw-etc__who">
          <div className="aw-etc__name">{empName || t("tm.unassigned")}</div>
          <div className="aw-etc__role">{empRole}</div>
        </div>
        <span className="aw-etc__cat" style={{ background: catBg, color: catFg }}>
          <Icon name={cat} size={19} />
        </span>
      </div>

      <h3 className="aw-etc__title">{task.text}</h3>

      <div className="aw-etc__chips">
        <button
          className="aw-etc__chip"
          style={{ background: st.bg, color: st.fg }}
          onClick={onCycle}
          title="Click to change status"
        >
          {st.live ? <span className="aw-etc__live" /> : null}
          {st.label}
        </button>
        <span
          className="aw-etc__chip"
          style={{ background: "var(--surface-sunken)", color: "var(--text-secondary)" }}
        >
          <Icon name="folder" size={12} sw={2.2} />
          {task.projectName}
        </span>
      </div>

      <div className="aw-etc__prog">
        <div className="aw-etc__progtop">
          <span
            style={{
              color: "var(--text-secondary)",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Icon name="subtask" size={13} />{" "}
            {t("tb.projTasks", { done: projDone, total: projTotal })}
          </span>
          <b>{projPct}%</b>
        </div>
        <div className="aw-etc__track">
          <div
            className="aw-etc__fill"
            style={{
              width: projPct + "%",
              background:
                task.status === "Completed"
                  ? "var(--status-done-fg)"
                  : "var(--accent)",
            }}
          />
        </div>
      </div>

      <div className="aw-etc__foot">
        {due ? (
          <span className="aw-etc__meta">
            <Icon name="clock" size={15} /> {due}
          </span>
        ) : null}
        <button className="aw-etc__del" title="Delete" onClick={onDelete}>
          🗑️
        </button>
      </div>
    </article>
  );
}

export default function Team() {
  const { db, setProjectTaskStatus, addProjectTask, delProjectTask } = useStore();
  const { t, locale } = useLang();
  const toast = useToast();
  const [hideDone, setHideDone] = useState(false);
  const [proj, setProj] = useState("");
  const [who, setWho] = useState("");
  const [text, setText] = useState("");

  // flatten all tasks with project context
  const all: FlatTask[] = db.projects.flatMap((p) =>
    p.tasks.map((tk) => ({
      id: tk.id,
      text: tk.text,
      status: tk.status,
      assignee: tk.assignee,
      projectId: p.id,
      projectName: p.name,
    }))
  );

  const RANK: Record<TaskStatus, number> = { Progress: 0, Pending: 1, Completed: 2 };
  const visible = all
    .filter((x) => (hideDone ? x.status !== "Completed" : true))
    .sort((a, b) => RANK[a.status] - RANK[b.status]);

  const active = all.filter((x) => x.status === "Progress").length;
  const done = all.filter((x) => x.status === "Completed").length;
  const pending = all.filter((x) => x.status === "Pending").length;

  // per-project completion (for the progress bars)
  const projStats = (pid: string) => {
    const p = db.projects.find((x) => x.id === pid);
    if (!p) return { done: 0, total: 0 };
    return {
      done: p.tasks.filter((x) => x.status === "Completed").length,
      total: p.tasks.length,
    };
  };

  const empOf = (id: string) => db.employees.find((e) => e.id === id);

  const dueText = (pid: string) => {
    const p = db.projects.find((x) => x.id === pid);
    if (!p || !p.due) return "";
    return new Date(p.due + "T00:00:00").toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
    });
  };

  const cycle = (task: FlatTask) =>
    setProjectTaskStatus(
      task.projectId,
      task.id,
      TASK_ORDER[(TASK_ORDER.indexOf(task.status) + 1) % 3]
    );

  const members = proj
    ? db.employees.filter((e) =>
        db.projects.find((p) => p.id === proj)?.assignees.includes(e.id)
      )
    : [];

  const addTask = () => {
    if (!proj) {
      toast("Pick a project first");
      return;
    }
    if (!text.trim()) return;
    addProjectTask(proj, text, who);
    setText("");
    toast("Task added");
  };

  return (
    <div className="card">
      <div className="tboard-head">
        <div>
          <h2>👥 {t("tb.title")}</h2>
          <p className="sub">{t("tb.sub", { active, done, pending })}</p>
        </div>
        <LiveClock />
      </div>

      <div className="tboard-controls">
        <select
          className="taskassign projsel"
          value={proj}
          onChange={(e) => {
            setProj(e.target.value);
            setWho("");
          }}
        >
          <option value="">{t("pr.project")}</option>
          {db.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          className="taskassign"
          value={who}
          onChange={(e) => setWho(e.target.value)}
          disabled={!proj}
        >
          <option value="">{t("c.who")}</option>
          {members.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <input
          className="agtext"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addTask();
          }}
          placeholder={t("tb.taskTitle")}
        />
        <button className="btn sm" onClick={addTask}>
          ＋ {t("c.add")}
        </button>
        <label className="toggle" style={{ marginInlineStart: "auto" }}>
          <input
            type="checkbox"
            checked={hideDone}
            onChange={(e) => setHideDone(e.target.checked)}
          />
          {t("tm.hideDone")}
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="empty">{t("tb.noTasks")}</div>
      ) : (
        <div className="tboard-grid">
          {visible.map((task, i) => {
            const emp = empOf(task.assignee);
            const ps = projStats(task.projectId);
            return (
              <TaskCard
                key={task.id}
                task={task}
                index={i}
                projDone={ps.done}
                projTotal={ps.total}
                due={dueText(task.projectId)}
                empName={emp?.name || ""}
                empRole={emp?.role || ""}
                onCycle={() => cycle(task)}
                onDelete={() => delProjectTask(task.projectId, task.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
