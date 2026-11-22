import { type FormEvent, useState } from "react";
import { WorkerPicker } from "../components/WorkerPicker";
import { PRODUCT_CHIPS } from "../data/constants";
import { formatDateES, todayISO } from "../lib/dates";
import { useAppStore } from "../store/AppStore";

export function InventarioView() {
  const { data, saveInventario, markOutOfStock, showToast, openConfirm } = useAppStore();
  const [tab, setTab] = useState<"nuevo" | "stock">("nuevo");
  const [fecha, setFecha] = useState(todayISO());
  const [producto, setProducto] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [persona, setPersona] = useState("");
  const [obs, setObs] = useState("");

  const activos = data.inventario.filter((i) => i.estado === "En almacén");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!persona.trim()) {
      showToast("Falta el trabajador", "Toca tu nombre antes de guardar.", "bg-amber-600");
      return;
    }
    saveInventario({
      fecha: formatDateES(fecha),
      producto: producto.trim(),
      cantidad: cantidad.trim(),
      persona: persona.trim(),
      obs: obs.trim(),
    });
    setProducto("");
    setCantidad("");
    setObs("");
    showToast("Guardado en inventario", `${producto.trim()} (${cantidad.trim()}) registrado por ${persona}.`);
    setTab("stock");
  }

  return (
    <section className="fade-in space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-3xl">📦</span>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Inventario</h2>
          <p className="text-sm text-slate-600">Conteo de almacén y productos agotados</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-200/80 p-1.5">
        <button
          type="button"
          onClick={() => setTab("nuevo")}
          className={`rounded-xl px-3 py-3 text-sm font-extrabold transition-all sm:text-base ${
            tab === "nuevo" ? "bg-white text-brand shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Nuevo Conteo
        </button>
        <button
          type="button"
          onClick={() => setTab("stock")}
          className={`rounded-xl px-3 py-3 text-sm font-extrabold transition-all sm:text-base ${
            tab === "stock" ? "bg-white text-brand shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Stock en Almacén (<span>{activos.length}</span>)
        </button>
      </div>

      {tab === "nuevo" ? (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <label htmlFor="inv-fecha" className="mb-1.5 block text-base font-bold text-slate-800">
              Fecha
            </label>
            <input
              id="inv-fecha"
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-4 py-3.5 text-lg font-semibold focus:border-brand focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="inv-producto" className="mb-1.5 block text-base font-bold text-slate-800">
              Producto
            </label>
            <input
              id="inv-producto"
              type="text"
              required
              value={producto}
              onChange={(e) => setProducto(e.target.value)}
              placeholder="Ej: Solomillo de ternera"
              className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-4 py-3.5 text-lg font-medium focus:border-brand focus:bg-white focus:outline-none"
            />
            <div className="mt-2.5 flex flex-wrap gap-2">
              {PRODUCT_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setProducto(chip)}
                  className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 sm:text-sm"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="inv-cantidad" className="mb-1.5 block text-base font-bold text-slate-800">
              Cantidad
            </label>
            <input
              id="inv-cantidad"
              type="text"
              required
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="Ej: 15 kg  o  4 cajas"
              className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-4 py-3.5 text-lg font-extrabold focus:border-brand focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="inv-persona" className="mb-1.5 block text-base font-bold text-slate-800">
              Persona que realiza el conteo
            </label>
            <WorkerPicker inputId="inv-persona" value={persona} onChange={setPersona} />
          </div>

          <div>
            <label htmlFor="inv-obs" className="mb-1.5 block text-base font-bold text-slate-800">
              Observaciones <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <input
              id="inv-obs"
              type="text"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Ej: Cámara 2, cajas cerradas..."
              className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-4 py-3 text-base focus:border-brand focus:bg-white focus:outline-none"
            />
          </div>

          <SaveButton>Guardar</SaveButton>
        </form>
      ) : (
        <div className="space-y-3">
          <p className="px-1 text-sm font-medium text-slate-600">
            Si un producto se ha terminado en cámara, pulsa <strong>&quot;Agotado / Quitar&quot;</strong>:
          </p>
          <div className="space-y-3">
            {activos.length === 0 ? (
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <span className="block text-4xl">📭</span>
                <p className="text-lg font-extrabold text-slate-800">No hay productos activos en almacén</p>
                <p className="text-sm text-slate-500">Pulsa &quot;Nuevo Conteo&quot; para añadir mercancía.</p>
              </div>
            ) : (
              activos.map((item) => (
                <div key={item.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold uppercase text-slate-400">{item.fecha}</span>
                      <h4 className="text-lg font-extrabold text-slate-900 sm:text-xl">{item.producto}</h4>
                    </div>
                    <span className="shrink-0 rounded-xl border border-brand-border bg-brand-light px-3 py-1 text-base font-extrabold text-brand">
                      {item.cantidad}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-sm text-slate-600">
                    <div>
                      <span>
                        👤 <strong>{item.persona}</strong>
                      </span>
                      {item.obs ? (
                        <span className="mt-0.5 block text-xs italic text-slate-500">&quot;{item.obs}&quot;</span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        openConfirm({
                          title: "¿Marcar como agotado?",
                          text: `¿Marcar producto "${item.producto}" (${item.cantidad}) como agotado y quitarlo de la lista activa?`,
                          yesLabel: "Sí, marcar agotado",
                          onConfirm: () => {
                            markOutOfStock(item.id);
                            showToast(
                              "Producto marcado como agotado",
                              `"${item.producto}" ha pasado a Agotado.`,
                              "bg-red-600",
                            );
                          },
                        })
                      }
                      className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-extrabold text-red-700 transition-all hover:bg-red-100 active:scale-95 sm:text-sm"
                    >
                      <span>🗑️</span>
                      <span>Agotado / Quitar</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function SaveButton({ children }: { children: string }) {
  return (
    <button
      type="submit"
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-xl font-extrabold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-hover active:scale-[0.99]"
    >
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <span>{children}</span>
    </button>
  );
}
