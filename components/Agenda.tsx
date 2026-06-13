"use client";

import { useState, useMemo, KeyboardEvent } from "react";
import { useStore } from "@/lib/store";

function iso(d: Date) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}
function todayISO() {
  return iso(new Date());
}
function addDays(isoDate: string, n: number) {
  const d = new Date(isoDate + "T00:00:00");
  d.setDate(d.getDate() + n);
  return iso(d);
}
function addMonths(isoDate: string, n: number) {
  const d = new Date(isoDate + "T00:00:00");
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  return iso(d);
}
function prettyDate(isoDate: string) {
  return new Date(isoDate + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
function shortDate(isoDate: string) {
  return new Date(isoDate + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// Week starts Saturday (Sat–Fri)
const WD = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const satOffset = (isoDate: string) => {
  const dow = new Date(isoDate + "T00:00:00").getDay(); // 0 Sun..6 Sat
  return (dow + 1) % 7;
};

export default function Agenda() {
  const {
    db,
    addAgenda,
    toggleAgenda,
    editAgenda,
    delAgenda,
    setAgendaDate,
  } = useStore();
  const [date, setDate] = useState(todayISO());
  const [text, setText] = useState("");
  const [time, setTime] = useState("");
  const [view, setView] = useState<"week" | "month">("week");

  const items = useMemo(
    () =>
      db.agenda
        .filter((a) => a.date === date)
        .sort((a, b) => {
          if (a.time && b.time) return a.time.localeCompare(b.time);
          if (a.time) return -1;
          if (b.time) return 1;
          return a.ts - b.ts;
        }),
    [db.agenda, date]
  );

  const doneCount = items.filter((a) => a.done).length;
  const total = items.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  // carried-over: unfinished tasks dated before the selected day (only when viewing today/future)
  const overdue = useMemo(
    () =>
      db.agenda
        .filter((a) => !a.done && a.date < date)
        .sort(
          (a, b) =>
            a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || "")
        ),
    [db.agenda, date]
  );
  const showCarry = date >= todayISO() && overdue.length > 0;

  // week strip
  const week = useMemo(() => {
    const start = addDays(date, -satOffset(date));
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(start, i);
      const dayItems = db.agenda.filter((a) => a.date === day);
      return { day, total: dayItems.length, done: dayItems.filter((a) => a.done).length };
    });
  }, [date, db.agenda]);

  // month grid
  const monthCells = useMemo(() => {
    const anchor = new Date(date + "T00:00:00");
    const year = anchor.getFullYear();
    const m = anchor.getMonth();
    const firstIso = iso(new Date(year, m, 1));
    const offset = satOffset(firstIso);
    const dim = new Date(year, m + 1, 0).getDate();
    const cells: ({ ds: string; day: number; total: number; done: number } | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let day = 1; day <= dim; day++) {
      const ds = iso(new Date(year, m, day));
      const dayItems = db.agenda.filter((a) => a.date === ds);
      cells.push({ ds, day, total: dayItems.length, done: dayItems.filter((a) => a.done).length });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [date, db.agenda]);

  const monthLabel = new Date(date + "T00:00:00").toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const submit = () => {
    if (!text.trim()) return;
    addAgenda(date, text, time);
    setText("");
    setTime("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
  };

  const stateOf = (t: number, d: number) =>
    t === 0 ? "none" : d === t ? "full" : "part";

  return (
    <div className="card">
      <h2 className="sec">📅 Daily agenda</h2>
      <p className="hint">
        Plan the work you intend to do, then check items off as you finish them.
        Unfinished tasks from earlier days are carried over automatically.
        Switch between <b>Week</b> and <b>Month</b> to track your progress.
      </p>

      {/* date navigation + view toggle */}
      <div className="daynav">
        <button className="btn ghost sm" onClick={() => setDate(addDays(date, -1))}>
          ◀ Prev
        </button>
        <input
          type="date"
          className="datepick"
          value={date}
          onChange={(e) => setDate(e.target.value || todayISO())}
        />
        <button className="btn ghost sm" onClick={() => setDate(addDays(date, 1))}>
          Next ▶
        </button>
        <button
          className="btn ghost sm"
          onClick={() => setDate(todayISO())}
          disabled={date === todayISO()}
        >
          Today
        </button>
        <span className="daynav-spacer" />
        <div className="viewtoggle">
          <button
            className={"vt" + (view === "week" ? " on" : "")}
            onClick={() => setView("week")}
          >
            Week
          </button>
          <button
            className={"vt" + (view === "month" ? " on" : "")}
            onClick={() => setView("month")}
          >
            Month
          </button>
        </div>
      </div>

      {/* week or month overview */}
      {view === "week" ? (
        <div className="weekstrip">
          {week.map((w) => (
            <button
              key={w.day}
              className={
                "daychip" +
                (w.day === date ? " sel" : "") +
                (w.day === todayISO() ? " today" : "") +
                " s-" +
                stateOf(w.total, w.done)
              }
              onClick={() => setDate(w.day)}
              title={prettyDate(w.day)}
            >
              <span className="dchip-dow">
                {new Date(w.day + "T00:00:00").toLocaleDateString(undefined, {
                  weekday: "short",
                })}
              </span>
              <span className="dchip-num">
                {new Date(w.day + "T00:00:00").getDate()}
              </span>
              <span className="dchip-ratio">
                {w.total ? `${w.done}/${w.total}` : "—"}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="monthview">
          <div className="monthhead">
            <button
              className="btn ghost sm"
              onClick={() => setDate(addMonths(date, -1))}
            >
              ◀
            </button>
            <span className="monthlabel">{monthLabel}</span>
            <button
              className="btn ghost sm"
              onClick={() => setDate(addMonths(date, 1))}
            >
              ▶
            </button>
          </div>
          <div className="monthgrid">
            {WD.map((d) => (
              <div key={d} className="wd-head">
                {d}
              </div>
            ))}
            {monthCells.map((c, i) =>
              c === null ? (
                <div key={"b" + i} className="mcell blank" />
              ) : (
                <button
                  key={c.ds}
                  className={
                    "mcell" +
                    (c.ds === date ? " sel" : "") +
                    (c.ds === todayISO() ? " today" : "") +
                    " s-" +
                    stateOf(c.total, c.done)
                  }
                  onClick={() => setDate(c.ds)}
                  title={prettyDate(c.ds)}
                >
                  <span className="mcell-num">{c.day}</span>
                  {c.total > 0 && (
                    <span className="mcell-ratio">
                      {c.done}/{c.total}
                    </span>
                  )}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* carried-over from earlier days */}
      {showCarry && (
        <div className="carry">
          <div className="carry-head">
            <span>⏰ Carried over — {overdue.length} unfinished from earlier days</span>
            <button
              className="btn ghost sm"
              onClick={() => overdue.forEach((a) => setAgendaDate(a.id, date))}
            >
              Move all to this day
            </button>
          </div>
          {overdue.map((a) => (
            <div key={a.id} className="agitem carry-item">
              <input
                type="checkbox"
                className="agcheck"
                checked={a.done}
                onChange={() => toggleAgenda(a.id)}
              />
              <span className="carry-date">{shortDate(a.date)}</span>
              {a.time && <span className="agtimebadge">{a.time}</span>}
              <span className="agitemtext">{a.text}</span>
              <span className="acts">
                <button
                  className="iconbtn"
                  title="Move to selected day"
                  onClick={() => setAgendaDate(a.id, date)}
                >
                  →
                </button>
                <button
                  className="iconbtn"
                  title="Delete"
                  onClick={() => {
                    if (confirm("Delete this task?")) delAgenda(a.id);
                  }}
                >
                  🗑️
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* selected day header + progress */}
      <div className="agday">
        <div className="agday-title">{prettyDate(date)}</div>
        {total > 0 && (
          <div className="agprogress">
            <div className="agbar">
              <div className="agbar-fill" style={{ width: pct + "%" }} />
            </div>
            <span className="agpct">
              {doneCount}/{total} done · {pct}%
            </span>
          </div>
        )}
      </div>

      {/* add item */}
      <div className="agadd">
        <input
          type="time"
          className="agtime"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          title="Optional time"
        />
        <input
          className="agtext"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder="Add a task for this day…"
        />
        <button className="btn" onClick={submit}>
          ＋ Add
        </button>
      </div>

      {/* items */}
      {items.length === 0 ? (
        <div className="empty">Nothing planned for this day yet ✍️</div>
      ) : (
        <div className="aglist">
          {items.map((a) => (
            <div key={a.id} className={"agitem" + (a.done ? " done" : "")}>
              <input
                type="checkbox"
                className="agcheck"
                checked={a.done}
                onChange={() => toggleAgenda(a.id)}
              />
              {a.time && <span className="agtimebadge">{a.time}</span>}
              <span className="agitemtext">{a.text}</span>
              <span className="acts">
                <button
                  className="iconbtn"
                  title="Edit"
                  onClick={() => {
                    const v = prompt("Edit task:", a.text);
                    if (v === null) return;
                    const tm = prompt("Time (HH:MM, leave empty for none):", a.time);
                    editAgenda(a.id, v, tm ?? "");
                  }}
                >
                  ✏️
                </button>
                <button
                  className="iconbtn"
                  title="Delete"
                  onClick={() => {
                    if (confirm("Delete this task?")) delAgenda(a.id);
                  }}
                >
                  🗑️
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
