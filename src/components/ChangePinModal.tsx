import { type FormEvent, useState } from "react";
import { useAppStore } from "../store/AppStore";
import { useAuth } from "../store/AuthStore";

export function ChangePinModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { changeOwnPin, session } = useAuth();
  const { showToast } = useAppStore();
  const [actual, setActual] = useState("");
  const [nuevo, setNuevo] = useState("");
  const [repetir, setRepetir] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (nuevo !== repetir) {
      setError("El PIN nuevo y la repetición no coinciden.");
      return;
    }
    if (!/^\d{4,8}$/.test(nuevo)) {
      setError("El PIN nuevo debe tener entre 4 y 8 números.");
      return;
    }
    setBusy(true);
    const message = await changeOwnPin(actual, nuevo);
    setBusy(false);
    if (message) {
      setError(message);
      return;
    }
    setActual("");
    setNuevo("");
    setRepetir("");
    onClose();
    showToast("PIN actualizado", `El PIN de ${session?.nombre ?? "tu usuario"} se ha cambiado.`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <form onSubmit={(e) => void onSubmit(e)} className="fade-in w-full max-w-[400px] space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">Cambiar PIN</h3>
          <p className="mt-1 text-sm text-slate-600">
            {session?.nombre}: pon el PIN actual y elige uno nuevo de 4 a 8 números.
          </p>
        </div>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          required
          value={actual}
          onChange={(e) => setActual(e.target.value.replace(/\D/g, "").slice(0, 8))}
          placeholder="PIN actual"
          className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-center text-xl font-extrabold tracking-[0.3em]"
        />
        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          required
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value.replace(/\D/g, "").slice(0, 8))}
          placeholder="PIN nuevo"
          className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-center text-xl font-extrabold tracking-[0.3em]"
        />
        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          required
          value={repetir}
          onChange={(e) => setRepetir(e.target.value.replace(/\D/g, "").slice(0, 8))}
          placeholder="Repetir PIN nuevo"
          className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-center text-xl font-extrabold tracking-[0.3em]"
        />
        {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 py-3.5 font-bold text-slate-700">
            Cancelar
          </button>
          <button type="submit" disabled={busy} className="rounded-xl bg-brand py-3.5 font-extrabold text-white disabled:opacity-50">
            {busy ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
