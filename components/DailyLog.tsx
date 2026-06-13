"use client";

import { useState, useMemo, KeyboardEvent } from "react";
import { useStore } from "@/lib/store";
import { CATEGORIES, Category, LogEntry } from "@/lib/types";

function fmtDay(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
  const [input, setInput] = useState("");
  const [cat, setCat] = useState<Category>("Achievement");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<Category | "">("");

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
        <h2 className="sec">⚡ Quick capture</h2>
        <p className="hint">
          Type fast in your own words — don&apos;t worry about grammar. Pick a
          category, then press <b>Enter</b> (or click Add). Everything is
          auto-stamped with today&apos;s date &amp; time. You&apos;ll polish it
          into professional language later in the Report tab.
        </p>
        <div className="quick">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="e.g. finished the monthly safety report and sent it to the team..."
          />
          <button className="btn" onClick={submit}>
            ＋ Add
          </button>
        </div>
        <div className="chips">
          {CATEGORIES.map(({ cat: c, label }) => (
            <button
              key={c}
              className={"chip" + (cat === c ? " active c-" + c : "")}
              onClick={() => setCat(c)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="sec">🗂️ Your log</h2>
        <div className="logtools">
          <input
            className="searchbox"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search your entries..."
          />
          <select
            className="filtersel"
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value as Category | "")}
          >
            <option value="">All categories</option>
            {CATEGORIES.map(({ cat: c, label }) => (
              <option key={c} value={c}>
                {label}
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
            Clear
          </button>
        </div>

        {db.logs.length === 0 ? (
          <div className="empty">
            No entries yet. Capture your first task above ☝️
          </div>
        ) : dayKeys.length === 0 ? (
          <div className="empty">No entries match your search 🔍</div>
        ) : (
          dayKeys.map((day) => (
            <div className="daygroup" key={day}>
              <div className="dayhead">{fmtDay(groups[day][0].ts)}</div>
              {groups[day].map((e) => (
                <div className="entry" key={e.id}>
                  <span className={"badge b-" + e.cat}>{e.cat}</span>
                  <div className="txt">
                    <Highlight text={e.text} q={q} />
                    <div className="time">{fmtTime(e.ts)}</div>
                  </div>
                  <div className="acts">
                    <button
                      className="iconbtn"
                      title="Edit"
                      onClick={() => {
                        const v = prompt("Edit entry:", e.text);
                        if (v !== null) editLog(e.id, v);
                      }}
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
              ))}
            </div>
          ))
        )}
      </div>
    </>
  );
}
