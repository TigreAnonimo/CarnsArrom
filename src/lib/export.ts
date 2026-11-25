import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { NEVERA_NOMBRES } from "../data/constants";
import { formatTempES, monthLabel } from "./dates";
import { resumenEncargoLineas } from "./orders";
import type { ActivityItem, EncargoItem, InventarioItem, NeveraDia, ProductoStock } from "../types";

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function exportExcel(sheets: Record<string, Record<string, string | number>[]>, filename: string) {
  const book = XLSX.utils.book_new();
  Object.entries(sheets).forEach(([name, rows]) => {
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows), name.slice(0, 31));
  });
  XLSX.writeFile(book, filename);
}

export function exportPdf(title: string, head: string[], body: (string | number)[][], filename: string) {
  const doc = new jsPDF({ orientation: head.length > 6 ? "landscape" : "portrait" });
  doc.setFontSize(16);
  doc.text("Carns Arrom", 14, 16);
  doc.setFontSize(11);
  doc.text(title, 14, 24);
  doc.setFontSize(9);
  doc.text(`Exportado: ${new Date().toLocaleString("es-ES")}`, 14, 30);
  autoTable(doc, {
    startY: 36,
    head: [head],
    body,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [139, 30, 36] },
  });
  doc.save(filename);
}

export function inventarioRows(items: InventarioItem[] | ProductoStock[]) {
  return items.map((item) => {
    if ("nombre" in item) {
      return {
        Fecha: item.fecha,
        Producto: item.nombre,
        Cantidad: item.cantidad,
        Persona: item.persona,
        Estado: item.estado,
      };
    }
    return {
      Fecha: item.fecha,
      Producto: item.producto,
      Cantidad: item.cantidad,
      Persona: item.persona,
      Estado: item.estado,
    };
  });
}

export function encargosRows(items: EncargoItem[]) {
  return items.map((o) => ({
    Número: o.numero,
    Producto: resumenEncargoLineas(o.producto, o.cantidad),
    Cantidad: o.cantidad.replace(/\n/g, " · "),
    Cliente: o.cliente,
    Teléfono: o.telefono,
    Recogida: o.dia,
    Persona: o.persona,
    Estado: o.estado,
    Observaciones: o.obs,
  }));
}

export function neverasRows(items: NeveraDia[]) {
  return items.map((d) => ({
    Fecha: d.fecha,
    Hora: d.hora,
    ...Object.fromEntries(NEVERA_NOMBRES.map((nombre, i) => [nombre, formatTempES(d.temps[i] ?? 0)])),
    Persona: d.persona,
    Mes: monthLabel(d.mes),
  }));
}

export function actividadRows(items: ActivityItem[]) {
  return items.map((a) => ({
    Fecha: a.meta,
    Trabajador: a.persona,
    Acción: a.descripcion,
    Tipo: a.tipo,
  }));
}

export function filename(prefix: string, ext: "xlsx" | "pdf") {
  return `Carns-Arrom-${prefix}-${stamp()}.${ext}`;
}

export { downloadBlob };
