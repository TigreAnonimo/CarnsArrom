import { seedData } from "../data/seed";
import { STORAGE_KEY } from "../data/constants";
import type { AppData } from "../types";

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(seedData);
    const parsed = JSON.parse(raw) as Partial<AppData>;
    const neverasPorDia = (parsed.neverasPorDia ?? seedData.neverasPorDia).map((day, index) => ({
      ...day,
      id: day.id || `n-${day.mes}-${day.fecha}-${index}`,
    }));
    const recentActivity = (parsed.recentActivity ?? seedData.recentActivity).map((item, index) => ({
      ...item,
      id: item.id || `a-${index}`,
    }));
    return {
      recentActivity,
      inventario: parsed.inventario ?? seedData.inventario,
      encargos: parsed.encargos ?? seedData.encargos,
      neverasPorDia,
    };
  } catch {
    return structuredClone(seedData);
  }
}

export function saveAppData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
