"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { TaskStatus, TaskPriority, PRIORITIES, Project } from "@/lib/types";
import { useToast } from "./Toast";
import { useLang } from "@/lib/i18n";

const TASK_ORDER: TaskStatus[] = ["Pending", "Progress", "Completed"];
const pillKey = (s: TaskStatus) =>
  s === "Progress" ? "ts.Progress" : s === "Completed" ? "ts.Done" : "ts.Pending";
const PRIORITY_COLOR: Record<TaskPriority, string> = {
  High: "var(--status-issue-fg)",
  Medium: "var(--status-progress-fg)",
  Low: "var(--text-muted)",
};

function initials(name: string) {
  const a = name.trim().split(/\s+/);
  return ((a[0]?.[0] || "") + (a[1]?.[0] || "")).toUpperCase();
}
const AVA_BG = ["#0071e3", "#5e5ce6", "#d97706", "#1d8a4e", "#be3455"];
const avaBg = (name: string) => AVA_BG[(name.charCodeAt(0) || 0) % AVA_BG.length];

function LiveClock() {
  const { t } = useLang();
  const [now, setNow] = useState("");
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

export default function Team() {
  const {
    db,
    setProjectTaskStatus,
    setProjectTaskAssignee,
    setProjectTaskPriority,
    editProjectTask,
    addProjectTask,
    delProjectTask,
  } = useStore();
  const { t, locale } = useLang();
  const toast = useToast();
  // which employee's details are open: employee id, "unassigned", or null
  const [open, setOpen] = useState<string | null>(null);
  const [addText, setAddText] = useState<Record<string, string>>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const cycle = (pid: string, tid: string, cur: TaskStatus) =>
    setProjectTaskStatus(pid, tid, TASK_ORDER[(TASK_ORDER.indexOf(cur) + 1) % 3]);

  // tasks assigned to an employee, across all projects
  const tasksOf = (empId: string) =>
    db.projects.flatMap((p) => p.tasks.filter((tk) => tk.assignee === empId));

  // projects relevant to an employee: assigned to OR has tasks for them
  const projectsOf = (empId: string) =>
    db.projects.filter(
      (p) => p.assignees.includes(empId) || p.tasks.some((tk) => tk.assignee === empId)
    );

  // unassigned tasks (no owner or owner not in roster)
  const unassignedProjects = db.projects.filter((p) =>
    p.tasks.some(
      (tk) => !tk.assignee || !db.employees.some((e) => e.id === tk.assignee)
    )
  );
  const unassignedTasks = db.projects.flatMap((p) =>
    p.tasks.filter(
      (tk) => !tk.assignee || !db.employees.some((e) => e.id === tk.assignee)
    )
  );

  const allActive = db.projects.flatMap((p) => p.tasks).filter((tk) => tk.status === "Progress").length;
  const allDone = db.projects.flatMap((p) => p.tasks).filter((tk) => tk.status === "Completed").length;

  const dueText = (p: Project) =>
    p.due
      ? new Date(p.due + "T00:00:00").toLocaleDateString(locale, {
          month: "short",
          day: "numeric",
        })
      : "";

  // ---- the details popup ----
  const renderModal = () => {
    if (!open) return null;
    const isUnassigned = open === "unassigned";
    const emp = isUnassigned ? null : db.employees.find((e) => e.id === open);
    if (!isUnassigned && !emp) return null;

    const name = emp ? emp.name : t("tm.unassigned");
    const role = emp ? emp.role : "";
    const projects = isUnassigned ? unassignedProjects : projectsOf(open);
    const tasksInProj = (p: Project) =>
      p.tasks.filter((tk) =>
        isUnassigned
          ? !tk.assignee || !db.employees.some((e) => e.id === tk.assignee)
          : tk.assignee === open
      );

    return (
      <div className="modal-overlay" onClick={() => setOpen(null)}>
        <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <span
              className="ava-lg"
              style={{ background: emp ? avaBg(name) : "#94a3b8" }}
            >
              {emp ? initials(name) : "—"}
            </span>
            <div className="modal-title">
              <div className="nm">{name}</div>
              {role && <div className="rl">{role}</div>}
            </div>
            <button
              className="modal-close"
              title={t("tb.close")}
              onClick={() => setOpen(null)}
            >
              ✕
            </button>
          </div>

          <div className="modal-body">
            {projects.length === 0 ? (
              <div className="empty">{t("tb.noProjects")}</div>
            ) : (
              projects.map((p) => {
                const list = tasksInProj(p);
                const key = open + ":" + p.id;
                return (
                  <div className="modal-proj" key={p.id}>
                    <div className="modal-proj-head">
                      <span className={"dot d-" + p.status} />
                      {p.name}
                      <span className="badge b-stage">{t("stage." + p.status)}</span>
                      {p.due && <span className="modal-due">🗓️ {dueText(p)}</span>}
                    </div>

                    {list.length === 0 ? (
                      <div className="psub-empty">{t("tb.noTasksProj")}</div>
                    ) : (
                      list.map((tk) => (
                        <div className="taskrow" key={tk.id}>
                          <button
                            className={"taskpill tp-" + tk.status}
                            onClick={() => cycle(p.id, tk.id, tk.status)}
                            title="Click to change status"
                          >
                            {t(pillKey(tk.status))}
                          </button>
                          {editId === tk.id ? (
                            <input
                              className="taskedit"
                              value={editText}
                              autoFocus
                              onChange={(ev) => setEditText(ev.target.value)}
                              onBlur={() => {
                                if (editText.trim())
                                  editProjectTask(p.id, tk.id, editText);
                                setEditId(null);
                              }}
                              onKeyDown={(ev) => {
                                if (ev.key === "Enter") {
                                  if (editText.trim())
                                    editProjectTask(p.id, tk.id, editText);
                                  setEditId(null);
                                }
                                if (ev.key === "Escape") setEditId(null);
                              }}
                            />
                          ) : (
                            <span
                              className={
                                "subtext" +
                                (tk.status === "Completed" ? " done" : "")
                              }
                              onDoubleClick={() => {
                                setEditId(tk.id);
                                setEditText(tk.text);
                              }}
                            >
                              {tk.text}
                            </span>
                          )}
                          {isUnassigned && (
                            <select
                              className="taskassign"
                              value=""
                              onChange={(e) =>
                                e.target.value &&
                                setProjectTaskAssignee(p.id, tk.id, e.target.value)
                              }
                            >
                              <option value="">{t("c.who")}</option>
                              {db.employees
                                .filter((e) => p.assignees.includes(e.id))
                                .map((e) => (
                                  <option key={e.id} value={e.id}>
                                    {e.name}
                                  </option>
                                ))}
                            </select>
                          )}
                          <span className="prio-group">
                            {PRIORITIES.map((pr) => (
                              <button
                                key={pr}
                                className={
                                  "prio-btn p-" + pr + (tk.priority === pr ? " on" : "")
                                }
                                onClick={() =>
                                  setProjectTaskPriority(p.id, tk.id, pr)
                                }
                              >
                                {t("prio." + pr)}
                              </button>
                            ))}
                          </span>
                          <button
                            className="iconbtn"
                            title="Edit name"
                            onClick={() => {
                              setEditId(tk.id);
                              setEditText(tk.text);
                            }}
                          >
                            ✏️
                          </button>
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

                    {/* add a task in this project for this employee */}
                    {!isUnassigned && (
                      <div className="psub-add" style={{ marginTop: 8 }}>
                        <input
                          value={addText[key] || ""}
                          onChange={(e) =>
                            setAddText((s) => ({ ...s, [key]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (addText[key] || "").trim()) {
                              addProjectTask(p.id, addText[key], open);
                              setAddText((s) => ({ ...s, [key]: "" }));
                            }
                          }}
                          placeholder={t("tb.taskTitle")}
                        />
                        <button
                          className="btn sm"
                          onClick={() => {
                            if (!(addText[key] || "").trim()) return;
                            addProjectTask(p.id, addText[key], open);
                            setAddText((s) => ({ ...s, [key]: "" }));
                            toast(t("toast.taskAdded"));
                          }}
                        >
                          ＋
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="tboard-head">
        <div>
          <h2>👥 {t("tb.title")}</h2>
          <p className="sub">
            {t("tb.subMembers", {
              members: db.employees.length,
              active: allActive,
              done: allDone,
            })}
          </p>
        </div>
        <LiveClock />
      </div>

      {db.employees.length === 0 && unassignedTasks.length === 0 ? (
        <div className="empty">{t("tb.noEmps")}</div>
      ) : (
        <div className="tboard-grid">
          {db.employees.map((e, i) => {
            const tasks = tasksOf(e.id);
            const ip = tasks.filter((tk) => tk.status === "Progress").length;
            const pend = tasks.filter((tk) => tk.status === "Pending").length;
            const done = tasks.filter((tk) => tk.status === "Completed").length;
            const onState = ip > 0 ? "busy" : tasks.length && done === tasks.length ? "on" : "off";
            const accent =
              onState === "busy"
                ? "var(--status-progress-fg)"
                : onState === "on"
                ? "var(--status-done-fg)"
                : "var(--ink-300)";
            return (
              <article
                className="aw-etc emp-clickable"
                key={e.id}
                style={{ animationDelay: i * 70 + "ms" }}
                onClick={() => setOpen(e.id)}
              >
                <span className="aw-etc__accent" style={{ background: accent }} />
                <div className="aw-etc__top">
                  <div className="aw-etc__ava">
                    <span
                      className="aw-etc__avacircle"
                      style={{ background: avaBg(e.name) }}
                    >
                      {initials(e.name)}
                    </span>
                    <span className={"aw-etc__on aw-etc__on--" + onState} />
                  </div>
                  <div className="aw-etc__who">
                    <div className="aw-etc__name">{e.name}</div>
                    <div className="aw-etc__role">{e.role}</div>
                  </div>
                </div>
                <div className="empcard-stats">
                  <span className="stat ip">{t("tm.inProgress", { n: ip })}</span>
                  <span className="stat pend">{t("tm.pending", { n: pend })}</span>
                  <span className="stat done">{t("tm.done", { n: done })}</span>
                </div>
                <div className="emp-foot">
                  <span>
                    {t("tb.tasksProjects", {
                      tasks: tasks.length,
                      projects: projectsOf(e.id).length,
                    })}
                  </span>
                  <span className="emp-open">{t("tb.viewDetails")} →</span>
                </div>
              </article>
            );
          })}

          {unassignedTasks.length > 0 && (
            <article
              className="aw-etc emp-clickable"
              style={{ animationDelay: db.employees.length * 70 + "ms" }}
              onClick={() => setOpen("unassigned")}
            >
              <span className="aw-etc__accent" style={{ background: "var(--ink-300)" }} />
              <div className="aw-etc__top">
                <div className="aw-etc__ava">
                  <span className="aw-etc__avacircle" style={{ background: "#94a3b8" }}>
                    —
                  </span>
                </div>
                <div className="aw-etc__who">
                  <div className="aw-etc__name">{t("tm.unassigned")}</div>
                  <div className="aw-etc__role">{t("tm.noOwner", { n: unassignedTasks.length })}</div>
                </div>
              </div>
              <div className="emp-foot">
                <span>
                  {t("tb.tasksProjects", {
                    tasks: unassignedTasks.length,
                    projects: unassignedProjects.length,
                  })}
                </span>
                <span className="emp-open">{t("tb.viewDetails")} →</span>
              </div>
            </article>
          )}
        </div>
      )}

      {renderModal()}
    </div>
  );
}
