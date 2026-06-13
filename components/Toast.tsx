"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

const Ctx = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);

  const toast = useCallback((m: string) => {
    setMsg(m);
    setShow(true);
    window.setTimeout(() => setShow(false), 1800);
  }, []);

  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className={"toast" + (show ? " show" : "")}>{msg}</div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
