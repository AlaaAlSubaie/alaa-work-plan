"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { ToastProvider, useToast } from "@/components/Toast";
import { useLang } from "@/lib/i18n";
import { DB } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import Lock from "@/components/Lock";
import ChangePassword from "@/components/ChangePassword";
import Dashboard from "@/components/Dashboard";
import DailyLog from "@/components/DailyLog";
import Agenda from "@/components/Agenda";
import Projects from "@/components/Projects";
import Team from "@/components/Team";
import WeeklyReport from "@/components/WeeklyReport";

type Tab = "dashboard" | "log" | "agenda" | "projects" | "team" | "report";

function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="langtoggle" role="group" aria-label="Language">
      <button
        className={"lt" + (lang === "en" ? " on" : "")}
        onClick={() => setLang("en")}
      >
        EN
      </button>
      <button
        className={"lt" + (lang === "ar" ? " on" : "")}
        onClick={() => setLang("ar")}
      >
        ع
      </button>
    </div>
  );
}

function Header() {
  const { db, setMeta } = useStore();
  const { t } = useLang();
  const [showPw, setShowPw] = useState(false);
  const signOut = async () => {
    try {
      localStorage.setItem("aw-keep", "0");
      sessionStorage.removeItem("aw-active");
    } catch {
      /* ignore */
    }
    await supabase.auth.signOut();
  };
  return (
    <header className="app-header">
      {showPw && <ChangePassword onClose={() => setShowPw(false)} />}
      <div className="head-row">
        <div className="logo">📋</div>
        <div>
          <h1>{t("app.title")}</h1>
          <div className="sub">{t("app.sub")}</div>
        </div>
        <div className="head-spacer"></div>
        <LangToggle />
        <button className="btn ghost sm signout-btn" onClick={() => setShowPw(true)}>
          {t("pw.title")}
        </button>
        <button className="btn ghost sm signout-btn" onClick={signOut}>
          {t("lock.signOut")}
        </button>
        <div className="head-fields">
          <input
            placeholder={t("app.dept")}
            value={db.meta.dept}
            onChange={(e) => setMeta({ dept: e.target.value })}
          />
          <input
            placeholder={t("app.user")}
            value={db.meta.user}
            onChange={(e) => setMeta({ user: e.target.value })}
          />
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const { db, replaceAll } = useStore();
  const toast = useToast();
  const { t } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "department-backup.json";
    a.click();
    toast(t("toast.backupDown"));
  };

  const importBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(String(reader.result)) as Partial<DB>;
        replaceAll({
          logs: d.logs ?? [],
          projects: (d.projects ?? []).map((p) => ({
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
          agenda: d.agenda ?? [],
          reports: d.reports ?? [],
          employees: d.employees ?? [],
          meta: d.meta ?? { dept: "", user: "" },
        });
        toast(t("toast.backupRestored"));
      } catch {
        toast(t("toast.invalidFile"));
      }
    };
    reader.readAsText(file);
  };

  return (
    <footer className="app-footer">
      <span className="note">💾 {t("foot.note")}</span>
      <button className="btn ghost sm" onClick={exportBackup}>
        ⬇️ {t("foot.export")}
      </button>
      <button className="btn ghost sm" onClick={() => fileRef.current?.click()}>
        ⬆️ {t("foot.import")}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importBackup(f);
          e.target.value = "";
        }}
      />
      <div className="app-copyright">{t("foot.copyright")}</div>
    </footer>
  );
}

function todayISO() {
  const d = new Date();
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

function Shell() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [unlocked, setUnlocked] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const { db, loaded } = useStore();
  const { t } = useLang();

  // Auth gate driven by the Supabase session
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const session = data.session;
      // honor "keep me signed in": if the user opted out and this is a fresh
      // browser session (new tab/window), sign them back out.
      const keep = localStorage.getItem("aw-keep") !== "0";
      const freshTab = !sessionStorage.getItem("aw-active");
      if (session && !keep && freshTab) {
        await supabase.auth.signOut();
        setUnlocked(false);
      } else {
        setUnlocked(!!session);
      }
      sessionStorage.setItem("aw-active", "1");
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUnlocked(!!session);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Daily reminder notification (once per day, when the app is open & permission granted)
  useEffect(() => {
    if (!loaded || !unlocked) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const today = todayISO();
    const key = "dept_notified_" + today;
    if (localStorage.getItem(key)) return;

    const overdue = db.projects.filter(
      (p) => p.status !== "Completed" && p.due && p.due < today
    ).length;
    const dueToday = db.projects.filter(
      (p) => p.status !== "Completed" && p.due === today
    ).length;
    const agendaToday = db.agenda.filter(
      (a) => a.date === today && !a.done
    ).length;

    const parts: string[] = [];
    if (overdue) parts.push(`${overdue} project${overdue > 1 ? "s" : ""} overdue`);
    if (dueToday) parts.push(`${dueToday} due today`);
    if (agendaToday)
      parts.push(`${agendaToday} agenda task${agendaToday > 1 ? "s" : ""} for today`);

    if (parts.length) {
      new Notification("🔔 Department reminders", { body: parts.join(" · ") });
      localStorage.setItem(key, "1");
    }
  }, [loaded, db, unlocked]);

  if (!authReady) return <div className="login-stage" />;
  if (!unlocked) return <Lock />;

  return (
    <>
      <Header />
      <div className="wrap">
        <div className="tabs">
          <button
            className={"tab" + (tab === "dashboard" ? " active" : "")}
            onClick={() => setTab("dashboard")}
          >
            📊 {t("tab.dashboard")}
          </button>
          <button
            className={"tab" + (tab === "log" ? " active" : "")}
            onClick={() => setTab("log")}
          >
            📝 {t("tab.log")}
          </button>
          <button
            className={"tab" + (tab === "agenda" ? " active" : "")}
            onClick={() => setTab("agenda")}
          >
            📅 {t("tab.agenda")}
          </button>
          <button
            className={"tab" + (tab === "projects" ? " active" : "")}
            onClick={() => setTab("projects")}
          >
            📂 {t("tab.projects")}
          </button>
          <button
            className={"tab" + (tab === "team" ? " active" : "")}
            onClick={() => setTab("team")}
          >
            👥 {t("tab.team")}
          </button>
          <button
            className={"tab" + (tab === "report" ? " active" : "")}
            onClick={() => setTab("report")}
          >
            📄 {t("tab.report")}
          </button>
        </div>

        {!loaded ? (
          <div className="card">
            <div className="empty">{t("app.loading")}</div>
          </div>
        ) : tab === "dashboard" ? (
          <Dashboard onNav={(x) => setTab(x as Tab)} />
        ) : tab === "log" ? (
          <DailyLog />
        ) : tab === "agenda" ? (
          <Agenda />
        ) : tab === "projects" ? (
          <Projects />
        ) : tab === "team" ? (
          <Team />
        ) : (
          <WeeklyReport />
        )}
      </div>
      <Footer />
    </>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  );
}
