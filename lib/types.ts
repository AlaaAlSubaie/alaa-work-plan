export type Category = "Achievement" | "Task" | "Meeting" | "Issue" | "Note";
export type Status =
  | "Upcoming"
  | "Progress"
  | "Pending"
  | "Testing"
  | "Issues"
  | "Completed";

export interface LogEntry {
  id: string;
  text: string;
  cat: Category;
  ts: number;
}

export type TaskStatus = "Pending" | "Progress" | "Completed";
export type TaskPriority = "Low" | "Medium" | "High";

export interface ProjectTask {
  id: string;
  text: string;
  status: TaskStatus;
  assignee: string; // Employee id, or "" if unassigned
  priority: TaskPriority;
  done?: boolean; // legacy field (migrated to status)
}

export const PRIORITIES: TaskPriority[] = ["Low", "Medium", "High"];

export interface ProjectIssue {
  id: string;
  text: string;
  resolved: boolean;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  note: string;
  status: Status;
  due: string; // "" or yyyy-mm-dd — target/reminder date
  ts: number;
  tasks: ProjectTask[];
  issues: ProjectIssue[];
  assignees: string[]; // Employee ids working on this project
}

export interface AgendaItem {
  id: string;
  date: string; // yyyy-mm-dd (the day this item is planned for)
  text: string;
  time: string; // "" or "HH:MM"
  done: boolean;
  ts: number;
  cat?: Category; // set when the item was created from a Daily Log entry
}

export interface SavedReport {
  id: string;
  title: string; // e.g. "Weekly Report — Jun 8 – Jun 14"
  from: string; // yyyy-mm-dd
  to: string; // yyyy-mm-dd
  lang: "en" | "ar";
  text: string;
  ts: number; // when it was saved
}

export interface Meta {
  dept: string;
  user: string;
}

export interface DB {
  logs: LogEntry[];
  projects: Project[];
  agenda: AgendaItem[];
  reports: SavedReport[];
  employees: Employee[];
  meta: Meta;
}

export const CATEGORIES: { cat: Category; label: string }[] = [
  { cat: "Achievement", label: "✅ Achievement" },
  { cat: "Task", label: "📌 Task" },
  { cat: "Meeting", label: "🤝 Meeting" },
  { cat: "Issue", label: "⚠️ Issue" },
  { cat: "Note", label: "🗒️ Note" },
];

export const TASK_STATUSES: { key: TaskStatus; label: string }[] = [
  { key: "Pending", label: "Pending" },
  { key: "Progress", label: "In Progress" },
  { key: "Completed", label: "Completed" },
];

export const COLUMNS: { key: Status; label: string }[] = [
  { key: "Upcoming", label: "Upcoming" },
  { key: "Progress", label: "In Progress" },
  { key: "Pending", label: "Pending" },
  { key: "Testing", label: "Testing" },
  { key: "Issues", label: "Issues" },
  { key: "Completed", label: "Completed" },
];

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
