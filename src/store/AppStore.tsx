import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { TEMP_ALERT } from "../data/constants";
import { formatDateES, formatDayLabel, todayISO } from "../lib/dates";
import { getOrderBadgeStyle } from "../lib/orders";
import { loadAppData, saveAppData } from "../lib/storage";
import type {
  ActivityItem,
  AppData,
  ConfirmState,
  EncargoEstado,
  EncargoItem,
  InventarioItem,
  NeveraDia,
  ToastState,
  ViewName,
} from "../types";

interface AppStoreValue {
  data: AppData;
  view: ViewName;
  toast: ToastState | null;
  confirm: ConfirmState | null;
  navigateTo: (view: ViewName) => void;
  showToast: (title: string, desc: string, colorClass?: string) => void;
  openConfirm: (state: ConfirmState) => void;
  closeConfirm: () => void;
  saveInventario: (item: Omit<InventarioItem, "id" | "estado">) => void;
  markOutOfStock: (id: number) => void;
  saveEncargo: (item: Omit<EncargoItem, "id">) => void;
  changeOrderStatus: (id: number, estado: EncargoEstado) => void;
  deleteEncargo: (id: number) => void;
  saveNeveras: (payload: { isoDate: string; persona: string; temps: number[] }) => void;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [view, setView] = useState<ViewName>("home");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  useEffect(() => {
    saveAppData(data);
  }, [data]);

  const showToast = useCallback(
    (title: string, desc: string, colorClass = "bg-emerald-600") => {
      setToast({ title, desc, colorClass });
    },
    [],
  );

  const pushActivity = useCallback((list: ActivityItem[], item: Omit<ActivityItem, "id">) => {
    return [{ ...item, id: `${Date.now()}` }, ...list].slice(0, 20);
  }, []);

  const navigateTo = useCallback((next: ViewName) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const saveInventario = useCallback(
    (item: Omit<InventarioItem, "id" | "estado">) => {
      setData((prev) => ({
        ...prev,
        inventario: [
          { ...item, id: Date.now(), estado: "En almacén" },
          ...prev.inventario,
        ],
        recentActivity: pushActivity(prev.recentActivity, {
          icon: "📦",
          text: `Inventario: ${item.producto} — ${item.cantidad}`,
          meta: `Contado por ${item.persona}`,
          badge: "En almacén",
          badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
        }),
      }));
    },
    [pushActivity],
  );

  const markOutOfStock = useCallback(
    (id: number) => {
      setData((prev) => {
        const item = prev.inventario.find((i) => i.id === id);
        if (!item) return prev;
        return {
          ...prev,
          inventario: prev.inventario.map((i) =>
            i.id === id ? { ...i, estado: "Agotado" as const } : i,
          ),
          recentActivity: pushActivity(prev.recentActivity, {
            icon: "🗑️",
            text: `Agotado: ${item.producto}`,
            meta: "Quitado de Stock en Almacén",
            badge: "Agotado",
            badgeColor: "bg-red-50 text-red-700 border-red-200",
          }),
        };
      });
    },
    [pushActivity],
  );

  const saveEncargo = useCallback(
    (item: Omit<EncargoItem, "id">) => {
      setData((prev) => ({
        ...prev,
        encargos: [{ ...item, id: Date.now() }, ...prev.encargos],
        recentActivity: pushActivity(prev.recentActivity, {
          icon: "📝",
          text: `Encargo ${item.numero} - ${item.producto} (${item.cantidad})`,
          meta: `Recibido por ${item.persona}`,
          badge: item.estado,
          badgeColor: getOrderBadgeStyle(item.estado),
        }),
      }));
    },
    [pushActivity],
  );

  const changeOrderStatus = useCallback(
    (id: number, estado: EncargoEstado) => {
      setData((prev) => {
        const order = prev.encargos.find((o) => o.id === id);
        if (!order || order.estado === estado) return prev;
        const next = {
          ...prev,
          encargos: prev.encargos.map((o) => (o.id === id ? { ...o, estado } : o)),
        };
        if (estado === "Entregado") {
          next.recentActivity = pushActivity(prev.recentActivity, {
            icon: "✅",
            text: `Encargo ${order.numero} - ${order.producto}`,
            meta: "Marcado como Entregado",
            badge: "Entregado",
            badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
          });
        }
        return next;
      });
    },
    [pushActivity],
  );

  const deleteEncargo = useCallback((id: number) => {
    setData((prev) => ({
      ...prev,
      encargos: prev.encargos.filter((o) => o.id !== id),
    }));
  }, []);

  const saveNeveras = useCallback(
    (payload: { isoDate: string; persona: string; temps: number[] }) => {
      const fecha = formatDateES(payload.isoDate);
      const mes = payload.isoDate.slice(0, 7);
      const entry: NeveraDia = {
        id: `n-${payload.isoDate}-${Date.now()}`,
        fecha,
        mes,
        diaTexto: formatDayLabel(payload.isoDate, todayISO()),
        persona: payload.persona,
        temps: payload.temps,
      };
      const alerts = payload.temps.filter((t) => t > TEMP_ALERT).length;
      const badge = alerts === 0 ? "7/7 OK" : `${alerts} alerta${alerts === 1 ? "" : "s"}`;
      setData((prev) => ({
        ...prev,
        neverasPorDia: [entry, ...prev.neverasPorDia],
        recentActivity: pushActivity(prev.recentActivity, {
          icon: "❄️",
          text: `Neveras revisadas por ${payload.persona}`,
          meta: `${fecha} · 7 neveras`,
          badge,
          badgeColor:
            alerts === 0
              ? "bg-sky-50 text-sky-800 border-sky-200"
              : "bg-red-50 text-red-700 border-red-200",
        }),
      }));
    },
    [pushActivity],
  );

  const value = useMemo<AppStoreValue>(
    () => ({
      data,
      view,
      toast,
      confirm,
      navigateTo,
      showToast,
      openConfirm: setConfirm,
      closeConfirm: () => setConfirm(null),
      saveInventario,
      markOutOfStock,
      saveEncargo,
      changeOrderStatus,
      deleteEncargo,
      saveNeveras,
    }),
    [
      data,
      view,
      toast,
      confirm,
      navigateTo,
      showToast,
      saveInventario,
      markOutOfStock,
      saveEncargo,
      changeOrderStatus,
      deleteEncargo,
      saveNeveras,
    ],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore debe usarse dentro de AppStoreProvider");
  return ctx;
}
