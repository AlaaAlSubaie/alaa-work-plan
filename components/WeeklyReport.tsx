"use client";

import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { buildReport, weekToWednesday, enhanceText } from "@/lib/report";
import { useToast } from "./Toast";
import { useLang } from "@/lib/i18n";

function iso(d: Date) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}
function rangeTitle(from: string, to: string) {
  const f = new Date(from + "T00:00:00");
  const t = new Date(to + "T00:00:00");
  const o: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${f.toLocaleDateString(undefined, o)} – ${t.toLocaleDateString(undefined, {
    ...o,
    year: "numeric",
  })}`;
}

export default function WeeklyReport() {
  const { db, saveReport, delReport } = useStore();
  const toast = useToast();
  const { t } = useLang();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [incProjects, setIncProjects] = useState(true);
  const [incAgenda, setIncAgenda] = useState(true);
  const [report, setReport] = useState("");

  useEffect(() => {
    const { from, to } = weekToWednesday();
    setFrom(from);
    setTo(to);
  }, []);

  // live preview of what the Daily Log + Agenda will contribute for this range
  const counts = useMemo(() => {
    if (!from || !to) return null;
    const f = new Date(from + "T00:00:00").getTime();
    const t = new Date(to + "T23:59:59").getTime();
    const logs = db.logs.filter((e) => e.ts >= f && e.ts <= t);
    const acc = logs.filter((e) =>
      ["Achievement", "Task", "Meeting"].includes(e.cat)
    ).length;
    const iss = logs.filter((e) => e.cat === "Issue").length;
    const notes = logs.filter((e) => e.cat === "Note").length;
    const agendaDone = db.agenda.filter(
      (a) => a.done && a.date >= from && a.date <= to
    ).length;
    return { total: logs.length, acc, iss, notes, agendaDone };
  }, [db.logs, db.agenda, from, to]);

  const quick = (type: "weekWed" | "last7" | "month") => {
    const today = new Date();
    if (type === "weekWed") {
      const r = weekToWednesday(today);
      setFrom(r.from);
      setTo(r.to);
      return;
    }
    if (type === "last7") {
      const f = new Date(today);
      f.setDate(today.getDate() - 6);
      setFrom(iso(f));
      setTo(iso(today));
      return;
    }
    if (type === "month") {
      const f = new Date(today.getFullYear(), today.getMonth(), 1);
      setFrom(iso(f));
      setTo(iso(today));
    }
  };

  const generate = () => {
    if (!from || !to) {
      toast("Pick a date range");
      return;
    }
    setReport(
      buildReport(db, {
        from,
        to,
        lang,
        includeProjects: incProjects,
        includeAgenda: incAgenda,
      })
    );
  };

  const enhance = () => {
    if (!report.trim()) {
      toast("Generate a report first");
      return;
    }
    setReport(enhanceText(report, lang));
    toast("Wording enhanced ✨");
  };

  const save = () => {
    if (!report.trim()) {
      toast("Generate a report first");
      return;
    }
    saveReport({
      title: `Weekly Report — ${rangeTitle(from, to)}`,
      from,
      to,
      lang,
      text: report,
    });
    toast("Report saved 📁");
  };

  const copy = () => {
    if (!report) {
      toast("Generate a report first");
      return;
    }
    navigator.clipboard.writeText(report);
    toast("Copied! Paste it to your supervisor 📋");
  };

  const download = () => {
    if (!report) {
      toast("Generate a report first");
      return;
    }
    const blob = new Blob([report], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "weekly-report.txt";
    a.click();
  };

  const openSaved = (id: string) => {
    const r = db.reports.find((x) => x.id === id);
    if (!r) return;
    setFrom(r.from);
    setTo(r.to);
    setLang(r.lang);
    setReport(r.text);
    toast("Opened saved report");
  };

  return (
    <div className="card">
      <h2 className="sec">📄 {t("wr.title")}</h2>
      <p className="hint">{t("wr.hint")}</p>
      <div className="quickdates">
        <button className="btn ghost sm" onClick={() => quick("weekWed")}>
          {t("wr.thisWeek")}
        </button>
        <button className="btn ghost sm" onClick={() => quick("last7")}>
          {t("wr.last7")}
        </button>
        <button className="btn ghost sm" onClick={() => quick("month")}>
          {t("wr.thisMonth")}
        </button>
      </div>
      <div className="rrow">
        <div className="field">
          <label>{t("wr.from")}</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field">
          <label>{t("wr.to")}</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="field">
          <label>{t("wr.language")}</label>
          <select value={lang} onChange={(e) => setLang(e.target.value as "en" | "ar")}>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={incProjects}
            onChange={(e) => setIncProjects(e.target.checked)}
          />
          {t("wr.incProjects")}
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={incAgenda}
            onChange={(e) => setIncAgenda(e.target.checked)}
          />
          {t("wr.incAgenda")}
        </label>
        <button className="btn" onClick={generate}>
          ✨ {t("wr.generate")}
        </button>
      </div>

      {counts && (
        <div
          className={
            "pullbar" +
            (counts.total === 0 && counts.agendaDone === 0 ? " empty-range" : "")
          }
        >
          {counts.total === 0 && counts.agendaDone === 0
            ? "📭 " + t("wr.pullEmpty")
            : "🔗 " + t("wr.pull", { n: counts.total + counts.agendaDone })}
        </div>
      )}

      <textarea
        className="report-box"
        value={report}
        onChange={(e) => setReport(e.target.value)}
        placeholder={t("wr.reportPh")}
      />
      <div className="rbtns">
        <button className="btn" onClick={enhance}>
          ✨ {t("wr.enhance")}
        </button>
        <button className="btn" onClick={save}>
          💾 {t("wr.save")}
        </button>
        <button className="btn ghost" onClick={copy}>
          📋 {t("wr.copy")}
        </button>
        <button className="btn ghost" onClick={download}>
          ⬇️ {t("wr.download")}
        </button>
      </div>

      {/* saved reports archive */}
      <div className="saved">
        <h2 className="sec" style={{ marginTop: 4 }}>
          📚 {t("wr.saved")} {db.reports.length > 0 && `(${db.reports.length})`}
        </h2>
        {db.reports.length === 0 ? (
          <div className="empty">{t("wr.noSaved")}</div>
        ) : (
          db.reports.map((r) => (
            <div className="savedrow" key={r.id}>
              <div className="saved-info">
                <div className="saved-title">
                  {r.title}
                  <span className="saved-lang">{r.lang === "ar" ? "AR" : "EN"}</span>
                </div>
                <div className="saved-meta">
                  {t("wr.savedAt")} {new Date(r.ts).toLocaleDateString()} ·{" "}
                  {new Date(r.ts).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <div className="saved-acts">
                <button className="btn ghost sm" onClick={() => openSaved(r.id)}>
                  {t("c.open")}
                </button>
                <button
                  className="btn ghost sm"
                  onClick={() => {
                    navigator.clipboard.writeText(r.text);
                    toast("Copied 📋");
                  }}
                >
                  {t("c.copy")}
                </button>
                <button
                  className="iconbtn"
                  title="Delete"
                  onClick={() => {
                    if (confirm("Delete this saved report?")) delReport(r.id);
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
