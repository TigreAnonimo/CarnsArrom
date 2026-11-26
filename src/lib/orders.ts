import type { EncargoEstado, EncargoItem } from "../types";

export type EncargoUnidad = "ud" | "kg";

export interface EncargoLinea {
  producto: string;
  cantidad: string;
  unidad: EncargoUnidad;
}

function normalizarTexto(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function parseUnidadCantidad(raw: string): { cantidad: string; unidad: EncargoUnidad } {
  const t = raw.trim();
  const unidad: EncargoUnidad = /\b(kg|kilo|kilos)\b/i.test(t) ? "kg" : "ud";
  const num = t.replace(/,/g, ".").match(/-?\d+(?:\.\d+)?/);
  const cantidad = num
    ? num[0]
    : t.replace(/\s*(kg|kilos?|uds?|unidades?)\s*/gi, "").trim();
  return { cantidad, unidad };
}

export function parseEncargoLineas(producto: string, cantidad: string): EncargoLinea[] {
  const productos = producto.split("\n").map((s) => s.trim());
  const cantidades = cantidad.split("\n").map((s) => s.trim());
  const n = Math.max(productos.length, cantidades.length, 1);
  const lineas: EncargoLinea[] = [];
  for (let i = 0; i < n; i += 1) {
    const p = productos[i] ?? "";
    const parsed = parseUnidadCantidad(cantidades[i] ?? "");
    if (!p && !parsed.cantidad) continue;
    lineas.push({ producto: p, cantidad: parsed.cantidad, unidad: parsed.unidad });
  }
  return lineas.length ? lineas : [{ producto: "", cantidad: "", unidad: "ud" }];
}

export function serializeEncargoLineas(lineas: EncargoLinea[]): { producto: string; cantidad: string } {
  const clean = lineas.filter((l) => l.producto.trim() || l.cantidad.trim());
  return {
    producto: clean.map((l) => l.producto.trim()).join("\n"),
    cantidad: clean.map((l) => `${l.cantidad.trim()} ${l.unidad === "kg" ? "kg" : "ud"}`.trim()).join("\n"),
  };
}

export function etiquetaCantidad(linea: EncargoLinea): string {
  if (!linea.cantidad.trim()) return "";
  return linea.unidad === "kg" ? `${linea.cantidad} kg` : `${linea.cantidad} ud`;
}

export function resumenEncargoLineas(producto: string, cantidad: string): string {
  return parseEncargoLineas(producto, cantidad)
    .filter((l) => l.producto)
    .map((l) => {
      const cant = etiquetaCantidad(l);
      return cant ? `${l.producto} (${cant})` : l.producto;
    })
    .join(" · ");
}

function numeroDeCantidad(texto: string): number {
  const n = Number.parseFloat(texto.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function formatCantidadTotal(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded).replace(".", ",");
}

/** Suma ud/kg de las líneas cuyo producto coincide con la búsqueda. */
export function textoTotalBusqueda(encargos: EncargoItem[], busqueda: string): string | null {
  const q = normalizarTexto(busqueda);
  if (!q) return null;
  let ud = 0;
  let kg = 0;
  let hits = 0;
  for (const o of encargos) {
    for (const l of parseEncargoLineas(o.producto, o.cantidad)) {
      if (!l.producto || !normalizarTexto(l.producto).includes(q)) continue;
      hits += 1;
      const n = numeroDeCantidad(l.cantidad);
      if (l.unidad === "kg") kg += n;
      else ud += n;
    }
  }
  if (!hits) return null;
  const nombre = busqueda.trim();
  const udTxt = formatCantidadTotal(ud);
  const kgTxt = formatCantidadTotal(kg);
  if (ud > 0 && kg > 0) return `${udTxt} ${nombre} y ${kgTxt} kg en total`;
  if (kg > 0) return `${kgTxt} kg de ${nombre} en total`;
  return `${udTxt} ${nombre} en total`;
}

export function getOrderBadgeStyle(estado: EncargoEstado): string {
  if (estado === "Pendiente") return "bg-amber-100 text-amber-900 border-amber-300";
  if (estado === "Preparado") return "bg-sky-100 text-sky-900 border-sky-300";
  return "bg-emerald-100 text-emerald-900 border-emerald-300";
}

export function formatEncargoNumero(n: number): string {
  return `#${n}`;
}

/** Primer número libre ese día de recogida (1, 2, 3…; rellena huecos). */
export function siguienteNumeroEncargo(encargos: EncargoItem[], diaISO: string, exceptId?: string): number {
  const usados = new Set(
    encargos.filter((o) => o.diaISO === diaISO && o.id !== exceptId).map((o) => o.numeroInt),
  );
  let n = 1;
  while (usados.has(n)) n += 1;
  return n;
}

export function fridgeBadge(temps: number[], alertLimit: number): { text: string; ok: boolean; alerts: number } {
  const alerts = temps.filter((t) => Number(t) > alertLimit).length;
  const ok = 7 - alerts;
  if (alerts === 0) return { text: "7/7 OK", ok: true, alerts: 0 };
  return {
    text: `${ok}/7 OK — ${alerts} alerta${alerts === 1 ? "" : "s"}`,
    ok: false,
    alerts,
  };
}
