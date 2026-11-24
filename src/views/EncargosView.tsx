import { type FormEvent, useMemo, useState } from "react";
import { addDaysISO, todayISO } from "../lib/dates";
import { getOrderBadgeStyle } from "../lib/orders";
import { useAppStore } from "../store/AppStore";
import type { EncargoEstado, EncargoItem } from "../types";

function sortEncargos(list: EncargoItem[]) {
  const today = todayISO();
  return [...list].sort((a, b) => {
    const aToday = a.diaISO === today ? 0 : 1;
    const bToday = b.diaISO === today ? 0 : 1;
    if (aToday !== bToday) return aToday - bToday;
    const pend = (e: EncargoItem) => (e.estado === "Pendiente" ? 0 : e.estado === "Preparado" ? 1 : 2);
    if (pend(a) !== pend(b)) return pend(a) - pend(b);
    return a.diaISO.localeCompare(b.diaISO);
  });
}

export function EncargosView() {
  const {
    data,
    worker,
    saveEncargo,
    updateEncargo,
    changeOrderStatus,
    deleteEncargo,
    showToast,
    openConfirm,
  } = useAppStore();
  const [tab, setTab] = useState<"activos" | "entregados" | "nuevo">("activos");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"Todos" | EncargoEstado>("Todos");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [dia, setDia] = useState(addDaysISO(todayISO(), 1));
  const [producto, setProducto] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [obs, setObs] = useState("");
  const [estado, setEstado] = useState<Extract<EncargoEstado, "Pendiente" | "Preparado">>("Pendiente");
  const [edit, setEdit] = useState<EncargoItem | null>(null);

  const normalizar = (texto: string) =>
    texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  const filtrar = (list: EncargoItem[]) => {
    const q = normalizar(busqueda);
    return list.filter((o) => {
      const statusOk = filtroEstado === "Todos" || o.estado === filtroEstado;
      const fechaOk = !filtroFecha || o.diaISO === filtroFecha;
      const textOk =
        !q ||
        normalizar([o.producto, o.numero, o.cantidad, o.persona, o.obs, o.dia].join(" ")).includes(q);
      return statusOk && fechaOk && textOk;
    });
  };

  const activos = useMemo(
    () => sortEncargos(filtrar(data.encargos.filter((o) => o.estado !== "Entregado"))),
    [data.encargos, busqueda, filtroEstado, filtroFecha],
  );
  const entregados = useMemo(
    () => filtrar(data.encargos.filter((o) => o.estado === "Entregado")),
    [data.encargos, busqueda, filtroEstado, filtroFecha],
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await saveEncargo({
        producto: producto.trim(),
        cantidad: cantidad.trim(),
        diaISO: dia,
        obs: obs.trim(),
        estado,
      });
      setProducto("");
      setCantidad("");
      setObs("");
      showToast("Encargo guardado", `Apuntado por ${worker.nombre}.`);
      setTab("activos");
    } catch (err) {
      showToast("No se pudo guardar", err instanceof Error ? err.message : "Error", "bg-red-600");
    }
  }

  function confirmDelete(order: EncargoItem) {
    openConfirm({
      title: "¿Eliminar encargo?",
      text: `Se borrará ${order.numero} (${order.producto}).`,
      yesLabel: "Sí, eliminar",
      onConfirm: () => {
        void deleteEncargo(order.id).then(() => showToast("Encargo eliminado", order.numero, "bg-red-600"));
      },
    });
  }

  return (
    <section className="fade-in space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-3xl">📝</span>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Encargos</h2>
          <p className="text-sm text-slate-600">Hoy primero, pendientes arriba. Número automático.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-200/80 p-1.5">
        <button type="button" onClick={() => setTab("activos")} className={`rounded-xl py-3 text-xs font-extrabold sm:text-sm ${tab === "activos" ? "bg-white shadow-sm" : "text-slate-600"}`}>
          Activos ({data.encargos.filter((o) => o.estado !== "Entregado").length})
        </button>
        <button type="button" onClick={() => setTab("entregados")} className={`rounded-xl py-3 text-xs font-extrabold sm:text-sm ${tab === "entregados" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600"}`}>
          Entregados
        </button>
        <button type="button" onClick={() => setTab("nuevo")} className={`rounded-xl py-3 text-xs font-extrabold sm:text-sm ${tab === "nuevo" ? "bg-brand text-white shadow-sm" : "text-brand"}`}>
          + Nuevo
        </button>
      </div>

      {tab !== "nuevo" ? (
        <div className="space-y-2 rounded-2xl border bg-white p-3">
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar nº, producto, trabajador…" className="w-full rounded-xl border-2 border-slate-300 px-3 py-2" />
          <div className="flex flex-wrap gap-2">
            {(["Todos", "Pendiente", "Preparado", "Entregado"] as const).map((st) => (
              <button key={st} type="button" onClick={() => setFiltroEstado(st)} className={`rounded-xl px-3 py-1.5 text-xs font-extrabold ${filtroEstado === st ? "bg-slate-900 text-white" : "bg-slate-100"}`}>
                {st}
              </button>
            ))}
            <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} className="rounded-xl border px-2 py-1 text-xs" />
          </div>
        </div>
      ) : null}

      {tab === "activos"
        ? activos.map((order) => (
            <article key={order.id} className={`space-y-3 rounded-2xl border-2 bg-white p-4 ${order.estado === "Pendiente" ? "border-amber-200" : "border-sky-200"} ${order.diaISO === todayISO() ? "ring-2 ring-brand/30" : ""}`}>
              <div className="flex justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-brand-light px-2 py-0.5 text-sm font-extrabold text-brand">{order.numero}</span>
                    <span className="text-sm font-bold">📅 {order.dia}{order.diaISO === todayISO() ? " · HOY" : ""}</span>
                  </div>
                  <h4 className="mt-1 text-lg font-extrabold">{order.producto}</h4>
                  <p className="font-bold">Cantidad: {order.cantidad}</p>
                </div>
                <span className={`h-fit rounded-xl border px-3 py-1 text-xs font-extrabold ${getOrderBadgeStyle(order.estado)}`}>{order.estado}</span>
              </div>
              {order.obs ? <p className="rounded-xl bg-slate-50 p-2 text-sm">Obs: {order.obs}</p> : null}
              <p className="text-xs text-slate-500">Recibido por {order.persona}</p>
              {edit?.id === order.id ? (
                <EditForm
                  order={order}
                  onCancel={() => setEdit(null)}
                  onSave={(patch) =>
                    void updateEncargo(order.id, patch).then(() => {
                      setEdit(null);
                      showToast("Encargo actualizado", order.numero);
                    })
                  }
                />
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {(["Pendiente", "Preparado", "Entregado"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => void changeOrderStatus(order.id, st)}
                      className={`rounded-xl border-2 py-3 text-xs font-extrabold ${order.estado === st ? "bg-slate-900 text-white border-slate-900" : "border-slate-200"}`}
                    >
                      {st === "Entregado" ? "✓ Entregado" : st}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => setEdit(order)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-extrabold">
                  Modificar
                </button>
                <button type="button" onClick={() => confirmDelete(order)} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-extrabold text-red-700">
                  Eliminar
                </button>
              </div>
            </article>
          ))
        : null}

      {tab === "entregados"
        ? entregados.map((order) => (
            <div key={order.id} className="rounded-2xl border bg-white p-4">
              <p className="font-extrabold">
                {order.numero} · {order.producto} ({order.cantidad})
              </p>
              <p className="text-sm text-slate-500">{order.dia} · {order.persona}</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => void changeOrderStatus(order.id, "Pendiente")} className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold">
                  Devolver a activos
                </button>
                <button type="button" onClick={() => confirmDelete(order)} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-extrabold text-red-700">
                  Eliminar
                </button>
              </div>
            </div>
          ))
        : null}

      {tab === "nuevo" ? (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-2xl border bg-white p-5">
          <p className="text-sm">El número se asigna solo. Encargo a nombre de <strong>{worker.nombre}</strong>.</p>
          <input required value={producto} onChange={(e) => setProducto(e.target.value)} placeholder="Producto" className="w-full rounded-xl border-2 px-4 py-3" />
          <input required value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="Cantidad" className="w-full rounded-xl border-2 px-4 py-3 font-extrabold" />
          <input type="date" required value={dia} onChange={(e) => setDia(e.target.value)} className="w-full rounded-xl border-2 px-4 py-3" />
          <input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Observaciones" className="w-full rounded-xl border-2 px-4 py-3" />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setEstado("Pendiente")} className={`rounded-xl border-2 py-3 font-extrabold ${estado === "Pendiente" ? "border-amber-600 bg-amber-50" : ""}`}>
              Pendiente
            </button>
            <button type="button" onClick={() => setEstado("Preparado")} className={`rounded-xl border-2 py-3 font-extrabold ${estado === "Preparado" ? "border-sky-700 bg-sky-50" : ""}`}>
              Preparado
            </button>
          </div>
          <button type="submit" className="w-full rounded-2xl bg-brand py-4 text-xl font-extrabold text-white">
            Guardar encargo
          </button>
        </form>
      ) : null}
    </section>
  );
}

function EditForm({
  order,
  onCancel,
  onSave,
}: {
  order: EncargoItem;
  onCancel: () => void;
  onSave: (patch: {
    producto: string;
    cantidad: string;
    diaISO: string;
    obs: string;
    estado: EncargoEstado;
  }) => void;
}) {
  const [producto, setProducto] = useState(order.producto);
  const [cantidad, setCantidad] = useState(order.cantidad);
  const [diaISO, setDiaISO] = useState(order.diaISO);
  const [obs, setObs] = useState(order.obs);
  const [estado, setEstado] = useState(order.estado);
  return (
    <div className="space-y-2 rounded-xl bg-slate-50 p-3">
      <input value={producto} onChange={(e) => setProducto(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
      <input value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
      <input type="date" value={diaISO} onChange={(e) => setDiaISO(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
      <input value={obs} onChange={(e) => setObs(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
      <select value={estado} onChange={(e) => setEstado(e.target.value as EncargoEstado)} className="w-full rounded-xl border px-3 py-2">
        <option>Pendiente</option>
        <option>Preparado</option>
        <option>Entregado</option>
      </select>
      <div className="flex gap-2">
        <button type="button" onClick={() => onSave({ producto, cantidad, diaISO, obs, estado })} className="rounded-xl bg-brand px-3 py-2 text-xs font-extrabold text-white">
          Guardar
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl bg-white px-3 py-2 text-xs font-bold">
          Cancelar
        </button>
      </div>
    </div>
  );
}
