import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { mapActivity } from "../lib/activity";
import { formatDateES, formatDayLabel, parseTime, todayISO } from "../lib/dates";
import { formatEncargoNumero, fridgeBadge } from "../lib/orders";
import { requireSupabase } from "../lib/supabase";
import { TEMP_ALERT } from "../data/constants";
import type {
  AppData,
  BackupPayload,
  ConfirmState,
  EncargoEstado,
  EncargoItem,
  InventarioEstado,
  InventarioItem,
  NeveraDia,
  ProductoStock,
  SessionWorker,
  ToastState,
  ViewName,
} from "../types";
import { useAuth } from "./AuthStore";

const emptyData: AppData = {
  recentActivity: [],
  productos: [],
  inventario: [],
  encargos: [],
  neverasPorDia: [],
};

interface AppStoreValue {
  data: AppData;
  view: ViewName;
  toast: ToastState | null;
  confirm: ConfirmState | null;
  loading: boolean;
  syncError: string | null;
  worker: SessionWorker;
  navigateTo: (view: ViewName) => void;
  showToast: (title: string, desc: string, colorClass?: string) => void;
  openConfirm: (state: ConfirmState) => void;
  closeConfirm: () => void;
  reload: () => Promise<void>;
  saveInventario: (item: {
    fechaISO: string;
    producto: string;
    cantidad: string;
    obs: string;
  }) => Promise<void>;
  updateProducto: (
    id: string,
    patch: { cantidad: string; obs: string; fechaISO: string },
  ) => Promise<void>;
  markOutOfStock: (id: string) => Promise<void>;
  reactivateProducto: (id: string) => Promise<void>;
  deleteProducto: (id: string) => Promise<void>;
  saveEncargo: (item: {
    producto: string;
    cantidad: string;
    diaISO: string;
    obs: string;
    estado: EncargoEstado;
  }) => Promise<void>;
  updateEncargo: (
    id: string,
    patch: {
      producto: string;
      cantidad: string;
      diaISO: string;
      obs: string;
      estado: EncargoEstado;
    },
  ) => Promise<void>;
  changeOrderStatus: (id: string, estado: EncargoEstado) => Promise<void>;
  deleteEncargo: (id: string) => Promise<void>;
  saveNeveras: (payload: { isoDate: string; temps: number[] }) => Promise<void>;
  updateNeveras: (id: string, payload: { temps: number[]; isoDate: string }) => Promise<void>;
  deleteNeveras: (id: string) => Promise<void>;
  exportBackup: () => BackupPayload;
  restoreBackup: (payload: BackupPayload) => Promise<void>;
  createWorker: (nombre: string, pin: string, esAdmin: boolean) => Promise<void>;
  setWorkerPin: (id: string, pin: string) => Promise<void>;
  setWorkerAdmin: (id: string, esAdmin: boolean) => Promise<void>;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

function mapProducto(row: Record<string, unknown>): ProductoStock {
  const fechaISO = String(row.fecha);
  return {
    id: String(row.id),
    nombre: String(row.nombre),
    cantidad: String(row.cantidad),
    estado: row.estado as InventarioEstado,
    fecha: formatDateES(fechaISO),
    fechaISO,
    persona: String(row.persona),
    obs: String(row.obs ?? ""),
  };
}

function mapInventario(row: Record<string, unknown>): InventarioItem {
  const fechaISO = String(row.fecha);
  return {
    id: String(row.id),
    productoId: row.producto_id ? String(row.producto_id) : null,
    fecha: formatDateES(fechaISO),
    fechaISO,
    producto: String(row.producto),
    cantidad: String(row.cantidad),
    persona: String(row.persona),
    obs: String(row.obs ?? ""),
    estado: row.estado as InventarioEstado,
  };
}

function mapEncargo(row: Record<string, unknown>): EncargoItem {
  const diaISO = String(row.dia);
  const numeroInt = Number(row.numero);
  return {
    id: String(row.id),
    numero: formatEncargoNumero(numeroInt),
    numeroInt,
    producto: String(row.producto),
    cantidad: String(row.cantidad),
    persona: String(row.persona),
    dia: formatDateES(diaISO),
    diaISO,
    obs: String(row.obs ?? ""),
    estado: row.estado as EncargoEstado,
  };
}

function mapNevera(row: Record<string, unknown>): NeveraDia {
  const fechaISO = String(row.fecha);
  const temps = (row.temps as number[]).map((t) => Number(t));
  return {
    id: String(row.id),
    fecha: formatDateES(fechaISO),
    fechaISO,
    mes: fechaISO.slice(0, 7),
    diaTexto: formatDayLabel(fechaISO, todayISO()),
    persona: String(row.persona),
    hora: parseTime(row.hora as string),
    temps,
  };
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const { session, refreshWorkers, patchSession, workers } = useAuth();
  const worker = session!;
  const [data, setData] = useState<AppData>(emptyData);
  const [view, setView] = useState<ViewName>("home");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  const showToast = useCallback((title: string, desc: string, colorClass = "bg-emerald-600") => {
    setToast({ title, desc, colorClass });
  }, []);

  const logActivity = useCallback(
    async (tipo: string, descripcion: string, entidad?: string, entidadId?: string) => {
      const client = requireSupabase();
      await client.from("actividad").insert({
        persona: worker.nombre,
        tipo,
        descripcion,
        entidad: entidad ?? null,
        entidad_id: entidadId ?? null,
      });
    },
    [worker.nombre],
  );

  const reload = useCallback(async () => {
    const client = requireSupabase();
    const [productos, inventario, encargos, neveras, actividad] = await Promise.all([
      client.from("productos").select("*").order("updated_at", { ascending: false }),
      client.from("inventario").select("*").order("created_at", { ascending: false }),
      client.from("encargos").select("*").order("numero", { ascending: false }),
      client.from("neveras").select("*").order("fecha", { ascending: false }),
      client.from("actividad").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    const firstError =
      productos.error || inventario.error || encargos.error || neveras.error || actividad.error;
    if (firstError) throw firstError;
    setData({
      productos: (productos.data ?? []).map((row) => mapProducto(row as Record<string, unknown>)),
      inventario: (inventario.data ?? []).map((row) => mapInventario(row as Record<string, unknown>)),
      encargos: (encargos.data ?? []).map((row) => mapEncargo(row as Record<string, unknown>)),
      neverasPorDia: (neveras.data ?? []).map((row) => mapNevera(row as Record<string, unknown>)),
      recentActivity: (actividad.data ?? []).map((row) =>
        mapActivity(row as Parameters<typeof mapActivity>[0]),
      ),
    });
    setSyncError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    reload()
      .catch((err: Error) => {
        if (!cancelled) setSyncError(err.message || "No se han podido cargar los datos.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    const client = requireSupabase();
    const channel = client
      .channel("carns-arrom")
      .on("postgres_changes", { event: "*", schema: "public", table: "productos" }, () => {
        void reload();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "inventario" }, () => {
        void reload();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "encargos" }, () => {
        void reload();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "neveras" }, () => {
        void reload();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "actividad" }, () => {
        void reload();
      })
      .subscribe();
    return () => {
      cancelled = true;
      void client.removeChannel(channel);
    };
  }, [reload]);

  const navigateTo = useCallback((next: ViewName) => {
    if (next === "basedatos" && !worker.esAdmin) return;
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [worker.esAdmin]);

  const saveInventario = useCallback(
    async (item: { fechaISO: string; producto: string; cantidad: string; obs: string }) => {
      const client = requireSupabase();
      const nombre = item.producto.trim();
      const { data: existing } = await client.from("productos").select("id").eq("nombre", nombre).maybeSingle();
      let productoId = existing?.id as string | undefined;
      if (productoId) {
        const { error } = await client
          .from("productos")
          .update({
            cantidad: item.cantidad,
            estado: "En almacén",
            fecha: item.fechaISO,
            persona: worker.nombre,
            obs: item.obs,
            updated_at: new Date().toISOString(),
          })
          .eq("id", productoId);
        if (error) throw error;
      } else {
        const { data: created, error } = await client
          .from("productos")
          .insert({
            nombre,
            cantidad: item.cantidad,
            estado: "En almacén",
            fecha: item.fechaISO,
            persona: worker.nombre,
            obs: item.obs,
          })
          .select("id")
          .single();
        if (error) throw error;
        productoId = created.id as string;
      }
      const { error: histError } = await client.from("inventario").insert({
        producto_id: productoId,
        fecha: item.fechaISO,
        producto: nombre,
        cantidad: item.cantidad,
        persona: worker.nombre,
        obs: item.obs,
        estado: "En almacén",
      });
      if (histError) throw histError;
      await logActivity("crear_inventario", `${worker.nombre} registró inventario: ${nombre} (${item.cantidad})`, "inventario", productoId);
      await reload();
    },
    [logActivity, reload, worker.nombre],
  );

  const updateProducto = useCallback(
    async (id: string, patch: { cantidad: string; obs: string; fechaISO: string }) => {
      const client = requireSupabase();
      const current = data.productos.find((p) => p.id === id);
      if (!current) return;
      const { error } = await client
        .from("productos")
        .update({
          cantidad: patch.cantidad,
          obs: patch.obs,
          fecha: patch.fechaISO,
          persona: worker.nombre,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      await client.from("inventario").insert({
        producto_id: id,
        fecha: patch.fechaISO,
        producto: current.nombre,
        cantidad: patch.cantidad,
        persona: worker.nombre,
        obs: patch.obs,
        estado: current.estado,
      });
      await logActivity("modificar_inventario", `${worker.nombre} modificó inventario: ${current.nombre}`, "inventario", id);
      await reload();
    },
    [data.productos, logActivity, reload, worker.nombre],
  );

  const markOutOfStock = useCallback(
    async (id: string) => {
      const client = requireSupabase();
      const current = data.productos.find((p) => p.id === id);
      if (!current) return;
      const { error } = await client
        .from("productos")
        .update({ estado: "Agotado", persona: worker.nombre, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await logActivity("agotar_inventario", `${worker.nombre} marcó agotado: ${current.nombre}`, "inventario", id);
      await reload();
    },
    [data.productos, logActivity, reload, worker.nombre],
  );

  const reactivateProducto = useCallback(
    async (id: string) => {
      const client = requireSupabase();
      const current = data.productos.find((p) => p.id === id);
      if (!current) return;
      const { error } = await client
        .from("productos")
        .update({ estado: "En almacén", persona: worker.nombre, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await logActivity("reactivar_inventario", `${worker.nombre} reactivó: ${current.nombre}`, "inventario", id);
      await reload();
    },
    [data.productos, logActivity, reload, worker.nombre],
  );

  const deleteProducto = useCallback(
    async (id: string) => {
      const client = requireSupabase();
      const current = data.productos.find((p) => p.id === id);
      const { error } = await client.from("productos").delete().eq("id", id);
      if (error) throw error;
      await logActivity("eliminar_inventario", `${worker.nombre} eliminó el producto ${current?.nombre ?? id}`, "inventario", id);
      await reload();
    },
    [data.productos, logActivity, reload, worker.nombre],
  );

  const saveEncargo = useCallback(
    async (item: {
      producto: string;
      cantidad: string;
      diaISO: string;
      obs: string;
      estado: EncargoEstado;
    }) => {
      const client = requireSupabase();
      const { data: created, error } = await client
        .from("encargos")
        .insert({
          producto: item.producto,
          cantidad: item.cantidad,
          persona: worker.nombre,
          dia: item.diaISO,
          obs: item.obs,
          estado: item.estado,
        })
        .select("id, numero")
        .single();
      if (error) throw error;
      await logActivity(
        "crear_encargo",
        `${worker.nombre} creó el encargo ${formatEncargoNumero(Number(created.numero))} — ${item.producto}`,
        "encargo",
        String(created.id),
      );
      await reload();
    },
    [logActivity, reload, worker.nombre],
  );

  const updateEncargo = useCallback(
    async (
      id: string,
      patch: {
        producto: string;
        cantidad: string;
        diaISO: string;
        obs: string;
        estado: EncargoEstado;
      },
    ) => {
      const client = requireSupabase();
      const current = data.encargos.find((o) => o.id === id);
      const { error } = await client
        .from("encargos")
        .update({
          producto: patch.producto,
          cantidad: patch.cantidad,
          dia: patch.diaISO,
          obs: patch.obs,
          estado: patch.estado,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      await logActivity(
        "modificar_encargo",
        `${worker.nombre} modificó el encargo ${current?.numero ?? id}`,
        "encargo",
        id,
      );
      await reload();
    },
    [data.encargos, logActivity, reload, worker.nombre],
  );

  const changeOrderStatus = useCallback(
    async (id: string, estado: EncargoEstado) => {
      const client = requireSupabase();
      const current = data.encargos.find((o) => o.id === id);
      if (!current || current.estado === estado) return;
      const { error } = await client
        .from("encargos")
        .update({ estado, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await logActivity(
        "estado_encargo",
        `${worker.nombre} cambió ${current.numero} a ${estado}`,
        "encargo",
        id,
      );
      await reload();
    },
    [data.encargos, logActivity, reload, worker.nombre],
  );

  const deleteEncargo = useCallback(
    async (id: string) => {
      const client = requireSupabase();
      const current = data.encargos.find((o) => o.id === id);
      const { error } = await client.from("encargos").delete().eq("id", id);
      if (error) throw error;
      await logActivity("eliminar_encargo", `${worker.nombre} eliminó el encargo ${current?.numero ?? id}`, "encargo", id);
      await reload();
    },
    [data.encargos, logActivity, reload, worker.nombre],
  );

  const saveNeveras = useCallback(
    async (payload: { isoDate: string; temps: number[] }) => {
      const client = requireSupabase();
      const now = new Date();
      const hora = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      const { data: existing } = await client.from("neveras").select("id").eq("fecha", payload.isoDate).maybeSingle();
      if (existing?.id) {
        const { error } = await client
          .from("neveras")
          .update({
            temps: payload.temps,
            persona: worker.nombre,
            hora,
            updated_at: now.toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw error;
        const badge = fridgeBadge(payload.temps, TEMP_ALERT);
        await logActivity(
          "modificar_neveras",
          `${worker.nombre} actualizó neveras del ${formatDateES(payload.isoDate)} (${badge.text})`,
          "neveras",
          String(existing.id),
        );
      } else {
        const { data: created, error } = await client
          .from("neveras")
          .insert({
            fecha: payload.isoDate,
            persona: worker.nombre,
            temps: payload.temps,
            hora,
          })
          .select("id")
          .single();
        if (error) throw error;
        const badge = fridgeBadge(payload.temps, TEMP_ALERT);
        await logActivity(
          "revisar_neveras",
          `${worker.nombre} revisó las neveras (${badge.text})`,
          "neveras",
          String(created.id),
        );
      }
      await reload();
    },
    [logActivity, reload, worker.nombre],
  );

  const updateNeveras = useCallback(
    async (_id: string, payload: { temps: number[]; isoDate: string }) => {
      await saveNeveras({ isoDate: payload.isoDate, temps: payload.temps });
    },
    [saveNeveras],
  );

  const deleteNeveras = useCallback(
    async (id: string) => {
      const client = requireSupabase();
      const current = data.neverasPorDia.find((d) => d.id === id);
      const { error } = await client.from("neveras").delete().eq("id", id);
      if (error) throw error;
      await logActivity("eliminar_neveras", `${worker.nombre} eliminó la revisión de neveras ${current?.fecha ?? id}`, "neveras", id);
      await reload();
    },
    [data.neverasPorDia, logActivity, reload, worker.nombre],
  );

  const exportBackup = useCallback((): BackupPayload => {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      productos: data.productos,
      inventario: data.inventario,
      encargos: data.encargos,
      neverasPorDia: data.neverasPorDia,
      actividad: data.recentActivity,
    };
  }, [data]);

  const restoreBackup = useCallback(
    async (payload: BackupPayload) => {
      const client = requireSupabase();
      if (payload.productos.length) {
        await client.from("productos").upsert(
          payload.productos.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            cantidad: p.cantidad,
            estado: p.estado,
            fecha: p.fechaISO,
            persona: p.persona,
            obs: p.obs,
          })),
        );
      }
      if (payload.inventario.length) {
        await client.from("inventario").upsert(
          payload.inventario.map((i) => ({
            id: i.id,
            producto_id: i.productoId,
            fecha: i.fechaISO,
            producto: i.producto,
            cantidad: i.cantidad,
            persona: i.persona,
            obs: i.obs,
            estado: i.estado,
          })),
        );
      }
      if (payload.encargos.length) {
        await client.from("encargos").upsert(
          payload.encargos.map((o) => ({
            id: o.id,
            numero: o.numeroInt,
            producto: o.producto,
            cantidad: o.cantidad,
            persona: o.persona,
            dia: o.diaISO,
            obs: o.obs,
            estado: o.estado,
          })),
        );
      }
      if (payload.neverasPorDia.length) {
        await client.from("neveras").upsert(
          payload.neverasPorDia.map((n) => ({
            id: n.id,
            fecha: n.fechaISO,
            persona: n.persona,
            temps: n.temps,
            hora: `${n.hora}:00`,
          })),
        );
      }
      await logActivity("backup", `${worker.nombre} restauró una copia de seguridad`, "backup");
      await reload();
    },
    [logActivity, reload, worker.nombre],
  );

  const createWorker = useCallback(
    async (nombre: string, pin: string, esAdmin: boolean) => {
      const client = requireSupabase();
      const { data: created, error } = await client
        .from("trabajadores")
        .insert({
          nombre: nombre.trim(),
          pin_hash: "pending",
          es_admin: esAdmin,
        })
        .select("id")
        .single();
      if (error) throw error;
      const { error: pinError } = await client.rpc("set_trabajador_pin", { p_id: created.id, p_pin: pin });
      if (pinError) throw pinError;
      await refreshWorkers();
    },
    [refreshWorkers],
  );

  const setWorkerPin = useCallback(async (id: string, pin: string) => {
    const client = requireSupabase();
    const { error } = await client.rpc("set_trabajador_pin", { p_id: id, p_pin: pin });
    if (error) throw error;
  }, []);

  const setWorkerAdmin = useCallback(
    async (id: string, esAdmin: boolean) => {
      if (!esAdmin) {
        const adminCount = workers.filter((w) => w.esAdmin).length;
        const target = workers.find((w) => w.id === id);
        if (target?.esAdmin && adminCount <= 1) {
          throw new Error("Tiene que quedar al menos un administrador.");
        }
      }
      const client = requireSupabase();
      const { error } = await client.from("trabajadores").update({ es_admin: esAdmin }).eq("id", id);
      if (error) throw error;
      await refreshWorkers();
      if (id === worker.id) {
        patchSession({ esAdmin });
        if (!esAdmin) setView("home");
      }
    },
    [patchSession, refreshWorkers, worker.id, workers],
  );

  const value = useMemo<AppStoreValue>(
    () => ({
      data,
      view,
      toast,
      confirm,
      loading,
      syncError,
      worker,
      navigateTo,
      showToast,
      openConfirm: setConfirm,
      closeConfirm: () => setConfirm(null),
      reload,
      saveInventario,
      updateProducto,
      markOutOfStock,
      reactivateProducto,
      deleteProducto,
      saveEncargo,
      updateEncargo,
      changeOrderStatus,
      deleteEncargo,
      saveNeveras,
      updateNeveras,
      deleteNeveras,
      exportBackup,
      restoreBackup,
      createWorker,
      setWorkerPin,
      setWorkerAdmin,
    }),
    [
      data,
      view,
      toast,
      confirm,
      loading,
      syncError,
      worker,
      navigateTo,
      showToast,
      reload,
      saveInventario,
      updateProducto,
      markOutOfStock,
      reactivateProducto,
      deleteProducto,
      saveEncargo,
      updateEncargo,
      changeOrderStatus,
      deleteEncargo,
      saveNeveras,
      updateNeveras,
      deleteNeveras,
      exportBackup,
      restoreBackup,
      createWorker,
      setWorkerPin,
      setWorkerAdmin,
    ],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore debe usarse dentro de AppStoreProvider");
  return ctx;
}
