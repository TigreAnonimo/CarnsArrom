import { type FormEvent, useState } from "react";
import { WorkerPicker } from "../components/WorkerPicker";
import { TEMP_ALERT } from "../data/constants";
import { defaultFridgeTemps } from "../data/seed";
import { formatTempES, todayISO } from "../lib/dates";
import { useAppStore } from "../store/AppStore";

export function NeverasView() {
  const { data, saveNeveras, showToast } = useAppStore();
  const [tab, setTab] = useState<"registro" | "historial">("registro");
  const [historyView, setHistoryView] = useState<"cards" | "table">("cards");
  const [temps, setTemps] = useState<number[]>([...defaultFridgeTemps]);
  const [persona, setPersona] = useState("");
  const [fecha, setFecha] = useState(todayISO());

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!persona.trim()) {
      showToast("Falta el trabajador", "Toca tu nombre antes de guardar la revisión.", "bg-amber-600");
      return;
    }
    saveNeveras({ isoDate: fecha || todayISO(), persona: persona.trim(), temps });
    showToast("Revisión de neveras guardada", `Las 7 temperaturas se han guardado por ${persona}.`, "bg-sky-700");
    setTab("historial");
  }

  return (
    <section className="fade-in space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-3xl">❄️</span>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Revisión de neveras</h2>
          <p className="text-sm text-slate-600">Temperatura diaria de las 7 neveras</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-200/80 p-1.5">
        <button
          type="button"
          onClick={() => setTab("registro")}
          className={`rounded-xl px-3 py-3 text-sm font-extrabold transition-all sm:text-base ${
            tab === "registro" ? "bg-white text-sky-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Registrar Hoy
        </button>
        <button
          type="button"
          onClick={() => setTab("historial")}
          className={`rounded-xl px-3 py-3 text-sm font-extrabold transition-all sm:text-base ${
            tab === "historial" ? "bg-white text-sky-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Historial por día (<span>{data.neverasPorDia.length}</span>)
        </button>
      </div>

      {tab === "registro" ? (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
            {temps.map((temp, index) => (
              <div key={index} className="flex items-center justify-between bg-white px-4 py-3 hover:bg-slate-50">
                <label htmlFor={`nev-${index + 1}`} className="flex items-center gap-2.5 text-lg font-bold text-slate-800">
                  <span className="h-3 w-3 rounded-full bg-sky-600" />
                  Nevera {index + 1}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={`nev-${index + 1}`}
                    type="number"
                    step="0.1"
                    required
                    value={temp}
                    onChange={(e) => {
                      const next = [...temps];
                      const parsed = parseFloat(e.target.value);
                      next[index] = Number.isNaN(parsed) ? 0 : parsed;
                      setTemps(next);
                    }}
                    className="w-24 rounded-xl border-2 border-slate-300 bg-sky-50/70 px-2 py-2 text-center text-xl font-extrabold text-slate-900 outline-none focus:border-sky-600 focus:bg-white"
                  />
                  <span className="text-lg font-bold text-slate-500">°C</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <label htmlFor="nev-persona" className="mb-1.5 block text-base font-bold text-slate-800">
                Persona que realiza la revisión
              </label>
              <WorkerPicker inputId="nev-persona" value={persona} onChange={setPersona} theme="sky" />
            </div>
            <div>
              <label htmlFor="nev-fecha" className="mb-1.5 block text-base font-bold text-slate-800">
                Fecha
              </label>
              <input
                id="nev-fecha"
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-4 py-3 text-lg font-semibold focus:border-sky-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-700 py-4 text-xl font-extrabold text-white shadow-lg shadow-sky-700/20 transition-all hover:bg-sky-800 active:scale-[0.99]"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>GUARDAR REVISIÓN</span>
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="text-sm font-bold text-slate-700">Ver como:</span>
            <div className="flex gap-1.5 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setHistoryView("cards")}
                className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm ${
                  historyView === "cards"
                    ? "bg-white font-extrabold text-sky-800 shadow-sm"
                    : "font-bold text-slate-600 hover:text-slate-900"
                }`}
              >
                Tarjetas por día
              </button>
              <button
                type="button"
                onClick={() => setHistoryView("table")}
                className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm ${
                  historyView === "table"
                    ? "bg-white font-extrabold text-sky-800 shadow-sm"
                    : "font-bold text-slate-600 hover:text-slate-900"
                }`}
              >
                Tabla semanal
              </button>
            </div>
          </div>

          {historyView === "cards" ? (
            <div className="space-y-3">
              {data.neverasPorDia.map((day) => (
                <div key={day.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900 sm:text-lg">📅 {day.diaTexto || day.fecha}</h4>
                      <p className="text-xs font-semibold text-slate-500">
                        Revisado por: <strong className="text-slate-800">{day.persona}</strong>
                      </p>
                    </div>
                    <span className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-extrabold text-sky-800">
                      7/7 OK
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {day.temps.map((t, idx) => {
                      const isHigh = Number(t) > TEMP_ALERT;
                      return (
                        <div
                          key={idx}
                          className={`rounded-xl border p-2 text-center ${
                            isHigh ? "border-red-300 bg-red-50" : "border-slate-200/90 bg-slate-50"
                          }`}
                        >
                          <span className={`block text-[11px] font-bold uppercase ${isHigh ? "text-red-700" : "text-slate-500"}`}>
                            Nev {idx + 1}
                          </span>
                          <span className={`mt-0.5 block text-sm font-extrabold sm:text-base ${isHigh ? "text-red-700" : "text-sky-900"}`}>
                            {formatTempES(t)}°
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100 text-xs uppercase tracking-wider text-slate-700">
                      <th className="px-3 py-3 font-extrabold">Fecha</th>
                      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                        <th key={n} className="px-2 py-3 text-center font-extrabold">
                          N{n}
                        </th>
                      ))}
                      <th className="px-3 py-3 font-extrabold">Persona</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {data.neverasPorDia.map((day) => (
                      <tr key={day.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-3 py-3 font-bold text-slate-800">{day.fecha}</td>
                        {day.temps.map((t, idx) => {
                          const isHigh = Number(t) > TEMP_ALERT;
                          return (
                            <td
                              key={idx}
                              className={`whitespace-nowrap px-2 py-3 text-center font-extrabold ${
                                isHigh ? "bg-red-50 text-red-700" : "text-sky-900"
                              }`}
                            >
                              {formatTempES(t)}°
                            </td>
                          );
                        })}
                        <td className="whitespace-nowrap px-3 py-3 font-bold text-slate-700">{day.persona}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
