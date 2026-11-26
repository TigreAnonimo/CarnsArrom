import { type ReactNode, useState } from "react";
import { formatHeaderDate } from "../lib/dates";
import { useAppStore } from "../store/AppStore";
import { useAuth } from "../store/AuthStore";
import { ChangePinModal } from "./ChangePinModal";
import { ConfirmModal } from "./ConfirmModal";
import { Toast } from "./Toast";

export function Layout({ children }: { children: ReactNode }) {
  const { view, navigateTo, worker } = useAppStore();
  const { logout } = useAuth();
  const [pinOpen, setPinOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-start bg-slate-100 text-slate-800 antialiased sm:p-3 lg:p-5">
      <div className="relative flex min-h-screen w-full max-w-[1600px] flex-col overflow-hidden bg-[#F8FAFC] shadow-sm sm:min-h-[calc(100vh-24px)] sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-xl lg:min-h-[calc(100vh-40px)] lg:rounded-3xl">
        <header className="sticky top-0 z-30 flex w-full items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-5 sm:py-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigateTo("home")}
              className={`${
                view === "home" ? "hidden" : "flex"
              } shrink-0 items-center gap-1 rounded-xl border border-slate-300 bg-slate-100 px-2.5 py-2 text-sm font-extrabold text-slate-800 hover:bg-slate-200 sm:px-3.5 sm:py-2.5`}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Inicio</span>
            </button>
            <button type="button" onClick={() => navigateTo("home")} className="flex min-w-0 items-center gap-2 text-left">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-base font-extrabold text-white sm:h-11 sm:w-11 sm:rounded-2xl sm:text-lg">
                CA
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-extrabold text-slate-900 sm:text-xl">Carns Arrom</h1>
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand sm:text-xs">Gestión Interna</p>
              </div>
            </button>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700 sm:text-sm">
              {formatHeaderDate()}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-brand sm:text-xs">
                {worker.nombre}
                {worker.esAdmin ? " · Admin" : ""}
              </span>
              <button type="button" onClick={() => setPinOpen(true)} className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700">
                PIN
              </button>
              <button type="button" onClick={logout} className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700">
                Salir
              </button>
            </div>
          </div>
        </header>
        <Toast />
        <main className="flex w-full flex-1 flex-col p-3 sm:p-5 md:p-6 lg:p-8">{children}</main>
        <footer className="mt-auto border-t border-slate-200 bg-white px-3 py-3 text-center sm:px-6 sm:py-4">
          <p className="text-[10px] font-medium text-slate-400 sm:text-xs">
            Carns Arrom — Gestión Interna
            <span className="block font-semibold text-slate-600 sm:inline"> · Jesús, Jordi, Jony, Joel, Mónica, Chema y Sonia</span>
          </p>
        </footer>
      </div>
      <ChangePinModal open={pinOpen} onClose={() => setPinOpen(false)} />
      <ConfirmModal />
    </div>
  );
}
