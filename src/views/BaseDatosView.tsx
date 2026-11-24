import { useMemo, useState } from "react";
import { TEMP_ALERT } from "../data/constants";
import {
  actividadRows,
  encargosRows,
  exportExcel,
  exportPdf,
  filename,
  inventarioRows,
  neverasRows,
} from "../lib/export";
import { formatTempES, monthLabel } from "../lib/dates";
import { getOrderBadgeStyle } from "../lib/orders";
import { useAppStore } from "../store/AppStore";
import { useAuth } from "../store/AuthStore";
import type { BackupPayload, DbEncFilter, DbTab } from "../types";

export function BaseDatosView() {
  const { data, worker, exportBackup, restoreBackup, createWorker, setWorkerPin, setWorkerAdmin, showToast } =
    useAppStore();
  const { workers } = useAuth();
  const [tab, setTab] = useState<DbTab>("neveras");
  const [month, setMonth] = useState("all");
  const [workerFilter, setWorkerFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [encFilter, setEncFilter] = useState<DbEncFilter>("Todos");
  const [fecha, setFecha] = useState("");
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newAdmin, setNewAdmin] = useState(false);

  const months = useMemo(
    () => Array.from(new Set(data.neverasPorDia.map((d) => d.mes))).sort().reverse(),
    [data.neverasPorDia],
  );

  const neveras = data.neverasPorDia.filter((d) => {
    const monthOk = month === "all" || d.mes === month;
    const workerOk = workerFilter === "all" || d.persona === workerFilter;
    const fechaOk = !fecha || d.fechaISO === fecha;
    return monthOk && workerOk && fechaOk;
  });

  const inventario = data.inventario.filter((i) => {
    const q = search.toLowerCase();
    const textOk = !q || `${i.producto} ${i.persona}`.toLowerCase().includes(q);
    const workerOk = workerFilter === "all" || i.persona === workerFilter;
    const fechaOk = !fecha || i.fechaISO === fecha;
    const monthOk = month === "all" || i.fechaISO.startsWith(month);
    return textOk && workerOk && fechaOk && monthOk;
  });

  const encargos = data.encargos.filter((o) => {
    const q = search.toLowerCase();
    const textOk = !q || `${o.numero} ${o.producto} ${o.persona}`.toLowerCase().includes(q);
    const statusOk = encFilter === "Todos" || o.estado === encFilter;
    const workerOk = workerFilter === "all" || o.persona === workerFilter;
    const fechaOk = !fecha || o.diaISO === fecha;
    const monthOk = month === "all" || o.diaISO.startsWith(month);
    return textOk && statusOk && workerOk && fechaOk && monthOk;
  });

  const actividad = data.recentActivity.filter((a) => {
    const q = search.toLowerCase();
    const textOk = !q || `${a.descripcion} ${a.persona}`.toLowerCase().includes(q);
    const workerOk = workerFilter === "all" || a.persona === workerFilter;
    return textOk && workerOk;
  });

  function doExport(kind: "xlsx" | "pdf") {
    const titleMap: Record<DbTab, string> = {
      neveras: `Revisiones de neveras${month !== "all" ? ` — ${monthLabel(month)}` : ""}`,
      inventario: "Inventario",
      encargos: "Encargos",
      actividad: "Actividad",
      equipo: "Equipo",
    };
    if (tab === "equipo") return;
    if (kind === "xlsx") {
      const sheets: Record<string, Record<string, string | number>[]> = {};
      if (tab === "neveras") sheets.Neveras = neverasRows(neveras);
      else if (tab === "inventario") sheets.Inventario = inventarioRows(inventario);
      else if (tab === "encargos") sheets.Encargos = encargosRows(encargos);
      else sheets.Actividad = actividadRows(actividad);
      exportExcel(sheets, filename(tab, "xlsx"));
    } else {
      if (tab === "neveras") {
        exportPdf(
          titleMap.neveras,
          ["Fecha", "Hora", "N1", "N2", "N3", "N4", "N5", "N6", "N7", "Persona"],
          neveras.map((d) => [d.fecha, d.hora, ...d.temps.map((t) => formatTempES(t)), d.persona]),
          filename("neveras", "pdf"),
        );
      } else if (tab === "inventario") {
        exportPdf(
          titleMap.inventario,
          ["Fecha", "Producto", "Cantidad", "Persona", "Estado"],
          inventario.map((i) => [i.fecha, i.producto, i.cantidad, i.persona, i.estado]),
          filename("inventario", "pdf"),
        );
      } else if (tab === "encargos") {
        exportPdf(
          titleMap.encargos,
          ["Nº", "Producto", "Cant.", "Recogida", "Persona", "Estado"],
          encargos.map((o) => [o.numero, o.producto, o.cantidad, o.dia, o.persona, o.estado]),
          filename("encargos", "pdf"),
        );
      } else {
        exportPdf(
          titleMap.actividad,
          ["Registro", "Trabajador", "Acción"],
          actividad.map((a) => [a.meta, a.persona, a.descripcion]),
          filename("actividad", "pdf"),
        );
      }
    }
    showToast("Exportación lista", `Carns Arrom — ${titleMap[tab]}`);
  }

  function downloadBackup() {
    const payload = exportBackup();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename("backup", "xlsx").replace(".xlsx", ".json");
    a.click();
    showToast("Copia creada", "Archivo JSON descargado.");
  }

  function onRestore(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result)) as BackupPayload;
        void restoreBackup(payload).then(() => showToast("Copia restaurada", "Datos recuperados en Supabase."));
      } catch {
        showToast("Archivo no válido", "No es una copia de Carns Arrom.", "bg-red-600");
      }
    };
    reader.readAsText(file);
  }

  return (
    <section className="fade-in space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-3xl">📊</span>
        <div>
          <h2 className="text-2xl font-extrabold">Base de Datos</h2>
          <p className="text-sm text-slate-600">Consulta, filtros, exportación y copias</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-200/80 p-1.5 sm:grid-cols-5">
        {(
          [
            ["neveras", "❄️ Neveras"],
            ["inventario", "📦 Inventario"],
            ["encargos", "📝 Encargos"],
            ["actividad", "📋 Actividad"],
            ["equipo", "👥 Equipo"],
          ] as const
        ).map(([id, label]) =>
          id === "equipo" && !worker.esAdmin ? null : (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-xl px-2 py-3 text-xs font-extrabold ${tab === id ? "bg-white shadow-sm" : "text-slate-600"}`}
            >
              {label}
            </button>
          ),
        )}
      </div>

      {tab !== "equipo" ? (
        <div className="space-y-2 rounded-2xl border bg-white p-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto, nº o trabajador…" className="w-full rounded-xl border-2 px-3 py-2" />
          <div className="flex flex-wrap gap-2">
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-xl border-2 px-3 py-2 text-sm font-bold">
              <option value="all">Todos los meses</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
            <select value={workerFilter} onChange={(e) => setWorkerFilter(e.target.value)} className="rounded-xl border-2 px-3 py-2 text-sm font-bold">
              <option value="all">Todos los trabajadores</option>
              {workers.map((w) => (
                <option key={w.id} value={w.nombre}>
                  {w.nombre}
                </option>
              ))}
            </select>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="rounded-xl border-2 px-3 py-2 text-sm" />
            {tab === "encargos"
              ? (["Todos", "Pendiente", "Preparado", "Entregado"] as const).map((st) => (
                  <button key={st} type="button" onClick={() => setEncFilter(st)} className={`rounded-xl px-3 py-2 text-xs font-extrabold ${encFilter === st ? "bg-slate-900 text-white" : "bg-slate-100"}`}>
                    {st}
                  </button>
                ))
              : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => doExport("xlsx")} className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-extrabold text-white">
              Excel
            </button>
            <button type="button" onClick={() => doExport("pdf")} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-extrabold text-white">
              PDF
            </button>
            {worker.esAdmin ? (
              <>
                <button type="button" onClick={downloadBackup} className="rounded-xl bg-sky-700 px-3 py-2 text-xs font-extrabold text-white">
                  Copia de seguridad
                </button>
                <label className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-extrabold">
                  Restaurar JSON
                  <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && onRestore(e.target.files[0])} />
                </label>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === "neveras" ? (
        <Table
          head={["Fecha", "N1", "N2", "N3", "N4", "N5", "N6", "N7", "Persona"]}
          rows={neveras.map((day) => [
            `${day.fecha} ${day.hora}`,
            ...day.temps.map((t) => `${formatTempES(t)}°${t > TEMP_ALERT ? " ⚠️" : ""}`),
            day.persona,
          ])}
        />
      ) : null}
      {tab === "inventario" ? (
        <Table
          head={["Fecha", "Producto", "Cantidad", "Persona", "Estado"]}
          rows={inventario.map((i) => [i.fecha, i.producto, i.cantidad, i.persona, i.estado])}
        />
      ) : null}
      {tab === "encargos" ? (
        <Table
          head={["Nº", "Producto", "Recogida", "Persona", "Estado"]}
          rows={encargos.map((o) => [o.numero, `${o.producto} (${o.cantidad})`, o.dia, o.persona, o.estado])}
          badgeCol={4}
          badgeClass={(v) => getOrderBadgeStyle(v as "Pendiente" | "Preparado" | "Entregado")}
        />
      ) : null}
      {tab === "actividad" ? (
        <div className="divide-y overflow-hidden rounded-2xl border bg-white">
          {actividad.map((a) => (
            <div key={a.id} className="p-3">
              <p className="font-bold">{a.descripcion}</p>
              <p className="text-xs text-slate-500">{a.meta}</p>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "equipo" && worker.esAdmin ? (
        <div className="space-y-4">
          <form
            className="space-y-2 rounded-2xl border bg-white p-4"
            onSubmit={(e) => {
              e.preventDefault();
              void createWorker(newName, newPin, newAdmin).then(() => {
                setNewName("");
                setNewPin("");
                setNewAdmin(false);
                showToast("Trabajador creado", newName);
              });
            }}
          >
            <p className="font-extrabold">Nuevo trabajador</p>
            <input required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre" className="w-full rounded-xl border-2 px-3 py-2" />
            <input required minLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="PIN" className="w-full rounded-xl border-2 px-3 py-2" />
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" checked={newAdmin} onChange={(e) => setNewAdmin(e.target.checked)} />
              Administrador
            </label>
            <button type="submit" className="rounded-xl bg-brand px-4 py-2 font-extrabold text-white">
              Añadir
            </button>
          </form>
          {workers.map((w) => (
            <div key={w.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-white p-3">
              <div>
                <p className="font-extrabold">{w.nombre}</p>
                <p className="text-xs text-slate-500">{w.esAdmin ? "Administrador" : "Trabajador"}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => void setWorkerAdmin(w.id, !w.esAdmin)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold">
                  {w.esAdmin ? "Quitar admin" : "Hacer admin"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pin = window.prompt(`Nuevo PIN para ${w.nombre}`);
                    if (pin && pin.length >= 4) void setWorkerPin(w.id, pin).then(() => showToast("PIN actualizado", w.nombre));
                  }}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-extrabold text-white"
                >
                  Cambiar PIN
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Table({
  head,
  rows,
  badgeCol,
  badgeClass,
}: {
  head: string[];
  rows: string[][];
  badgeCol?: number;
  badgeClass?: (v: string) => string;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-900 text-xs uppercase text-white">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={head.length} className="px-3 py-8 text-center text-slate-500">
                Sin registros con esos filtros.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="border-t">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2">
                    {badgeCol === j && badgeClass ? (
                      <span className={`rounded-lg border px-2 py-1 text-xs font-extrabold ${badgeClass(cell)}`}>{cell}</span>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
