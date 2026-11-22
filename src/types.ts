export type ViewName = "home" | "inventario" | "encargos" | "neveras" | "basedatos";

export type EncargoEstado = "Pendiente" | "Preparado" | "Entregado";
export type InventarioEstado = "En almacén" | "Agotado";
export type DbEncFilter = "Todos" | EncargoEstado;
export type WorkerTheme = "brand" | "sky";

export interface ActivityItem {
  id: string;
  icon: string;
  text: string;
  meta: string;
  badge: string;
  badgeColor: string;
}

export interface InventarioItem {
  id: number;
  fecha: string;
  producto: string;
  cantidad: string;
  persona: string;
  obs: string;
  estado: InventarioEstado;
}

export interface EncargoItem {
  id: number;
  numero: string;
  producto: string;
  cantidad: string;
  persona: string;
  dia: string;
  obs: string;
  estado: EncargoEstado;
}

export interface NeveraDia {
  id: string;
  fecha: string;
  mes: string;
  diaTexto: string;
  persona: string;
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
  inventario: InventarioItem[];
  encargos: EncargoItem[];
  neverasPorDia: NeveraDia[];
}
