import { type FormEvent, useEffect, useState } from "react";
import { TEMP_ALERT, TEMP_MAX, TEMP_MIN } from "../data/constants";
import { useLang } from "../i18n/LangStore";
import { formatTempES, todayISO } from "../lib/dates";
import { fridgeBadge } from "../lib/orders";
import { useAppStore } from "../store/AppStore";

export function NeverasView() {
  const { data, worker, saveNeveras, deleteNeveras, showToast, openConfirm } = useAppStore();
  const { t, lang } = useLang();
  const fridgeName = (i: number) => t(`fridge.${i}`);
  const [tab, setTab] = useState<"registro" | "historial">("registro");
  const [historyView, setHistoryView] = useState<"cards" | "table">("cards");
  const [fecha, setFecha] = useState(todayISO());
  const existing = data.neverasPorDia.find((d) => d.fechaISO === fecha);
  const [temps, setTemps] = useState<number[]>(existing?.temps ?? [3, 3, 3, 3, 3, 3, 3]);
  const [error, setError] = useState("");

  useEffect(() => {
    const day = data.neverasPorDia.find((d) => d.fechaISO === fecha);
    setTemps(day?.temps ?? [3, 3, 3, 3, 3, 3, 3]);
  }, [fecha, data.neverasPorDia]);

  function validate(values: number[]): string | null {
    for (let i = 0; i < 7; i += 1) {
      const temp = values[i];
      if (Number.isNaN(temp)) return t("nev.badNum", { name: fridgeName(i) });
      if (temp < TEMP_MIN || temp > TEMP_MAX) return t("nev.range", { name: fridgeName(i), min: TEMP_MIN, max: TEMP_MAX });
    }
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const message = validate(temps);
    if (message) {
      setError(message);
      showToast(t("nev.invalid"), message, "bg-amber-600");
      return;
    }
    setError("");
    try {
      await saveNeveras({ isoDate: fecha, temps });
      showToast(t("nev.saved"), existing ? t("nev.updated") : t("nev.new"), "bg-sky-700");
      setTab("historial");
    } catch (err) {
      showToast("No se pudo guardar", err instanceof Error ? err.message : "Error", "bg-red-600");
    }
  }

  return (
    <section className="fade-in space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-3xl">❄️</span>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">{t("nev.title")}</h2>
          <p className="text-sm text-slate-600">{t("nev.subtitle", { temp: TEMP_ALERT.toFixed(1).replace(".", ",") })}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-200/80 p-1.5">
        <button type="button" onClick={() => setTab("registro")} className={`rounded-xl py-3 font-extrabold ${tab === "registro" ? "bg-white text-sky-800 shadow-sm" : "text-slate-600"}`}>
          {t("nev.register")}
        </button>
        <button type="button" onClick={() => setTab("historial")} className={`rounded-xl py-3 font-extrabold ${tab === "historial" ? "bg-white text-sky-800 shadow-sm" : "text-slate-600"}`}>
          {t("nev.history", { n: data.neverasPorDia.length })}
        </button>
      </div>

      {tab === "registro" ? (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 rounded-2xl border bg-white p-4">
          {existing ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">
              {t("nev.exists", { hora: existing.hora, persona: existing.persona })}
            </p>
          ) : null}
          <div className="divide-y overflow-hidden rounded-2xl border">
            {temps.map((temp, index) => {
              const high = Number(temp) > TEMP_ALERT;
              return (
                <div key={index} className="flex items-center justify-between px-4 py-3">
                  <label className="flex items-center gap-2 font-bold">
                    <span className={`h-3 w-3 rounded-full ${high ? "bg-red-600" : "bg-sky-600"}`} />
                    {fridgeName(index)}
                    {high ? <span className="text-xs text-red-700">⚠️</span> : null}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={Number.isNaN(temp) ? "" : temp}
                      onChange={(e) => {
                        const next = [...temps];
                        next[index] = parseFloat(e.target.value);
                        setTemps(next);
                      }}
                      className={`w-24 rounded-xl border-2 py-2 text-center text-xl font-extrabold ${high ? "border-red-400 bg-red-50" : "border-slate-300 bg-sky-50"}`}
                    />
                    <span className="font-bold text-slate-500">°C</span>
                  </div>
                </div>
              );
            })}
          </div>
          {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}
          <p className="text-sm text-slate-600">
            {t("nev.by")} <strong>{worker.nombre}</strong>
          </p>
          <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full rounded-xl border-2 px-4 py-3 font-semibold" />
          <button type="submit" className="w-full rounded-2xl bg-sky-700 py-4 text-xl font-extrabold text-white">
            {existing ? t("nev.update") : t("nev.save")}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setHistoryView("cards")} className={`rounded-lg px-3 py-1.5 text-sm font-bold ${historyView === "cards" ? "bg-white shadow" : ""}`}>
              {t("nev.cards")}
            </button>
            <button type="button" onClick={() => setHistoryView("table")} className={`rounded-lg px-3 py-1.5 text-sm font-bold ${historyView === "table" ? "bg-white shadow" : ""}`}>
              {t("nev.table")}
            </button>
          </div>
          {historyView === "cards"
            ? data.neverasPorDia.map((day) => {
                const badge = fridgeBadge(day.temps, TEMP_ALERT);
                return (
                  <div key={day.id} className="space-y-3 rounded-2xl border bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold">📅 {day.diaTexto}</h4>
                        <p className="text-xs text-slate-500">
                          {day.persona} · {day.hora}
                        </p>
                      </div>
                      <span className={`rounded-lg border px-2 py-1 text-xs font-extrabold ${badge.ok ? "border-sky-200 bg-sky-50 text-sky-800" : "border-red-300 bg-red-50 text-red-800"}`}>
                        {badge.alerts === 0
                          ? t("fridge.ok")
                          : t("fridge.alert", {
                              ok: 7 - badge.alerts,
                              n: badge.alerts,
                              s: badge.alerts === 1 ? "" : lang === "ca" ? "es" : "s",
                            })}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                      {day.temps.map((t, idx) => {
                        const high = t > TEMP_ALERT;
                        return (
                          <div key={idx} className={`rounded-xl border p-2 text-center ${high ? "border-red-300 bg-red-50" : "bg-slate-50"}`}>
                            <span className="block text-[11px] font-bold leading-tight">{fridgeName(idx)}</span>
                            <span className={`font-extrabold ${high ? "text-red-700" : "text-sky-900"}`}>{formatTempES(t)}°</span>
                          </div>
                        );
                      })}
                    </div>
                    {worker.esAdmin ? (
                      <button
                        type="button"
                        onClick={() =>
                          openConfirm({
                            title: t("nev.delTitle"),
                            text: t("nev.delText", { date: day.fecha }),
                            yesLabel: t("enc.delYes"),
                            onConfirm: () => {
                              void deleteNeveras(day.id).then(() => showToast(t("nev.deleted"), day.fecha, "bg-red-600"));
                            },
                          })
                        }
                        className="rounded-xl bg-red-50 px-3 py-2 text-xs font-extrabold text-red-700"
                      >
                        {t("common.delete")}
                      </button>
                    ) : null}
                  </div>
                );
              })
            : (
              <div className="overflow-x-auto rounded-2xl border bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 text-xs uppercase">
                    <tr>
                      <th className="px-3 py-2 text-left">{t("nev.date")}</th>
                      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                        <th key={i} className="max-w-[5.5rem] px-2 py-2 leading-tight">
                          {fridgeName(i)}
                        </th>
                      ))}
                      <th className="px-3 py-2">{t("nev.person")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.neverasPorDia.map((day) => (
                      <tr key={day.id} className="border-t">
                        <td className="px-3 py-2 font-bold">{day.fecha} {day.hora}</td>
                        {day.temps.map((t, idx) => (
                          <td key={idx} className={`px-2 py-2 text-center font-extrabold ${t > TEMP_ALERT ? "bg-red-50 text-red-700" : ""}`}>
                            {formatTempES(t)}°
                          </td>
                        ))}
                        <td className="px-3 py-2">{day.persona}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      )}
    </section>
  );
}
