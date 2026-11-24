import type { EncargoEstado } from "../types";

export function getOrderBadgeStyle(estado: EncargoEstado): string {
  if (estado === "Pendiente") return "bg-amber-100 text-amber-900 border-amber-300";
  if (estado === "Preparado") return "bg-sky-100 text-sky-900 border-sky-300";
  return "bg-emerald-100 text-emerald-900 border-emerald-300";
}

export function formatEncargoNumero(n: number): string {
  return `#${n}`;
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
