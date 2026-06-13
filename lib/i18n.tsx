"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";

export type Lang = "en" | "ar";

type Entry = { en: string; ar: string };

export const T: Record<string, Entry> = {
  // ---- app chrome ----
  "app.title": { en: "Department Organizer", ar: "منظّم القسم" },
  "app.sub": {
    en: "Log your day · Polished weekly report · Track every project",
    ar: "سجّل يومك · تقرير أسبوعي متقن · تابع كل مشروع",
  },
  "app.dept": { en: "Department name", ar: "اسم القسم" },
  "app.user": { en: "Your name", ar: "اسمك" },
  "app.loading": { en: "Loading your data…", ar: "جارٍ تحميل بياناتك…" },
  "foot.note": {
    en: "Your data is saved automatically in this browser on this computer. Back it up regularly with Export — and use the same browser each time.",
    ar: "تُحفظ بياناتك تلقائيًا في هذا المتصفح على هذا الجهاز. خذ نسخة احتياطية بانتظام عبر التصدير — واستخدم المتصفح نفسه في كل مرة.",
  },
  "foot.export": { en: "Export backup", ar: "تصدير نسخة احتياطية" },
  "foot.import": { en: "Import backup", ar: "استيراد نسخة احتياطية" },

  // ---- tabs ----
  "tab.dashboard": { en: "Dashboard", ar: "لوحة المعلومات" },
  "tab.log": { en: "Daily Log", ar: "السجل اليومي" },
  "tab.agenda": { en: "Agenda", ar: "الأجندة" },
  "tab.projects": { en: "Projects", ar: "المشاريع" },
  "tab.team": { en: "Team", ar: "الفريق" },
  "tab.report": { en: "Weekly Report", ar: "التقرير الأسبوعي" },

  // ---- common ----
  "c.add": { en: "Add", ar: "إضافة" },
  "c.clear": { en: "Clear", ar: "مسح" },
  "c.today": { en: "Today", ar: "اليوم" },
  "c.who": { en: "— who —", ar: "— لمن —" },
  "c.copy": { en: "Copy", ar: "نسخ" },
  "c.open": { en: "Open", ar: "فتح" },

  // ---- categories ----
  "cat.Achievement": { en: "Achievement", ar: "إنجاز" },
  "cat.Task": { en: "Task", ar: "مهمة" },
  "cat.Meeting": { en: "Meeting", ar: "اجتماع" },
  "cat.Issue": { en: "Issue", ar: "ملاحظة" },
  "cat.Note": { en: "Note", ar: "مذكرة" },

  // ---- stages ----
  "stage.Upcoming": { en: "Upcoming", ar: "قادم" },
  "stage.Progress": { en: "In Progress", ar: "قيد التنفيذ" },
  "stage.Pending": { en: "Pending", ar: "قيد الانتظار" },
  "stage.Testing": { en: "Testing", ar: "قيد الاختبار" },
  "stage.Issues": { en: "Issues", ar: "ملاحظات" },
  "stage.Completed": { en: "Completed", ar: "مكتمل" },

  // ---- task statuses ----
  "ts.Pending": { en: "Pending", ar: "قيد الانتظار" },
  "ts.Progress": { en: "In Progress", ar: "قيد التنفيذ" },
  "ts.Done": { en: "Done", ar: "منجز" },

  // ---- Daily Log ----
  "log.capture": { en: "Quick capture", ar: "تدوين سريع" },
  "log.captureHint": {
    en: "Type fast in your own words — don't worry about grammar. Pick a category, then press Enter (or click Add). Everything is auto-stamped with today's date & time.",
    ar: "اكتب بسرعة بكلماتك — لا تقلق بشأن القواعد. اختر تصنيفًا ثم اضغط Enter (أو زر إضافة). يُسجَّل كل شيء تلقائيًا بتاريخ ووقت اليوم.",
  },
  "log.placeholder": {
    en: "e.g. finished the monthly safety report and sent it to the team…",
    ar: "مثال: أنهيت تقرير السلامة الشهري وأرسلته للفريق…",
  },
  "log.yourLog": { en: "Your log", ar: "سجلّك" },
  "log.search": { en: "Search your entries…", ar: "ابحث في مدخلاتك…" },
  "log.allCats": { en: "All categories", ar: "كل التصنيفات" },
  "log.empty": {
    en: "No entries yet. Capture your first task above ☝️",
    ar: "لا توجد مدخلات بعد. سجّل أول مهمة بالأعلى ☝️",
  },
  "log.noMatch": { en: "No entries match your search 🔍", ar: "لا توجد مدخلات مطابقة لبحثك 🔍" },

  // ---- Agenda ----
  "ag.title": { en: "Daily agenda", ar: "الأجندة اليومية" },
  "ag.hint": {
    en: "Plan the work you intend to do, then check items off as you finish. Unfinished tasks from earlier days are carried over automatically.",
    ar: "خطّط للعمل الذي تنوي إنجازه، ثم علّم المهام عند إتمامها. تُرحَّل المهام غير المنجزة من الأيام السابقة تلقائيًا.",
  },
  "ag.prev": { en: "Prev", ar: "السابق" },
  "ag.next": { en: "Next", ar: "التالي" },
  "ag.week": { en: "Week", ar: "أسبوع" },
  "ag.month": { en: "Month", ar: "شهر" },
  "ag.carried": { en: "Carried over — {n} unfinished from earlier days", ar: "مُرحّلة — {n} غير منجزة من أيام سابقة" },
  "ag.moveAll": { en: "Move all to this day", ar: "نقل الكل إلى هذا اليوم" },
  "ag.addTask": { en: "Add a task for this day…", ar: "أضف مهمة لهذا اليوم…" },
  "ag.empty": { en: "Nothing planned for this day yet ✍️", ar: "لا يوجد مخطط لهذا اليوم بعد ✍️" },
  "ag.done": { en: "done", ar: "منجز" },

  // ---- Projects ----
  "pr.addProject": { en: "Add a project", ar: "إضافة مشروع" },
  "pr.name": { en: "Project name", ar: "اسم المشروع" },
  "pr.note": { en: "Short note / detail (optional)", ar: "ملاحظة قصيرة / تفصيل (اختياري)" },
  "pr.addBtn": { en: "Add project", ar: "إضافة المشروع" },
  "pr.hint": {
    en: "Swipe the board sideways to see all stages. Use the ◀ ▶ buttons to move a card between stages. Set a target date to get reminders. Click Details to follow tasks, issues and assign team members.",
    ar: "اسحب اللوحة جانبيًا لرؤية كل المراحل. استخدم زرّي ◀ ▶ لنقل البطاقة بين المراحل. حدّد تاريخًا مستهدفًا للتذكير. اضغط التفاصيل لمتابعة المهام والملاحظات وتعيين أعضاء الفريق.",
  },
  "pr.manageTeam": { en: "Manage team", ar: "إدارة الفريق" },
  "pr.empName": { en: "Employee name", ar: "اسم الموظف" },
  "pr.empRole": { en: "Role (optional)", ar: "الدور (اختياري)" },
  "pr.noTeam": { en: "No team members yet.", ar: "لا يوجد أعضاء بعد." },
  "pr.details": { en: "Details", ar: "التفاصيل" },
  "pr.teamOnProject": { en: "Team on this project", ar: "الفريق في هذا المشروع" },
  "pr.addMember": { en: "＋ Add a member…", ar: "＋ أضف عضوًا…" },
  "pr.noMembers": { en: "No members on this project yet — add from the menu.", ar: "لا يوجد أعضاء في هذا المشروع — أضف من القائمة." },
  "pr.addTeamFirst": { en: "Add team members in the “Manage team” panel above first.", ar: "أضف أعضاء الفريق من لوحة «إدارة الفريق» بالأعلى أولًا." },
  "pr.targetDate": { en: "Target date (reminder)", ar: "التاريخ المستهدف (تذكير)" },
  "pr.tasks": { en: "Tasks (assign & track)", ar: "المهام (تعيين ومتابعة)" },
  "pr.addTaskPh": { en: "Add a task…", ar: "أضف مهمة…" },
  "pr.noTasks": { en: "No tasks yet.", ar: "لا توجد مهام بعد." },
  "pr.issues": { en: "Issues to follow", ar: "ملاحظات للمتابعة" },
  "pr.addIssuePh": { en: "Add an issue…", ar: "أضف ملاحظة…" },
  "pr.noIssues": { en: "No issues logged.", ar: "لا توجد ملاحظات مسجلة." },
  "pr.project": { en: "— project —", ar: "— المشروع —" },

  // ---- reminders ----
  "rem.head": { en: "Reminders — {n} project(s) need attention", ar: "تذكيرات — {n} مشروع يحتاج انتباهًا" },

  // ---- Team ----
  "tm.title": { en: "Team workload", ar: "حِمل عمل الفريق" },
  "tm.hint": {
    en: "Every member's tasks across all projects, so you can keep up. Add a task from a member's card — pick one of the projects they're assigned to. Click a status pill to update it.",
    ar: "مهام كل عضو عبر جميع المشاريع لتبقى على اطلاع. أضف مهمة من بطاقة العضو — اختر أحد المشاريع المسندة إليه. اضغط شارة الحالة لتغييرها.",
  },
  "tm.hideDone": { en: "Hide completed tasks", ar: "إخفاء المهام المكتملة" },
  "tm.inProgress": { en: "{n} in progress", ar: "{n} قيد التنفيذ" },
  "tm.pending": { en: "{n} pending", ar: "{n} قيد الانتظار" },
  "tm.done": { en: "{n} done", ar: "{n} منجزة" },
  "tm.addFor": { en: "Add a task for {name}…", ar: "أضف مهمة لـ {name}…" },
  "tm.assignFirst": { en: "Assign {name} to a project first (in 📂 Projects) to add tasks here.", ar: "أسند {name} إلى مشروع أولًا (في 📂 المشاريع) لإضافة المهام هنا." },
  "tm.noTasks": { en: "No tasks.", ar: "لا توجد مهام." },
  "tm.noMembers": { en: "No team members yet. Add them in 📂 Projects → 👥 Manage team.", ar: "لا يوجد أعضاء بعد. أضفهم في 📂 المشاريع ← 👥 إدارة الفريق." },
  "tm.unassigned": { en: "Unassigned", ar: "غير مُسند" },
  "tm.noOwner": { en: "{n} task(s) with no owner", ar: "{n} مهمة دون مالك" },

  // ---- Team board (live cards) ----
  "tb.title": { en: "Team · who's working on what", ar: "الفريق · مَن يعمل على ماذا" },
  "tb.sub": {
    en: "{active} active now · {done} completed · {pending} pending",
    ar: "{active} نشطة الآن · {done} مكتملة · {pending} قيد الانتظار",
  },
  "tb.live": { en: "Live", ar: "مباشر" },
  "tb.active": { en: "Active now", ar: "نشطة الآن" },
  "tb.completed": { en: "Completed", ar: "مكتملة" },
  "tb.pending": { en: "Pending", ar: "قيد الانتظار" },
  "tb.projTasks": { en: "{done}/{total} project tasks", ar: "{done}/{total} من مهام المشروع" },
  "tb.taskTitle": { en: "Task title…", ar: "عنوان المهمة…" },
  "tb.noTasks": {
    en: "No tasks yet. Add one above, or create tasks in 📂 Projects.",
    ar: "لا توجد مهام بعد. أضف واحدة بالأعلى، أو أنشئ مهامًا في 📂 المشاريع.",
  },

  // ---- Dashboard ----
  "db.title": { en: "Department dashboard", ar: "لوحة معلومات القسم" },
  "db.hint": {
    en: "A live overview of everything — projects, tasks, team workload, and your achievements this week.",
    ar: "نظرة حيّة على كل شيء — المشاريع والمهام وحِمل عمل الفريق وإنجازاتك هذا الأسبوع.",
  },
  "db.kProjects": { en: "Projects", ar: "المشاريع" },
  "db.kCompleted": { en: "{n} completed", ar: "{n} مكتمل" },
  "db.kActive": { en: "Active tasks", ar: "مهام نشطة" },
  "db.kDone": { en: "{n} done", ar: "{n} منجزة" },
  "db.kTeam": { en: "Team members", ar: "أعضاء الفريق" },
  "db.kAch": { en: "Achievements", ar: "إنجازات" },
  "db.kThisWeek": { en: "this week", ar: "هذا الأسبوع" },
  "db.kReminders": { en: "Reminders", ar: "تذكيرات" },
  "db.kRemSub": { en: "overdue / due soon", ar: "متأخرة / قريبة الاستحقاق" },
  "db.kAgenda": { en: "Today's agenda", ar: "أجندة اليوم" },
  "db.kPctDone": { en: "{n}% done", ar: "{n}% منجز" },
  "db.byStage": { en: "Projects by stage", ar: "المشاريع حسب المرحلة" },
  "db.noProjects": { en: "No projects yet.", ar: "لا توجد مشاريع بعد." },
  "db.attention": { en: "Needs attention", ar: "يحتاج انتباهًا" },
  "db.teamWorkload": { en: "Team workload", ar: "حِمل عمل الفريق" },
  "db.recentAch": { en: "My recent achievements", ar: "إنجازاتي الأخيرة" },
  "db.noAch": { en: "Nothing logged yet — add achievements in 📝 Daily Log.", ar: "لا شيء مسجّل بعد — أضف الإنجازات في 📝 السجل اليومي." },
  "db.notifOn": { en: "Reminders are on", ar: "التذكيرات مفعّلة" },
  "db.notifUnsupported": { en: "Notifications aren't supported on this browser.", ar: "الإشعارات غير مدعومة في هذا المتصفح." },
  "db.enable": { en: "Enable reminders", ar: "تفعيل التذكيرات" },
  "db.enableHint": { en: "Get a daily alert for overdue projects & today's tasks.", ar: "احصل على تنبيه يومي بالمشاريع المتأخرة ومهام اليوم." },

  // ---- Weekly Report ----
  "wr.title": { en: "Generate weekly achievement report", ar: "إنشاء تقرير الإنجازات الأسبوعي" },
  "wr.hint": {
    en: "Everything you write in the Daily Log (and complete in the Agenda) within the selected dates is pulled in automatically. Pick the period, click Generate, optionally Enhance the wording, then Copy — or Save it to revisit any time.",
    ar: "كل ما تكتبه في السجل اليومي (وتُنجزه في الأجندة) ضمن التواريخ المحددة يُجمَع تلقائيًا. اختر الفترة، اضغط إنشاء، حسّن الصياغة اختياريًا، ثم انسخ — أو احفظه للرجوع إليه لاحقًا.",
  },
  "wr.thisWeek": { en: "This week (up to Wednesday)", ar: "هذا الأسبوع (حتى الأربعاء)" },
  "wr.last7": { en: "Last 7 days", ar: "آخر ٧ أيام" },
  "wr.thisMonth": { en: "This month", ar: "هذا الشهر" },
  "wr.from": { en: "From", ar: "من" },
  "wr.to": { en: "To", ar: "إلى" },
  "wr.language": { en: "Language", ar: "اللغة" },
  "wr.incProjects": { en: "Include projects summary", ar: "تضمين ملخص المشاريع" },
  "wr.incAgenda": { en: "Include completed agenda tasks", ar: "تضمين مهام الأجندة المكتملة" },
  "wr.generate": { en: "Generate", ar: "إنشاء" },
  "wr.enhance": { en: "Enhance writing", ar: "تحسين الصياغة" },
  "wr.save": { en: "Save report", ar: "حفظ التقرير" },
  "wr.copy": { en: "Copy", ar: "نسخ" },
  "wr.download": { en: "Download .txt", ar: "تنزيل .txt" },
  "wr.reportPh": { en: "Your generated report will appear here…", ar: "سيظهر تقريرك المُنشأ هنا…" },
  "wr.saved": { en: "Saved reports", ar: "التقارير المحفوظة" },
  "wr.noSaved": { en: "No saved reports yet. Generate one above and click 💾 Save.", ar: "لا توجد تقارير محفوظة بعد. أنشئ تقريرًا بالأعلى واضغط 💾 حفظ." },
  "wr.savedAt": { en: "Saved", ar: "حُفظ" },
  "wr.pullEmpty": { en: "No Daily Log entries or completed agenda tasks in this period — try a wider date range.", ar: "لا توجد مدخلات في السجل اليومي ولا مهام أجندة مكتملة في هذه الفترة — جرّب نطاقًا أوسع." },
  "wr.pull": {
    en: "{n} item(s) from your Daily Log & Agenda in this period will be pulled in. Click Generate.",
    ar: "{n} عنصرًا من السجل اليومي والأجندة في هذه الفترة سيُضمَّن. اضغط إنشاء.",
  },
};

export function tr(lang: Lang, key: string, vars?: Record<string, string | number>) {
  const entry = T[key];
  let s = entry ? entry[lang] : key;
  if (vars) for (const k in vars) s = s.replace(`{${k}}`, String(vars[k]));
  return s;
}

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  rtl: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
  locale: string | undefined;
}

const Ctx = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("aw-lang") as Lang | null;
      if (saved === "ar" || saved === "en") setLangState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    try {
      localStorage.setItem("aw-lang", lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => tr(lang, key, vars),
    [lang]
  );

  return (
    <Ctx.Provider
      value={{
        lang,
        setLang,
        rtl: lang === "ar",
        t,
        locale: lang === "ar" ? "ar" : undefined,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useLang() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLang must be used within LangProvider");
  return c;
}
