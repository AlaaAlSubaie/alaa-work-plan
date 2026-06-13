import { DB, COLUMNS } from "./types";

const VERB: Record<string, string> = {
  did: "Completed",
  do: "Carried out",
  made: "Prepared",
  make: "Prepare",
  fixed: "Resolved",
  fix: "Resolve",
  called: "Contacted",
  call: "Contact",
  sent: "Submitted",
  send: "Submit",
  met: "Held a meeting with",
  meet: "Meet with",
  finished: "Completed",
  finish: "Complete",
  wrote: "Prepared",
  write: "Prepare",
  got: "Obtained",
  checked: "Reviewed",
  check: "Review",
  helped: "Supported",
  help: "Support",
  talked: "Coordinated",
  followed: "Followed up on",
  started: "Initiated",
  start: "Initiate",
  updated: "Updated",
  asked: "Requested",
  solved: "Resolved",
  tested: "Tested",
  deployed: "Deployed",
  reviewed: "Reviewed",
};

/** Light professional polish: trim, upgrade weak openers, capitalize, end punctuation. */
export function polish(text: string): string {
  let t = text.trim().replace(/\s+/g, " ");
  if (!t) return t;
  const m = t.match(/^(\w+)(\s|$)/);
  if (m) {
    const w = m[1].toLowerCase();
    if (VERB[w]) t = VERB[w] + t.slice(m[1].length);
  }
  t = t.charAt(0).toUpperCase() + t.slice(1);
  if (!/[.!?؟]$/.test(t)) t += ".";
  return t;
}

// Safe professional phrase replacements for the "Enhance" pass.
const PHRASES: [RegExp, string][] = [
  [/\basap\b/gi, "as soon as possible"],
  [/\bfyi\b/gi, "for your information"],
  [/\bcan't\b/gi, "cannot"],
  [/\bwon't\b/gi, "will not"],
  [/\bdon't\b/gi, "do not"],
  [/\bdidn't\b/gi, "did not"],
  [/\bwasn't\b/gi, "was not"],
  [/\bisn't\b/gi, "is not"],
  [/\bit's\b/gi, "it is"],
  [/\bi'm\b/gi, "I am"],
  [/\bwe're\b/gi, "we are"],
  [/\bwe've\b/gi, "we have"],
  [/\bwanna\b/gi, "want to"],
  [/\bgonna\b/gi, "going to"],
  [/\bi\b/g, "I"],
];

/** Stronger polish used by the Enhance button. */
function polishStrong(text: string): string {
  let t = text.trim();
  for (const [re, rep] of PHRASES) t = t.replace(re, rep);
  t = t.replace(/\s+/g, " ").trim();
  if (!t) return t;
  const m = t.match(/^(\w+)(\s|$)/);
  if (m) {
    const w = m[1].toLowerCase();
    if (VERB[w]) t = VERB[w] + t.slice(m[1].length);
  }
  t = t.charAt(0).toUpperCase() + t.slice(1);
  if (!/[.!?؟]$/.test(t)) t += ".";
  return t;
}

/**
 * Enhance an already-generated report: rewrites each bullet into more polished,
 * professional language and adds a short executive intro. Operates on the text
 * shown in the editor, so any manual edits are respected.
 */
export function enhanceText(report: string, lang: "en" | "ar"): string {
  if (!report.trim()) return report;
  const intro =
    lang === "ar"
      ? "خلال هذه الفترة، أنجز القسم المهام والمبادرات الرئيسية التالية:"
      : "During this period, the department delivered the following key outcomes:";
  const lines = report.split("\n");
  const out: string[] = [];
  let introInserted = false;
  for (const line of lines) {
    const bullet = line.match(/^(\s*•\s)(.*)$/);
    if (bullet) {
      out.push(bullet[1] + polishStrong(bullet[2]));
      continue;
    }
    out.push(line);
    if (!introInserted && /^(Period|الفترة)\s*:/.test(line)) {
      out.push("");
      out.push(intro);
      introInserted = true;
    }
  }
  return out.join("\n");
}

interface ReportOpts {
  from: string; // yyyy-mm-dd
  to: string;
  lang: "en" | "ar";
  includeProjects: boolean;
  includeAgenda: boolean;
}

export function buildReport(db: DB, opts: ReportOpts): string {
  const { from, to, lang, includeProjects, includeAgenda } = opts;
  if (!from || !to) return "";
  const ar = lang === "ar";
  const f = new Date(from + "T00:00:00");
  const t = new Date(to + "T23:59:59");
  const inRange = db.logs.filter((e) => e.ts >= f.getTime() && e.ts <= t.getTime());

  const L = ar
    ? {
        title: "تقرير إنجازات القسم الأسبوعي",
        dept: "القسم",
        by: "إعداد",
        period: "الفترة",
        acc: "أبرز الإنجازات",
        ong: "الأعمال الجارية والمهام قيد التنفيذ",
        iss: "التحديات والملاحظات",
        proj: "نظرة عامة على المشاريع",
        none: "لا توجد بنود مسجلة لهذه الفترة.",
        due: "تاريخ الاستحقاق",
        st: {
          Upcoming: "قادم",
          Progress: "قيد التنفيذ",
          Pending: "قيد الانتظار",
          Testing: "قيد الاختبار",
          Issues: "يوجد ملاحظة",
          Completed: "مكتمل",
        },
      }
    : {
        title: "Weekly Department Achievement Report",
        dept: "Department",
        by: "Prepared by",
        period: "Period",
        acc: "Key Accomplishments",
        ong: "Ongoing & Pending Work",
        iss: "Challenges & Notes",
        proj: "Projects Overview",
        none: "No items were logged for this period.",
        due: "due",
        st: {
          Upcoming: "Upcoming",
          Progress: "In Progress",
          Pending: "Pending",
          Testing: "Testing",
          Issues: "Needs attention",
          Completed: "Completed",
        },
      };

  const loc = ar ? "ar" : undefined;
  const dOpt: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };

  let out = `${L.title}\n${"=".repeat(L.title.length)}\n`;
  if (db.meta.dept) out += `${L.dept}: ${db.meta.dept}\n`;
  if (db.meta.user) out += `${L.by}: ${db.meta.user}\n`;
  out += `${L.period}: ${f.toLocaleDateString(loc, dOpt)} – ${t.toLocaleDateString(loc, dOpt)}\n\n`;

  // Accomplishments = logged Achievements/Tasks/Meetings + completed agenda tasks
  type Acc = { ts: number; text: string };
  const acc: Acc[] = inRange
    .filter((e) => ["Achievement", "Task", "Meeting"].includes(e.cat))
    .map((e) => ({ ts: e.ts, text: e.text }));
  if (includeAgenda) {
    db.agenda
      .filter((a) => a.done && a.date >= from && a.date <= to)
      .forEach((a) =>
        acc.push({ ts: new Date(a.date + "T12:00:00").getTime(), text: a.text })
      );
  }
  const ongStatuses = ["Upcoming", "Progress", "Pending", "Testing"];
  const ong = db.projects.filter((p) => ongStatuses.includes(p.status));
  const issues = inRange.filter((e) => e.cat === "Issue");
  const notes = inRange.filter((e) => e.cat === "Note");

  const dueTxt = (iso: string) =>
    iso
      ? ` [${L.due}: ${new Date(iso + "T00:00:00").toLocaleDateString(loc, dOpt)}]`
      : "";

  const teamTxt = (ids: string[]) => {
    const names = ids
      .map((id) => db.employees.find((e) => e.id === id)?.name)
      .filter(Boolean);
    return names.length ? ` — ${ar ? "الفريق" : "Team"}: ${names.join(", ")}` : "";
  };

  // Accomplishments grouped by day
  out += `${L.acc}\n${"-".repeat(L.acc.length)}\n`;
  if (acc.length) {
    const groups: Record<string, Acc[]> = {};
    acc
      .sort((a, b) => a.ts - b.ts)
      .forEach((e) => {
        const k = new Date(e.ts).toDateString();
        (groups[k] ||= []).push(e);
      });
    for (const day in groups) {
      out += `\n${new Date(groups[day][0].ts).toLocaleDateString(loc, { weekday: "long", ...dOpt })}:\n`;
      groups[day].forEach((e) => (out += `  • ${polish(e.text)}\n`));
    }
  } else out += L.none + "\n";

  // Ongoing
  out += `\n${L.ong}\n${"-".repeat(L.ong.length)}\n`;
  if (ong.length)
    ong.forEach(
      (p) =>
        (out += `  • ${p.name} — ${L.st[p.status]}${p.note ? ` (${p.note})` : ""}${dueTxt(p.due)}${teamTxt(p.assignees)}\n`)
    );
  else out += L.none + "\n";

  // Issues
  out += `\n${L.iss}\n${"-".repeat(L.iss.length)}\n`;
  const issuesProj = db.projects.filter((p) => p.status === "Issues");
  if (issues.length || issuesProj.length || notes.length) {
    issues.forEach((e) => (out += `  • ${polish(e.text)}\n`));
    issuesProj.forEach((p) => (out += `  • ${p.name}${p.note ? ` — ${p.note}` : ""}\n`));
    notes.forEach((e) => (out += `  • ${polish(e.text)}\n`));
  } else out += L.none + "\n";

  // Projects overview
  if (includeProjects && db.projects.length) {
    out += `\n${L.proj}\n${"-".repeat(L.proj.length)}\n`;
    COLUMNS.forEach(({ key }) => {
      const items = db.projects.filter((p) => p.status === key);
      if (items.length) {
        out += `\n${L.st[key]} (${items.length}):\n`;
        items.forEach(
          (p) =>
            (out += `  • ${p.name}${p.note ? ` — ${p.note}` : ""}${dueTxt(p.due)}${teamTxt(p.assignees)}\n`)
        );
      }
    });
  }

  return out.trim();
}

/**
 * Compute the current reporting week: the 7-day window ending on the UPCOMING
 * Wednesday (or today, if today is Wednesday). This keeps today's freshly-logged
 * entries inside the default range so they always appear in the report.
 */
export function weekToWednesday(now = new Date()): { from: string; to: string } {
  const iso = (d: Date) => {
    const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return z.toISOString().slice(0, 10);
  };
  const day = now.getDay(); // 0 Sun .. 3 Wed .. 6 Sat
  const fwd = (3 - day + 7) % 7; // days until the upcoming Wednesday (0 = today)
  const wed = new Date(now);
  wed.setDate(now.getDate() + fwd);
  const from = new Date(wed);
  from.setDate(wed.getDate() - 6);
  return { from: iso(from), to: iso(wed) };
}
