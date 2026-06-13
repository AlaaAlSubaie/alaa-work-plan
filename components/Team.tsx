"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { TaskStatus, Employee } from "@/lib/types";
import { useToast } from "./Toast";
import { useLang } from "@/lib/i18n";

const TASK_ORDER: TaskStatus[] = ["Pending", "Progress", "Completed"];
const pillKey = (s: TaskStatus) =>
  s === "Progress" ? "ts.Progress" : s === "Completed" ? "ts.Done" : "ts.Pending";
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

function TaskList({
  tasks,
  hideDone,
  onCycle,
}: {
  tasks: FlatTask[];
  hideDone: boolean;
  onCycle: (pid: string, tid: string, cur: TaskStatus) => void;
}) {
  const { t } = useLang();
  const visible = (hideDone ? tasks.filter((x) => x.status !== "Completed") : tasks)
    .slice()
    .sort((a, b) => RANK[a.status] - RANK[b.status]);
  if (visible.length === 0) return <div className="psub-empty">{t("tm.noTasks")}</div>;
  return (
    <>
      {visible.map((task) => (
        <div key={task.id} className="taskrow">
          <button
            className={"taskpill tp-" + task.status}
            onClick={() => onCycle(task.projectId, task.id, task.status)}
            title="Click to change status"
          >
            {t(pillKey(task.status))}
          </button>
          <span
            className={"subtext" + (task.status === "Completed" ? " done" : "")}
          >
            {task.text}
          </span>
          <span className="projbadge">📂 {task.projectName}</span>
        </div>
      ))}
    </>
  );
}

function EmployeeCard({
  emp,
  tasks,
  hideDone,
  onCycle,
}: {
  emp: Employee;
  tasks: FlatTask[];
  hideDone: boolean;
  onCycle: (pid: string, tid: string, cur: TaskStatus) => void;
}) {
  const { db, addProjectTask } = useStore();
  const toast = useToast();
  const { t } = useLang();
  const [proj, setProj] = useState("");
  const [text, setText] = useState("");

  const assignedProjects = db.projects.filter((p) => p.assignees.includes(emp.id));
  const ip = tasks.filter((x) => x.status === "Progress").length;
  const pend = tasks.filter((x) => x.status === "Pending").length;
  const done = tasks.filter((x) => x.status === "Completed").length;

  const add = () => {
    if (!proj) {
      toast("Pick a project first");
      return;
    }
    if (!text.trim()) return;
    addProjectTask(proj, text, emp.id);
    setText("");
    toast("Task added");
  };

  return (
    <div className="empcard">
      <div className="empcard-head">
        <span className="ava-lg" style={{ background: avatarColor(emp.name) }}>
          {initials(emp.name)}
        </span>
        <div className="empcard-id">
          <div className="empcard-name">
            {emp.name}
            {emp.role && <span className="emprole">{emp.role}</span>}
          </div>
          <div className="empcard-stats">
            <span className="stat ip">{t("tm.inProgress", { n: ip })}</span>
            <span className="stat pend">{t("tm.pending", { n: pend })}</span>
            <span className="stat done">{t("tm.done", { n: done })}</span>
          </div>
        </div>
      </div>

      {assignedProjects.length === 0 ? (
        <div className="psub-empty">{t("tm.assignFirst", { name: emp.name })}</div>
      ) : (
        <div className="psub-add wrap" style={{ marginBottom: 10 }}>
          <select
            className="taskassign projsel"
            value={proj}
            onChange={(e) => setProj(e.target.value)}
            title="Project"
          >
            <option value="">{t("pr.project")}</option>
            {assignedProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            className="agtext"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
            placeholder={t("tm.addFor", { name: emp.name })}
          />
          <button className="btn sm" onClick={add}>
            ＋ {t("c.add")}
          </button>
        </div>
      )}

      <div className="empcard-tasks">
        <TaskList tasks={tasks} hideDone={hideDone} onCycle={onCycle} />
      </div>
    </div>
  );
}

export default function Team() {
  const { db, setProjectTaskStatus } = useStore();
  const { t } = useLang();
  const [hideDone, setHideDone] = useState(false);

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

  const onCycle = (pid: string, tid: string, cur: TaskStatus) =>
    setProjectTaskStatus(pid, tid, TASK_ORDER[(TASK_ORDER.indexOf(cur) + 1) % 3]);

  const unassigned = all.filter(
    (x) => !x.assignee || !db.employees.some((e) => e.id === x.assignee)
  );

  return (
    <div className="card">
      <h2 className="sec">👥 {t("tm.title")}</h2>
      <p className="hint">{t("tm.hint")}</p>
      <label className="toggle" style={{ marginBottom: 14 }}>
        <input
          type="checkbox"
          checked={hideDone}
          onChange={(e) => setHideDone(e.target.checked)}
        />
        {t("tm.hideDone")}
      </label>

      {db.employees.length === 0 ? (
        <div className="empty">{t("tm.noMembers")}</div>
      ) : (
        db.employees.map((e) => (
          <EmployeeCard
            key={e.id}
            emp={e}
            tasks={all.filter((x) => x.assignee === e.id)}
            hideDone={hideDone}
            onCycle={onCycle}
          />
        ))
      )}

      {unassigned.length > 0 && (
        <div className="empcard">
          <div className="empcard-head">
            <span className="ava-lg" style={{ background: "#94a3b8" }}>
              —
            </span>
            <div className="empcard-id">
              <div className="empcard-name">{t("tm.unassigned")}</div>
              <div className="empcard-stats">
                <span className="stat">
                  {t("tm.noOwner", { n: unassigned.length })}
                </span>
              </div>
            </div>
          </div>
          <div className="empcard-tasks">
            <TaskList tasks={unassigned} hideDone={hideDone} onCycle={onCycle} />
          </div>
        </div>
      )}
    </div>
  );
}
