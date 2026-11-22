import { useEffect, useState } from "react";
import { useAppStore } from "../store/AppStore";

export function Toast() {
  const { toast } = useAppStore();
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(toast);

  useEffect(() => {
    if (!toast) return;
    setCurrent(toast);
    setVisible(true);
    const hide = window.setTimeout(() => setVisible(false), 3000);
    return () => window.clearTimeout(hide);
  }, [toast]);

  if (!current) return null;

  return (
    <div
      className={`fixed top-20 left-1/2 z-50 flex w-[92%] max-w-[460px] -translate-x-1/2 items-center gap-3.5 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-4 text-white shadow-2xl transition-all duration-300 ${
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-2.5 opacity-0"
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${current.colorClass}`}
      >
        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <p className="text-base font-extrabold leading-snug">{current.title}</p>
        <p className="text-sm text-slate-300">{current.desc}</p>
      </div>
    </div>
  );
}
