// Supabase persistence layer for the Department Organizer.
//
// Strategy: when a user is signed in, Supabase is the source of truth.
// loadDB() pulls the whole workspace for the current user (RLS scopes every
// query to auth.uid()); syncDB() reconciles the in-memory DB back up to the
// tables (upsert current rows, delete removed ones) in FK-safe order.
// localStorage is handled separately in store.tsx as a local/offline cache.

import { supabase } from "./supabase";
import {
  DB,
  Project,
  ProjectTask,
  ProjectIssue,
  AgendaItem,
  SavedReport,
  Employee,
  LogEntry,
  Category,
  Status,
  TaskStatus,
  TaskPriority,
} from "./types";

const iso = (ts: number) => new Date(ts).toISOString();
const ms = (s: string | null) => (s ? new Date(s).getTime() : Date.now());

export async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// ---------- row shapes as returned by Supabase ----------
interface MetaRow { dept: string | null; user_name: string | null }
interface EmployeeRow { id: string; name: string; role: string | null }
interface ProjectRow {
  id: string; name: string; note: string | null; status: Status;
  due: string | null; created_at: string; order_index: number | null;
}
interface TaskRow {
  id: string; project_id: string; text: string; status: TaskStatus;
  assignee: string | null; priority: TaskPriority;
}
interface IssueRow { id: string; project_id: string; text: string; resolved: boolean }
interface AssigneeRow { project_id: string; employee_id: string }
interface LogRow { id: string; text: string; cat: Category; created_at: string }
interface AgendaRow {
  id: string; date: string; text: string; time: string | null;
  done: boolean; cat: Category | null; created_at: string;
}
interface ReportRow {
  id: string; title: string; from_date: string; to_date: string;
  lang: "en" | "ar"; text: string; created_at: string;
}
interface IdRow { id: string }

// ---------- LOAD: assemble the full DB for the signed-in user ----------
export async function loadDB(): Promise<DB | null> {
  const uid = await currentUserId();
  if (!uid) return null;

  const [meta, employees, projects, tasks, issues, assignees, logs, agenda, reports] =
    await Promise.all([
      supabase.from("meta").select("dept, user_name").maybeSingle(),
      supabase.from("employees").select("id, name, role").order("created_at"),
      supabase.from("projects").select("id, name, note, status, due, created_at, order_index").order("created_at"),
      supabase.from("project_tasks").select("id, project_id, text, status, assignee, priority").order("created_at"),
      supabase.from("project_issues").select("id, project_id, text, resolved").order("created_at"),
      supabase.from("project_assignees").select("project_id, employee_id"),
      supabase.from("logs").select("id, text, cat, created_at").order("created_at"),
      supabase.from("agenda").select("id, date, text, time, done, cat, created_at").order("created_at"),
      supabase.from("reports").select("id, title, from_date, to_date, lang, text, created_at").order("created_at", { ascending: false }),
    ]);

  const tasksByProject = new Map<string, ProjectTask[]>();
  ((tasks.data ?? []) as TaskRow[]).forEach((r) => {
    const arr = tasksByProject.get(r.project_id) ?? [];
    arr.push({ id: r.id, text: r.text, status: r.status, assignee: r.assignee ?? "", priority: r.priority });
    tasksByProject.set(r.project_id, arr);
  });

  const issuesByProject = new Map<string, ProjectIssue[]>();
  ((issues.data ?? []) as IssueRow[]).forEach((r) => {
    const arr = issuesByProject.get(r.project_id) ?? [];
    arr.push({ id: r.id, text: r.text, resolved: r.resolved });
    issuesByProject.set(r.project_id, arr);
  });

  const assigneesByProject = new Map<string, string[]>();
  ((assignees.data ?? []) as AssigneeRow[]).forEach((r) => {
    const arr = assigneesByProject.get(r.project_id) ?? [];
    arr.push(r.employee_id);
    assigneesByProject.set(r.project_id, arr);
  });

  const metaRow = meta.data as MetaRow | null;

  return {
    logs: ((logs.data ?? []) as LogRow[]).map((r) => ({
      id: r.id, text: r.text, cat: r.cat, ts: ms(r.created_at),
    })),
    projects: ((projects.data ?? []) as ProjectRow[]).map((r) => ({
      id: r.id,
      name: r.name,
      note: r.note ?? "",
      status: r.status,
      due: r.due ?? "",
      ts: ms(r.created_at),
      order: r.order_index ?? 0,
      tasks: tasksByProject.get(r.id) ?? [],
      issues: issuesByProject.get(r.id) ?? [],
      assignees: assigneesByProject.get(r.id) ?? [],
    })),
    agenda: ((agenda.data ?? []) as AgendaRow[]).map((r) => ({
      id: r.id, date: r.date, text: r.text, time: r.time ?? "",
      done: r.done, ts: ms(r.created_at), cat: r.cat ?? undefined,
    })),
    reports: ((reports.data ?? []) as ReportRow[]).map((r) => ({
      id: r.id, title: r.title, from: r.from_date, to: r.to_date,
      lang: r.lang, text: r.text, ts: ms(r.created_at),
    })),
    employees: ((employees.data ?? []) as EmployeeRow[]).map((r) => ({
      id: r.id, name: r.name, role: r.role ?? "",
    })),
    meta: { dept: metaRow?.dept ?? "", user: metaRow?.user_name ?? "" },
  };
}

// ---------- SYNC: reconcile the in-memory DB up to Supabase ----------
async function existingIds(table: string): Promise<string[]> {
  const { data } = await supabase.from(table).select("id");
  return ((data ?? []) as IdRow[]).map((r) => r.id);
}

// Upsert current rows; delete rows that no longer exist locally.
async function reconcile(
  table: string,
  rows: Record<string, unknown>[],
  existing: string[]
): Promise<void> {
  const currentIds = new Set(rows.map((r) => r.id as string));
  const toDelete = existing.filter((id) => !currentIds.has(id));
  if (toDelete.length) await supabase.from(table).delete().in("id", toDelete);
  if (rows.length) await supabase.from(table).upsert(rows);
}

export async function syncDB(db: DB): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;

  // Snapshot existing ids up front (before any deletes/cascades).
  const [empIds, projIds, taskIds, issueIds, logIds, agIds, repIds] = await Promise.all([
    existingIds("employees"),
    existingIds("projects"),
    existingIds("project_tasks"),
    existingIds("project_issues"),
    existingIds("logs"),
    existingIds("agenda"),
    existingIds("reports"),
  ]);

  // meta (one row per user)
  await supabase.from("meta").upsert({
    user_id: uid,
    dept: db.meta.dept,
    user_name: db.meta.user,
    updated_at: new Date().toISOString(),
  });

  // Parents first so child FKs resolve on upsert.
  await reconcile(
    "employees",
    db.employees.map((e: Employee) => ({ id: e.id, user_id: uid, name: e.name, role: e.role })),
    empIds
  );
  await reconcile(
    "projects",
    db.projects.map((p: Project) => ({
      id: p.id, user_id: uid, name: p.name, note: p.note,
      status: p.status, due: p.due, created_at: iso(p.ts), order_index: p.order,
    })),
    projIds
  );

  // Children of projects.
  await reconcile(
    "project_tasks",
    db.projects.flatMap((p: Project) =>
      p.tasks.map((t: ProjectTask) => ({
        id: t.id, project_id: p.id, user_id: uid, text: t.text,
        status: t.status, assignee: t.assignee, priority: t.priority,
      }))
    ),
    taskIds
  );
  await reconcile(
    "project_issues",
    db.projects.flatMap((p: Project) =>
      p.issues.map((is: ProjectIssue) => ({
        id: is.id, project_id: p.id, user_id: uid, text: is.text, resolved: is.resolved,
      }))
    ),
    issueIds
  );

  // project_assignees has a composite key — reconcile by (project_id, employee_id).
  const currentPairs = db.projects.flatMap((p: Project) =>
    p.assignees.map((eid: string) => ({ project_id: p.id, employee_id: eid, user_id: uid }))
  );
  const { data: exAssign } = await supabase
    .from("project_assignees")
    .select("project_id, employee_id");
  const curKeys = new Set(currentPairs.map((x) => `${x.project_id}|${x.employee_id}`));
  for (const r of (exAssign ?? []) as AssigneeRow[]) {
    if (!curKeys.has(`${r.project_id}|${r.employee_id}`)) {
      await supabase
        .from("project_assignees")
        .delete()
        .eq("project_id", r.project_id)
        .eq("employee_id", r.employee_id);
    }
  }
  if (currentPairs.length) await supabase.from("project_assignees").upsert(currentPairs);

  // Independent collections.
  await reconcile(
    "logs",
    db.logs.map((l: LogEntry) => ({ id: l.id, user_id: uid, text: l.text, cat: l.cat, created_at: iso(l.ts) })),
    logIds
  );
  await reconcile(
    "agenda",
    db.agenda.map((a: AgendaItem) => ({
      id: a.id, user_id: uid, date: a.date, text: a.text, time: a.time,
      done: a.done, cat: a.cat ?? null, created_at: iso(a.ts),
    })),
    agIds
  );
  await reconcile(
    "reports",
    db.reports.map((r: SavedReport) => ({
      id: r.id, user_id: uid, title: r.title, from_date: r.from,
      to_date: r.to, lang: r.lang, text: r.text, created_at: iso(r.ts),
    })),
    repIds
  );
}
