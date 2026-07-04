// Infraestructura compartida para los documentos PDF institucionales
// (certificados, indicaciones, solicitudes y resumen de atención).
// Solo se importa bajo demanda: pdf-lib se carga con import() dinámico.

import { rgb } from "pdf-lib";

import { normalizarTallaCm } from "@/lib/vital-signs";
import type { Atencion } from "@/types/clinical";

export const A4_WIDTH = 596;
export const A4_HEIGHT = 842;
export const PDF_TEXT = rgb(0, 0, 0);

export type PdfFonts = {
  regular: import("pdf-lib").PDFFont;
  bold: import("pdf-lib").PDFFont;
};

export const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export function valueOrFallback(value?: string | number) {
  const text = String(value ?? "").trim();
  return text || "No registra";
}

export function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

export function formatTextDate(value: string) {
  const date = parseLocalDate(value);
  return `${String(date.getDate()).padStart(2, "0")} de ${MONTHS_ES[date.getMonth()]} de ${date.getFullYear()}`;
}

export function formatCityDate(value: string) {
  return `Loja, ${formatTextDate(value)}`;
}

export function safeFilenamePart(value: string) {
  return valueOrFallback(value).replace(/[^0-9A-Za-z-]+/g, "-").replace(/^-+|-+$/g, "") || "sin-registro";
}

export function downloadBlob(filename: string, bytes: Uint8Array, type = "application/pdf") {
  const data = new Uint8Array(bytes.length);
  data.set(bytes);
  const blob = new Blob([data.buffer], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function loadPdfFonts(pdfDoc: import("pdf-lib").PDFDocument): Promise<PdfFonts> {
  const [{ default: fontkit }, regularBytes, boldBytes] = await Promise.all([
    import("@pdf-lib/fontkit"),
    fetch("/fonts/montserrat-regular.ttf").then((response) => response.arrayBuffer()),
    fetch("/fonts/montserrat-bold.ttf").then((response) => response.arrayBuffer()),
  ]);
  pdfDoc.registerFontkit(fontkit);
  return {
    regular: await pdfDoc.embedFont(regularBytes, { subset: true }),
    bold: await pdfDoc.embedFont(boldBytes, { subset: true }),
  };
}

export function wrapText(text: string, font: import("pdf-lib").PDFFont, size: number, maxWidth: number) {
  const normalized = valueOrFallback(text).replace(/\s+/g, " ").trim();
  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
      return;
    }
    if (current) lines.push(current);
    current = word;
  });
  if (current) lines.push(current);
  return lines;
}

export async function embedDocumentBackground(pdfDoc: import("pdf-lib").PDFDocument) {
  const bytes = await fetch("/brand/fondo-documentos.jpg").then((response) => response.arrayBuffer());
  return pdfDoc.embedJpg(bytes);
}

export function drawDocumentBackground(page: import("pdf-lib").PDFPage, background: import("pdf-lib").PDFImage) {
  page.drawImage(background, {
    x: 0,
    y: 0,
    width: A4_WIDTH,
    height: A4_HEIGHT,
  });
}

export function drawFitText({
  page,
  text,
  x,
  y,
  maxWidth,
  size,
  font,
  color = PDF_TEXT,
  align = "left",
}: {
  page: import("pdf-lib").PDFPage;
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  size: number;
  font: import("pdf-lib").PDFFont;
  color?: import("pdf-lib").RGB;
  align?: "left" | "center" | "right";
}) {
  const value = valueOrFallback(text);
  let fontSize = size;
  while (font.widthOfTextAtSize(value, fontSize) > maxWidth && fontSize > 8) fontSize -= 0.25;
  const width = Math.min(font.widthOfTextAtSize(value, fontSize), maxWidth);
  const drawX = align === "right" ? x + maxWidth - width : align === "center" ? x + (maxWidth - width) / 2 : x;
  page.drawText(value, { x: drawX, y, size: fontSize, font, color, maxWidth });
}

export function drawWrappedLines({
  page,
  text,
  x,
  y,
  maxWidth,
  size,
  font,
  color = PDF_TEXT,
  lineHeight = size + 4,
}: {
  page: import("pdf-lib").PDFPage;
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  size: number;
  font: import("pdf-lib").PDFFont;
  color?: import("pdf-lib").RGB;
  lineHeight?: number;
}) {
  const lines = wrapText(text, font, size, maxWidth);
  lines.forEach((line, index) => page.drawText(line, { x, y: y - index * lineHeight, size, font, color, maxWidth }));
  return y - lines.length * lineHeight;
}

export function drawLabelValue(
  page: import("pdf-lib").PDFPage,
  fonts: PdfFonts,
  label: string,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  size = 10.5,
) {
  const labelText = `${label}: `;
  page.drawText(labelText, { x, y, size, font: fonts.bold, color: PDF_TEXT });
  const valueX = x + fonts.bold.widthOfTextAtSize(labelText, size);
  return drawWrappedLines({
    page,
    text: value,
    x: valueX,
    y,
    maxWidth: Math.max(maxWidth - (valueX - x), 80),
    size,
    font: fonts.regular,
    lineHeight: size + 4,
  });
}

export function splitIndicaciones(text: string) {
  const normalized = text.trim();
  if (!normalized) return ["No registra"];
  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:\d+[\).-]|[-*•])\s*/, "").trim())
    .filter(Boolean);
  return lines.length > 1 ? lines : [normalized.replace(/^\s*(?:\d+[\).-]|[-*•])\s*/, "").trim()];
}

// ---------------------------------------------------------------------------
// Resumen de atención: documento local de una atención finalizada, con las
// mismas secciones que muestra el detalle en pantalla.
// ---------------------------------------------------------------------------

export type ResumenAtencionData = {
  atencion: Atencion;
  pacienteNombre: string;
  cedula: string;
  historiaClinica: string;
  programa?: string;
  servicio: string;
};

export async function generateResumenAtencionPdf(data: ResumenAtencionData) {
  const { PDFDocument } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.create();
  const fonts = await loadPdfFonts(pdfDoc);
  const background = await embedDocumentBackground(pdfDoc);
  const left = 76;
  const maxWidth = 444;
  const bottomLimit = 96;

  let page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  drawDocumentBackground(page, background);
  page.drawText("RESUMEN DE ATENCIÓN", { x: left, y: 704, size: 13, font: fonts.bold, color: PDF_TEXT });
  let y = 676;

  const ensureSpace = (needed: number) => {
    if (y - needed >= bottomLimit) return;
    page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    drawDocumentBackground(page, background);
    y = 704;
  };

  const sectionTitle = (title: string) => {
    ensureSpace(34);
    y -= 10;
    page.drawText(title.toUpperCase(), { x: left, y, size: 11, font: fonts.bold, color: PDF_TEXT });
    y -= 18;
  };

  const row = (label: string, value?: string | number) => {
    const text = valueOrFallback(value);
    const lines = wrapText(text, fonts.regular, 9.7, maxWidth - 140);
    ensureSpace(Math.max(1, lines.length) * 14 + 4);
    const nextY = drawLabelValue(page, fonts, label, text, left, y, maxWidth, 9.7);
    y = Math.min(y - 15, nextY - 3);
  };

  const { atencion } = data;
  sectionTitle("Datos generales");
  row("Paciente", data.pacienteNombre);
  row("Cédula / historia clínica", `${valueOrFallback(data.cedula)} / ${valueOrFallback(data.historiaClinica)}`);
  if (data.programa) row("Carrera / dependencia", data.programa);
  row("Fecha de atención", formatCityDate(atencion.fechaAtencion || atencion.fechaInicio.slice(0, 10)));
  row("Hora", [atencion.horaInicio, atencion.horaFin].filter(Boolean).join(" - "));
  row("Servicio", data.servicio);
  row("Profesional", atencion.profesionalNombre || atencion.profesionalId);
  row("Tipo de atención", atencion.tipoAtencion === "apertura_hc" ? "Primera atención" : "Atención subsecuente");

  const signos = atencion.signosVitales;
  sectionTitle("Signos vitales");
  if (signos) {
    row("Presión arterial (mmHg)", signos.presionArterial);
    row("Frecuencia cardíaca (lpm)", signos.frecuenciaCardiaca);
    row("Frecuencia respiratoria (rpm)", signos.frecuenciaRespiratoria);
    row("Temperatura (°C)", signos.temperatura);
    row("Saturación O₂ (%)", signos.saturacionOxigeno);
    row("Talla (cm)", normalizarTallaCm(signos.talla));
    row("Peso (kg)", signos.peso);
    row("IMC (kg/m²)", signos.imc);
  } else {
    row("Signos vitales", "No registra");
  }

  sectionTitle("Consulta");
  row("Motivo de consulta", atencion.motivoConsulta);
  row("Enfermedad actual", atencion.enfermedadActual);
  row("Examen físico", atencion.examenFisico);

  sectionTitle("Diagnósticos CIE-10");
  const diagnosticos = atencion.diagnosticos ?? [];
  if (diagnosticos.length) {
    diagnosticos.forEach((diagnostico) => {
      row(
        diagnostico.codigo,
        `${diagnostico.descripcion} (${diagnostico.tipo}${diagnostico.principal ? ", principal" : ""})`,
      );
    });
  } else {
    row("Diagnósticos", "No registra");
  }

  sectionTitle("Plan de tratamiento");
  const indicaciones = splitIndicaciones(atencion.planTratamiento ?? "");
  indicaciones.forEach((indicacion, index) => {
    row(`${index + 1}`, indicacion);
  });

  sectionTitle("Farmacia");
  if (atencion.ordenFarmacia) {
    row("Código", atencion.ordenFarmacia.codigo);
    row("Estado", atencion.ordenFarmacia.estado);
    atencion.ordenFarmacia.medicamentos.forEach((medicamento) => {
      row(
        medicamento.nombre,
        `${medicamento.presentacion || ""} ${medicamento.dosis || "Sin dosis"} - Cant. ${medicamento.cantidad}`.trim(),
      );
    });
  } else {
    row("Orden de farmacia", "No registra");
  }

  sectionTitle("Laboratorio");
  if (atencion.ordenLaboratorio) {
    row("Código", atencion.ordenLaboratorio.codigo);
    row("Estado", atencion.ordenLaboratorio.estado);
    row("Estudios", atencion.ordenLaboratorio.estudios.map((estudio) => estudio.nombre).join("; "));
  } else {
    row("Orden de laboratorio", "No registra");
  }

  sectionTitle("Procedimiento");
  if (atencion.procedimiento?.realizado) {
    row("Tipo", atencion.procedimiento.tipo);
    row("Descripción", atencion.procedimiento.descripcion);
    row("Observaciones", atencion.procedimiento.observaciones);
  } else {
    row("Procedimiento", "No registrado");
  }

  sectionTitle("Referencia / derivación");
  if (atencion.referenciaDerivacion?.emitida) {
    row("Destino", atencion.referenciaDerivacion.destino);
    row("Motivo", atencion.referenciaDerivacion.motivo);
    row("Prioridad", atencion.referenciaDerivacion.prioridad);
    row("Observaciones", atencion.referenciaDerivacion.observaciones);
  } else {
    row("Referencia", "No registrada");
  }

  sectionTitle("Certificados emitidos");
  const certificados = atencion.certificados ?? [];
  if (certificados.length) {
    certificados.forEach((certificado) => {
      row(
        certificado.tipo === "atencion" ? "Certificado de atención" : "Certificado de reposo",
        new Date(certificado.fecha).toLocaleString("es-EC"),
      );
    });
  } else {
    row("Certificados", "No registra");
  }

  return pdfDoc.save();
}
