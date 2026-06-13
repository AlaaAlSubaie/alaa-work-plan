"use client";

import { useState, DragEvent, KeyboardEvent } from "react";
import { useStore } from "@/lib/store";
import { COLUMNS, Status, Project, TaskStatus } from "@/lib/types";
import { useToast } from "./Toast";
import { useLang } from "@/lib/i18n";

const TASK_ORDER: TaskStatus[] = ["Pending", "Progress", "Completed"];
const pillKey = (s: TaskStatus) =>
  s === "Progress" ? "ts.Progress" : s === "Completed" ? "ts.Done" : "ts.Pending";

/* ---------- avatar helpers ---------- */
function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase();
}
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h} 52% 45%)`;
}

/* ---------- date helpers ---------- */
function daysUntil(iso: string) {
  const d = new Date(iso + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}
function shortDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
type DueLevel = "overdue" | "soon" | "ok";
function dueInfo(iso: string): { n: number; level: DueLevel; txt: string } | null {
  if (!iso) return null;
  const n = daysUntil(iso);
  const level: DueLevel = n < 0 ? "overdue" : n <= 3 ? "soon" : "ok";
  let txt: string;
  if (n < 0) txt = `${Math.abs(n)}d overdue`;
  else if (n === 0) txt = "due today";
  else if (n === 1) txt = "due tomorrow";
  else txt = `in ${n} days`;
  return { n, level, txt };
}

/* ---------- per-project tasks + issues + target date ---------- */
function ProjectDetail({ p }: { p: Project }) {
  const {
    db,
    setProjectDue,
    addProjectTask,
    setProjectTaskStatus,
    setProjectTaskAssignee,
    delProjectTask,
    addProjectIssue,
    toggleProjectIssue,
    delProjectIssue,
    toggleAssignee,
  } = useStore();
  const { t } = useLang();
  const [task, setTask] = useState("");
  const [taskWho, setTaskWho] = useState("");
  const [issue, setIssue] = useState("");

  const addTask = () => {
    if (!task.trim()) return;
    addProjectTask(p.id, task, taskWho);
    setTask("");
  };
  const cycleTask = (taskId: string, cur: TaskStatus) => {
    const next = TASK_ORDER[(TASK_ORDER.indexOf(cur) + 1) % TASK_ORDER.length];
    setProjectTaskStatus(p.id, taskId, next);
  };

  // members actually assigned to this project, and those still available to add
  const members = db.employees.filter((e) => p.assignees.includes(e.id));
  const available = db.employees.filter((e) => !p.assignees.includes(e.id));
  // task assignee options = project members (+ the task's current owner if set)
  const taskOptions = (currentId: string) => {
    const list = [...members];
    if (currentId && !list.some((m) => m.id === currentId)) {
      const emp = db.employees.find((e) => e.id === currentId);
      if (emp) list.push(emp);
    }
    return list;
  };

  return (
    <div className="psub">
      {/* team on this project — pick from a menu, show only those selected */}
      <div className="psub-sec">
        <div className="psub-title">👥 {t("pr.teamOnProject")}</div>
        {db.employees.length === 0 ? (
          <div className="psub-empty">{t("pr.addTeamFirst")}</div>
        ) : (
          <>
            {available.length > 0 && (
              <select
                className="taskassign addmember"
                value=""
                onChange={(e) => {
                  if (e.target.value) toggleAssignee(p.id, e.target.value);
                }}
              >
                <option value="">{t("pr.addMember")}</option>
                {available.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                    {e.role ? ` (${e.role})` : ""}
                  </option>
                ))}
              </select>
            )}
            {members.length === 0 ? (
              <div className="psub-empty">{t("pr.noMembers")}</div>
            ) : (
              <div className="assign-chips">
                {members.map((e) => (
                  <span key={e.id} className="assign-chip on" title={e.role || e.name}>
                    <span
                      className="mini-ava"
                      style={{ background: avatarColor(e.name) }}
                    >
                      {initials(e.name)}
                    </span>
                    {e.name}
                    <button
                      className="chipx"
                      title="Remove from project"
                      onClick={() => toggleAssignee(p.id, e.id)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* target date */}
      <div className="psub-sec">
        <div className="psub-title">🗓️ {t("pr.targetDate")}</div>
        <div className="psub-date">
          <input
            type="date"
            value={p.due}
            onChange={(e) => setProjectDue(p.id, e.target.value)}
          />
          {p.due && (
            <button
              className="btn ghost sm"
              onClick={() => setProjectDue(p.id, "")}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* tasks */}
      <div className="psub-sec">
        <div className="psub-title">✅ {t("pr.tasks")}</div>
        <div className="psub-add wrap">
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") addTask();
            }}
            placeholder={t("pr.addTaskPh")}
          />
          <select
            className="taskassign"
            value={taskWho}
            onChange={(e) => setTaskWho(e.target.value)}
            title="Assign to"
          >
            <option value="">{t("c.who")}</option>
            {members.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <button className="btn sm" onClick={addTask}>
            ＋
          </button>
        </div>
        {p.tasks.length === 0 ? (
          <div className="psub-empty">{t("pr.noTasks")}</div>
        ) : (
          p.tasks.map((tk) => (
            <div key={tk.id} className="taskrow">
              <button
                className={"taskpill tp-" + tk.status}
                onClick={() => cycleTask(tk.id, tk.status)}
                title="Click to change status"
              >
                {t(pillKey(tk.status))}
              </button>
              <span
                className={"subtext" + (tk.status === "Completed" ? " done" : "")}
              >
                {tk.text}
              </span>
              <select
                className="taskassign"
                value={tk.assignee}
                onChange={(e) =>
                  setProjectTaskAssignee(p.id, tk.id, e.target.value)
                }
              >
                <option value="">{t("c.who")}</option>
                {taskOptions(tk.assignee).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
              <button
                className="iconbtn"
                title="Delete"
                onClick={() => delProjectTask(p.id, tk.id)}
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>

      {/* issues */}
      <div className="psub-sec">
        <div className="psub-title">⚠️ {t("pr.issues")}</div>
        <div className="psub-add">
          <input
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                addProjectIssue(p.id, issue);
                setIssue("");
              }
            }}
            placeholder={t("pr.addIssuePh")}
          />
          <button
            className="btn sm"
            onClick={() => {
              addProjectIssue(p.id, issue);
              setIssue("");
            }}
          >
            ＋
          </button>
        </div>
        {p.issues.length === 0 ? (
          <div className="psub-empty">{t("pr.noIssues")}</div>
        ) : (
          p.issues.map((i) => (
            <div key={i.id} className={"subrow issue" + (i.resolved ? " done" : "")}>
              <input
                type="checkbox"
                checked={i.resolved}
                title={i.resolved ? "Resolved" : "Mark resolved"}
                onChange={() => toggleProjectIssue(p.id, i.id)}
              />
              <span className="subtext">{i.text}</span>
              <button
                className="iconbtn"
                title="Delete"
                onClick={() => delProjectIssue(p.id, i.id)}
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function Projects() {
  const {
    db,
    addProject,
    editProject,
    setProjectStatus,
    delProject,
    addEmployee,
    delEmployee,
  } = useStore();
  const toast = useToast();
  const { t } = useLang();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>("Upcoming");
  const [due, setDue] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<Status | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showTeam, setShowTeam] = useState(false);
  const [empName, setEmpName] = useState("");
  const [empRole, setEmpRole] = useState("");

  const order = COLUMNS.map((c) => c.key);

  const add = () => {
    if (!name.trim()) {
      toast("Enter a project name");
      return;
    }
    addProject(name, note, status, due);
    setName("");
    setNote("");
    setDue("");
    toast("Project added");
  };

  const move = (id: string, dir: number) => {
    const p = db.projects.find((x) => x.id === id);
    if (!p) return;
    let i = order.indexOf(p.status) + dir;
    i = Math.max(0, Math.min(order.length - 1, i));
    setProjectStatus(id, order[i]);
  };

  const onDrop = (e: DragEvent, col: Status) => {
    e.preventDefault();
    setOverCol(null);
    if (dragId) setProjectStatus(dragId, col);
    setDragId(null);
  };

  // reminders: non-completed projects with a due date that is overdue or due soon
  const reminders = db.projects
    .filter((p) => p.status !== "Completed" && p.due)
    .map((p) => ({ p, info: dueInfo(p.due)! }))
    .filter((r) => r.info.level !== "ok")
    .sort((a, b) => a.info.n - b.info.n);

  return (
    <div className="card">
      <h2 className="sec">➕ {t("pr.addProject")}</h2>
      <div className="addproj">
        <input
          className="pn"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={t("pr.name")}
        />
        <input
          className="pd"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("pr.note")}
        />
        <input
          type="date"
          className="pdate-in"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          title="Target / reminder date (optional)"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value as Status)}>
          {COLUMNS.map((c) => (
            <option key={c.key} value={c.key}>
              {t("stage." + c.key)}
            </option>
          ))}
        </select>
        <button className="btn" onClick={add}>
          {t("pr.addBtn")}
        </button>
      </div>
      <p className="hint">{t("pr.hint")}</p>

      {/* manage team */}
      <div className="teampanel">
        <button
          className="teamtoggle"
          onClick={() => setShowTeam((s) => !s)}
        >
          {showTeam ? "▾" : "▸"} 👥 {t("pr.manageTeam")} ({db.employees.length})
        </button>
        {showTeam && (
          <div className="teambody">
            <div className="teamadd">
              <input
                value={empName}
                onChange={(e) => setEmpName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addEmployee(empName, empRole);
                    setEmpName("");
                    setEmpRole("");
                  }
                }}
                placeholder={t("pr.empName")}
              />
              <input
                value={empRole}
                onChange={(e) => setEmpRole(e.target.value)}
                placeholder={t("pr.empRole")}
              />
              <button
                className="btn sm"
                onClick={() => {
                  if (!empName.trim()) {
                    toast("Enter a name");
                    return;
                  }
                  addEmployee(empName, empRole);
                  setEmpName("");
                  setEmpRole("");
                }}
              >
                ＋ {t("c.add")}
              </button>
            </div>
            {db.employees.length === 0 ? (
              <div className="psub-empty">{t("pr.noTeam")}</div>
            ) : (
              <div className="emplist">
                {db.employees.map((e) => (
                  <div className="empitem" key={e.id}>
                    <span
                      className="mini-ava"
                      style={{ background: avatarColor(e.name) }}
                    >
                      {initials(e.name)}
                    </span>
                    <span className="empname">{e.name}</span>
                    {e.role && <span className="emprole">{e.role}</span>}
                    <button
                      className="iconbtn"
                      title="Remove"
                      onClick={() => {
                        if (confirm(`Remove ${e.name} from the team?`))
                          delEmployee(e.id);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* reminders banner */}
      {reminders.length > 0 && (
        <div className="reminders">
          <div className="rem-head">🔔 {t("rem.head", { n: reminders.length })}</div>
          {reminders.map(({ p, info }) => (
            <div key={p.id} className="rem-row">
              <span className={"rem-dot lvl-" + info.level} />
              <span className="rem-name">{p.name}</span>
              <span className="rem-stage">{t("stage." + p.status)}</span>
              <span className={"rem-when lvl-" + info.level}>
                {shortDate(p.due)} · {info.txt}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="board board-6">
        {COLUMNS.map(({ key }) => {
          const items = db.projects
            .filter((p) => p.status === key)
            .sort((a, b) => {
              if (a.due && b.due) return a.due.localeCompare(b.due);
              if (a.due) return -1;
              if (b.due) return 1;
              return a.ts - b.ts;
            });
          return (
            <div
              key={key}
              className={"col" + (overCol === key ? " drag" : "")}
              onDragOver={(e) => {
                e.preventDefault();
                setOverCol(key);
              }}
              onDragLeave={() => setOverCol((c) => (c === key ? null : c))}
              onDrop={(e) => onDrop(e, key)}
            >
              <div className="colhead">
                <span className={"dot d-" + key}></span>
                {t("stage." + key)}
                <span className="count">{items.length}</span>
              </div>
              {items.map((p) => {
                const doneTasks = p.tasks.filter((t) => t.status === "Completed").length;
                const openIssues = p.issues.filter((i) => !i.resolved).length;
                const isOpen = !!expanded[p.id];
                const info = dueInfo(p.due);
                const completed = p.status === "Completed";
                const team = p.assignees
                  .map((id) => db.employees.find((e) => e.id === id))
                  .filter(Boolean) as { id: string; name: string; role: string }[];
                return (
                  <div
                    key={p.id}
                    className={"pcard l-" + key + (dragId === p.id ? " dragging" : "")}
                  >
                    <div
                      className="pcard-handle"
                      draggable
                      onDragStart={() => setDragId(p.id)}
                      onDragEnd={() => setDragId(null)}
                    >
                      <div className="pname">{p.name}</div>
                      {p.note && <div className="pnote">{p.note}</div>}
                    </div>

                    {/* due badge */}
                    {info && (
                      <div
                        className={
                          "duebadge " + (completed ? "lvl-done" : "lvl-" + info.level)
                        }
                      >
                        🗓️ {shortDate(p.due)}
                        {!completed && <> · {info.txt}</>}
                      </div>
                    )}

                    {/* assigned team avatars */}
                    {team.length > 0 && (
                      <div className="cardteam">
                        {team.map((e) => (
                          <span
                            key={e.id}
                            className="mini-ava"
                            style={{ background: avatarColor(e.name) }}
                            title={e.role ? `${e.name} — ${e.role}` : e.name}
                          >
                            {initials(e.name)}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* summary chips */}
                    {(p.tasks.length > 0 || p.issues.length > 0) && (
                      <div className="psummary">
                        {p.tasks.length > 0 && (
                          <span className="schip t">
                            ✅ {doneTasks}/{p.tasks.length}
                          </span>
                        )}
                        {openIssues > 0 && (
                          <span className="schip i">⚠️ {openIssues}</span>
                        )}
                      </div>
                    )}

                    <div className="pfoot">
                      <button
                        className="detailsbtn"
                        onClick={() =>
                          setExpanded((e) => ({ ...e, [p.id]: !e[p.id] }))
                        }
                      >
                        {isOpen ? "▾ " : "▸ "}
                        {t("pr.details")}
                      </button>
                      <span>
                        <button
                          className="iconbtn"
                          title="Move left"
                          onClick={() => move(p.id, -1)}
                        >
                          ◀
                        </button>
                        <button
                          className="iconbtn"
                          title="Move right"
                          onClick={() => move(p.id, 1)}
                        >
                          ▶
                        </button>
                        <button
                          className="iconbtn"
                          title="Edit"
                          onClick={() => {
                            const n = prompt("Project name:", p.name);
                            if (n === null) return;
                            const d = prompt("Note:", p.note || "");
                            editProject(p.id, n, d || "");
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          className="iconbtn"
                          title="Delete"
                          onClick={() => {
                            if (confirm("Delete this project?")) delProject(p.id);
                          }}
                        >
                          🗑️
                        </button>
                      </span>
                    </div>

                    {isOpen && <ProjectDetail p={p} />}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
