"use client";

import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { buildReport, weekToWednesday, enhanceText } from "@/lib/report";
import { useToast } from "./Toast";

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
      <h2 className="sec">📄 Generate weekly achievement report</h2>
      <p className="hint">
        Everything you write in the <b>Daily Log</b> (and complete in the{" "}
        <b>Agenda</b>) within the selected dates is pulled in automatically. Pick
        the period, click <b>Generate</b>, optionally <b>✨ Enhance</b> the
        wording, then <b>Copy</b> — or <b>💾 Save</b> it to revisit any time.
      </p>
      <div className="quickdates">
        <button className="btn ghost sm" onClick={() => quick("weekWed")}>
          This week (up to Wednesday)
        </button>
        <button className="btn ghost sm" onClick={() => quick("last7")}>
          Last 7 days
        </button>
        <button className="btn ghost sm" onClick={() => quick("month")}>
          This month
        </button>
      </div>
      <div className="rrow">
        <div className="field">
          <label>From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field">
          <label>To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="field">
          <label>Language</label>
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
          Include projects summary
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={incAgenda}
            onChange={(e) => setIncAgenda(e.target.checked)}
          />
          Include completed agenda tasks
        </label>
        <button className="btn" onClick={generate}>
          ✨ Generate
        </button>
      </div>

      {counts && (
        <div className={"pullbar" + (counts.total === 0 && counts.agendaDone === 0 ? " empty-range" : "")}>
          {counts.total === 0 && counts.agendaDone === 0 ? (
            <>📭 No Daily Log entries or completed agenda tasks in this period — try a wider date range.</>
          ) : (
            <>
              🔗 From your Daily Log &amp; Agenda in this period:{" "}
              <b>{counts.acc}</b> accomplishments
              {counts.iss > 0 && (
                <>
                  , <b>{counts.iss}</b> issue{counts.iss > 1 ? "s" : ""}
                </>
              )}
              {counts.notes > 0 && (
                <>
                  , <b>{counts.notes}</b> note{counts.notes > 1 ? "s" : ""}
                </>
              )}
              {counts.agendaDone > 0 && (
                <>
                  , <b>{counts.agendaDone}</b> completed agenda task
                  {counts.agendaDone > 1 ? "s" : ""}
                </>
              )}{" "}
              will be pulled in. Click <b>Generate</b>.
            </>
          )}
        </div>
      )}

      <textarea
        className="report-box"
        value={report}
        onChange={(e) => setReport(e.target.value)}
        placeholder="Your generated report will appear here..."
      />
      <div className="rbtns">
        <button className="btn" onClick={enhance}>
          ✨ Enhance writing
        </button>
        <button className="btn" onClick={save}>
          💾 Save report
        </button>
        <button className="btn ghost" onClick={copy}>
          📋 Copy
        </button>
        <button className="btn ghost" onClick={download}>
          ⬇️ Download .txt
        </button>
      </div>

      {/* saved reports archive */}
      <div className="saved">
        <h2 className="sec" style={{ marginTop: 4 }}>
          📚 Saved reports {db.reports.length > 0 && `(${db.reports.length})`}
        </h2>
        {db.reports.length === 0 ? (
          <div className="empty">
            No saved reports yet. Generate one above and click 💾 Save.
          </div>
        ) : (
          db.reports.map((r) => (
            <div className="savedrow" key={r.id}>
              <div className="saved-info">
                <div className="saved-title">
                  {r.title}
                  <span className="saved-lang">{r.lang === "ar" ? "AR" : "EN"}</span>
                </div>
                <div className="saved-meta">
                  Saved {new Date(r.ts).toLocaleDateString()} ·{" "}
                  {new Date(r.ts).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <div className="saved-acts">
                <button className="btn ghost sm" onClick={() => openSaved(r.id)}>
                  Open
                </button>
                <button
                  className="btn ghost sm"
                  onClick={() => {
                    navigator.clipboard.writeText(r.text);
                    toast("Copied 📋");
                  }}
                >
                  Copy
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
