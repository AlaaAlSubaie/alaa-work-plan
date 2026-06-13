"use client";

import { useState, useMemo, KeyboardEvent } from "react";
import { useStore } from "@/lib/store";
import { CATEGORIES, Category, LogEntry } from "@/lib/types";
import { useLang } from "@/lib/i18n";

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
  const { db, addLog, editLog, delLog } = useStore();
  const { t, locale } = useLang();
  const [input, setInput] = useState("");
  const [cat, setCat] = useState<Category>("Achievement");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<Category | "">("");

  // inline edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editCat, setEditCat] = useState<Category>("Achievement");

  const fmtDay = (ts: number) =>
    new Date(ts).toLocaleDateString(locale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const fmtTime = (ts: number) =>
    new Date(ts).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

  const submit = () => {
    if (!input.trim()) return;
    addLog(input, cat);
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

  return (
    <>
      <div className="card">
        <h2 className="sec">⚡ {t("log.capture")}</h2>
        <p className="hint">{t("log.captureHint")}</p>
        <div className="quick">
          <textarea
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
      </div>

      <div className="card">
        <h2 className="sec">🗂️ {t("log.yourLog")}</h2>
        <div className="logtools">
          <input
            className="searchbox"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("log.search")}
          />
          <select
            className="filtersel"
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value as Category | "")}
          >
            <option value="">{t("log.allCats")}</option>
            {CATEGORIES.map(({ cat: c }) => (
              <option key={c} value={c}>
                {EMOJI[c]} {t("cat." + c)}
              </option>
            ))}
          </select>
          <button
            className="btn ghost sm"
            onClick={() => {
              setSearch("");
              setFilterCat("");
            }}
          >
            {t("c.clear")}
          </button>
        </div>

        {db.logs.length === 0 ? (
          <div className="empty">{t("log.empty")}</div>
        ) : dayKeys.length === 0 ? (
          <div className="empty">{t("log.noMatch")}</div>
        ) : (
          dayKeys.map((day) => (
            <div className="daygroup" key={day}>
              <div className="dayhead">{fmtDay(groups[day][0].ts)}</div>
              {groups[day].map((e) =>
                editId === e.id ? (
                  <div className="entry editing" key={e.id}>
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
                    <button
                      className="btn ghost sm"
                      onClick={() => setEditId(null)}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="entry" key={e.id}>
                    <span className={"badge b-" + e.cat}>{t("cat." + e.cat)}</span>
                    <div className="txt">
                      <Highlight text={e.text} q={q} />
                      <div className="time">{fmtTime(e.ts)}</div>
                    </div>
                    <div className="acts">
                      <button
                        className="iconbtn"
                        title="Edit"
                        onClick={() => startEdit(e)}
                      >
                        ✏️
                      </button>
                      <button
                        className="iconbtn"
                        title="Delete"
                        onClick={() => {
                          if (confirm("Delete this entry?")) delLog(e.id);
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
