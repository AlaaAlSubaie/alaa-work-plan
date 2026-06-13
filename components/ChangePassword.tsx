"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

const ICONS: Record<string, string> = {
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff:
    '<path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6.5 0 10 7 10 7a18 18 0 0 1-3.2 4M6.6 6.6A18 18 0 0 0 2 11s3.5 7 10 7a10.9 10.9 0 0 0 3.4-.5"/><path d="m3 3 18 18"/><path d="M9.5 9.5a3 3 0 0 0 4.2 4.2"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
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

// In-app password change (no email link) — visible only while signed in.
export default function ChangePassword({ onClose }: { onClose: () => void }) {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email || ""));
  }, []);

  const submit = async () => {
    if (busy) return;
    setErr("");
    if (next.length < 6) return setErr(t("pw.errShort"));
    if (next !== confirm) return setErr(t("pw.errMatch"));
    if (next === cur) return setErr(t("pw.errSame"));
    setBusy(true);
    try {
      // confirm the user knows the current password before changing it
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email,
        password: cur,
      });
      if (signErr) return setErr(t("pw.errCurrent"));
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) return setErr(error.message);
      setOk(true);
    } finally {
      setBusy(false);
    }
  };

  const field = (
    label: string,
    value: string,
    set: (v: string) => void,
    auto: string
  ) => (
    <label className="lk-field">
      <span className="lk-label">{label}</span>
      <span className="lk-wrap">
        <span className="lk-lead">
          <Icon name="lock" />
        </span>
        <input
          className="lk-input"
          type={show ? "text" : "password"}
          autoComplete={auto}
          value={value}
          onChange={(e) => set(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder={label}
        />
        <button type="button" className="lk-eye" onClick={() => setShow((s) => !s)} aria-label="toggle">
          <Icon name={show ? "eyeOff" : "eye"} />
        </button>
      </span>
    </label>
  );

  return createPortal(
    <div className="pw-overlay" onClick={onClose}>
      <div className="pw-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pw-head">
          <h2>{t("pw.title")}</h2>
          <button className="pw-close" onClick={onClose} aria-label={t("pw.cancel")}>
            <Icon name="x" />
          </button>
        </div>

        {ok ? (
          <div className="pw-done">
            <span className="pw-done-ic">
              <Icon name="check" size={26} sw={2.6} />
            </span>
            <p>{t("pw.okMsg")}</p>
            <button className="btn lk-submit" onClick={onClose}>
              {t("pw.done")}
            </button>
          </div>
        ) : (
          <>
            <p className="sub">{t("pw.sub")}</p>
            {field(t("pw.current"), cur, setCur, "current-password")}
            {field(t("pw.new"), next, setNext, "new-password")}
            {field(t("pw.confirm"), confirm, setConfirm, "new-password")}

            {err && <div className="lock-err">{err}</div>}

            <button className="btn lk-submit" onClick={submit} disabled={busy}>
              {busy ? t("lock.working") : t("pw.save")}
              {!busy && <Icon name="check" />}
            </button>
            <button className="lk-link lk-back" onClick={onClose}>
              {t("pw.cancel")}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
