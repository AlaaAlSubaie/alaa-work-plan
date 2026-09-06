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
    ar: "سجلي يومك · تقرير أسبوعي حلو · تابعي كل مشاريعك",
  },
  "app.dept": { en: "Department name", ar: "اسم القسم" },
  "app.user": { en: "Your name", ar: "الاسم" },
  "app.loading": { en: "Loading your data…", ar: "قاعد يحمّل بياناتك…" },
  "foot.note": {
    en: "Your data is saved automatically in this browser on this computer. Back it up regularly with Export — and use the same browser each time.",
    ar: "بياناتك تنحفظ تلقائي في هذا المتصفح على هذا الجهاز. خذي نسخة احتياطية بين فترة وفترة عبر التصدير — واستخدمي نفس المتصفح كل مرة.",
  },
  "foot.export": { en: "Export backup", ar: "تصدير نسخة احتياطية" },
  "foot.import": { en: "Import backup", ar: "استيراد نسخة احتياطية" },

  // ---- login brand panel ----
  "login.headline": { en: "Plan the day. Ship the week.", ar: "رتّبي يومك، وخلّصي أسبوعك." },
  "login.tagline": {
    en: "Capture quick notes, track your team, and turn it all into a polished weekly report — in one calm workspace.",
    ar: "سجلي ملاحظاتك على طول، تابعي فريقك، وحوّلي كل شي لتقرير أسبوعي مرتّب — بمكان شغل واحد وهادي.",
  },
  "login.f1": { en: "Daily log & agenda", ar: "السجل اليومي والأجندة" },
  "login.f2": { en: "Live project board", ar: "لوحة مشاريع " },
  "login.f3": { en: "One-tap weekly report", ar: "تقرير أسبوعي بلمسة وحدة" },
  "login.sub": { en: "Sign in to continue", ar: "سجّلي دخولك عشان تكمّلين" },
  "login.keep": { en: "Keep me signed in", ar: "خلّني داخله" },
  "login.tag": { en: "", ar: "" },
  "login.vol": { en: "Vol. 1 · 2026", ar: "العدد ١ · ٢٠٢٦" },
  "login.label": { en: "Workspace access", ar: "الدخول لمساحة الشغل" },
  "login.headLead": { en: "Welcome back, our", ar: "حيّاج الله، يا" },
  "login.headAccent": { en: "Engineer", ar: "مهندستنا" },
  "login.cardToday": { en: "Today", ar: "اليوم" },
  "login.cardDate": { en: "WED · 10 JUNE", ar: "الأربعاء · ١٠ يونيو" },
  "login.report": { en: "Report ready", ar: "التقرير جاهز" },
  "login.streak": { en: "12-day streak", ar: "١٢ يوم متواصل" },

  // ---- lock / auth screen ----
  "lock.welcome": { en: "Welcome back", ar: "تسجيل الدخول" },
  "lock.hello": { en: "Hello, {name}", ar: "هلا، {name}" },
  "lock.setupTitle": { en: "Create your account", ar: "سوّي حسابك" },
  "lock.setupSub": { en: "Sign up to your workspace.", ar: "سجّلي بمساحة شغلك." },
  "lock.enterSub": { en: "Sign in to continue.", ar: "سجّلي دخولك عشان تكمّلين." },
  "lock.email": { en: "Email", ar: "البريد الإلكتروني" },
  "lock.password": { en: "Password", ar: "كلمة السر" },
  "lock.confirmPw": { en: "Confirm password", ar: "أكّدي كلمة السر" },
  "lock.errEmail": { en: "Enter a valid email", ar: "دخّلي إيميل صحيح" },
  "lock.errPwShort": { en: "Password must be at least 6 characters", ar: "كلمة السر لازم \u0666 أحرف على الأقل" },
  "lock.errUnconfirmed": { en: "Confirm your email first — check your inbox", ar: "أكّدي إيميلك أول — شوفي بريدك" },
  "lock.checkEmail": { en: "Account created — check your email to confirm.", ar: "انفتح الحساب — شوفي إيميلك عشان تأكّدين." },
  "lock.needAccount": { en: "Don't have an account? Create one", ar: "ما عندك حساب؟ سوّي وحد" },
  "lock.haveAccount": { en: "Already have an account? Sign in", ar: "عندك حساب؟ سجّلي دخولك" },
  "lock.working": { en: "Working…", ar: "لحظة…" },
  "lock.signOut": { en: "Sign out", ar: "خروج" },
  "lock.unlock": { en: "Sign in", ar: "تسجيل الدخول" },
  "lock.errWrong": { en: "Wrong email or password", ar: "الإيميل أو كلمة السر غلط" },

  // ---- change password ----
  "pw.title": { en: "Change password", ar: "تغيير كلمة السر" },
  "pw.sub": { en: "Set a new password for your account.", ar: "عيّن كلمة سر جديدة لحسابك." },
  "pw.current": { en: "Current password", ar: "كلمة السر الحالية" },
  "pw.new": { en: "New password", ar: "كلمة السر الجديدة" },
  "pw.confirm": { en: "Confirm new password", ar: "أكّد كلمة السر الجديدة" },
  "pw.save": { en: "Update password", ar: "حدّث كلمة السر" },
  "pw.cancel": { en: "Cancel", ar: "إلغاء" },
  "pw.done": { en: "Done", ar: "تم" },
  "pw.okMsg": { en: "Password updated", ar: "انحدّثت كلمة السر" },
  "pw.errShort": { en: "Password must be at least 6 characters", ar: "كلمة السر لازم ٦ أحرف على الأقل" },
  "pw.errMatch": { en: "New passwords don't match", ar: "كلمتا السر الجديدتين مو متطابقتين" },
  "pw.errSame": { en: "New password must differ from the current one", ar: "لازم كلمة السر الجديدة تختلف عن الحالية" },
  "pw.errCurrent": { en: "Current password is wrong", ar: "كلمة السر الحالية غلط" },

  // ---- tabs ----
  "tab.dashboard": { en: "Dashboard", ar: "الملخص" },
  "tab.log": { en: "Daily Log", ar: "السجل اليومي" },
  "tab.agenda": { en: "Agenda", ar: "الأجندة" },
  "tab.projects": { en: "Projects", ar: "المشاريع" },
  "tab.team": { en: "Team", ar: "الفريق" },
  "tab.report": { en: "Weekly Report", ar: "التقرير الأسبوعي" },

  // ---- toasts & dialogs ----
  "toast.enterProjName": { en: "Enter a project name", ar: "دخّلي اسم المشروع" },
  "toast.projectAdded": { en: "Project added", ar: "انضاف المشروع" },
  "toast.enterName": { en: "Enter a name", ar: "دخّلي اسم" },
  "toast.taskAdded": { en: "Task added", ar: "انضافت المهمة" },
  "toast.pickRange": { en: "Pick a date range", ar: "اختاري فترة أول" },
  "toast.genFirst": { en: "Generate a report first", ar: "سوّي تقرير أول" },
  "toast.enhanced": { en: "Wording enhanced ✨", ar: "تحسّنت الصياغة ✨" },
  "toast.reportSaved": { en: "Report saved 📁", ar: "انحفظ التقرير 📁" },
  "toast.copiedSup": { en: "Copied! Paste it to your supervisor 📋", ar: "اننسخ! الصقه لمديرك 📋" },
  "toast.openedSaved": { en: "Opened saved report", ar: "فتحنا التقرير المحفوظ" },
  "toast.copied": { en: "Copied 📋", ar: "اننسخ 📋" },
  "toast.remindersOn": { en: "Reminders enabled ✓", ar: "التذكيرات اشتغلت ✓" },
  "toast.backupDown": { en: "Backup downloaded", ar: "انزلت النسخة الاحتياطية" },
  "toast.backupRestored": { en: "Backup restored", ar: "ارجعت النسخة الاحتياطية" },
  "toast.invalidFile": { en: "Invalid file", ar: "ملف غلط" },
  "toast.pickProj": { en: "Pick a project first", ar: "اختاري مشروع أول" },
  "dlg.delProject": { en: "Delete this project?", ar: "تبين تمسحين هذا المشروع؟" },
  "dlg.delEntry": { en: "Delete this entry?", ar: "تبين تمسحين هذا المدخل؟" },
  "dlg.delSaved": { en: "Delete this saved report?", ar: "تبين تمسحين هذا التقرير المحفوظ؟" },
  "dlg.delTask": { en: "Delete this task?", ar: "تبين تمسحين هذه المهمة؟" },
  "dlg.projName": { en: "Project name:", ar: "اسم المشروع:" },
  "dlg.note": { en: "Note:", ar: "الملاحظة:" },
  "dlg.editTask": { en: "Edit task:", ar: "عدّلي المهمة:" },
  "dlg.time": { en: "Time (HH:MM, leave empty for none):", ar: "الوقت (HH:MM، خلّيه فاضي إذا ما تبين):" },

  // ---- common ----
  "c.add": { en: "Add", ar: "أضف" },
  "c.clear": { en: "Clear", ar: "مسح" },
  "c.today": { en: "Today", ar: "اليوم" },
  "c.who": { en: "— who —", ar: "— منو —" },
  "c.assignLabel": { en: "Assign", ar: "تعيين" },
  "c.copy": { en: "Copy", ar: "نسخ" },
  "c.open": { en: "Open", ar: "فتح" },
  "c.edit": { en: "Edit", ar: "تعديل" },
  "c.delete": { en: "Delete", ar: "حذف" },

  // ---- categories ----
  "cat.Achievement": { en: "Achievement", ar: "إنجاز" },
  "cat.Task": { en: "Task", ar: "مهمة" },
  "cat.Meeting": { en: "Meeting", ar: "اجتماع" },
  "cat.Issue": { en: "Issue", ar: "ملاحظة" },
  "cat.Note": { en: "Note", ar: "مذكرة" },

  // ---- stages ----
  "stage.Upcoming": { en: "Upcoming", ar: "جديد" },
  "stage.Progress": { en: "In Progress", ar: "قيد التقدم" },
  "stage.Pending": { en: "Pending", ar: "بالانتظار" },
  "stage.Testing": { en: "Testing", ar: "تحت التجربة" },
  "stage.Issues": { en: "Issues", ar: "ملاحظات" },
  "stage.Completed": { en: "Completed", ar: "اكتمل" },

  // ---- task statuses ----
  "ts.Pending": { en: "Pending", ar: "بالانتظار" },
  "ts.Progress": { en: "In Progress", ar: "قيد التقدم" },
  "ts.Done": { en: "Done", ar: "اكتمل" },

  // ---- task priority ----
  "prio.label": { en: "Priority", ar: "الأولوية" },
  "prio.Low": { en: "Low", ar: "قليلة" },
  "prio.Medium": { en: "Medium", ar: "متوسطة" },
  "prio.High": { en: "High", ar: "عالية" },

  // ---- Daily Log ----
  "log.capture": { en: "Quick capture", ar: "تدوين سريع" },
  "log.captureHint": {
    en: "Type fast in your own words — don't worry about grammar. Pick a category, then press Enter (or click Add). Everything is auto-stamped with today's date & time.",
    ar: "اكتبي بسرعة بكلماتك — لا تهتمين بالقواعد. اختاري النوع وبعدها دوسي Enter (أو زر الإضافة). كل شي ينحفظ تلقائي بتاريخ ووقت اليوم.",
  },
  "log.placeholder": {
    en: "e.g. finished the achievements report and sent it to the team…",
    ar: "مثلاً: خلّصتي تقرير الانجازات الشهري …",
  },
  "log.yourLog": { en: "Your log", ar: "سجلّك" },
  "log.search": { en: "Search your entries…", ar: " بحثي في مدخلاتك …" },
  "log.allCats": { en: "All categories", ar: "كل الأنواع" },
  "log.empty": {
    en: "No entries yet. Capture your first task above ☝️",
    ar: "ما في مدخلات لحد الحين. سجّلي أول مهمة فوق ☝️",
  },
  "log.toAgenda": {
    en: "Also add to today's agenda",
    ar: "ضيفيها بعد لأجندة اليوم",
  },
  "log.noMatch": { en: "No entries match your search 🔍", ar: "ما في مدخلات تطابق بحثك 🔍" },
  "log.all": { en: "All", ar: "الكل" },
  "log.yesterday": { en: "Yesterday", ar: "أمس" },
  "log.newEntry": { en: "New entry", ar: "مدخل جديد" },

  // ---- Agenda ----
  "ag.title": { en: "Daily agenda", ar: "الأجندة اليومية" },
  "ag.hint": {
    en: "Plan the work you intend to do, then check items off as you finish. Unfinished tasks from earlier days are carried over automatically.",
    ar: "خطّطي للشغل اللي ناوية تسوّينه، وبعدها علّمي المهام أول ما تخلّصينها. المهام اللي ما خلّصتيها من أيام قبل تنرحّل تلقائي.",
  },
  "ag.prev": { en: "Prev", ar: "قبل" },
  "ag.next": { en: "Next", ar: "بعد" },
  "ag.week": { en: "Week", ar: "أسبوع" },
  "ag.month": { en: "Month", ar: "شهر" },
  "ag.carried": { en: "Carried over — {n} unfinished from earlier days", ar: "مُرحّلة — {n} ما خلّصتها من أيام قبل" },
  "ag.moveAll": { en: "Move all to this day", ar: "نقّليهم كلهم لهذا اليوم" },
  "ag.addTask": { en: "Add a task for this day…", ar: "ضيفي مهمة لهذا اليوم…" },
  "ag.empty": { en: "Nothing planned for this day yet ✍️", ar: "ما في شي مخطط لهذا اليوم لحد الحين ✍️" },
  "ag.done": { en: "done", ar: "خالص" },

  // ---- Projects ----
  "pr.addProject": { en: "Add a project", ar: "ضيفي مشروع" },
  "pr.name": { en: "Project name", ar: "اسم المشروع" },
  "pr.note": { en: "Short note / detail (optional)", ar: "ملاحظة قصيرة / تفصيل (اختياري)" },
  "pr.addBtn": { en: "Add project", ar: "ضيفي المشروع" },
  "pr.hint": {
    en: "Swipe the board sideways to see all stages. Use the ◀ ▶ buttons to move a card between stages. Set a target date to get reminders. Click Details to follow tasks, issues and assign team members.",
    ar: "اسحبي اللوحة على جنب عشان تشوفين كل المراحل. استخدمي زرّي ▶ ◀ عشان تنقلين البطاقة بين المراحل. حدّدي تاريخ مستهدف عشان توصلك تذكيرات. دوسي على التفاصيل عشان تتابعين المهام والملاحظات وتعيّنين أعضاء الفريق.",
  },
  "pr.manageTeam": { en: "Manage team", ar: "إدارة الفريق" },
  "pr.empName": { en: "Employee name", ar: "اسم الموظف" },
  "pr.empRole": { en: "Role (optional)", ar: "الدور (اختياري)" },
  "pr.noTeam": { en: "No team members yet.", ar: "ما في أعضاء لحد الحين." },
  "pr.details": { en: "Details", ar: "التفاصيل" },
  "pr.teamOnProject": { en: "Team on this project", ar: "الفريق في هذا المشروع" },
  "pr.addMember": { en: "＋ Add a member…", ar: "＋ ضيفي عضو…" },
  "pr.noMembers": { en: "No members on this project yet — add from the menu.", ar: "ما في أعضاء في هذا المشروع — ضيفي من القائمة." },
  "pr.addTeamFirst": { en: "Add team members in the “Manage team” panel above first.", ar: "ضيفي أعضاء الفريق من لوحة «إدارة الفريق» فوق أول." },
  "pr.targetDate": { en: "Target date (reminder)", ar: "التاريخ المستهدف (تذكير)" },
  "pr.tasks": { en: "Tasks (assign & track)", ar: "المهام (تعيين ومتابعة)" },
  "pr.addTaskPh": { en: "Add a task…", ar: "ضيفي مهمة…" },
  "pr.noTasks": { en: "No tasks yet.", ar: "ما في مهام لحد الحين." },
  "pr.issues": { en: "Issues to follow", ar: "ملاحظات للمتابعة" },
  "pr.addIssuePh": { en: "Add an issue…", ar: "ضيفي ملاحظة…" },
  "pr.noIssues": { en: "No issues logged.", ar: "ما في ملاحظات مسجّلة." },
  "pr.project": { en: "— project —", ar: "— المشروع —" },
  "pr.active": { en: "{n} active across {c} columns", ar: "{n} نشِط في {c} أعمدة" },
  "pr.oneIssue": { en: "1 issue", ar: "ملاحظة وحدة" },
  "pr.nIssues": { en: "{n} issues", ar: "{n} ملاحظات" },
  "pr.addToCol": { en: "Add a project to {col}", ar: "ضيفي مشروع إلى {col}" },
  "pr.issueOpen": { en: "Open", ar: "مفتوحة" },
  "pr.issueResolved": { en: "Resolved", ar: "محلولة" },

  // ---- reminders ----
  "rem.head": { en: "Reminders — {n} project(s) need attention", ar: "تذكيرات — {n} مشروع يبيله انتباه" },

  // ---- Team ----
  "tm.title": { en: "Team workload", ar: "حِمل شغل الفريق" },
  "tm.hint": {
    en: "Every member's tasks across all projects, so you can keep up. Add a task from a member's card — pick one of the projects they're assigned to. Click a status pill to update it.",
    ar: "مهام كل عضو في كل المشاريع عشان تظلين على اطّلاع. ضيفي مهمة من بطاقة العضو — اختاري مشروع من اللي مسند له. دوسي على شارة الحالة عشان تغيّرينها.",
  },
  "tm.hideDone": { en: "Hide completed tasks", ar: "خفّي المهام الخالصة" },
  "tm.inProgress": { en: "{n} in progress", ar: "{n} قيد التقدم" },
  "tm.pending": { en: "{n} pending", ar: "{n} بالانتظار" },
  "tm.done": { en: "{n} done", ar: "{n} مكتمل" },
  "tm.addFor": { en: "Add a task for {name}…", ar: "ضيفي مهمة لـ {name}…" },
  "tm.assignFirst": { en: "Assign {name} to a project first (in 📂 Projects) to add tasks here.", ar: "أسندي {name} لمشروع أول (في 📂 المشاريع) عشان تقدرين تضيفين مهام هني." },
  "tm.noTasks": { en: "No tasks.", ar: "ما في مهام." },
  "tm.noMembers": { en: "No team members yet. Add them in 📂 Projects → 👥 Manage team.", ar: "ما في أعضاء لحد الحين. ضيفهم في 📂 المشاريع ← 👥 إدارة الفريق." },
  "tm.unassigned": { en: "Unassigned", ar: "مو مُسند" },
  "tm.noOwner": { en: "{n} task(s) with no owner", ar: "{n} مهمة بدون مالك" },

  // ---- Team board (live cards) ----
  "tb.title": { en: "Team · who's working on what", ar: "الفريق" },
  "tb.sub": {
    en: "{active} active now · {done} completed · {pending} pending",
    ar: "{active} شغّالة الحين · {done} خالصة · {pending} بالانتظار",
  },
  "tb.live": { en: "Live", ar: "مباشر" },
  "tb.active": { en: "Active now", ar: "جديد" },
  "tb.completed": { en: "Completed", ar: "مكتمل" },
  "tb.pending": { en: "Pending", ar: "بالانتظار" },
  "tb.projTasks": { en: "{done}/{total} project tasks", ar: "{done}/{total} من مهام المشروع" },
  "tb.taskTitle": { en: "Task title…", ar: "عنوان المهمة…" },
  "tb.noTasks": {
    en: "No tasks yet. Add one above, or create tasks in 📂 Projects.",
    ar: "ما في مهام لحد الحين. ضيفي وحدة فوق، أو سوّي مهام في 📂 المشاريع.",
  },
  "tb.subMembers": {
    en: "{members} members · {active} active · {done} done",
    ar: "{members} أعضاء · {active} فعال · {done} مكتمل",
  },
  "tb.tasksProjects": { en: "{tasks} tasks · {projects} projects", ar: "{tasks} مهام · {projects} مشاريع" },
  "tb.viewDetails": { en: "View details", ar: "شوفي التفاصيل" },
  "tb.close": { en: "Close", ar: "مغلق" },
  "tb.noProjects": { en: "Not assigned to any project yet.", ar: "مو مسند لأي مشروع لحد الحين." },
  "tb.noTasksProj": { en: "No tasks in this project yet.", ar: "ما في مهام في هذا المشروع لحد الحين." },
  "tb.noEmps": { en: "No team members yet. Add them in 📂 Projects → 👥 Manage team.", ar: "ما في أعضاء لحد الحين. ضيفهم في 📂 المشاريع ← 👥 إدارة الفريق." },

  // ---- Dashboard ----
  "db.title": { en: "Department dashboard", ar: "لوحة القسم" },
  "db.hint": {
    en: "A live overview of everything — projects, tasks, team workload, and your achievements this week.",
    ar: "نظرة مباشرة على كل شي — المشاريع والمهام وحِمل شغل الفريق وإنجازاتك هالأسبوع.",
  },
  "db.kProjects": { en: "Projects", ar: "المشاريع" },
  "db.kCompleted": { en: "{n} completed", ar: "{n} خالص" },
  "db.kActive": { en: "Active tasks", ar: "مهام شغّالة" },
  "db.kDone": { en: "{n} done", ar: "{n} خالصة" },
  "db.kTeam": { en: "Team members", ar: "أعضاء الفريق" },
  "db.kAch": { en: "Achievements", ar: "إنجازات" },
  "db.kThisWeek": { en: "this week", ar: "هالأسبوع" },
  "db.kReminders": { en: "Reminders", ar: "تذكيرات" },
  "db.kRemSub": { en: "overdue / due soon", ar: "متأخرة / قربت" },
  "db.kAgenda": { en: "Today's agenda", ar: "أجندة اليوم" },
  "db.kPctDone": { en: "{n}% done", ar: "{n}% خالص" },
  "db.byStage": { en: "Projects by stage", ar: "المشاريع حسب المرحلة" },
  "db.noProjects": { en: "No projects yet.", ar: "ما في مشاريع لحد الحين." },
  "db.attention": { en: "Needs attention", ar: "يبيله انتباه" },
  "db.teamWorkload": { en: "Team workload", ar: "حِمل شغل الفريق" },
  "db.recentAch": { en: "My recent achievements", ar: "آخر إنجازاتي" },
  "db.noAch": { en: "Nothing logged yet — add achievements in 📝 Daily Log.", ar: "ما في شي مسجّل لحد الحين — ضيفي إنجازات في 📝 السجل اليومي." },
  "db.tasksToday": { en: "Tasks today", ar: "مهام اليوم" },
  "db.activeProjects": { en: "Active projects", ar: "مشاريع شغّالة" },
  "db.openIssues": { en: "Open issues", ar: "ملاحظات مفتوحة" },
  "db.todayProgress": { en: "Today's progress", ar: "تقدّم اليوم" },
  "db.complete": { en: "complete", ar: "خالص" },
  "db.doneRemaining": {
    en: "{done} of {total} tasks done · {rem} remaining",
    ar: "{done} من {total} مهام خالصة · باقي {rem}",
  },
  "db.addTask": { en: "Add task", ar: "ضيفي مهمة" },
  "db.openReport": { en: "Open report", ar: "افتحي التقرير" },
  "db.quickActions": { en: "Quick actions", ar: "اختصارات سريعة" },
  "db.qaLog": { en: "Log entry", ar: "تدوين" },
  "db.qaPlan": { en: "Plan day", ar: "خطّطي يومك" },
  "db.qaProject": { en: "New project", ar: "مشروع جديد" },
  "db.qaShare": { en: "Share report", ar: "شاركي التقرير" },
  "db.allProjects": { en: "All projects", ar: "كل المشاريع" },
  "db.openBoard": { en: "Open board", ar: "افتحي اللوحة" },
  "db.all": { en: "All", ar: "الكل" },
  "db.issuesN": { en: "{n} issues", ar: "{n} ملاحظات" },
  "db.activeTasksTitle": { en: "Team · in progress", ar: "الفريق · قيد التنفيذ" },
  "db.activeNow": { en: "Active now", ar: "شغّالة الحين" },
  "db.blocked": { en: "Blocked", ar: "معلّقة" },
  "db.overdue": { en: "Overdue", ar: "متأخّرة" },
  "db.dueToday": { en: "Due today", ar: "مستحقة اليوم" },
  "db.dueTomorrow": { en: "Due tomorrow", ar: "مستحقة بكرة" },
  "db.dueOn": { en: "Due {d}", ar: "مستحقة {d}" },
  "db.noActiveTasks": { en: "No active tasks right now.", ar: "ما في مهام شغّالة الحين." },
  "db.recentActivity": { en: "Recent activity", ar: "آخر النشاط" },
  "db.noActivity": { en: "No activity yet — add an entry in the Daily Log.", ar: "ما في نشاط لحد الحين — ضيف مدخل في السجل اليومي." },
  "db.you": { en: "You", ar: "أنت" },
  "db.logged": { en: "logged", ar: "سجّلت" },
  "db.ago": { en: "{t} ago", ar: "قبل {t}" },
  "db.viewAll": { en: "View all", ar: "شوفي الكل" },
  "db.notifOn": { en: "Reminders are on", ar: "التذكيرات شغّالة" },
  "db.notifUnsupported": { en: "Notifications aren't supported on this browser.", ar: "الإشعارات مو مدعومة في هذا المتصفح." },
  "db.enable": { en: "Enable reminders", ar: "فعّل التذكيرات" },
  "db.enableHint": { en: "Get a daily alert for overdue projects & today's tasks.", ar: "بيوصلك تنبيه يومي بالمشاريع المتأخرة ومهام اليوم." },

  // ---- Weekly Report ----
  "wr.title": { en: "Generate weekly achievement report", ar: "سوِّ تقرير الإنجازات الأسبوعي" },
  "wr.hint": {
    en: "Everything you write in the Daily Log (and complete in the Agenda) within the selected dates is pulled in automatically. Pick the period, click Generate, optionally Enhance the wording, then Copy — or Save it to revisit any time.",
    ar: "كل اللي تكتبينه في السجل اليومي (واللي تخلّصينه في الأجندة) ضمن التواريخ المحددة ينجمع تلقائي. اختاري الفترة، دوسي إنشاء، حسّني الصياغة إذا تبين، وبعدها انسخي — أو احفظيه عشان ترجعين له أي وقت.",
  },
  "wr.thisWeek": { en: "This week (up to Wednesday)", ar: "هالأسبوع (لين الأربعاء)" },
  "wr.last7": { en: "Last 7 days", ar: "آخر ٧ أيام" },
  "wr.thisMonth": { en: "This month", ar: "هالشهر" },
  "wr.from": { en: "From", ar: "من" },
  "wr.to": { en: "To", ar: "إلى" },
  "wr.language": { en: "Language", ar: "اللغة" },
  "wr.incProjects": { en: "Include projects summary", ar: "ضمّن ملخص المشاريع" },
  "wr.incAgenda": { en: "Include completed agenda tasks", ar: "ضمّن مهام الأجندة الخالصة" },
  "wr.generate": { en: "Generate", ar: "إنشاء" },
  "wr.enhance": { en: "Enhance writing", ar: "حسّني الصياغة" },
  "wr.save": { en: "Save report", ar: "احفظي التقرير" },
  "wr.copy": { en: "Copy", ar: "انسخي" },
  "wr.download": { en: "Download .txt", ar: "نزّلي .txt" },
  "wr.reportPh": { en: "Your generated report will appear here…", ar: "تقريرك بيظهر هني…" },
  "wr.saved": { en: "Saved reports", ar: "التقارير المحفوظة" },
  "wr.noSaved": { en: "No saved reports yet. Generate one above and click 💾 Save.", ar: "ما في تقارير محفوظة لحد الحين. سوّي واحد فوق وضغطي 💾 حفظ." },
  "wr.savedAt": { en: "Saved", ar: "انحفظ" },
  "wr.pullEmpty": { en: "No Daily Log entries or completed agenda tasks in this period — try a wider date range.", ar: "ما في مدخلات في السجل اليومي ولا مهام أجندة خالصة في هالفترة — جرّبي نطاق أوسع." },
  "wr.pull": {
    en: "{n} item(s) from your Daily Log & Agenda in this period will be pulled in. Click Generate.",
    ar: "{n} عنصر من السجل اليومي والأجندة في هالفترة بينضمّ. دوسي إنشاء.",
  },
  "foot.copyright": {
    en: "© 2026 Alaa hub for the Systems Development and Update Department -KU",
    ar: "© 2026 Alaa hub لقسم تطوير وتحديث الأنظمة - KU",
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
  const [lang, setLangState] = useState<Lang>("ar");

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
