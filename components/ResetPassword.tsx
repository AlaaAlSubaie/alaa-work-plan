"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

const ICONS: Record<string, string> = {
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff:
    '<path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6.5 0 10 7 10 7a18 18 0 0 1-3.2 4M6.6 6.6A18 18 0 0 0 2 11s3.5 7 10 7a10.9 10.9 0 0 0 3.4-.5"/><path d="m3 3 18 18"/><path d="M9.5 9.5a3 3 0 0 0 4.2 4.2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
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

// Shown after the user opens a password-reset link (PASSWORD_RECOVERY session).
export default function ResetPassword({ onDone }: { onDone: () => void }) {
  const { t, lang, setLang } = useLang();
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (busy) return;
    setErr("");
    if (pass.length < 6) return setErr(t("lock.errPwShort"));
    if (pass !== confirm) return setErr(t("lock.errMatch"));
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pass });
      if (error) return setErr(error.message);
      // recovery session is now a normal session — enter the app
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-stage reset-stage">
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
          <h1>{t("lock.newPassTitle")}</h1>
          <p className="sub">{t("lock.newPassSub")}</p>

          <label className="lk-field">
            <span className="lk-label">{t("lock.newPassword")}</span>
            <span className="lk-wrap">
              <span className="lk-lead">
                <Icon name="lock" />
              </span>
              <input
                className="lk-input"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                value={pass}
                autoFocus
                onChange={(e) => setPass(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") save();
                }}
                placeholder={t("lock.newPassword")}
              />
              <button type="button" className="lk-eye" onClick={() => setShow((s) => !s)} aria-label="toggle">
                <Icon name={show ? "eyeOff" : "eye"} />
              </button>
            </span>
          </label>

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
                  if (e.key === "Enter") save();
                }}
                placeholder={t("lock.confirmPw")}
              />
            </span>
          </label>

          {err && <div className="lock-err">{err}</div>}

          <button className="btn lk-submit" onClick={save} disabled={busy}>
            {busy ? t("lock.working") : t("lock.savePassword")}
            {!busy && <Icon name="check" />}
          </button>

          <p className="lk-foot-mobile">{t("foot.copyright")}</p>
        </div>
      </div>
    </div>
  );
}
