import { type FormEvent, useMemo, useState } from "react";
import { PRODUCT_CHIPS } from "../data/constants";
import { todayISO } from "../lib/dates";
import { useAppStore } from "../store/AppStore";
import type { ProductoStock } from "../types";

export function InventarioView() {
  const {
    data,
    worker,
    saveInventario,
    updateProducto,
    markOutOfStock,
    reactivateProducto,
    deleteProducto,
    showToast,
    openConfirm,
  } = useAppStore();
  const [tab, setTab] = useState<"nuevo" | "stock" | "agotados" | "historial">("stock");
  const [fecha, setFecha] = useState(todayISO());
  const [producto, setProducto] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [obs, setObs] = useState("");
  const [query, setQuery] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editCantidad, setEditCantidad] = useState("");
  const [editObs, setEditObs] = useState("");

  const activos = data.productos.filter((i) => i.estado === "En almacén");
  const agotados = data.productos.filter((i) => i.estado === "Agotado");

  const filtrar = (list: ProductoStock[]) => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((i) => `${i.nombre} ${i.persona}`.toLowerCase().includes(q));
  };

  const historial = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.inventario.filter((i) => !q || `${i.producto} ${i.persona}`.toLowerCase().includes(q));
  }, [data.inventario, query]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await saveInventario({
        fechaISO: fecha,
        producto: producto.trim(),
        cantidad: cantidad.trim(),
        obs: obs.trim(),
      });
      setProducto("");
      setCantidad("");
      setObs("");
      showToast("Guardado en inventario", `${producto.trim()} (${cantidad.trim()}) registrado por ${worker.nombre}.`);
      setTab("stock");
    } catch (err) {
      showToast("No se pudo guardar", err instanceof Error ? err.message : "Error", "bg-red-600");
    }
  }

  function ProductCard({ item, agotado }: { item: ProductoStock; agotado?: boolean }) {
    const editing = editId === item.id;
    return (
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">{item.fecha}</span>
            <h4 className="text-lg font-extrabold text-slate-900 sm:text-xl">{item.nombre}</h4>
          </div>
          <span className="shrink-0 rounded-xl border border-brand-border bg-brand-light px-3 py-1 text-base font-extrabold text-brand">
            {item.cantidad}
          </span>
        </div>
        {editing ? (
          <div className="space-y-2">
            <input
              value={editCantidad}
              onChange={(e) => setEditCantidad(e.target.value)}
              className="w-full rounded-xl border-2 border-slate-300 px-3 py-2 font-bold"
            />
            <input
              value={editObs}
              onChange={(e) => setEditObs(e.target.value)}
              className="w-full rounded-xl border-2 border-slate-300 px-3 py-2"
            />
            <button
              type="button"
              onClick={() => {
                void updateProducto(item.id, {
                  cantidad: editCantidad,
                  obs: editObs,
                  fechaISO: todayISO(),
                }).then(() => {
                  setEditId(null);
                  showToast("Inventario actualizado", item.nombre);
                });
              }}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-extrabold text-white"
            >
              Guardar cambios
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-sm text-slate-600">
            <div>
              <span>
                👤 <strong>{item.persona}</strong>
              </span>
              {item.obs ? <span className="mt-0.5 block text-xs italic text-slate-500">&quot;{item.obs}&quot;</span> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditId(item.id);
                  setEditCantidad(item.cantidad);
                  setEditObs(item.obs);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold"
              >
                Modificar
              </button>
              {agotado ? (
                <button
                  type="button"
                  onClick={() => void reactivateProducto(item.id).then(() => showToast("Reactivado", item.nombre))}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-800"
                >
                  Reactivar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    openConfirm({
                      title: "¿Marcar como agotado?",
                      text: `¿Marcar "${item.nombre}" como agotado?`,
                      yesLabel: "Sí, marcar agotado",
                      onConfirm: () => {
                        void markOutOfStock(item.id).then(() =>
                          showToast("Producto agotado", item.nombre, "bg-red-600"),
                        );
                      },
                    })
                  }
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-extrabold text-red-700"
                >
                  Agotado
                </button>
              )}
              {worker.esAdmin ? (
                <button
                  type="button"
                  onClick={() =>
                    openConfirm({
                      title: "¿Eliminar producto?",
                      text: `Se eliminará "${item.nombre}" del stock. El historial de conteos se conserva.`,
                      yesLabel: "Sí, eliminar",
                      onConfirm: () => {
                        void deleteProducto(item.id).then(() =>
                          showToast("Eliminado", item.nombre, "bg-red-600"),
                        );
                      },
                    })
                  }
                  className="rounded-xl border border-red-300 bg-red-600 px-3 py-2 text-xs font-extrabold text-white"
                >
                  Eliminar
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="fade-in space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-3xl">📦</span>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Inventario</h2>
          <p className="text-sm text-slate-600">Stock actual e historial de conteos</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-200/80 p-1.5 sm:grid-cols-4">
        {(
          [
            ["stock", `Stock (${activos.length})`],
            ["nuevo", "Nuevo conteo"],
            ["agotados", `Agotados (${agotados.length})`],
            ["historial", "Historial"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-xl px-2 py-3 text-xs font-extrabold sm:text-sm ${
              tab === id ? "bg-white text-brand shadow-sm" : "text-slate-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab !== "nuevo" ? (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar producto o trabajador…"
          className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3"
        />
      ) : null}

      {tab === "nuevo" ? (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">
            Conteo a nombre de <strong>{worker.nombre}</strong>. Si el producto ya existe, se actualiza el stock y se guarda el historial.
          </p>
          <div>
            <label className="mb-1.5 block text-base font-bold">Fecha</label>
            <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-4 py-3.5 text-lg font-semibold" />
          </div>
          <div>
            <label className="mb-1.5 block text-base font-bold">Producto</label>
            <input required value={producto} onChange={(e) => setProducto(e.target.value)} placeholder="Ej: Solomillo de ternera" className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-4 py-3.5 text-lg" />
            <div className="mt-2.5 flex flex-wrap gap-2">
              {PRODUCT_CHIPS.map((chip) => (
                <button key={chip} type="button" onClick={() => setProducto(chip)} className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold">
                  {chip}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-base font-bold">Cantidad</label>
            <input required value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="Ej: 15 kg" className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-4 py-3.5 text-lg font-extrabold" />
          </div>
          <div>
            <label className="mb-1.5 block text-base font-bold">Observaciones</label>
            <input value={obs} onChange={(e) => setObs(e.target.value)} className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-4 py-3" />
          </div>
          <button type="submit" className="w-full rounded-2xl bg-brand py-4 text-xl font-extrabold text-white">
            Guardar
          </button>
        </form>
      ) : null}

      {tab === "stock" ? (
        <div className="space-y-3">
          {filtrar(activos).length === 0 ? (
            <p className="rounded-2xl border bg-white p-8 text-center text-slate-500">No hay productos en stock.</p>
          ) : (
            filtrar(activos).map((item) => <ProductCard key={item.id} item={item} />)
          )}
        </div>
      ) : null}

      {tab === "agotados" ? (
        <div className="space-y-3">
          {filtrar(agotados).length === 0 ? (
            <p className="rounded-2xl border bg-white p-8 text-center text-slate-500">No hay productos agotados.</p>
          ) : (
            filtrar(agotados).map((item) => <ProductCard key={item.id} item={item} agotado />)
          )}
        </div>
      ) : null}

      {tab === "historial" ? (
        <div className="overflow-hidden rounded-2xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-xs uppercase text-white">
              <tr>
                <th className="px-3 py-3">Fecha</th>
                <th className="px-3 py-3">Producto</th>
                <th className="px-3 py-3">Cant.</th>
                <th className="px-3 py-3">Persona</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2">{row.fecha}</td>
                  <td className="px-3 py-2 font-extrabold">{row.producto}</td>
                  <td className="px-3 py-2">{row.cantidad}</td>
                  <td className="px-3 py-2">{row.persona}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
