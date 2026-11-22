import type { EncargoEstado } from "../types";

export function getOrderBadgeStyle(estado: EncargoEstado): string {
  if (estado === "Pendiente") return "bg-amber-100 text-amber-900 border-amber-300";
  if (estado === "Preparado") return "bg-sky-100 text-sky-900 border-sky-300";
  return "bg-emerald-100 text-emerald-900 border-emerald-300";
}

export function nextOrderNumber(existing: string[]): string {
  const max = existing.reduce((acc, numero) => {
    const n = parseInt(numero.replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 107);
  return `#${max + 1}`;
}
