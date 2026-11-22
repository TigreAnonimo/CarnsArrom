import { useMemo, useState } from "react";
import { TEMP_ALERT } from "../data/constants";
import { formatTempES, monthLabel } from "../lib/dates";
import { getOrderBadgeStyle } from "../lib/orders";
import { useAppStore } from "../store/AppStore";
import type { DbEncFilter } from "../types";

export function BaseDatosView() {
  const { data } = useAppStore();
  const [tab, setTab] = useState<"neveras" | "inventario" | "encargos">("neveras");
  const [month, setMonth] = useState("2026-11");
  const [encFilter, setEncFilter] = useState<DbEncFilter>("Todos");
  const [search, setSearch] = useState("");

  const months = useMemo(() => {
    const unique = Array.from(new Set(data.neverasPorDia.map((d) => d.mes))).sort().reverse();
    return unique;
  }, [data.neverasPorDia]);

  const neveras = useMemo(() => {
    return month === "all" ? data.neverasPorDia : data.neverasPorDia.filter((d) => d.mes === month);
  }, [data.neverasPorDia, month]);

  const encargos = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.encargos.filter((o) => {
      const matchesStatus = encFilter === "Todos" || o.estado === encFilter;
      const matchesText =
        !query ||
        o.numero.toLowerCase().includes(query) ||
        o.producto.toLowerCase().includes(query) ||
        o.persona.toLowerCase().includes(query);
      return matchesStatus && matchesText;
    });
  }, [data.encargos, encFilter, search]);

  return (
    <section className="fade-in space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-3xl">📊</span>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Base de Datos</h2>
          <p className="text-sm text-slate-600">Registros completos de toda la carnicería</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-200/80 p-1.5">
        {(
          [
            ["neveras", "❄️ Neveras (Mes)"],
            ["inventario", "📦 Inventario"],
            ["encargos", "📝 Encargos"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-xl px-2 py-3 text-xs font-extrabold transition-all sm:text-sm ${
              tab === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "neveras" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <span className="block text-sm font-extrabold text-slate-800">Filtrar por mes</span>
              <span className="text-xs text-slate-500">En rojo si supera los 5,0 °C</span>
            </div>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-xl border-2 border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-sky-600 focus:outline-none sm:text-base"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
              <option value="all">Todos los meses</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-900 text-xs uppercase tracking-wider text-white">
                    <th className="px-3 py-3 font-extrabold">Fecha</th>
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <th key={n} className="px-2 py-3 text-center font-extrabold">
                        N{n}
                      </th>
                    ))}
                    <th className="px-3 py-3 font-extrabold">Persona</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {neveras.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center font-medium text-slate-500">
                        No hay registros en este mes.
                      </td>
                    </tr>
                  ) : (
                    neveras.map((day) => (
                      <tr key={day.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-3 py-3 font-bold text-slate-800">{day.fecha}</td>
                        {day.temps.map((t, idx) => {
                          const isHigh = Number(t) > TEMP_ALERT;
                          return (
                            <td
                              key={idx}
                              className={`whitespace-nowrap px-2 py-3 text-center font-extrabold ${
                                isHigh ? "bg-red-100 text-red-800" : "text-sky-900"
                              }`}
                            >
                              {formatTempES(t)}°
                            </td>
                          );
                        })}
                        <td className="whitespace-nowrap px-3 py-3 font-bold text-slate-700">{day.persona}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "inventario" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-900 text-xs uppercase tracking-wider text-white">
                  <th className="px-3 py-3 font-extrabold">Fecha</th>
                  <th className="px-3 py-3 font-extrabold">Producto</th>
                  <th className="px-3 py-3 font-extrabold">Cantidad</th>
                  <th className="px-3 py-3 font-extrabold">Persona</th>
                  <th className="px-3 py-3 font-extrabold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {data.inventario.map((item) => {
                  const isStock = item.estado === "En almacén";
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-3 py-3 font-semibold text-slate-600">{item.fecha}</td>
                      <td className="px-3 py-3 font-extrabold text-slate-900">{item.producto}</td>
                      <td className="whitespace-nowrap px-3 py-3 font-bold text-slate-800">{item.cantidad}</td>
                      <td className="whitespace-nowrap px-3 py-3 font-semibold text-slate-700">{item.persona}</td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span
                          className={`rounded-lg border px-2.5 py-1 text-xs font-extrabold ${
                            isStock
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {item.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "encargos" && (
        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Buscar por nº (#107), producto o trabajador..."
              className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-4 py-3 text-base focus:border-brand focus:bg-white focus:outline-none"
            />
            <div className="flex flex-wrap gap-2">
              {(["Todos", "Pendiente", "Preparado", "Entregado"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setEncFilter(st)}
                  className={`rounded-xl px-3.5 py-2 text-xs sm:text-sm ${
                    encFilter === st
                      ? "bg-slate-900 font-extrabold text-white shadow-sm"
                      : "bg-slate-100 font-bold text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-900 text-xs uppercase tracking-wider text-white">
                    <th className="px-3 py-3 font-extrabold">Nº</th>
                    <th className="px-3 py-3 font-extrabold">Producto / Cant.</th>
                    <th className="px-3 py-3 font-extrabold">Recogida</th>
                    <th className="px-3 py-3 font-extrabold">Persona</th>
                    <th className="px-3 py-3 font-extrabold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {encargos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center font-medium text-slate-500">
                        No se encontraron encargos con ese filtro.
                      </td>
                    </tr>
                  ) : (
                    encargos.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-3 py-3 font-extrabold text-brand">{o.numero}</td>
                        <td className="px-3 py-3">
                          <span className="block font-extrabold text-slate-900">{o.producto}</span>
                          <span className="text-xs font-semibold text-slate-500">{o.cantidad}</span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 font-semibold text-slate-700">{o.dia}</td>
                        <td className="whitespace-nowrap px-3 py-3 font-semibold text-slate-700">{o.persona}</td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <span className={`rounded-lg border px-2.5 py-1 text-xs font-extrabold ${getOrderBadgeStyle(o.estado)}`}>
                            {o.estado}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
