import { type FormEvent, useMemo, useState } from "react";
import { WorkerPicker } from "../components/WorkerPicker";
import { addDaysISO, formatDateES, todayISO } from "../lib/dates";
import {
  etiquetaCantidad,
  formatEncargoNumero,
  getOrderBadgeStyle,
  parseEncargoLineas,
  serializeEncargoLineas,
  siguienteNumeroEncargo,
  textoTotalBusqueda,
  type EncargoLinea,
  type EncargoUnidad,
} from "../lib/orders";
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

function soloDigitos(texto: string) {
  return texto.replace(/\D/g, "");
}

function faltaClienteOTelefono(cliente: string, telefono: string): string | null {
  if (!cliente.trim()) return "Pon el nombre de la persona.";
  if (soloDigitos(telefono).length < 9) return "Pon un teléfono (mínimo 9 cifras).";
  return null;
}

function EncargoLineasLista({ producto, cantidad }: { producto: string; cantidad: string }) {
  const items = parseEncargoLineas(producto, cantidad).filter((l) => l.producto || l.cantidad);
  if (!items.length) return null;
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((l, i) => (
        <li key={`${l.producto}-${i}`} className="text-base font-extrabold leading-snug">
          {l.producto}
          {etiquetaCantidad(l) ? <span className="ml-2 font-bold text-slate-600">· {etiquetaCantidad(l)}</span> : null}
        </li>
      ))}
    </ul>
  );
}

function LineasEncargoEditor({
  lineas,
  onChange,
  compact = false,
}: {
  lineas: EncargoLinea[];
  onChange: (lineas: EncargoLinea[]) => void;
  compact?: boolean;
}) {
  function patch(i: number, campo: keyof EncargoLinea, valor: string) {
    onChange(lineas.map((l, idx) => (idx === i ? { ...l, [campo]: valor } : l)));
  }
  function setUnidad(i: number, unidad: EncargoUnidad) {
    onChange(lineas.map((l, idx) => (idx === i ? { ...l, unidad } : l)));
  }
  const pad = compact ? "py-2" : "py-3";
  return (
    <div className="space-y-2">
      <p className={`block font-bold ${compact ? "text-sm" : "text-base"}`}>Qué pide (una cosa por línea)</p>
      {lineas.map((l, i) => (
        <div key={i} className="space-y-2 rounded-xl border-2 border-slate-200 p-2">
          <input
            required={i === 0}
            value={l.producto}
            onChange={(e) => patch(i, "producto", e.target.value)}
            placeholder={`Producto ${i + 1}`}
            className={`w-full rounded-xl border-2 px-3 ${pad}`}
          />
          <div className="flex gap-2">
            <input
              required={i === 0}
              value={l.cantidad}
              onChange={(e) => patch(i, "cantidad", e.target.value)}
              inputMode="decimal"
              placeholder="Cant."
              className={`w-20 shrink-0 rounded-xl border-2 px-3 font-extrabold ${pad} sm:w-24`}
            />
            <button
              type="button"
              onClick={() => setUnidad(i, "ud")}
              className={`flex-1 rounded-xl border-2 text-xs font-extrabold ${l.unidad === "ud" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200"}`}
            >
              Ud
            </button>
            <button
              type="button"
              onClick={() => setUnidad(i, "kg")}
              className={`flex-1 rounded-xl border-2 text-xs font-extrabold ${l.unidad === "kg" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200"}`}
            >
              Kg
            </button>
            {lineas.length > 1 ? (
              <button
                type="button"
                onClick={() => onChange(lineas.filter((_, idx) => idx !== i))}
                className="shrink-0 rounded-xl bg-red-50 px-2 text-xs font-extrabold text-red-700"
                aria-label="Quitar esta línea"
              >
                ✕
              </button>
            ) : null}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...lineas, { producto: "", cantidad: "", unidad: "ud" }])}
        className="w-full rounded-xl border-2 border-dashed border-brand/40 py-2 text-sm font-extrabold text-brand"
      >
        + Añadir otra cosa
      </button>
    </div>
  );
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
  const [busquedaTel, setBusquedaTel] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"Todos" | "Pendiente" | "Preparado">("Todos");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [dia, setDia] = useState(addDaysISO(todayISO(), 1));
  const [lineas, setLineas] = useState<EncargoLinea[]>([{ producto: "", cantidad: "", unidad: "ud" }]);
  const [cliente, setCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [persona, setPersona] = useState(worker.nombre);
  const [obs, setObs] = useState("");
  const [estado, setEstado] = useState<Extract<EncargoEstado, "Pendiente" | "Preparado">>("Pendiente");
  const [edit, setEdit] = useState<EncargoItem | null>(null);
  const siguienteNumero = siguienteNumeroEncargo(data.encargos, dia);

  const normalizar = (texto: string) =>
    texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  const filtrar = (list: EncargoItem[], aplicarEstado: boolean) => {
    const q = normalizar(busqueda);
    const telQ = soloDigitos(busquedaTel);
    return list.filter((o) => {
      const statusOk = !aplicarEstado || filtroEstado === "Todos" || o.estado === filtroEstado;
      const fechaOk = !filtroFecha || o.diaISO === filtroFecha;
      const textOk =
        !q ||
        normalizar([o.producto, o.numero, o.cantidad, o.cliente, o.telefono, o.persona, o.obs, o.dia].join(" ")).includes(q);
      const telOk = !telQ || soloDigitos(o.telefono).includes(telQ);
      return statusOk && fechaOk && textOk && telOk;
    });
  };

  const activos = useMemo(
    () => sortEncargos(filtrar(data.encargos.filter((o) => o.estado !== "Entregado"), true)),
    [data.encargos, busqueda, busquedaTel, filtroEstado, filtroFecha],
  );
  const entregados = useMemo(
    () =>
      filtrar(
        data.encargos.filter((o) => o.estado === "Entregado"),
        false,
      ).sort((a, b) => b.numeroInt - a.numeroInt),
    [data.encargos, busqueda, busquedaTel, filtroFecha],
  );
  const nActivos = data.encargos.filter((o) => o.estado !== "Entregado").length;
  const nEntregados = data.encargos.filter((o) => o.estado === "Entregado").length;
  const totalBusqueda = useMemo(
    () => textoTotalBusqueda(tab === "entregados" ? entregados : activos, busqueda),
    [tab, activos, entregados, busqueda],
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const packed = serializeEncargoLineas(lineas);
    const faltaContacto = faltaClienteOTelefono(cliente, telefono);
    if (faltaContacto) {
      showToast("Faltan datos del cliente", faltaContacto, "bg-red-600");
      return;
    }
    if (!packed.producto.trim()) {
      showToast("Falta el producto", "Añade al menos una cosa.", "bg-red-600");
      return;
    }
    try {
      await saveEncargo({
        ...packed,
        cliente: cliente.trim(),
        telefono: telefono.trim(),
        persona: persona.trim() || worker.nombre,
        diaISO: dia,
        obs: obs.trim(),
        estado,
      });
      setLineas([{ producto: "", cantidad: "", unidad: "ud" }]);
      setCliente("");
      setTelefono("");
      setPersona(worker.nombre);
      setObs("");
      showToast("Encargo guardado", `Apuntado por ${worker.nombre}.`);
      setTab("activos");
    } catch (err) {
      showToast("No se pudo guardar", err instanceof Error ? err.message : "Error", "bg-red-600");
    }
  }

  async function marcarEstado(order: EncargoItem, st: EncargoEstado) {
    try {
      await changeOrderStatus(order.id, st);
      if (st === "Entregado") {
        setTab("entregados");
        showToast("Encargo entregado", `${order.numero} queda en Entregados.`);
      }
    } catch (err) {
      showToast("No se pudo cambiar el estado", err instanceof Error ? err.message : "Error", "bg-red-600");
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
          <p className="text-sm text-slate-600">Hoy primero. Números por día de recogida (#1, #2… cada día).</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-200/80 p-1.5">
        <button type="button" onClick={() => setTab("activos")} className={`rounded-xl py-3 text-xs font-extrabold sm:text-sm ${tab === "activos" ? "bg-white shadow-sm" : "text-slate-600"}`}>
          Activos ({nActivos})
        </button>
        <button type="button" onClick={() => setTab("entregados")} className={`rounded-xl py-3 text-xs font-extrabold sm:text-sm ${tab === "entregados" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600"}`}>
          Entregados ({nEntregados})
        </button>
        <button type="button" onClick={() => setTab("nuevo")} className={`rounded-xl py-3 text-xs font-extrabold sm:text-sm ${tab === "nuevo" ? "bg-brand text-white shadow-sm" : "text-brand"}`}>
          + Nuevo
        </button>
      </div>

      {tab !== "nuevo" ? (
        <div className="space-y-2 rounded-2xl border bg-white p-3">
          <input
            value={busquedaTel}
            onChange={(e) => setBusquedaTel(e.target.value)}
            inputMode="tel"
            placeholder="Buscar por teléfono del cliente…"
            className="w-full rounded-xl border-2 border-slate-300 px-3 py-2 font-bold"
          />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar nº, cliente, producto, trabajador…" className="w-full rounded-xl border-2 border-slate-300 px-3 py-2" />
          <div className="flex flex-wrap gap-2">
            {tab === "activos"
              ? (["Todos", "Pendiente", "Preparado"] as const).map((st) => (
                  <button key={st} type="button" onClick={() => setFiltroEstado(st)} className={`rounded-xl px-3 py-1.5 text-xs font-extrabold ${filtroEstado === st ? "bg-slate-900 text-white" : "bg-slate-100"}`}>
                    {st}
                  </button>
                ))
              : null}
            <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} className="rounded-xl border px-2 py-1 text-xs" />
          </div>
          {totalBusqueda ? (
            <p className="rounded-xl bg-brand-light px-3 py-2 text-xs font-extrabold text-brand">{totalBusqueda}</p>
          ) : null}
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
                  <EncargoLineasLista producto={order.producto} cantidad={order.cantidad} />
                  {order.cliente ? <p className="text-sm font-bold text-slate-700">Cliente: {order.cliente}</p> : null}
                  {order.telefono ? (
                    <p className="text-sm font-bold text-slate-700">
                      Tel:{" "}
                      <a href={`tel:${soloDigitos(order.telefono)}`} className="underline">
                        {order.telefono}
                      </a>
                    </p>
                  ) : null}
                </div>
                <span className={`h-fit rounded-xl border px-3 py-1 text-xs font-extrabold ${getOrderBadgeStyle(order.estado)}`}>{order.estado}</span>
              </div>
              {order.obs ? <p className="rounded-xl bg-slate-50 p-2 text-sm">Obs: {order.obs}</p> : null}
              <p className="text-xs text-slate-500">Apuntado por {order.persona}</p>
              {edit?.id === order.id ? (
                <EditForm
                  order={order}
                  onCancel={() => setEdit(null)}
                  onSave={(patch) =>
                    void updateEncargo(order.id, patch).then(() => {
                      setEdit(null);
                      if (patch.estado === "Entregado") setTab("entregados");
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
                      onClick={() => void marcarEstado(order, st)}
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

      {tab === "activos" && activos.length === 0 ? (
        <p className="rounded-2xl border border-dashed bg-white p-6 text-center text-sm text-slate-500">No hay encargos activos con estos filtros.</p>
      ) : null}

      {tab === "entregados"
        ? entregados.map((order) => (
            <article key={order.id} className="space-y-2 rounded-2xl border-2 border-emerald-200 bg-white p-4">
              <div className="flex justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-sm font-extrabold text-emerald-800">{order.numero}</span>
                    <span className="text-sm font-bold">📅 {order.dia}</span>
                  </div>
                  <EncargoLineasLista producto={order.producto} cantidad={order.cantidad} />
                  {order.cliente ? <p className="text-sm font-bold text-slate-700">Cliente: {order.cliente}</p> : null}
                  {order.telefono ? (
                    <p className="text-sm font-bold text-slate-700">
                      Tel:{" "}
                      <a href={`tel:${soloDigitos(order.telefono)}`} className="underline">
                        {order.telefono}
                      </a>
                    </p>
                  ) : null}
                </div>
                <span className={`h-fit rounded-xl border px-3 py-1 text-xs font-extrabold ${getOrderBadgeStyle("Entregado")}`}>Entregado</span>
              </div>
              <p className="text-xs text-slate-500">Apuntado por {order.persona}</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => void marcarEstado(order, "Pendiente")} className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold">
                  Devolver a activos
                </button>
                <button type="button" onClick={() => confirmDelete(order)} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-extrabold text-red-700">
                  Eliminar
                </button>
              </div>
            </article>
          ))
        : null}

      {tab === "entregados" && entregados.length === 0 ? (
        <p className="rounded-2xl border border-dashed bg-white p-6 text-center text-sm text-slate-500">
          {nEntregados === 0 ? "Aún no hay encargos entregados. Al pulsar Entregado, el pedido queda aquí." : "Ningún entregado coincide con la búsqueda o la fecha."}
        </p>
      ) : null}

      {tab === "nuevo" ? (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-2xl border bg-white p-5">
          <div className="rounded-2xl border-2 border-brand-border bg-brand-light px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-brand">Número de ese día</p>
            <p className="text-3xl font-extrabold text-brand">{formatEncargoNumero(siguienteNumero)}</p>
            <p className="text-xs text-slate-600">
              Recogida {formatDateES(dia)}: #1, #2, #3… Si borras uno, ese número se vuelve a usar. Otro día empieza otra vez en #1.
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-base font-bold">Nombre de la persona (cliente) *</label>
            <input required value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Ej: Sra. Rosa" className="w-full rounded-xl border-2 px-4 py-3 text-lg font-bold" />
          </div>
          <div>
            <label className="mb-1.5 block text-base font-bold">Teléfono del cliente *</label>
            <input
              required
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              type="tel"
              inputMode="tel"
              minLength={9}
              placeholder="Ej: 612 345 678"
              className="w-full rounded-xl border-2 px-4 py-3 text-lg font-bold"
            />
          </div>
          <LineasEncargoEditor lineas={lineas} onChange={setLineas} />
          <input type="date" required value={dia} onChange={(e) => setDia(e.target.value)} className="w-full rounded-xl border-2 px-4 py-3" />
          <div>
            <label className="mb-1.5 block text-base font-bold">Quién apunta el encargo</label>
            <WorkerPicker inputId="enc-persona" value={persona} onChange={setPersona} />
          </div>
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
    cliente: string;
    telefono: string;
    persona: string;
    diaISO: string;
    obs: string;
    estado: EncargoEstado;
  }) => void;
}) {
  const [lineas, setLineas] = useState<EncargoLinea[]>(() => parseEncargoLineas(order.producto, order.cantidad));
  const [cliente, setCliente] = useState(order.cliente);
  const [telefono, setTelefono] = useState(order.telefono);
  const [persona, setPersona] = useState(order.persona);
  const [diaISO, setDiaISO] = useState(order.diaISO);
  const [obs, setObs] = useState(order.obs);
  const [estado, setEstado] = useState(order.estado);
  const [aviso, setAviso] = useState("");
  return (
    <div className="space-y-2 rounded-xl bg-slate-50 p-3">
      <input required value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Cliente *" className="w-full rounded-xl border px-3 py-2" />
      <input required value={telefono} onChange={(e) => setTelefono(e.target.value)} type="tel" minLength={9} placeholder="Teléfono *" className="w-full rounded-xl border px-3 py-2" />
      <LineasEncargoEditor compact lineas={lineas} onChange={setLineas} />
      <input type="date" value={diaISO} onChange={(e) => setDiaISO(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
      <input value={persona} onChange={(e) => setPersona(e.target.value)} placeholder="Quién lo apuntó" className="w-full rounded-xl border px-3 py-2" />
      <input value={obs} onChange={(e) => setObs(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
      <select value={estado} onChange={(e) => setEstado(e.target.value as EncargoEstado)} className="w-full rounded-xl border px-3 py-2">
        <option>Pendiente</option>
        <option>Preparado</option>
        <option>Entregado</option>
      </select>
      <div className="flex gap-2">
        {aviso ? <p className="text-xs font-bold text-red-700">{aviso}</p> : null}
        <button
          type="button"
          onClick={() => {
            const falta = faltaClienteOTelefono(cliente, telefono);
            if (falta) {
              setAviso(falta);
              return;
            }
            onSave({
              ...serializeEncargoLineas(lineas),
              cliente: cliente.trim(),
              telefono: telefono.trim(),
              persona,
              diaISO,
              obs,
              estado,
            });
          }}
          className="rounded-xl bg-brand px-3 py-2 text-xs font-extrabold text-white"
        >
          Guardar
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl bg-white px-3 py-2 text-xs font-bold">
          Cancelar
        </button>
      </div>
    </div>
  );
}
