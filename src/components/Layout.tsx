import type { ReactNode } from "react";
import { formatHeaderDate } from "../lib/dates";
import { useAppStore } from "../store/AppStore";
import { ConfirmModal } from "./ConfirmModal";
import { Toast } from "./Toast";

export function Layout({ children }: { children: ReactNode }) {
  const { view, navigateTo } = useAppStore();

  return (
    <div className="flex min-h-screen flex-col items-center justify-start text-slate-800 antialiased sm:py-6">
      <div className="relative flex min-h-screen w-full max-w-[680px] flex-col overflow-hidden bg-[#F8FAFC] sm:min-h-[850px] sm:rounded-3xl sm:border sm:border-slate-200 sm:shadow-xl">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigateTo("home")}
              className={`${
                view === "home" ? "hidden" : "flex"
              } items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-100 px-3.5 py-2.5 text-sm font-extrabold text-slate-800 transition-colors hover:bg-slate-200 active:bg-slate-300 sm:text-base`}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Inicio</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo("home")}
              className="flex cursor-pointer items-center gap-2.5 text-left"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-lg font-extrabold text-white shadow-sm">
                CA
              </div>
              <div>
                <h1 className="text-lg font-extrabold leading-tight tracking-tight text-slate-900 sm:text-xl">
                  Carns Arrom
                </h1>
                <p className="text-xs font-bold uppercase tracking-wider text-brand">Gestión Interna</p>
              </div>
            </button>
          </div>

          <div className="text-right">
            <span className="inline-block rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 sm:text-sm">
              {formatHeaderDate()}
            </span>
          </div>
        </header>

        <Toast />

        <main className="flex flex-1 flex-col p-4 sm:p-6">{children}</main>

        <footer className="mt-auto border-t border-slate-200 bg-white px-6 py-4 text-center">
          <p className="text-xs font-medium text-slate-400">
            Carns Arrom — Gestión Interna ·{" "}
            <span className="font-semibold text-slate-600">Jesús, Jordy, Jony, Joel, Mónica, Chema y Sonia</span>
          </p>
        </footer>
      </div>

      <ConfirmModal />
    </div>
  );
}
