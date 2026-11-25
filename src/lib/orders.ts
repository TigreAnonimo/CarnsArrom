import type { EncargoEstado, EncargoItem } from "../types";

export interface EncargoLinea {
  producto: string;
  cantidad: string;
}

export function parseEncargoLineas(producto: string, cantidad: string): EncargoLinea[] {
  const productos = producto.split("\n").map((s) => s.trim());
  const cantidades = cantidad.split("\n").map((s) => s.trim());
  const n = Math.max(productos.length, cantidades.length, 1);
  const lineas: EncargoLinea[] = [];
  for (let i = 0; i < n; i += 1) {
    const p = productos[i] ?? "";
    const c = cantidades[i] ?? "";
    if (!p && !c) continue;
    lineas.push({ producto: p, cantidad: c });
  }
  return lineas.length ? lineas : [{ producto: "", cantidad: "" }];
}

export function serializeEncargoLineas(lineas: EncargoLinea[]): { producto: string; cantidad: string } {
  const clean = lineas.filter((l) => l.producto.trim() || l.cantidad.trim());
  return {
    producto: clean.map((l) => l.producto.trim()).join("\n"),
    cantidad: clean.map((l) => l.cantidad.trim()).join("\n"),
  };
}

export function resumenEncargoLineas(producto: string, cantidad: string): string {
  return parseEncargoLineas(producto, cantidad)
    .filter((l) => l.producto)
    .map((l) => (l.cantidad ? `${l.producto} (${l.cantidad})` : l.producto))
    .join(" · ");
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
