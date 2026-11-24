export type ViewName =
  | "home"
  | "inventario"
  | "encargos"
  | "neveras"
  | "basedatos";

export type EncargoEstado = "Pendiente" | "Preparado" | "Entregado";
export type InventarioEstado = "En almacén" | "Agotado";
export type DbEncFilter = "Todos" | EncargoEstado;
export type WorkerTheme = "brand" | "sky";
export type DbTab = "neveras" | "inventario" | "encargos" | "actividad" | "equipo";

export interface SessionWorker {
  id: string;
  nombre: string;
  esAdmin: boolean;
}

export interface ActivityItem {
  id: string;
  createdAt: string;
  persona: string;
  tipo: string;
  descripcion: string;
  entidad?: string | null;
  entidadId?: string | null;
  icon: string;
  text: string;
  meta: string;
  badge: string;
  badgeColor: string;
}

export interface InventarioItem {
  id: string;
  productoId?: string | null;
  fecha: string;
  fechaISO: string;
  producto: string;
  cantidad: string;
  persona: string;
  obs: string;
  estado: InventarioEstado;
}

export interface ProductoStock {
  id: string;
  nombre: string;
  cantidad: string;
  estado: InventarioEstado;
  fecha: string;
  fechaISO: string;
  persona: string;
  obs: string;
}

export interface EncargoItem {
  id: string;
  numero: string;
  numeroInt: number;
  producto: string;
  cantidad: string;
  persona: string;
  dia: string;
  diaISO: string;
  obs: string;
  estado: EncargoEstado;
}

export interface NeveraDia {
  id: string;
  fecha: string;
  fechaISO: string;
  mes: string;
  diaTexto: string;
  persona: string;
  hora: string;
  temps: number[];
}

export interface ToastState {
  title: string;
  desc: string;
  colorClass: string;
}

export interface ConfirmState {
  title: string;
  text: string;
  yesLabel: string;
  onConfirm: () => void;
}

export interface AppData {
  recentActivity: ActivityItem[];
  productos: ProductoStock[];
  inventario: InventarioItem[];
  encargos: EncargoItem[];
  neverasPorDia: NeveraDia[];
}

export interface BackupPayload {
  version: 1;
  exportedAt: string;
  productos: ProductoStock[];
  inventario: InventarioItem[];
  encargos: EncargoItem[];
  neverasPorDia: NeveraDia[];
  actividad: ActivityItem[];
}
