import type { Lang } from "../i18n/messages";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;
const WEEKDAYS_CA = ["Dg", "Dl", "Dt", "Dc", "Dj", "Dv", "Ds"] as const;
const WEEKDAYS_LONG = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;
const MONTHS_SHORT = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
] as const;
const MONTHS_LONG = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDaysISO(isoDate: string, days: number): string {
  const date = fromISODate(isoDate);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function fromISODate(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function formatDateES(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

const MONTHS_SHORT_CA = ["gen", "feb", "març", "abr", "maig", "juny", "jul", "ago", "set", "oct", "nov", "des"] as const;

export function formatHeaderDate(date = new Date(), lang: Lang = "es"): string {
  const days = lang === "ca" ? WEEKDAYS_CA : WEEKDAYS;
  const months = lang === "ca" ? MONTHS_SHORT_CA : MONTHS_SHORT;
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDayLabel(isoDate: string, today = todayISO()): string {
  const date = fromISODate(isoDate);
  const weekday = WEEKDAYS_LONG[date.getDay()];
  const day = date.getDate();
  const month = MONTHS_SHORT[date.getMonth()];
  const suffix = isoDate === today ? " (Hoy)" : "";
  return `${weekday} ${day} ${month}${suffix}`;
}

export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const month = MONTHS_LONG[(m ?? 1) - 1] ?? ym;
  return `${month} ${y}`;
}

export function formatTempES(num: number): string {
  return Number(num).toFixed(1).replace(".", ",");
}

export function formatDateTimeES(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()} ${hh}:${min}`;
}

export function currentTimeHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function parseTime(value: string | null | undefined): string {
  if (!value) return currentTimeHHMM();
  return value.slice(0, 5);
}
