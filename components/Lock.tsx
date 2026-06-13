"use client";

import { useState, useEffect } from "react";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ICONS: Record<string, string> = {
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff:
    '<path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6.5 0 10 7 10 7a18 18 0 0 1-3.2 4M6.6 6.6A18 18 0 0 0 2 11s3.5 7 10 7a10.9 10.9 0 0 0 3.4-.5"/><path d="m3 3 18 18"/><path d="M9.5 9.5a3 3 0 0 0 4.2 4.2"/>',
  arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  report:
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>',
  sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>',
};
function Icon({ name, size = 18, sw = 2 }: { name: string; size?: number; sw?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: ICONS[name] || "" }}
    />
  );
}

// decorative demo tasks for the brand "Today" card
const TASKS = {
  en: [
    "Deploy staging pipeline",
    "Approve audit-log PR",
    "Follow up on licensing",
    "Confirm rollback plan",
    "Draft weekly report",
  ],
  ar: [
    "طلّع خط النشر التجريبي",
    "اعتمد طلب سحب سجل التدقيق",
    "تابع موضوع الترخيص",
    "ثبّت خطة التراجع",
    "جهّز التقرير الأسبوعي",
  ],
};
const WHOS = {
  en: ["SK", "OD", "AM", "LH", "AM"],
  ar: ["س.خ", "ع.د", "ع.م", "ل.ه", "ع.م"],
};

export default function Lock() {
  const { t, lang, setLang } = useLang();
  const [isSetup, setIsSetup] = useState(false); // false = sign in, true = create account
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [keep, setKeep] = useState(true);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [doneN, setDoneN] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const tasks = lang === "ar" ? TASKS.ar : TASKS.en;
  const whos = lang === "ar" ? WHOS.ar : WHOS.en;
  const TOTAL = tasks.length;

  useEffect(() => {
    const id = setInterval(() => setDoneN((n) => (n >= TOTAL ? 0 : n + 1)), 1300);
    return () => clearInterval(id);
  }, [TOTAL]);

  const pct = Math.round((doneN / TOTAL) * 100);
  const C = 2 * Math.PI * 21;

  const onMove = (e: React.MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTilt({
      x: ((e.clientY - r.top) / r.height - 0.5) * -7,
      y: ((e.clientX - r.left) / r.width - 0.5) * 9,
    });
  };

  // remember the "keep me signed in" choice (read back in app/page.tsx)
  const rememberKeep = (k: boolean) => {
    try {
      localStorage.setItem("aw-keep", k ? "1" : "0");
      sessionStorage.setItem("aw-active", "1");
    } catch {
      /* ignore */
    }
  };

  const submit = async () => {
    if (busy) return;
    setErr("");
    setInfo("");
    if (!EMAIL_RE.test(email.trim())) return setErr(t("lock.errEmail"));
    if (pass.length < 6) return setErr(t("lock.errPwShort"));

    setBusy(true);
    try {
      if (isSetup) {
        if (!name.trim()) return setErr(t("lock.errName"));
        if (pass !== confirm) return setErr(t("lock.errMatch"));
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: pass,
          options: { data: { name: name.trim() } },
        });
        if (error) return setErr(error.message);
        rememberKeep(keep);
        if (!data.session) {
          // email confirmation is on — let the user know and flip to sign in
          setInfo(t("lock.checkEmail"));
          setIsSetup(false);
          setPass("");
          setConfirm("");
        }
        // if a session exists, onAuthStateChange in the shell unlocks the app
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });
        if (error) {
          return setErr(
            /confirm/i.test(error.message) ? t("lock.errUnconfirmed") : t("lock.errWrong")
          );
        }
        rememberKeep(keep);
        // onAuthStateChange unlocks the app
      }
    } finally {
      setBusy(false);
    }
  };

  const toggleMode = () => {
    setIsSetup((s) => !s);
    setErr("");
    setInfo("");
    setConfirm("");
  };

  const title = isSetup ? t("lock.setupTitle") : t("lock.welcome");

  return (
    <div className="login-stage">
      {/* brand — warm editorial canvas */}
      <div className="brand" onMouseMove={onMove} onMouseLeave={() => setTilt({ x: 0, y: 0 })}>
        <div className="brand__top">
          <div className="brand__logo">
            <span className="brand__mark">📋</span>
            <span>Alaa Work Plan</span>
          </div>
          <span className="brand__vol">{t("login.vol")}</span>
        </div>

        <div className="scene">
          <div className="eyebrow">
            <span className="tag">{t("login.tag")}</span>
            <span className="rule" />
          </div>
          <h2 className="scene__head">
            {t("login.headLead")} <em>{t("login.headAccent")}.</em>
          </h2>
          <p className="scene__sub">{t("login.tagline")}</p>

          <div
            className="float"
            style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
          >
            <div className="paper" style={{ transform: "translateZ(40px)" }}>
              <div className="paper__top">
                <div>
                  <div className="paper__title">{t("login.cardToday")}</div>
                  <div className="paper__sub">{t("login.cardDate")}</div>
                </div>
                <div className="ring">
                  <svg width="50" height="50">
                    <circle cx="25" cy="25" r="21" fill="none" stroke="var(--border-default)" strokeWidth="4" />
                    <circle
                      cx="25"
                      cy="25"
                      r="21"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={C}
                      strokeDashoffset={C * (1 - doneN / TOTAL)}
                      style={{ transition: "stroke-dashoffset .6s cubic-bezier(.16,1,.3,1)" }}
                    />
                  </svg>
                  <span className="ring__num">{pct}%</span>
                </div>
              </div>
              <div className="tlist">
                {tasks.map((tx, i) => (
                  <div key={i} className={"titem" + (i < doneN ? " done" : "")}>
                    <span className="box">
                      <Icon name="check" size={12} sw={3.6} />
                    </span>
                    <span className="tx">{tx}</span>
                    <span className="who">{whos[i]}</span>
                  </div>
                ))}
              </div>
              {doneN >= TOTAL && (
                <span className="chip chip--report pop" style={{ transform: "translateZ(80px)" }}>
                  <span className="ic">
                    <Icon name="report" size={16} />
                  </span>
                  {t("login.report")}
                </span>
              )}
              <span className="chip chip--streak" style={{ transform: "translateZ(70px)" }}>
                <span className="ic">
                  <Icon name="sparkles" size={16} />
                </span>
                {t("login.streak")}
              </span>
            </div>
          </div>
        </div>

        <div className="brand__foot">{t("foot.copyright")}</div>
      </div>

      {/* form side */}
      <div className="form-side">
        <div className="toprow">
          <div className="langtoggle">
            <button className={"lt" + (lang === "en" ? " on" : "")} onClick={() => setLang("en")}>
              EN
            </button>
            <button className={"lt" + (lang === "ar" ? " on" : "")} onClick={() => setLang("ar")}>
              ع
            </button>
          </div>
        </div>

        <div className="login-card">
          <p className="login-label">{t("login.label")}</p>
          <h1>{title}</h1>
          <p className="sub">{isSetup ? t("lock.setupSub") : t("login.sub")}</p>

          {isSetup && (
            <label className="lk-field">
              <span className="lk-label">{t("app.user")}</span>
              <span className="lk-wrap">
                <span className="lk-lead">
                  <Icon name="user" />
                </span>
                <input
                  className="lk-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("app.user")}
                />
              </span>
            </label>
          )}

          <label className="lk-field">
            <span className="lk-label">{t("lock.email")}</span>
            <span className="lk-wrap">
              <span className="lk-lead">
                <Icon name="mail" />
              </span>
              <input
                className="lk-input"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                autoFocus={!isSetup}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
                placeholder="name@example.com"
              />
            </span>
          </label>

          <label className="lk-field">
            <span className="lk-label">{t("lock.password")}</span>
            <span className="lk-wrap">
              <span className="lk-lead">
                <Icon name="lock" />
              </span>
              <input
                className="lk-input"
                type={show ? "text" : "password"}
                autoComplete={isSetup ? "new-password" : "current-password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSetup) submit();
                }}
                placeholder={t("lock.password")}
              />
              <button type="button" className="lk-eye" onClick={() => setShow((s) => !s)} aria-label="toggle">
                <Icon name={show ? "eyeOff" : "eye"} />
              </button>
            </span>
          </label>

          {isSetup && (
            <label className="lk-field">
              <span className="lk-label">{t("lock.confirmPw")}</span>
              <span className="lk-wrap">
                <span className="lk-lead">
                  <Icon name="lock" />
                </span>
                <input
                  className="lk-input"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submit();
                  }}
                  placeholder={t("lock.confirmPw")}
                />
              </span>
            </label>
          )}

          <div className="row-between">
            <label className="lk-keep">
              <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} />
              {t("login.keep")}
            </label>
            <button className="lk-link" onClick={toggleMode}>
              {isSetup ? t("lock.haveAccount") : t("lock.needAccount")}
            </button>
          </div>

          {err && <div className="lock-err">{err}</div>}
          {info && <div className="lock-info">{info}</div>}

          <button className="btn lk-submit" onClick={submit} disabled={busy}>
            {busy ? t("lock.working") : isSetup ? t("lock.create") : t("lock.unlock")}
            {!busy && <Icon name="arrowRight" />}
          </button>

          <p className="lk-foot-mobile">{t("foot.copyright")}</p>
        </div>
      </div>
    </div>
  );
}
