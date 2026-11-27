import { useState } from "react";
import { LanguageToggle, useLang } from "../i18n/LangStore";
import { useAuth } from "../store/AuthStore";

export function LoginView() {
  const { workers, login, loginError, loading } = useAuth();
  const { t } = useLang();
  const [nombre, setNombre] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!nombre || pin.length < 4) return;
    setBusy(true);
    await login(nombre, pin);
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#E9EEF4] p-4">
      <div className="w-full max-w-md space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex justify-end">
          <LanguageToggle />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-lg font-extrabold text-white">
            CA
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Carns Arrom</h1>
            <p className="text-xs font-bold uppercase tracking-wider text-brand">{t("login.access")}</p>
          </div>
        </div>
        <p className="text-sm text-slate-600">{t("login.hint")}</p>
        <div className="grid grid-cols-2 gap-2">
          {workers.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setNombre(w.nombre)}
              className={`rounded-xl border-2 px-3 py-3 text-sm font-extrabold ${
                nombre === w.nombre
                  ? "border-brand bg-brand text-white"
                  : "border-slate-200 bg-slate-50 text-slate-800"
              }`}
            >
              {w.nombre}
              {w.esAdmin ? <span className="mt-1 block text-[10px] font-bold opacity-80">{t("common.admin")}</span> : null}
            </button>
          ))}
        </div>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
          placeholder="PIN"
          className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-4 py-3.5 text-center text-2xl font-extrabold tracking-[0.4em] focus:border-brand focus:outline-none"
        />
        {loginError ? <p className="text-sm font-bold text-red-700">{loginError}</p> : null}
        <button
          type="button"
          disabled={!nombre || pin.length < 4 || busy || loading}
          onClick={() => void submit()}
          className="w-full rounded-2xl bg-brand py-4 text-lg font-extrabold text-white disabled:opacity-50"
        >
          {busy ? t("login.entering") : t("login.enter")}
        </button>
      </div>
    </div>
  );
}
