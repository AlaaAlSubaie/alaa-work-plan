"use client";

import { useState, useMemo, useEffect, KeyboardEvent } from "react";
import { useStore } from "@/lib/store";
import { CATEGORIES, Category, LogEntry } from "@/lib/types";
import { useLang } from "@/lib/i18n";

function todayISO() {
  const d = new Date();
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

const EMOJI: Record<Category, string> = {
  Achievement: "✅",
  Task: "📌",
  Meeting: "🤝",
  Issue: "⚠️",
  Note: "🗒️",
};

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  const lower = text.toLowerCase();
  let pos = 0;
  while (true) {
    const idx = lower.indexOf(q, pos);
    if (idx < 0) {
      parts.push(text.slice(pos));
      break;
    }
    parts.push(text.slice(pos, idx));
    parts.push(<mark key={idx}>{text.slice(idx, idx + q.length)}</mark>);
    pos = idx + q.length;
  }
  return <>{parts}</>;
}

export default function DailyLog() {
  const { db, addLog, editLog, delLog, addAgenda } = useStore();
  const { t, locale } = useLang();
  const [input, setInput] = useState("");
  const [cat, setCat] = useState<Category>("Achievement");
  const [toAgenda, setToAgenda] = useState(true);

  // remember the "also add to agenda" preference
  useEffect(() => {
    const v = localStorage.getItem("aw-log2agenda");
    if (v !== null) setToAgenda(v === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("aw-log2agenda", toAgenda ? "1" : "0");
  }, [toAgenda]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<Category | "">("");

  // inline edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editCat, setEditCat] = useState<Category>("Achievement");

  // per-entry "⋮" action menu
  const [menuId, setMenuId] = useState<string | null>(null);
  useEffect(() => {
    if (!menuId) return;
    const close = () => setMenuId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuId]);

  const fmtDay = (ts: number) =>
    new Date(ts).toLocaleDateString(locale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const fmtTime = (ts: number) =>
    new Date(ts).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const submit = () => {
    if (!input.trim()) return;
    addLog(input, cat);
    if (toAgenda) addAgenda(todayISO(), input.trim(), "", cat);
    setInput("");
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const startEdit = (e: LogEntry) => {
    setEditId(e.id);
    setEditText(e.text);
    setEditCat(e.cat);
  };
  const saveEdit = () => {
    if (editId && editText.trim()) editLog(editId, editText, editCat);
    setEditId(null);
  };

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    let items = [...db.logs].sort((a, b) => b.ts - a.ts);
    if (filterCat) items = items.filter((e) => e.cat === filterCat);
    if (q) items = items.filter((e) => e.text.toLowerCase().includes(q));
    const g: Record<string, LogEntry[]> = {};
    items.forEach((e) => {
      const k = new Date(e.ts).toDateString();
      (g[k] ||= []).push(e);
    });
    return g;
  }, [db.logs, search, filterCat]);

  const q = search.trim().toLowerCase();
  const dayKeys = Object.keys(groups);

  const todayKey = new Date().toDateString();
  const yesterdayKey = new Date(Date.now() - 86400000).toDateString();
  const dayLabel = (day: string) =>
    day === todayKey
      ? t("c.today")
      : day === yesterdayKey
      ? t("log.yesterday")
      : fmtDay(groups[day][0].ts);

  return (
    <>
      {/* composer */}
      <div className="card composer-card">
        <div className="composer">
          <span className="composer-icon" aria-hidden>
            ✎
          </span>
          <textarea
            className="composer-input"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={t("log.placeholder")}
          />
          <button className="btn" onClick={submit}>
            ＋ {t("c.add")}
          </button>
        </div>
        <div className="chips">
          {CATEGORIES.map(({ cat: c }) => (
            <button
              key={c}
              className={"chip" + (cat === c ? " active c-" + c : "")}
              onClick={() => setCat(c)}
            >
              {EMOJI[c]} {t("cat." + c)}
            </button>
          ))}
        </div>
        <label className="toggle" style={{ marginTop: 12 }}>
          <input
            type="checkbox"
            checked={toAgenda}
            onChange={(e) => setToAgenda(e.target.checked)}
          />
          📅 {t("log.toAgenda")}
        </label>
      </div>

      {/* search + category filter pills */}
      <div className="logbar">
        <div className="logsearch">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path
              d="m20 20-3.5-3.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("log.search")}
          />
        </div>
        <div className="logfilters">
          <button
            className={"fpill" + (filterCat === "" ? " on" : "")}
            onClick={() => setFilterCat("")}
          >
            {t("log.all")}
          </button>
          {CATEGORIES.map(({ cat: c }) => (
            <button
              key={c}
              className={"fpill" + (filterCat === c ? " on c-" + c : "")}
              onClick={() => setFilterCat(c)}
            >
              {t("cat." + c)}
            </button>
          ))}
        </div>
      </div>

      {/* list */}
      {db.logs.length === 0 ? (
        <div className="card">
          <div className="empty">{t("log.empty")}</div>
        </div>
      ) : dayKeys.length === 0 ? (
        <div className="card">
          <div className="empty">{t("log.noMatch")}</div>
        </div>
      ) : (
        dayKeys.map((day) => (
          <div className="daygroup" key={day}>
            <div className="dayhead">
              <span className="dayhead-label">{dayLabel(day)}</span>
              <span className="dayhead-rule" />
              <span className="dayhead-count">{groups[day].length}</span>
            </div>
            {groups[day].map((e) =>
              editId === e.id ? (
                <div className="logentry editing" key={e.id}>
                  <select
                    className="filtersel"
                    value={editCat}
                    onChange={(ev) => setEditCat(ev.target.value as Category)}
                  >
                    {CATEGORIES.map(({ cat: c }) => (
                      <option key={c} value={c}>
                        {EMOJI[c]} {t("cat." + c)}
                      </option>
                    ))}
                  </select>
                  <input
                    className="searchbox"
                    value={editText}
                    autoFocus
                    onChange={(ev) => setEditText(ev.target.value)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter") saveEdit();
                      if (ev.key === "Escape") setEditId(null);
                    }}
                  />
                  <button className="btn sm" onClick={saveEdit}>
                    ✓
                  </button>
                  <button className="btn ghost sm" onClick={() => setEditId(null)}>
                    ✕
                  </button>
                </div>
              ) : (
                <div className="logentry" key={e.id}>
                  <div className="le-time">{fmtTime(e.ts)}</div>
                  <div className="le-main">
                    <div className="le-text">
                      <Highlight text={e.text} q={q} />
                    </div>
                    <span className={"le-badge b-" + e.cat}>
                      <span className="le-dot" />
                      {t("cat." + e.cat)}
                    </span>
                  </div>
                  <div className="le-menu-wrap">
                    <button
                      className="le-menu"
                      title={t("c.edit")}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setMenuId((m) => (m === e.id ? null : e.id));
                      }}
                    >
                      ⋮
                    </button>
                    {menuId === e.id && (
                      <div
                        className="le-menu-pop"
                        onClick={(ev) => ev.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setMenuId(null);
                            startEdit(e);
                          }}
                        >
                          ✏️ {t("c.edit")}
                        </button>
                        <button
                          className="danger"
                          onClick={() => {
                            setMenuId(null);
                            if (confirm(t("dlg.delEntry"))) delLog(e.id);
                          }}
                        >
                          🗑️ {t("c.delete")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        ))
      )}
    </>
  );
}
