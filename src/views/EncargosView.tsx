
import { type FormEvent, useMemo, useState } from "react";
import { WorkerPicker } from "../components/WorkerPicker";
import { addDaysISO, formatDateES, todayISO } from "../lib/dates";
import { getOrderBadgeStyle, nextOrderNumber } from "../lib/orders";
import { useAppStore } from "../store/AppStore";
import type { EncargoEstado } from "../types";

export function EncargosView() {
  const {
    data,
    saveEncargo,
    changeOrderStatus,
    deleteEncargo,
    showToast,
    openConfirm,
  } = useAppStore();

  const [tab, setTab] = useState<"activos" | "entregados" | "nuevo">("activos");
  const [busqueda, setBusqueda] = useState("");
  const [numero, setNumero] = useState(() =>
    nextOrderNumber(data.encargos.map((o) => o.numero))
  );
  const [dia, setDia] = useState(addDaysISO(todayISO(), 1));
  const [producto, setProducto] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [persona, setPersona] = useState("");
  const [obs, setObs] = useState("");
  const [estado, setEstado] = useState<
    Extract<EncargoEstado, "Pendiente" | "Preparado">
  >("Pendiente");

  const activos = useMemo(
    () => data.encargos.filter((o) => o.estado !== "Entregado"),
    [data.encargos]
  );

  const entregados = useMemo(
    () => data.encargos.filter((o) => o.estado === "Entregado"),
    [data.encargos]
  );

  // Normalizar el texto para facilitar la búsqueda
  const normalizar = (texto: string) =>
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  // Buscar en todos los campos del encargo
  const filtrarEncargos = (encargos: typeof data.encargos) => {
    const texto = normalizar(busqueda);

    if (!texto) return encargos;

    return encargos.filter((o) => {
      const contenido = normalizar(
        [
          o.producto,
          o.numero,
          o.cantidad,
          o.persona,
          o.obs,
          o.dia,
        ]
          .filter(Boolean)
          .join(" ")
      );

      return contenido.includes(texto);
    });
  };

  const activosFiltrados = useMemo(
    () => filtrarEncargos(activos),
    [activos, busqueda]
  );

  const entregadosFiltrados = useMemo(
    () => filtrarEncargos(entregados),
    [entregados, busqueda]
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!persona.trim()) {
      showToast(
        "Falta el trabajador",
        "Toca tu nombre antes de guardar el encargo.",
        "bg-amber-600"
      );
      return;
    }

    saveEncargo({
      numero: numero.trim(),
      producto: producto.trim(),
      cantidad: cantidad.trim(),
      persona: persona.trim(),
      dia: formatDateES(dia),
      obs: obs.trim(),
      estado,
    });

    setNumero(
      nextOrderNumber([
        ...data.encargos.map((o) => o.numero),
        numero.trim(),
      ])
    );

    setProducto("");
    setCantidad("");
    setObs("");
    setBusqueda("");

    showToast(
      "Encargo guardado",
      `Pedido ${numero} apuntado por ${persona}.`
    );

    setTab("activos");
  }

  return (
    <section className="fade-in space-y-5">

      {/* CABECERA */}

      <div className="flex items-center gap-3">
        <span className="text-3xl">📝</span>

        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Encargos
          </h2>

          <p className="text-sm text-slate-600">
            Pedidos de clientes y entregas
          </p>
        </div>
      </div>

      {/* PESTAÑAS */}

      <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-200/80 p-1.5">

        <button
          type="button"
          onClick={() => setTab("activos")}
          className={`rounded-xl px-2 py-3 text-xs font-extrabold transition-all sm:text-sm ${
            tab === "activos"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Activos ({activos.length})
        </button>

        <button
          type="button"
          onClick={() => setTab("entregados")}
          className={`rounded-xl px-2 py-3 text-xs font-extrabold transition-all sm:text-sm ${
            tab === "entregados"
              ? "bg-white text-emerald-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Entregados ({entregados.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setTab("nuevo");
            setBusqueda("");
          }}
          className={`rounded-xl px-2 py-3 text-xs font-extrabold transition-all sm:text-sm ${
            tab === "nuevo"
              ? "bg-brand text-white shadow-sm"
              : "text-brand hover:bg-white/60"
          }`}
        >
          + Nuevo Encargo
        </button>

      </div>

      {/* BUSCADOR */}

      {tab !== "nuevo" && (
        <div className="relative">

          <svg
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>

          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto, número, persona..."
            aria-label="Buscar encargos"
            className="w-full rounded-2xl border-2 border-slate-200 bg-white py-4 pl-12 pr-20 text-base outline-none transition-colors focus:border-brand"
          />

          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-sm font-bold text-slate-500 hover:bg-slate-100"
            >
              Limpiar
            </button>
          )}

        </div>
      )}

      {/* ACTIVOS */}

      {tab === "activos" && (
        <div className="space-y-4">

          {activosFiltrados.length === 0 ? (

            <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-8 text-center">

              <span className="block text-4xl">
                {busqueda.trim() ? "🔎" : "✅"}
              </span>

              <p className="text-lg font-extrabold text-slate-800">
                {busqueda.trim()
                  ? "No se encontraron encargos"
                  : "¡Todo al día! No hay encargos pendientes"}
              </p>

              <p className="text-sm text-slate-500">
                {busqueda.trim()
                  ? `No hay encargos activos que coincidan con "${busqueda.trim()}". Prueba con otra palabra.`
                  : 'Pulsa "+ Nuevo Encargo" si entra un pedido nuevo.'}
              </p>

            </div>

          ) : (

            activosFiltrados.map((order) => (

              <div
                key={order.id}
                className={`space-y-3 rounded-2xl border-2 bg-white p-4 shadow-sm sm:p-5 ${
                  order.estado === "Pendiente"
                    ? "border-amber-200"
                    : "border-sky-200"
                }`}
              >

                <div className="flex items-start justify-between gap-2">

                  <div>

                    <div className="flex flex-wrap items-center gap-2">

                      <span className="rounded-lg border border-brand-border bg-brand-light px-2.5 py-0.5 text-sm font-extrabold text-brand">
                        {order.numero}
                      </span>

                      <span className="text-sm font-bold text-slate-600">
                        📅 {order.dia}
                      </span>

                    </div>

                    <h4 className="mt-1.5 text-lg font-extrabold text-slate-900 sm:text-xl">
                      {order.producto}
                    </h4>

                    <p className="text-base font-bold text-slate-700">
                      Cantidad:{" "}
                      <span className="text-slate-900">
                        {order.cantidad}
                      </span>
                    </p>

                  </div>

                  <span
                    className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-extrabold sm:text-sm ${getOrderBadgeStyle(order.estado)}`}
                  >
                    {order.estado}
                  </span>

                </div>

                {order.obs ? (
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700">
                    <span className="font-bold">Obs:</span> {order.obs}
                  </div>
                ) : null}

                <div className="text-xs font-medium text-slate-500">
                  Recibido por:{" "}
                  <strong className="text-slate-700">
                    {order.persona}
                  </strong>
                </div>

                {/* BOTONES DE ESTADO */}

                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-2">

                  <StatusButton
                    active={order.estado === "Pendiente"}
                    activeClass="bg-amber-600 text-white border-amber-600 shadow-sm"
                    idleClass="bg-white text-slate-600 border-slate-200 hover:bg-amber-50"
                    onClick={() => {
                      changeOrderStatus(order.id, "Pendiente");

                      if (order.estado !== "Pendiente") {
                        showToast(
                          `Encargo ${order.numero} actualizado`,
                          'Estado cambiado a "Pendiente".',
                          "bg-sky-700"
                        );
                      }
                    }}
                  >
                    Pendiente
                  </StatusButton>

                  <StatusButton
                    active={order.estado === "Preparado"}
                    activeClass="bg-sky-700 text-white border-sky-700 shadow-sm"
                    idleClass="bg-white text-slate-600 border-slate-200 hover:bg-sky-50"
                    onClick={() => {
                      changeOrderStatus(order.id, "Preparado");

                      if (order.estado !== "Preparado") {
                        showToast(
                          `Encargo ${order.numero} actualizado`,
                          'Estado cambiado a "Preparado".',
                          "bg-sky-700"
                        );
                      }
                    }}
                  >
                    Preparado
                  </StatusButton>

                  <button
                    type="button"
                    onClick={() => {
                      changeOrderStatus(order.id, "Entregado");

                      showToast(
                        "Encargo entregado",
                        `El pedido ${order.numero} se ha movido a "Entregados".`,
                        "bg-emerald-600"
                      );
                    }}
                    className="rounded-xl border-2 border-emerald-300 bg-emerald-50 px-2 py-3 text-xs font-extrabold text-emerald-800 transition-all hover:border-emerald-600 hover:bg-emerald-600 hover:text-white sm:text-sm"
                  >
                    ✓ Entregado
                  </button>

                </div>

              </div>

            ))

          )}

        </div>
      )}

      {/* ENTREGADOS */}

      {tab === "entregados" && (
        <div className="space-y-4">

          <p className="px-1 text-sm font-medium text-slate-600">
            Pedidos ya entregados. Puedes devolverlos a activos o eliminarlos definitivamente:
          </p>

          {entregadosFiltrados.length === 0 ? (

            <p className="rounded-2xl border border-slate-200 bg-white py-8 text-center text-slate-500">
              {busqueda.trim()
                ? `No se encontraron encargos entregados que coincidan con "${busqueda.trim()}".`
                : "No hay encargos en el historial de entregados."}
            </p>

          ) : (

            entregadosFiltrados.map((order) => (

              <div
                key={order.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >

                <div className="flex items-start justify-between gap-2">

                  <div>

                    <div className="flex flex-wrap items-center gap-2">

                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-extrabold text-slate-600">
                        {order.numero}
                      </span>

                      <span className="text-xs font-semibold text-slate-500">
                        📅 {order.dia}
                      </span>

                    </div>

                    <h4 className="mt-1 text-base font-extrabold text-slate-800 sm:text-lg">
                      {order.producto} ({order.cantidad})
                    </h4>

                  </div>

                  <span className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-800">
                    Entregado
                  </span>

                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-500">

                  <span>
                    Apuntado por:{" "}
                    <strong className="text-slate-700">
                      {order.persona}
                    </strong>
                  </span>

                  <div className="flex flex-wrap items-center gap-2">

                    <button
                      type="button"
                      onClick={() => {
                        changeOrderStatus(order.id, "Pendiente");

                        showToast(
                          `Encargo ${order.numero} actualizado`,
                          'Estado cambiado a "Pendiente".',
                          "bg-sky-700"
                        );
                      }}
                      className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 transition-all hover:bg-amber-100 active:scale-95 sm:text-sm"
                    >
                      Devolver a Activos
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openConfirm({
                          title: "¿Eliminar encargo?",
                          text: `¿Seguro que quieres borrar definitivamente el encargo ${order.numero} (${order.producto}) del historial?`,
                          yesLabel: "Sí, eliminar",
                          onConfirm: () => {
                            deleteEncargo(order.id);

                            showToast(
                              "Encargo eliminado",
                              `El pedido ${order.numero} se ha borrado definitivamente.`,
                              "bg-red-600"
                            );
                          },
                        })
                      }
                      className="flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-extrabold text-red-700 transition-all hover:bg-red-100 active:scale-95 sm:text-sm"
                    >
                      <span>🗑️</span>
                      <span>Eliminar</span>
                    </button>

                  </div>

                </div>

              </div>

            ))

          )}

        </div>
      )}

      {/* NUEVO ENCARGO */}

      {tab === "nuevo" && (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

            <div>
              <label
                htmlFor="enc-numero"
                className="mb-1.5 block text-base font-bold text-slate-800"
              >
                Nombre y Número de encargo
              </label>

              <input
                id="enc-numero"
                type="text"
                required
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="w-full rounded-xl border-2 border-brand-border bg-brand-light/40 px-4 py-3.5 text-lg font-extrabold text-brand focus:border-brand focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="enc-dia"
                className="mb-1.5 block text-base font-bold text-slate-800"
              >
                Día en que lo quiere
              </label>

              <input
                id="enc-dia"
                type="date"
                required
                value={dia}
                onChange={(e) => setDia(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-3.5 text-base font-bold focus:border-brand focus:bg-white focus:outline-none"
              />
            </div>

          </div>

          <div>
            <label
              htmlFor="enc-producto"
              className="mb-1.5 block text-base font-bold text-slate-800"
            >
              Producto
            </label>

            <input
              id="enc-producto"
              type="text"
              required
              value={producto}
              onChange={(e) => setProducto(e.target.value)}
              placeholder="Ej: Redondo de ternera relleno"
              className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-4 py-3.5 text-lg font-medium focus:border-brand focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="enc-cantidad"
              className="mb-1.5 block text-base font-bold text-slate-800"
            >
              Cantidad
            </label>

            <input
              id="enc-cantidad"
              type="text"
              required
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="Ej: 2,5 kg o 12 hamburguesas"
              className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-4 py-3.5 text-lg font-extrabold focus:border-brand focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="enc-persona"
              className="mb-1.5 block text-base font-bold text-slate-800"
            >
              Persona que recibe el encargo
            </label>

            <WorkerPicker
              inputId="enc-persona"
              value={persona}
              onChange={setPersona}
            />
          </div>

          <div>
            <label
              htmlFor="enc-obs"
              className="mb-1.5 block text-base font-bold text-slate-800"
            >
              Observaciones
            </label>

            <input
              id="enc-obs"
              type="text"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Ej: Cortado fino, sin grasa, cliente Sra. Rosa..."
              className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-4 py-3 text-base focus:border-brand focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <p className="mb-2 block text-base font-bold text-slate-800">
              Estado inicial
            </p>

            <div className="grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={() => setEstado("Pendiente")}
                className={`rounded-xl border-2 px-3 py-3.5 text-base font-extrabold ${
                  estado === "Pendiente"
                    ? "border-amber-600 bg-amber-50 text-amber-800 shadow-sm"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                Pendiente
              </button>

              <button
                type="button"
                onClick={() => setEstado("Preparado")}
                className={`rounded-xl border-2 px-3 py-3.5 text-base font-extrabold ${
                  estado === "Preparado"
                    ? "border-sky-700 bg-sky-50 text-sky-800 shadow-sm"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                Preparado
              </button>

            </div>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-xl font-extrabold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-hover active:scale-[0.99]"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>

            <span>Guardar encargo</span>
          </button>

        </form>
      )}

    </section>
  );
}

function StatusButton({
  active,
  activeClass,
  idleClass,
  onClick,
  children,
}: {
  active: boolean;
  activeClass: string;
  idleClass: string;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 px-2 py-3 text-xs font-extrabold transition-all sm:text-sm ${
        active ? activeClass : idleClass
      }`}
    >
      {children}
    </button>
  );
}
