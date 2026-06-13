"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { TaskStatus } from "@/lib/types";

const TASK_ORDER: TaskStatus[] = ["Pending", "Progress", "Completed"];
const taskPillLabel = (s: TaskStatus) =>
  s === "Progress" ? "In Progress" : s === "Completed" ? "Done" : "Pending";
const RANK: Record<TaskStatus, number> = { Progress: 0, Pending: 1, Completed: 2 };

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase();
}
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h} 52% 45%)`;
}

interface FlatTask {
  id: string;
  text: string;
  status: TaskStatus;
  assignee: string;
  projectId: string;
  projectName: string;
}

export default function Team() {
  const { db, setProjectTaskStatus } = useStore();
  const [hideDone, setHideDone] = useState(false);

  const all: FlatTask[] = db.projects.flatMap((p) =>
    p.tasks.map((t) => ({
      id: t.id,
      text: t.text,
      status: t.status,
      assignee: t.assignee,
      projectId: p.id,
      projectName: p.name,
    }))
  );

  const cycle = (pid: string, tid: string, cur: TaskStatus) =>
    setProjectTaskStatus(pid, tid, TASK_ORDER[(TASK_ORDER.indexOf(cur) + 1) % 3]);

  const unassigned = all.filter(
    (t) => !t.assignee || !db.employees.some((e) => e.id === t.assignee)
  );

  const renderTasks = (tasks: FlatTask[]) => {
    const visible = (hideDone ? tasks.filter((t) => t.status !== "Completed") : tasks)
      .slice()
      .sort((a, b) => RANK[a.status] - RANK[b.status]);
    if (visible.length === 0)
      return <div className="psub-empty">No tasks.</div>;
    return visible.map((t) => (
      <div key={t.id} className="taskrow">
        <button
          className={"taskpill tp-" + t.status}
          onClick={() => cycle(t.projectId, t.id, t.status)}
          title="Click to change status"
        >
          {taskPillLabel(t.status)}
        </button>
        <span className={"subtext" + (t.status === "Completed" ? " done" : "")}>
          {t.text}
        </span>
        <span className="projbadge">📂 {t.projectName}</span>
      </div>
    ));
  };

  return (
    <div className="card">
      <h2 className="sec">👥 Team workload</h2>
      <p className="hint">
        Every member&apos;s tasks across all projects, so you can keep up. Click a
        status pill to update it (Pending → In Progress → Done). Add or remove
        team members in <b>📂 Projects → 👥 Manage team</b>.
      </p>
      <label className="toggle" style={{ marginBottom: 14 }}>
        <input
          type="checkbox"
          checked={hideDone}
          onChange={(e) => setHideDone(e.target.checked)}
        />
        Hide completed tasks
      </label>

      {db.employees.length === 0 ? (
        <div className="empty">
          No team members yet. Add them in 📂 Projects → 👥 Manage team.
        </div>
      ) : (
        db.employees.map((e) => {
          const tasks = all.filter((t) => t.assignee === e.id);
          const ip = tasks.filter((t) => t.status === "Progress").length;
          const pend = tasks.filter((t) => t.status === "Pending").length;
          const done = tasks.filter((t) => t.status === "Completed").length;
          return (
            <div className="empcard" key={e.id}>
              <div className="empcard-head">
                <span
                  className="ava-lg"
                  style={{ background: avatarColor(e.name) }}
                >
                  {initials(e.name)}
                </span>
                <div className="empcard-id">
                  <div className="empcard-name">
                    {e.name}
                    {e.role && <span className="emprole">{e.role}</span>}
                  </div>
                  <div className="empcard-stats">
                    <span className="stat ip">{ip} in progress</span>
                    <span className="stat pend">{pend} pending</span>
                    <span className="stat done">{done} done</span>
                  </div>
                </div>
              </div>
              <div className="empcard-tasks">{renderTasks(tasks)}</div>
            </div>
          );
        })
      )}

      {unassigned.length > 0 && (
        <div className="empcard">
          <div className="empcard-head">
            <span className="ava-lg" style={{ background: "#94a3b8" }}>
              —
            </span>
            <div className="empcard-id">
              <div className="empcard-name">Unassigned tasks</div>
              <div className="empcard-stats">
                <span className="stat">
                  {unassigned.length} task{unassigned.length > 1 ? "s" : ""} with
                  no owner
                </span>
              </div>
            </div>
          </div>
          <div className="empcard-tasks">{renderTasks(unassigned)}</div>
        </div>
      )}
    </div>
  );
}
