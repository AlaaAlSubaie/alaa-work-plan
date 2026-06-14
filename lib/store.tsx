"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "./supabase";
import { loadDB, syncDB } from "./sync";
import {
  DB,
  LogEntry,
  Project,
  ProjectTask,
  ProjectIssue,
  AgendaItem,
  SavedReport,
  Employee,
  Category,
  Meta,
} from "./types";

const KEY = "dept_db_v1";
const EMPTY: DB = {
  logs: [],
  projects: [],
  agenda: [],
  reports: [],
  employees: [],
  meta: { dept: "", user: "" },
};

interface StoreCtx {
  db: DB;
  loaded: boolean;
  addLog: (text: string, cat: LogEntry["cat"]) => void;
  editLog: (id: string, text: string, cat?: LogEntry["cat"]) => void;
  delLog: (id: string) => void;
  addProject: (
    name: string,
    note: string,
    status: Project["status"],
    due: string
  ) => void;
  editProject: (id: string, name: string, note: string) => void;
  setProjectStatus: (id: string, status: Project["status"]) => void;
  setProjectDue: (id: string, due: string) => void;
  delProject: (id: string) => void;
  addProjectTask: (projectId: string, text: string, assignee: string) => void;
  setProjectTaskStatus: (
    projectId: string,
    taskId: string,
    status: ProjectTask["status"]
  ) => void;
  setProjectTaskAssignee: (
    projectId: string,
    taskId: string,
    assignee: string
  ) => void;
  setProjectTaskPriority: (
    projectId: string,
    taskId: string,
    priority: ProjectTask["priority"]
  ) => void;
  editProjectTask: (projectId: string, taskId: string, text: string) => void;
  delProjectTask: (projectId: string, taskId: string) => void;
  addProjectIssue: (projectId: string, text: string) => void;
  toggleProjectIssue: (projectId: string, issueId: string) => void;
  delProjectIssue: (projectId: string, issueId: string) => void;
  addAgenda: (date: string, text: string, time: string, cat?: Category) => void;
  toggleAgenda: (id: string) => void;
  editAgenda: (id: string, text: string, time: string) => void;
  delAgenda: (id: string) => void;
  setAgendaDate: (id: string, date: string) => void;
  saveReport: (r: Omit<SavedReport, "id" | "ts">) => void;
  delReport: (id: string) => void;
  addEmployee: (name: string, role: string) => void;
  delEmployee: (id: string) => void;
  toggleAssignee: (projectId: string, employeeId: string) => void;
  setMeta: (meta: Partial<Meta>) => void;
  replaceAll: (db: DB) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  // Auth / cloud-sync coordination
  const userIdRef = useRef<string | null>(null);
  const cloudReadyRef = useRef(false); // true once we've hydrated from (or confirmed absence of) the cloud
  const skipNextSync = useRef(false); // skip the change that came FROM a cloud load
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1) Instant local load on mount — keeps local/offline runs working immediately.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setDb({
          logs: parsed.logs ?? [],
          projects: (parsed.projects ?? []).map((p: Project) => ({
            ...p,
            status: (p.status as string) === "Done" ? "Completed" : p.status,
            due: p.due ?? "",
            tasks: (p.tasks ?? []).map((t) => ({
              id: t.id,
              text: t.text,
              status: t.status ?? (t.done ? "Completed" : "Pending"),
              assignee: t.assignee ?? "",
              priority: t.priority ?? "Medium",
            })),
            issues: p.issues ?? [],
            assignees: p.assignees ?? [],
          })),
          agenda: parsed.agenda ?? [],
          reports: parsed.reports ?? [],
          employees: parsed.employees ?? [],
          meta: parsed.meta ?? { dept: "", user: "" },
        });
      }
    } catch {
      /* ignore corrupt storage */
    }
    setLoaded(true);
  }, []);

  // 2) Cloud hydration — when signed in, Supabase is the source of truth.
  useEffect(() => {
    let active = true;

    const hydrate = async (uid: string | null) => {
      userIdRef.current = uid;
      if (uid) {
        const cloud = await loadDB();
        if (cloud && active) {
          skipNextSync.current = true; // don't echo the cloud data straight back
          setDb(cloud);
        }
      }
      cloudReadyRef.current = true; // local edits may now sync safely
    };

    supabase.auth.getUser().then(({ data }) => {
      if (active) hydrate(data.user?.id ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "SIGNED_IN") {
        cloudReadyRef.current = false;
        hydrate(session?.user?.id ?? null);
      } else if (event === "SIGNED_OUT") {
        userIdRef.current = null;
        cloudReadyRef.current = false; // back to local-only mode
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // 3) Persist on every change: localStorage always (cache), Supabase when signed in.
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(KEY, JSON.stringify(db));

    if (!userIdRef.current || !cloudReadyRef.current) return; // local-only
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      syncDB(db).catch(() => {
        /* best-effort; localStorage already holds the change */
      });
    }, 700);
  }, [db, loaded]);

  const addLog = useCallback((text: string, cat: LogEntry["cat"]) => {
    const t = text.trim();
    if (!t) return;
    setDb((d) => ({
      ...d,
      logs: [...d.logs, { id: uid(), text: t, cat, ts: Date.now() }],
    }));
  }, []);

  const editLog = useCallback(
    (id: string, text: string, cat?: LogEntry["cat"]) => {
      setDb((d) => ({
        ...d,
        logs: d.logs.map((l) =>
          l.id === id
            ? { ...l, text: text.trim(), cat: cat ?? l.cat }
            : l
        ),
      }));
    },
    []
  );

  const delLog = useCallback((id: string) => {
    setDb((d) => ({ ...d, logs: d.logs.filter((l) => l.id !== id) }));
  }, []);

  const addProject = useCallback(
    (name: string, note: string, status: Project["status"], due: string) => {
      const n = name.trim();
      if (!n) return;
      setDb((d) => ({
        ...d,
        projects: [
          ...d.projects,
          {
            id: uid(),
            name: n,
            note: note.trim(),
            status,
            due: due || "",
            ts: Date.now(),
            tasks: [],
            issues: [],
            assignees: [],
          },
        ],
      }));
    },
    []
  );

  const editProject = useCallback((id: string, name: string, note: string) => {
    setDb((d) => ({
      ...d,
      projects: d.projects.map((p) =>
        p.id === id ? { ...p, name: name.trim(), note: note.trim() } : p
      ),
    }));
  }, []);

  const setProjectStatus = useCallback(
    (id: string, status: Project["status"]) => {
      setDb((d) => ({
        ...d,
        projects: d.projects.map((p) => (p.id === id ? { ...p, status } : p)),
      }));
    },
    []
  );

  const setProjectDue = useCallback((id: string, due: string) => {
    setDb((d) => ({
      ...d,
      projects: d.projects.map((p) => (p.id === id ? { ...p, due } : p)),
    }));
  }, []);

  const delProject = useCallback((id: string) => {
    setDb((d) => ({ ...d, projects: d.projects.filter((p) => p.id !== id) }));
  }, []);

  // helper: update one project immutably
  const patchProject = (
    d: DB,
    projectId: string,
    fn: (p: Project) => Project
  ): DB => ({
    ...d,
    projects: d.projects.map((p) => (p.id === projectId ? fn(p) : p)),
  });

  const addProjectTask = useCallback(
    (projectId: string, text: string, assignee: string) => {
      const t = text.trim();
      if (!t) return;
      setDb((d) =>
        patchProject(d, projectId, (p) => ({
          ...p,
          tasks: [
            ...p.tasks,
            {
              id: uid(),
              text: t,
              status: "Pending",
              assignee: assignee || "",
              priority: "Medium",
            },
          ],
        }))
      );
    },
    []
  );

  const setProjectTaskStatus = useCallback(
    (projectId: string, taskId: string, status: ProjectTask["status"]) => {
      setDb((d) =>
        patchProject(d, projectId, (p) => ({
          ...p,
          tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
        }))
      );
    },
    []
  );

  const setProjectTaskAssignee = useCallback(
    (projectId: string, taskId: string, assignee: string) => {
      setDb((d) =>
        patchProject(d, projectId, (p) => ({
          ...p,
          tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, assignee } : t)),
        }))
      );
    },
    []
  );

  const setProjectTaskPriority = useCallback(
    (projectId: string, taskId: string, priority: ProjectTask["priority"]) => {
      setDb((d) =>
        patchProject(d, projectId, (p) => ({
          ...p,
          tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, priority } : t)),
        }))
      );
    },
    []
  );

  const editProjectTask = useCallback(
    (projectId: string, taskId: string, text: string) => {
      const v = text.trim();
      if (!v) return;
      setDb((d) =>
        patchProject(d, projectId, (p) => ({
          ...p,
          tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, text: v } : t)),
        }))
      );
    },
    []
  );

  const delProjectTask = useCallback((projectId: string, taskId: string) => {
    setDb((d) =>
      patchProject(d, projectId, (p) => ({
        ...p,
        tasks: p.tasks.filter((t) => t.id !== taskId),
      }))
    );
  }, []);

  const addProjectIssue = useCallback((projectId: string, text: string) => {
    const t = text.trim();
    if (!t) return;
    setDb((d) =>
      patchProject(d, projectId, (p) => ({
        ...p,
        issues: [...p.issues, { id: uid(), text: t, resolved: false }],
      }))
    );
  }, []);

  const toggleProjectIssue = useCallback(
    (projectId: string, issueId: string) => {
      setDb((d) =>
        patchProject(d, projectId, (p) => ({
          ...p,
          issues: p.issues.map((i) =>
            i.id === issueId ? { ...i, resolved: !i.resolved } : i
          ),
        }))
      );
    },
    []
  );

  const delProjectIssue = useCallback((projectId: string, issueId: string) => {
    setDb((d) =>
      patchProject(d, projectId, (p) => ({
        ...p,
        issues: p.issues.filter((i) => i.id !== issueId),
      }))
    );
  }, []);

  const addAgenda = useCallback(
    (date: string, text: string, time: string, cat?: Category) => {
      const t = text.trim();
      if (!t || !date) return;
      setDb((d) => ({
        ...d,
        agenda: [
          ...d.agenda,
          { id: uid(), date, text: t, time, done: false, ts: Date.now(), cat },
        ],
      }));
    },
    []
  );

  const toggleAgenda = useCallback((id: string) => {
    setDb((d) => ({
      ...d,
      agenda: d.agenda.map((a) =>
        a.id === id ? { ...a, done: !a.done } : a
      ),
    }));
  }, []);

  const editAgenda = useCallback((id: string, text: string, time: string) => {
    setDb((d) => ({
      ...d,
      agenda: d.agenda.map((a) =>
        a.id === id ? { ...a, text: text.trim(), time } : a
      ),
    }));
  }, []);

  const delAgenda = useCallback((id: string) => {
    setDb((d) => ({ ...d, agenda: d.agenda.filter((a) => a.id !== id) }));
  }, []);

  const setAgendaDate = useCallback((id: string, date: string) => {
    setDb((d) => ({
      ...d,
      agenda: d.agenda.map((a) => (a.id === id ? { ...a, date } : a)),
    }));
  }, []);

  const saveReport = useCallback((r: Omit<SavedReport, "id" | "ts">) => {
    setDb((d) => ({
      ...d,
      reports: [{ ...r, id: uid(), ts: Date.now() }, ...d.reports],
    }));
  }, []);

  const delReport = useCallback((id: string) => {
    setDb((d) => ({ ...d, reports: d.reports.filter((r) => r.id !== id) }));
  }, []);

  const addEmployee = useCallback((name: string, role: string) => {
    const n = name.trim();
    if (!n) return;
    setDb((d) => ({
      ...d,
      employees: [...d.employees, { id: uid(), name: n, role: role.trim() }],
    }));
  }, []);

  const delEmployee = useCallback((id: string) => {
    setDb((d) => ({
      ...d,
      employees: d.employees.filter((e) => e.id !== id),
      // also unassign this employee from every project and task
      projects: d.projects.map((p) => ({
        ...p,
        assignees: p.assignees.filter((a) => a !== id),
        tasks: p.tasks.map((t) =>
          t.assignee === id ? { ...t, assignee: "" } : t
        ),
      })),
    }));
  }, []);

  const toggleAssignee = useCallback(
    (projectId: string, employeeId: string) => {
      setDb((d) => ({
        ...d,
        projects: d.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                assignees: p.assignees.includes(employeeId)
                  ? p.assignees.filter((a) => a !== employeeId)
                  : [...p.assignees, employeeId],
              }
            : p
        ),
      }));
    },
    []
  );

  const setMeta = useCallback((meta: Partial<Meta>) => {
    setDb((d) => ({ ...d, meta: { ...d.meta, ...meta } }));
  }, []);

  const replaceAll = useCallback((next: DB) => setDb(next), []);

  return (
    <Ctx.Provider
      value={{
        db,
        loaded,
        addLog,
        editLog,
        delLog,
        addProject,
        editProject,
        setProjectStatus,
        setProjectDue,
        delProject,
        addProjectTask,
        setProjectTaskStatus,
        setProjectTaskAssignee,
        setProjectTaskPriority,
        editProjectTask,
        delProjectTask,
        addProjectIssue,
        toggleProjectIssue,
        delProjectIssue,
        addAgenda,
        toggleAgenda,
        editAgenda,
        delAgenda,
        setAgendaDate,
        saveReport,
        delReport,
        addEmployee,
        delEmployee,
        toggleAssignee,
        setMeta,
        replaceAll,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be used within StoreProvider");
  return c;
}
