# Department Organizer

A Next.js app for a Development & Systems department head to:

- **📝 Daily Log** — capture what you did in seconds (rough notes, any language), auto-stamped by date/time, with **search + category filter**.
- **📄 Weekly Report** — turn your quick notes into a clean, professional achievement report (English or Arabic) for your supervisor. One click to copy. Defaults to the 7-day window ending on Wednesday.
- **📂 Projects** — a drag-and-drop board: **Pending → In Progress → Done → Issues**.

Your data is stored locally in the browser (`localStorage`). Use **Export backup** regularly.

## Run it

```bash
npm install      # first time only
npm run dev      # start the dev server
```

Then open http://localhost:3000

## Build for production

```bash
npm run build
npm run start
```

## Project structure

```
app/
  layout.tsx        # root layout + StoreProvider
  page.tsx          # header, tabs, footer (export/import)
  globals.css       # all styling
components/
  DailyLog.tsx      # quick capture + searchable log
  Projects.tsx      # drag-and-drop status board
  WeeklyReport.tsx  # date range + report generation
  Toast.tsx         # toast notifications
lib/
  types.ts          # shared types + constants
  store.tsx         # localStorage-backed React context
  report.ts         # report builder + professional "polish"
```

## Tech

- Next.js 14 (App Router) + TypeScript
- No external UI libraries — plain CSS
- Client-side persistence via `localStorage`
