import { formatDateTimeES } from "./dates";
import type { ActivityItem } from "../types";

const ICONS: Record<string, { icon: string; badge: string; badgeColor: string }> = {
  crear_inventario: { icon: "📦", badge: "Inventario", badgeColor: "bg-slate-100 text-slate-700 border-slate-200" },
  modificar_inventario: { icon: "📦", badge: "Editado", badgeColor: "bg-slate-100 text-slate-700 border-slate-200" },
  agotar_inventario: { icon: "🗑️", badge: "Agotado", badgeColor: "bg-red-50 text-red-700 border-red-200" },
  reactivar_inventario: { icon: "📦", badge: "Reactivado", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  eliminar_inventario: { icon: "🗑️", badge: "Eliminado", badgeColor: "bg-red-50 text-red-700 border-red-200" },
  crear_encargo: { icon: "📝", badge: "Encargo", badgeColor: "bg-amber-50 text-amber-800 border-amber-200" },
  modificar_encargo: { icon: "📝", badge: "Editado", badgeColor: "bg-sky-50 text-sky-800 border-sky-200" },
  estado_encargo: { icon: "✅", badge: "Estado", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  eliminar_encargo: { icon: "🗑️", badge: "Eliminado", badgeColor: "bg-red-50 text-red-700 border-red-200" },
  revisar_neveras: { icon: "❄️", badge: "Neveras", badgeColor: "bg-sky-50 text-sky-800 border-sky-200" },
  modificar_neveras: { icon: "❄️", badge: "Editado", badgeColor: "bg-sky-50 text-sky-800 border-sky-200" },
  eliminar_neveras: { icon: "🗑️", badge: "Eliminado", badgeColor: "bg-red-50 text-red-700 border-red-200" },
  backup: { icon: "💾", badge: "Backup", badgeColor: "bg-slate-100 text-slate-700 border-slate-200" },
};

export function mapActivity(row: {
  id: string;
  created_at: string;
  persona: string;
  tipo: string;
  descripcion: string;
  entidad?: string | null;
  entidad_id?: string | null;
}): ActivityItem {
  const style = ICONS[row.tipo] ?? {
    icon: "•",
    badge: "Acción",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return {
    id: row.id,
    createdAt: row.created_at,
    persona: row.persona,
    tipo: row.tipo,
    descripcion: row.descripcion,
    entidad: row.entidad,
    entidadId: row.entidad_id,
    icon: style.icon,
    text: row.descripcion,
    meta: `${formatDateTimeES(row.created_at)} · ${row.persona}`,
    badge: style.badge,
    badgeColor: style.badgeColor,
  };
}
