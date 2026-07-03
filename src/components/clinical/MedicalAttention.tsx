"use client";

import { useEffect, useMemo, useState } from "react";
import { rgb } from "pdf-lib";

import {
  actualizarAtencion,
  createId,
  finalizarAtencion,
  obtenerAtencionEnProcesoPorDerivacion,
  obtenerAtencionesPorPaciente,
  obtenerHistoriaClinicaPorPaciente,
} from "@/lib/clinical-storage";
import { cie10Catalog } from "@/lib/cie10-catalog";
import { mockUsers, SIMULATED_SESSION_KEY, type SimulatedSession } from "@/lib/mock-users";
import type {
  CertificadoMedico,
  Derivacion,
  DiagnosticoAtencion,
  EstudioLaboratorio,
  IndicacionEnfermeria,
  MedicamentoOrden,
  OrdenFarmacia,
  OrdenLaboratorio,
  Paciente,
  ProcedimientoAtencion,
  ReferenciaDerivacion,
  SignosVitales,
} from "@/types/clinical";
import { Modal } from "@/components/ui/Modal";
import { AutocompleteField, type AutocompleteOption } from "./AutocompleteField";
import { Field, inputClass, selectClass } from "./ClinicalFormFields";

type MedicalAttentionProps = {
  derivacion: Derivacion;
  paciente?: Paciente;
  signos?: SignosVitales;
  onClose: () => void;
  onSaved: (message: string) => void;
};

type VitalSignsDraft = Omit<SignosVitales, "id" | "pacienteId" | "fecha" | "registradoPorUserId"> & {
  clasificacionImc?: string;
};

const emptyVitals: VitalSignsDraft = {
  presionArterial: "",
  presionArterialSistolica: "",
  presionArterialDiastolica: "",
  frecuenciaCardiaca: "",
  frecuenciaRespiratoria: "",
  temperatura: "",
  saturacionOxigeno: "",
  peso: "",
  talla: "",
  imc: "",
  observaciones: "",
  clasificacionImc: "",
};

const medicamentosCatalog = [
  { medicamentoId: "med-paracetamol-500", nombre: "Paracetamol", presentacion: "Tableta 500 mg", stock: 120 },
  { medicamentoId: "med-ibuprofeno-400", nombre: "Ibuprofeno", presentacion: "Tableta 400 mg", stock: 85 },
  { medicamentoId: "med-amoxicilina-500", nombre: "Amoxicilina", presentacion: "Cápsula 500 mg", stock: 46 },
  { medicamentoId: "med-loratadina-10", nombre: "Loratadina", presentacion: "Tableta 10 mg", stock: 72 },
  { medicamentoId: "med-omeprazol-20", nombre: "Omeprazol", presentacion: "Cápsula 20 mg", stock: 64 },
  { medicamentoId: "med-sales-rehidratacion", nombre: "Sales de rehidratación oral", presentacion: "Sobre", stock: 38 },
];

const laboratorioCatalog = [
  "Biometría hemática",
  "Glucosa",
  "Urea",
  "Creatinina",
  "Ácido úrico",
  "Colesterol total",
  "Triglicéridos",
  "HDL colesterol",
  "LDL colesterol",
  "TGO/AST",
  "TGP/ALT",
  "Bilirrubina total",
  "EMO",
  "Urocultivo",
  "Coproparasitario",
  "Sangre oculta en heces",
  "Prueba de embarazo",
  "VIH",
  "VDRL",
  "Vitamina D",
].map((nombre, index) => ({
  pruebaId: `lab-${index + 1}`,
  nombre,
  stockAlMomento: 100,
}));

function currentSession() {
  if (typeof window === "undefined") return undefined;
  try {
    return JSON.parse(window.localStorage.getItem(SIMULATED_SESSION_KEY) || "{}") as Partial<SimulatedSession>;
  } catch {
    return undefined;
  }
}

function currentDoctor() {
  const session = currentSession();
  const user = mockUsers.find((item) => item.id === session?.userId || item.username === session?.username);
  const profile = user?.profile;
  return {
    id: session?.userId || user?.id || "usuario-simulado",
    nombre:
      profile?.documentSettings.nombreDocumento ||
      [session?.nombres || user?.nombres, session?.apellidos || user?.apellidos].filter(Boolean).join(" ") ||
      "Médico responsable",
    cargo: profile?.professional.cargoInstitucional || session?.cargo || user?.cargo || "Médico General",
    cedula: profile?.cedula || profile?.professional.cedulaProfesional || "",
    senescyt: profile?.professional.registroSenescyt || "",
    email: profile?.correoInstitucional || user?.email || (session?.username ? `${session.username}@unl.edu.ec` : ""),
    telefono: profile?.telefono || "",
  };
}

function patientName(paciente?: Paciente) {
  return paciente ? `${paciente.apellidos} ${paciente.nombres}`.trim() : "";
}

function patientProgram(paciente?: Paciente) {
  if (!paciente) return "";
  if (paciente.tipoUsuario === "estudiante" && paciente.nivelAcademico === "pregrado") {
    return [paciente.carreraNombre, paciente.facultadNombre].filter(Boolean).join(" / ");
  }
  if (paciente.tipoUsuario === "estudiante" && paciente.nivelAcademico === "posgrado") {
    return [paciente.programaPosgradoNombre, paciente.facultadNombre].filter(Boolean).join(" / ");
  }
  if (paciente.tipoUsuario === "docente") {
    return [paciente.facultadNombre || paciente.dependencia, paciente.cargo].filter(Boolean).join(" / ");
  }
  if (paciente.tipoUsuario === "administrativo") {
    return [paciente.dependencia, paciente.cargo].filter(Boolean).join(" / ");
  }
  return paciente.institucionProcedencia || "Externo";
}

function patientPeriod(paciente?: Paciente) {
  if (!paciente) return "";
  if (paciente.tipoUsuario === "estudiante" && paciente.nivelAcademico === "pregrado") {
    return [paciente.ciclo, paciente.periodoAcademicoNombre].filter(Boolean).join(" / ");
  }
  if (paciente.tipoUsuario === "estudiante" && paciente.nivelAcademico === "posgrado") {
    return ["Postgrado", paciente.periodoAcademicoNombre].filter(Boolean).join(" / ");
  }
  return "No aplica";
}

function classifyImc(imc: number) {
  if (imc < 18.5) return "Bajo peso";
  if (imc < 25) return "Normal";
  if (imc < 30) return "Sobrepeso";
  if (imc < 35) return "Obesidad grado I";
  if (imc < 40) return "Obesidad grado II";
  return "Obesidad grado III";
}

function calculateImc(peso: string, talla: string) {
  const kg = Number(String(peso).replace(",", "."));
  const rawTalla = Number(String(talla).replace(",", "."));
  const meters = rawTalla > 3 ? rawTalla / 100 : rawTalla;
  if (!kg || !meters) return { imc: "", clasificacionImc: "" };
  const value = kg / (meters * meters);
  if (!Number.isFinite(value)) return { imc: "", clasificacionImc: "" };
  const imc = value.toFixed(1);
  return { imc, clasificacionImc: classifyImc(Number(imc)) };
}

function makeVitalsDraft(signos?: SignosVitales): VitalSignsDraft {
  const draft = { ...emptyVitals, ...(signos ?? {}) };
  const calculated = calculateImc(draft.peso, draft.talla);
  return { ...draft, ...calculated };
}

function generateOrderCode(prefix: "FARM" | "LAB" | "ENF") {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

const MONTHS_ES = [
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

const NUMBER_WORDS_ES: Record<number, string> = {
  1: "uno",
  2: "dos",
  3: "tres",
  4: "cuatro",
  5: "cinco",
  6: "seis",
  7: "siete",
  8: "ocho",
  9: "nueve",
  10: "diez",
  11: "once",
  12: "doce",
  13: "trece",
  14: "catorce",
  15: "quince",
  16: "dieciséis",
  17: "diecisiete",
  18: "dieciocho",
  19: "diecinueve",
  20: "veinte",
  21: "veintiuno",
  22: "veintidós",
  23: "veintitrés",
  24: "veinticuatro",
  25: "veinticinco",
  26: "veintiséis",
  27: "veintisiete",
  28: "veintiocho",
  29: "veintinueve",
  30: "treinta",
};

const A4_WIDTH = 596;
const A4_HEIGHT = 842;
const PDF_TEXT = rgb(0, 0, 0);

type CertificateForm = {
  ciudadFecha: string;
  medico: string;
  cargo: string;
  paciente: string;
  cedula: string;
  dependencia: string;
  horaLlegada: string;
  horaSalida: string;
  diagnostico: string;
  diasReposo: string;
  desde: string;
  hasta: string;
};

type PdfFonts = {
  regular: import("pdf-lib").PDFFont;
  bold: import("pdf-lib").PDFFont;
};

function valueOrFallback(value?: string | number) {
  const text = String(value ?? "").trim();
  return text || "No registra";
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function formatTextDate(value: string) {
  const date = parseLocalDate(value);
  return `${String(date.getDate()).padStart(2, "0")} de ${MONTHS_ES[date.getMonth()]} de ${date.getFullYear()}`;
}

function formatCityDate(value: string) {
  return `Loja, ${formatTextDate(value)}`;
}

function formatTime24(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, "0")}:${match[2]}`;
  const date = new Date();
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function addDaysInclusive(dateValue: string, daysValue: string) {
  const days = Math.min(Math.max(Number(daysValue) || 1, 1), 30);
  const date = parseLocalDate(dateValue);
  date.setDate(date.getDate() + days - 1);
  return date.toISOString().slice(0, 10);
}

function daysWithWords(value: string) {
  const days = Math.min(Math.max(Number(value) || 1, 1), 30);
  return `${days} (${NUMBER_WORDS_ES[days]}) ${days === 1 ? "día" : "días"}`;
}

function safeFilenamePart(value: string) {
  return valueOrFallback(value).replace(/[^0-9A-Za-z-]+/g, "-").replace(/^-+|-+$/g, "") || "sin-registro";
}

function downloadBlob(filename: string, bytes: Uint8Array, type = "application/pdf") {
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

async function loadPdfFonts(pdfDoc: import("pdf-lib").PDFDocument): Promise<PdfFonts> {
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

function wrapText(text: string, font: import("pdf-lib").PDFFont, size: number, maxWidth: number) {
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

async function embedDocumentBackground(pdfDoc: import("pdf-lib").PDFDocument) {
  const bytes = await fetch("/brand/fondo-documentos.jpg").then((response) => response.arrayBuffer());
  return pdfDoc.embedJpg(bytes);
}

function drawDocumentBackground(page: import("pdf-lib").PDFPage, background: import("pdf-lib").PDFImage) {
  page.drawImage(background, {
    x: 0,
    y: 0,
    width: A4_WIDTH,
    height: A4_HEIGHT,
  });
}

async function drawCertificateBase(
  pdfDoc: import("pdf-lib").PDFDocument,
  page: import("pdf-lib").PDFPage,
) {
  const background = await embedDocumentBackground(pdfDoc);
  drawDocumentBackground(page, background);
}

function drawFitText({
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

function drawWrappedLines({
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

function drawLabelValue(page: import("pdf-lib").PDFPage, fonts: PdfFonts, label: string, value: string, x: number, y: number, maxWidth: number, size = 10.5) {
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

function splitIndicaciones(text: string) {
  const normalized = text.trim();
  if (!normalized) return ["No registra"];
  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:\d+[\).-]|[-*•])\s*/, "").trim())
    .filter(Boolean);
  return lines.length > 1 ? lines : [normalized.replace(/^\s*(?:\d+[\).-]|[-*•])\s*/, "").trim()];
}

function doctorSignatureLines(doctor: ReturnType<typeof currentDoctor>, nameOverride?: string, cargoOverride?: string) {
  return [
    `Md. ${valueOrFallback(nameOverride || doctor.nombre).replace(/^Md\.\s*/i, "")}`,
    (cargoOverride || "MÉDICO DE LA UNIDAD DE BIENESTAR UNIVERSITARIO UNL.").toUpperCase(),
    `Cédula: ${valueOrFallback(doctor.cedula)}`,
    `Registro de Senescyt: ${valueOrFallback(doctor.senescyt)}`,
    `Email: ${valueOrFallback(doctor.email)}`,
    `Tlf: ${valueOrFallback(doctor.telefono)}`,
  ];
}

async function generateCertificatePdf(tipo: "atencion" | "reposo", form: CertificateForm, doctor: ReturnType<typeof currentDoctor>) {
  const { PDFDocument } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.create();
  const fonts = await loadPdfFonts(pdfDoc);
  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  await drawCertificateBase(pdfDoc, page);

  const signature = doctorSignatureLines(doctor, form.medico, form.cargo);
  const diagnosis = valueOrFallback(form.diagnostico);
  const left = 76;
  const width = 444;
  const cityDate = valueOrFallback(form.ciudadFecha);
  const doctorName = signature[0];
  const doctorCargo = valueOrFallback(form.cargo || "MÉDICO DE LA UNIDAD DE BIENESTAR UNIVERSITARIO UNL.").toUpperCase();

  drawFitText({ page, text: cityDate, x: 300, y: 704, maxWidth: 220, size: 10.8, font: fonts.regular, align: "right" });
  page.drawText(doctorName, { x: left, y: 656, size: 10.8, font: fonts.bold, color: PDF_TEXT });
  page.drawText(doctorCargo, { x: left, y: 639, size: 9.8, font: fonts.bold, color: PDF_TEXT, maxWidth: width });
  page.drawText("Ciudad", { x: left, y: 622, size: 10.5, font: fonts.regular, color: PDF_TEXT });

  if (tipo === "atencion") {
    let y = 568;
    y = drawLabelValue(page, fonts, "Certifico haber atendido a", form.paciente, left, y, width, 10.8) - 12;
    y = drawLabelValue(page, fonts, "Con cédula de identidad número", form.cedula, left, y, width, 10.8) - 12;
    y = drawLabelValue(page, fonts, "De la carrera de", form.dependencia, left, y, width, 10.8) - 12;
    y = drawLabelValue(page, fonts, "Hora de llegada", form.horaLlegada, left, y, width, 10.8) - 12;
    y = drawLabelValue(page, fonts, "Hora de salida", form.horaSalida, left, y, width, 10.8) - 28;
    drawWrappedLines({
      page,
      text: "NO SE INDICA REPOSO, SE JUSTIFICA SOLO TIEMPO DE ATENCIÓN REALIZADA",
      x: left,
      y,
      maxWidth: width,
      size: 10.5,
      font: fonts.bold,
      lineHeight: 14,
    });
    y -= 54;
    y = drawWrappedLines({
      page,
      text: "De conformidad al reglamento de régimen académico de la Universidad Nacional de Loja resolución SE-Nº 01-ROCS-Nº 04-27-01-2021, Art. 109.- Justificación de la inasistencia del estudiante.- El estudiante solicitará por escrito al Decano/a de Facultad o al Director/a de la Unidad de Educación a Distancia, la justificación de su inasistencia, dentro del término de 10 días posteriores a la misma, adjuntando los documentos justificativos.",
      x: left,
      y,
      maxWidth: width,
      size: 9.6,
      font: fonts.regular,
      lineHeight: 13.2,
    });
    y -= 24;
    page.drawText("Diagnóstico", { x: left, y, size: 10.8, font: fonts.bold, color: PDF_TEXT });
    drawWrappedLines({ page, text: diagnosis, x: left, y: y - 22, maxWidth: width, size: 10.6, font: fonts.regular, lineHeight: 14 });
  } else {
    page.drawText("Certifica", { x: left, y: 572, size: 11, font: fonts.bold, color: PDF_TEXT });
    let y = drawWrappedLines({
      page,
      text: `Certifico que el/la paciente ${valueOrFallback(form.paciente)} con cédula ${valueOrFallback(form.cedula)} de la carrera de ${valueOrFallback(form.dependencia)} acude a la Unidad de Bienestar Universitario el día ${formatTextDate(form.desde)}, en donde se evidencia cuadro clínico compatible con ${diagnosis}. Se realiza valoración y se indica reposo médico por ${daysWithWords(form.diasReposo)} desde ${formatTextDate(form.desde)} hasta ${formatTextDate(form.hasta)}.`,
      x: left,
      y: 542,
      maxWidth: width,
      size: 10.6,
      font: fonts.regular,
      lineHeight: 15,
    });
    y -= 26;
    y = drawWrappedLines({
      page,
      text: "De conformidad al reglamento de régimen académico de la Universidad Nacional de Loja resolución SE-Nº 01-ROCS-Nº 04-27-01-2021, Art. 109.- Justificación de la inasistencia del estudiante.- El estudiante solicitará por escrito al Decano/a de Facultad o al Director/a de la Unidad de Educación a Distancia, la justificación de su inasistencia, dentro del término de 10 días posteriores a la misma, adjuntando los documentos justificativos.",
      x: left,
      y,
      maxWidth: width,
      size: 9.5,
      font: fonts.regular,
      lineHeight: 13,
    });
    y -= 24;
    page.drawText("Diagnóstico", { x: left, y, size: 10.8, font: fonts.bold, color: PDF_TEXT });
    drawWrappedLines({ page, text: diagnosis, x: left, y: y - 22, maxWidth: width, size: 10.6, font: fonts.regular, lineHeight: 14 });
  }

  signature.forEach((line, index) => {
    page.drawText(line, {
      x: left,
      y: 151 - index * 14,
      size: index <= 1 ? 9.6 : 8.9,
      font: index <= 1 ? fonts.bold : fonts.regular,
      color: PDF_TEXT,
      maxWidth: width,
    });
  });

  return pdfDoc.save();
}

async function generateIndicacionesPdf(data: {
  paciente?: Paciente;
  cedula: string;
  historiaClinica: string;
  fechaAtencion: string;
  doctor: ReturnType<typeof currentDoctor>;
  diagnosticoPrincipal?: DiagnosticoAtencion;
  diagnosticos: DiagnosticoAtencion[];
  planTratamiento: string;
}) {
  const { PDFDocument } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.create();
  const fonts = await loadPdfFonts(pdfDoc);
  const background = await embedDocumentBackground(pdfDoc);
  let page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  drawDocumentBackground(page, background);
  page.drawText("INDICACIONES MÉDICAS", { x: 76, y: 704, size: 13, font: fonts.bold, color: PDF_TEXT });

  const patient = data.paciente;
  const headerRows = [
    ["Paciente", valueOrFallback(patientName(patient))],
    ["Cédula / historia clínica", `${valueOrFallback(data.cedula)} / ${valueOrFallback(data.historiaClinica)}`],
    ["Carrera / Facultad o dependencia", valueOrFallback(patientProgram(patient))],
    ["Fecha de atención", formatCityDate(data.fechaAtencion)],
    ["Médico responsable", doctorSignatureLines(data.doctor)[0]],
    ["Diagnóstico principal", valueOrFallback(data.diagnosticoPrincipal ? `${data.diagnosticoPrincipal.codigo} - ${data.diagnosticoPrincipal.descripcion}` : "")],
  ];

  let y = 672;
  headerRows.forEach(([label, value]) => {
    const nextY = drawLabelValue(page, fonts, label, value, 76, y, 444, 9.7);
    y = Math.min(y - 17, nextY - 4);
  });

  page.drawText("INDICACIONES", { x: 76, y: y - 10, size: 11.2, font: fonts.bold, color: PDF_TEXT });
  y -= 35;

  const indications = splitIndicaciones(data.planTratamiento);
  const left = 76;
  const maxWidth = 444;
  const bottomLimit = 198;
  const addPage = () => {
    page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    drawDocumentBackground(page, background);
    page.drawText("INDICACIONES MÉDICAS", { x: left, y: 704, size: 13, font: fonts.bold, color: PDF_TEXT });
    page.drawText("INDICACIONES", { x: left, y: 668, size: 11.2, font: fonts.bold, color: PDF_TEXT });
    y = 642;
  };

  indications.forEach((indication, index) => {
    const prefix = `${index + 1}. `;
    const prefixWidth = fonts.bold.widthOfTextAtSize(prefix, 10.7);
    const lines = wrapText(indication, fonts.regular, 10.7, maxWidth - prefixWidth);
    const needed = Math.max(1, lines.length) * 15 + 7;
    if (y - needed < bottomLimit) addPage();
    page.drawText(prefix, { x: left, y, size: 10.7, font: fonts.bold, color: PDF_TEXT });
    lines.forEach((line, lineIndex) => {
      page.drawText(line, {
        x: left + prefixWidth,
        y: y - lineIndex * 15,
        size: 10.7,
        font: fonts.regular,
        color: PDF_TEXT,
        maxWidth: maxWidth - prefixWidth,
      });
    });
    y -= needed;
  });

  const signature = doctorSignatureLines(data.doctor);
  const signatureY = y > 260 ? 196 : Math.max(92, y - 34);
  signature.forEach((line, index) => {
    page.drawText(line, {
      x: left,
      y: signatureY - index * 14,
      size: index <= 1 ? 9.6 : 8.9,
      font: index <= 1 ? fonts.bold : fonts.regular,
      color: PDF_TEXT,
      maxWidth,
    });
  });
  return pdfDoc.save();
}

async function generateLaboratorioPdf(data: {
  paciente?: Paciente;
  cedula: string;
  historiaClinica: string;
  fechaAtencion: string;
  doctor: ReturnType<typeof currentDoctor>;
  diagnosticoPrincipal?: DiagnosticoAtencion;
  motivoConsulta: string;
  estudios: EstudioLaboratorio[];
  codigo?: string;
}) {
  const { PDFDocument } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.create();
  const fonts = await loadPdfFonts(pdfDoc);
  const background = await embedDocumentBackground(pdfDoc);
  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  drawDocumentBackground(page, background);

  const left = 76;
  const maxWidth = 444;
  page.drawText("SOLICITUD DE LABORATORIO CLÍNICO", {
    x: left,
    y: 704,
    size: 13,
    font: fonts.bold,
    color: PDF_TEXT,
  });

  const headerRows = [
    ["Universidad", "Universidad Nacional de Loja"],
    ["Unidad", "Unidad de Bienestar Universitario"],
    ["Servicio", "Medicina"],
    ["Código", data.codigo || "Pendiente de guardar"],
    ["Fecha de atención", formatCityDate(data.fechaAtencion)],
    ["Médico responsable", doctorSignatureLines(data.doctor)[0]],
    ["Paciente", valueOrFallback(patientName(data.paciente))],
    ["Cédula / historia clínica", `${valueOrFallback(data.cedula)} / ${valueOrFallback(data.historiaClinica)}`],
    ["Edad", valueOrFallback(data.paciente?.edad)],
    ["Diagnóstico", valueOrFallback(data.diagnosticoPrincipal ? `${data.diagnosticoPrincipal.codigo} - ${data.diagnosticoPrincipal.descripcion}` : data.motivoConsulta)],
  ];

  let y = 674;
  headerRows.forEach(([label, value]) => {
    const nextY = drawLabelValue(page, fonts, label, value, left, y, maxWidth, 9.7);
    y = Math.min(y - 17, nextY - 4);
  });

  y -= 12;
  page.drawText("EXÁMENES SOLICITADOS", { x: left, y, size: 11.2, font: fonts.bold, color: PDF_TEXT });
  y -= 24;
  const rows = data.estudios.length ? data.estudios : [{ nombre: "No registra" } as EstudioLaboratorio];
  rows.forEach((item, index) => {
    const prefix = `${index + 1}. `;
    const prefixWidth = fonts.bold.widthOfTextAtSize(prefix, 10.7);
    const lines = wrapText(item.nombre, fonts.regular, 10.7, maxWidth - prefixWidth);
    page.drawText(prefix, { x: left, y, size: 10.7, font: fonts.bold, color: PDF_TEXT });
    lines.forEach((line, lineIndex) => {
      page.drawText(line, {
        x: left + prefixWidth,
        y: y - lineIndex * 15,
        size: 10.7,
        font: fonts.regular,
        color: PDF_TEXT,
      });
    });
    y -= Math.max(1, lines.length) * 15 + 5;
  });

  const signature = doctorSignatureLines(data.doctor);
  signature.forEach((line, index) => {
    page.drawText(line, {
      x: left,
      y: 151 - index * 14,
      size: index <= 1 ? 9.6 : 8.9,
      font: index <= 1 ? fonts.bold : fonts.regular,
      color: PDF_TEXT,
      maxWidth,
    });
  });

  return pdfDoc.save();
}

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="ubu-card scroll-mt-16 p-4">
      <h3 className="ubu-section-title">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MiniInfo({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-md border border-[#D7E3EC] bg-[#F8FBFD] px-3 py-2">
      <p className="text-[11px] font-semibold text-[#52677A]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#0F2F44]">{value || "No registra"}</p>
    </div>
  );
}

export function MedicalAttention({
  derivacion,
  paciente,
  signos,
  onClose,
  onSaved,
}: MedicalAttentionProps) {
  const doctor = useMemo(() => currentDoctor(), []);
  const atencionBase = useMemo(() => obtenerAtencionEnProcesoPorDerivacion(derivacion.id), [derivacion.id]);
  const historia = useMemo(
    () => (paciente ? obtenerHistoriaClinicaPorPaciente(paciente.id) : undefined),
    [paciente],
  );
  const cedula = paciente?.cedula?.trim() || "";
  const historiaClinica = cedula;
  const [vitals, setVitals] = useState<VitalSignsDraft>(() => makeVitalsDraft(signos));
  const [motivoConsulta, setMotivoConsulta] = useState(derivacion.motivoConsultaBreve);
  const [fechaAtencion, setFechaAtencion] = useState(new Date().toISOString().slice(0, 10));
  const [enfermedadActual, setEnfermedadActual] = useState("");
  const [examenFisico, setExamenFisico] = useState("");
  const [diagnosticSearch, setDiagnosticSearch] = useState("");
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<DiagnosticoAtencion>();
  const [diagnosticType, setDiagnosticType] = useState<DiagnosticoAtencion["tipo"]>("Definitivo");
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoAtencion[]>([]);
  const [planTratamiento, setPlanTratamiento] = useState("");
  const [medSearch, setMedSearch] = useState("");
  const [medDose, setMedDose] = useState("");
  const [medQty, setMedQty] = useState("1");
  const [selectedMed, setSelectedMed] = useState<(typeof medicamentosCatalog)[number]>();
  const [medicamentos, setMedicamentos] = useState<MedicamentoOrden[]>([]);
  const [ordenFarmacia, setOrdenFarmacia] = useState<OrdenFarmacia>();
  const [labSearch, setLabSearch] = useState("");
  const [selectedLab, setSelectedLab] = useState<(typeof laboratorioCatalog)[number]>();
  const [estudios, setEstudios] = useState<EstudioLaboratorio[]>([]);
  const [ordenLaboratorio, setOrdenLaboratorio] = useState<OrdenLaboratorio>();
  const [indicacionTexto, setIndicacionTexto] = useState("");
  const [indicacionEnfermeria, setIndicacionEnfermeria] = useState<IndicacionEnfermeria>();
  const [certificados, setCertificados] = useState<CertificadoMedico[]>([]);
  const [certModal, setCertModal] = useState<"atencion" | "reposo" | undefined>();
  const [procedimiento, setProcedimiento] = useState<ProcedimientoAtencion>({
    realizado: false,
    tipo: "",
    descripcion: "",
    observaciones: "",
    complicaciones: "",
  });
  const [referencia, setReferencia] = useState<ReferenciaDerivacion>({
    emitida: false,
    motivo: "",
    destino: "",
    diagnostico: "",
    prioridad: "Normal",
    observaciones: "",
  });
  const [message, setMessage] = useState("");
  const [confirmFarmacia, setConfirmFarmacia] = useState(false);
  const [success, setSuccess] = useState<{ title: string; code: string }>();

  const historial = useMemo(
    () =>
      paciente
        ? obtenerAtencionesPorPaciente(paciente.id).filter((item) => item.derivacionId !== derivacion.id)
        : [],
    [derivacion.id, paciente],
  );
  const [historyDetail, setHistoryDetail] = useState<(typeof historial)[number]>();

  const cieOptions: AutocompleteOption[] = useMemo(
    () =>
      cie10Catalog.map((item) => ({
        value: item.codigo,
        label: item.codigo,
        helper: item.descripcion,
      })),
    [],
  );

  const medOptions: AutocompleteOption[] = medicamentosCatalog.map((item) => ({
    value: item.medicamentoId,
    label: item.nombre,
    helper: `${item.presentacion} - stock ${item.stock}`,
  }));

  const labOptions: AutocompleteOption[] = laboratorioCatalog.map((item) => ({
    value: item.pruebaId,
    label: item.nombre,
    helper: `stock ${item.stockAlMomento}`,
  }));

  const diagnosticoPrincipal = diagnosticos.find((item) => item.principal) ?? diagnosticos[0];

  function changeVital(key: keyof VitalSignsDraft, value: string) {
    setVitals((current) => {
      const next = { ...current, [key]: value };
      if (key === "peso" || key === "talla") return { ...next, ...calculateImc(next.peso, next.talla) };
      return next;
    });
  }

  function addDiagnostico() {
    if (!selectedDiagnostic) {
      setMessage("Seleccione un diagnóstico CIE-10.");
      return;
    }
    if (diagnosticos.some((item) => item.codigo === selectedDiagnostic.codigo)) return;
    setDiagnosticos((items) => [
      ...items,
      { ...selectedDiagnostic, tipo: diagnosticType, principal: items.length === 0 },
    ]);
    setSelectedDiagnostic(undefined);
    setDiagnosticSearch("");
  }

  function addMedicamento() {
    if (!selectedMed) {
      setMessage("Seleccione un medicamento.");
      return;
    }
    const quantity = Number(medQty);
    if (!quantity || quantity < 1) {
      setMessage("Ingrese una cantidad valida.");
      return;
    }
    if (quantity > selectedMed.stock) {
      setMessage("La cantidad no puede superar el stock disponible.");
      return;
    }
    setMedicamentos((items) => [
      ...items.filter((item) => item.medicamentoId !== selectedMed.medicamentoId),
      {
        medicamentoId: selectedMed.medicamentoId,
        nombre: selectedMed.nombre,
        presentacion: selectedMed.presentacion,
        dosis: medDose,
        cantidad: quantity,
        stockAlMomento: selectedMed.stock,
      },
    ]);
    setSelectedMed(undefined);
    setMedSearch("");
    setMedDose("");
    setMedQty("1");
  }

  function confirmOrdenFarmacia() {
    if (medicamentos.length === 0) {
      setMessage("Agregue al menos un medicamento antes de enviar a Farmacia.");
      return;
    }
    const order: OrdenFarmacia = {
      codigo: ordenFarmacia?.codigo || generateOrderCode("FARM"),
      estado: "pendiente",
      medicamentos,
      fecha: new Date().toISOString(),
      pacienteId: paciente?.id || "",
      cedulaPaciente: cedula,
      medicoId: doctor.id,
    };
    setOrdenFarmacia(order);
    setConfirmFarmacia(false);
    setSuccess({ title: "Envio exitoso a Farmacia", code: order.codigo });
  }

  function addEstudio() {
    if (!selectedLab) {
      setMessage("Seleccione una prueba de laboratorio.");
      return;
    }
    setEstudios((items) => [
      ...items.filter((item) => item.pruebaId !== selectedLab.pruebaId),
      selectedLab,
    ]);
    setSelectedLab(undefined);
    setLabSearch("");
  }

  function sendLab() {
    if (estudios.length === 0) {
      setMessage("Agregue al menos un estudio antes de enviar a Laboratorio.");
      return;
    }
    const order: OrdenLaboratorio = {
      codigo: ordenLaboratorio?.codigo || generateOrderCode("LAB"),
      estado: "pendiente",
      estudios,
      fecha: new Date().toISOString(),
      pacienteId: paciente?.id || "",
      cedulaPaciente: cedula,
      medicoId: doctor.id,
    };
    setOrdenLaboratorio(order);
    setSuccess({ title: "Envio exitoso a Laboratorio", code: order.codigo });
  }

  async function downloadLaboratorio() {
    if (!paciente || estudios.length === 0) {
      setMessage("Agregue al menos un estudio para generar la solicitud de laboratorio.");
      return;
    }
    const pdfBytes = await generateLaboratorioPdf({
      paciente,
      cedula,
      historiaClinica,
      fechaAtencion,
      doctor,
      diagnosticoPrincipal,
      motivoConsulta,
      estudios,
      codigo: ordenLaboratorio?.codigo,
    });
    downloadBlob(`solicitud-laboratorio-${safeFilenamePart(cedula)}-${fechaAtencion}.pdf`, pdfBytes);
  }

  function sendNursing() {
    if (!indicacionTexto.trim()) {
      setMessage("Escriba indicaciones para Enfermería.");
      return;
    }
    const order: IndicacionEnfermeria = {
      codigo: indicacionEnfermeria?.codigo || generateOrderCode("ENF"),
      indicaciones: indicacionTexto.trim(),
      estado: "pendiente",
      fecha: new Date().toISOString(),
      pacienteId: paciente?.id || "",
      cedulaPaciente: cedula,
      medicoId: doctor.id,
    };
    setIndicacionEnfermeria(order);
    setSuccess({ title: "Envío exitoso a Enfermería", code: order.codigo });
  }

  async function downloadIndicaciones() {
    if (!paciente || !planTratamiento.trim()) {
      setMessage("Complete paciente y plan de tratamiento para generar indicaciones.");
      return;
    }
    const pdfBytes = await generateIndicacionesPdf({
      paciente,
      cedula,
      historiaClinica,
      fechaAtencion,
      doctor,
      diagnosticoPrincipal,
      diagnosticos,
      planTratamiento,
    });
    downloadBlob(`indicaciones-medicas-${safeFilenamePart(cedula)}-${fechaAtencion}.pdf`, pdfBytes);
  }

  function saveAttention() {
    if (!paciente || !cedula) {
      setMessage("No hay paciente válido para guardar la atención.");
      return;
    }
    if (historiaClinica !== cedula) {
      setMessage("La historia clínica debe ser exactamente la cédula.");
      return;
    }
    if (!fechaAtencion || !motivoConsulta.trim()) {
      setMessage("Complete fecha de atención y motivo de consulta.");
      return;
    }
    if (diagnosticos.length === 0) {
      setMessage("Agregue al menos un diagnóstico CIE-10.");
      return;
    }
    const current = atencionBase ?? obtenerAtencionEnProcesoPorDerivacion(derivacion.id);
    if (!current) {
      setMessage("No se encontró la atención en proceso. Vuelva a abrir el paciente desde la cola.");
      return;
    }
    const now = new Date().toISOString();
    const farmaciaFinal = ordenFarmacia ? { ...ordenFarmacia, medicamentos } : undefined;
    const laboratorioFinal = ordenLaboratorio ? { ...ordenLaboratorio, estudios } : undefined;
    finalizarAtencion(current.id, {
      cedulaPaciente: cedula,
      historiaClinica: cedula,
      fechaAtencion,
      horaInicio: current.horaInicio,
      profesionalNombre: doctor.nombre,
      origen: derivacion.origen,
      signosVitales: {
        ...vitals,
        id: signos?.id || createId("sv-atencion"),
        pacienteId: paciente.id,
        fecha: signos?.fecha || now,
        registradoPorUserId: signos?.registradoPorUserId || doctor.id,
      },
      motivoConsulta: motivoConsulta.trim(),
      enfermedadActual: enfermedadActual.trim(),
      examenFisico: examenFisico.trim(),
      diagnosticos,
      diagnosticoPrincipal,
      planTratamiento: planTratamiento.trim(),
      ordenFarmacia: farmaciaFinal,
      ordenLaboratorio: laboratorioFinal,
      indicacionEnfermeria,
      certificados,
      procedimiento,
      referenciaDerivacion: {
        ...referencia,
        diagnostico: referencia.diagnostico || (diagnosticoPrincipal ? `${diagnosticoPrincipal.codigo} ${diagnosticoPrincipal.descripcion}` : ""),
      },
      updatedAt: now,
    });
    onSaved("Atención guardada en expediente. El paciente salió de la cola de Medicina.");
  }

  function persistDraft() {
    const current = atencionBase ?? obtenerAtencionEnProcesoPorDerivacion(derivacion.id);
    if (!current) return;
    const farmaciaFinal = ordenFarmacia ? { ...ordenFarmacia, medicamentos } : undefined;
    const laboratorioFinal = ordenLaboratorio ? { ...ordenLaboratorio, estudios } : undefined;
    actualizarAtencion(current.id, {
      cedulaPaciente: cedula,
      historiaClinica: cedula,
      motivoConsulta,
      enfermedadActual,
      examenFisico,
      diagnosticos,
      diagnosticoPrincipal,
      planTratamiento,
      ordenFarmacia: farmaciaFinal,
      ordenLaboratorio: laboratorioFinal,
      indicacionEnfermeria,
      certificados,
      procedimiento,
      referenciaDerivacion: referencia,
    });
  }

  return (
    <>
      <Modal
        size="xl"
        className="bg-[#F6FAFD]"
        bodyClassName="space-y-4 bg-[#F6FAFD]"
        eyebrow="Medicina general"
        title="Atención médica"
        onClose={onClose}
        closeLabel="Cerrar atención médica"
        footer={
          <>
            <button type="button" onClick={persistDraft} className="ubu-btn ubu-btn-secondary">Guardar borrador</button>
            <button type="button" onClick={onClose} className="ubu-btn ubu-btn-secondary">Cerrar</button>
            <button type="button" onClick={saveAttention} className="ubu-btn ubu-btn-primary">Guardar atención</button>
          </>
        }
      >
          <div className="sticky top-0 z-10 -mx-2 overflow-x-auto border-b border-[#D7E3EC] bg-[#F6FAFD]/95 px-2 pb-3 pt-1 backdrop-blur">
            <div className="flex min-w-max gap-2">
              {[
                ["Paciente", "attn-paciente"],
                ["Signos vitales", "attn-vitales"],
                ["Antecedentes", "attn-antecedentes"],
                ["Consulta", "attn-consulta"],
                ["CIE-10", "attn-cie10"],
                ["Tratamiento", "attn-tratamiento"],
                ["Farmacia", "attn-farmacia"],
                ["Laboratorio", "attn-laboratorio"],
                ["Certificados", "attn-certificados"],
                ["Referencia", "attn-referencia"],
              ].map(([label, sectionId]) => (
                <button
                  key={sectionId}
                  type="button"
                  onClick={() => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="rounded-full border border-[#D7E3EC] bg-white px-3 py-1.5 text-xs font-bold text-[#0F2F44] transition hover:border-[#005B84] hover:text-[#005B84]"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {message && (
            <div className="rounded-md border border-[#BFD2DE] bg-[#EEF6FA] px-3 py-2 text-sm font-semibold text-[#005B84]">
              {message}
            </div>
          )}

          <Section id="attn-paciente" title="Resumen del paciente">
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
              <MiniInfo label="Paciente" value={patientName(paciente)} />
              <MiniInfo label="Cédula" value={cedula} />
              <MiniInfo label="Historia clínica" value={historiaClinica} />
              <MiniInfo label="Edad / género" value={[paciente?.edad, paciente?.sexo].filter(Boolean).join(" / ")} />
              <MiniInfo label="Tipo de usuario" value={paciente?.tipoUsuario} />
              <MiniInfo label="Facultad / carrera / dependencia" value={patientProgram(paciente)} />
              <MiniInfo label="Ciclo / período" value={patientPeriod(paciente)} />
              <MiniInfo label="Tipo de atención" value={atencionBase?.tipoAtencion === "apertura_hc" ? "Primera atencion" : "Atencion subsecuente"} />
              <MiniInfo label="Hora de llegada" value={derivacion.horaLlegada} />
              <MiniInfo label="Origen" value={derivacion.origen === "enfermeria" ? "Enfermería / Triaje" : "Medicina"} />
            </div>
          </Section>

          <Section id="attn-vitales" title="Signos vitales">
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
              {[
                ["Presion arterial", "presionArterial"],
                ["Frecuencia cardiaca", "frecuenciaCardiaca"],
                ["Frecuencia respiratoria", "frecuenciaRespiratoria"],
                ["Temperatura", "temperatura"],
                ["Saturacion O2", "saturacionOxigeno"],
                ["Talla en metros", "talla"],
                ["Peso kg", "peso"],
              ].map(([label, key]) => (
                <Field key={key} label={label}>
                  <input value={vitals[key as keyof VitalSignsDraft] ?? ""} onChange={(event) => changeVital(key as keyof VitalSignsDraft, event.target.value)} className={inputClass} />
                </Field>
              ))}
              <MiniInfo label="IMC" value={vitals.imc} />
              <MiniInfo label="Clasificación IMC" value={vitals.clasificacionImc} />
              <Field label="Observaciones">
                <textarea value={vitals.observaciones} onChange={(event) => changeVital("observaciones", event.target.value)} className={`${inputClass} min-h-20`} />
              </Field>
            </div>
          </Section>

          <Section id="attn-antecedentes" title="Antecedentes de la historia clínica">
            {historia ? (
              <div className="grid gap-3 md:grid-cols-2">
                <MiniInfo
                  label="Antecedentes personales"
                  value={historia.antecedentesPersonales.length
                    ? historia.antecedentesPersonales.map((item) => `${item.codigo} - ${item.descripcion}`).join("; ")
                    : "No registra"}
                />
                <MiniInfo
                  label="Antecedentes familiares"
                  value={historia.antecedentesFamiliares.length
                    ? historia.antecedentesFamiliares.map((item) => `${item.familiar}: ${item.codigo} - ${item.descripcion}`).join("; ")
                    : "No registra"}
                />
                <MiniInfo label="Antecedentes quirúrgicos" value={historia.antecedentesQuirurgicos} />
                <MiniInfo label="Alergias" value={historia.alergias} />
              </div>
            ) : (
              <p className="text-sm font-semibold text-[#64748B]">
                Este paciente no tiene historia clínica con antecedentes registrados.
              </p>
            )}
          </Section>

          <Section id="attn-consulta" title="Datos de atención médica">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Motivo de consulta">
                <textarea value={motivoConsulta} onChange={(event) => setMotivoConsulta(event.target.value)} className={`${inputClass} min-h-24`} />
              </Field>
              <Field label="Fecha de atención">
                <input type="date" value={fechaAtencion} onChange={(event) => setFechaAtencion(event.target.value)} className={inputClass} />
              </Field>
              <Field label="Enfermedad actual">
                <textarea value={enfermedadActual} onChange={(event) => setEnfermedadActual(event.target.value)} placeholder="Describa la evolución, síntomas principales y datos relevantes." className={`${inputClass} min-h-28`} />
              </Field>
              <Field label="Examen físico">
                <textarea value={examenFisico} onChange={(event) => setExamenFisico(event.target.value)} placeholder="Registre hallazgos clínicos relevantes." className={`${inputClass} min-h-28`} />
              </Field>
            </div>
          </Section>

          <Section id="attn-cie10" title="Diagnóstico CIE-10">
            <div className="grid gap-3 md:grid-cols-[1fr_180px_auto] md:items-end">
              <Field label="Buscar por código o palabra">
                <AutocompleteField
                  value={diagnosticSearch}
                  options={cieOptions}
                  limit={10}
                  hideOptionsUntilSearch
                  onChange={(value, option) => {
                    setDiagnosticSearch(option ? `${option.value} - ${option.helper}` : value);
                    if (option) setSelectedDiagnostic({ codigo: option.value, descripcion: option.helper || "", tipo: diagnosticType, principal: false });
                  }}
                />
              </Field>
              <Field label="Tipo">
                <select value={diagnosticType} onChange={(event) => setDiagnosticType(event.target.value as DiagnosticoAtencion["tipo"])} className={selectClass}>
                  <option>Presuntivo</option>
                  <option>Definitivo</option>
                </select>
              </Field>
              <button type="button" onClick={addDiagnostico} className="rounded-md bg-[#005B84] px-4 py-2 text-sm font-semibold text-white">
                Añadir diagnóstico
              </button>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead className="bg-[#EEF6FA] text-left text-[11px] uppercase tracking-wide text-[#64748B]">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Principal</th>
                    <th className="px-3 py-2 font-semibold">Código</th>
                    <th className="px-3 py-2 font-semibold">Descripción</th>
                    <th className="px-3 py-2 font-semibold">Tipo</th>
                    <th className="px-3 py-2 font-semibold">Eliminar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D7E3EC]">
                  {diagnosticos.map((item) => (
                    <tr key={item.codigo}>
                      <td className="px-3 py-2">
                        <input type="radio" checked={item.principal} onChange={() => setDiagnosticos((rows) => rows.map((row) => ({ ...row, principal: row.codigo === item.codigo })))} />
                      </td>
                      <td className="px-3 py-2 font-semibold text-[#0F2F44]">{item.codigo}</td>
                      <td className="px-3 py-2 text-[#52677A]">{item.descripcion}</td>
                      <td className="px-3 py-2 text-[#52677A]">{item.tipo}</td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => setDiagnosticos((rows) => rows.filter((row) => row.codigo !== item.codigo).map((row, index) => ({ ...row, principal: index === 0 ? true : row.principal })))} className="h-8 w-8 rounded-md border border-[#FCA5A5] text-sm font-semibold text-[#D71920]">
                          X
                        </button>
                      </td>
                    </tr>
                  ))}
                  {diagnosticos.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-sm font-semibold text-[#64748B]">Sin diagnósticos agregados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="attn-tratamiento" title="Plan de tratamiento">
            <Field label="Indicaciones medicas">
              <textarea value={planTratamiento} onChange={(event) => setPlanTratamiento(event.target.value)} className={`${inputClass} min-h-32`} />
            </Field>
            <div className="mt-3 flex justify-end">
              <button type="button" onClick={downloadIndicaciones} className="rounded-md border border-[#005B84] px-4 py-2 text-sm font-semibold text-[#005B84]">
                Descargar PDF de indicaciones
              </button>
            </div>
          </Section>

          <div className="grid gap-4 xl:grid-cols-2">
            <Section id="attn-farmacia" title="Orden a Farmacia">
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_90px_auto] md:items-end">
                <Field label="Medicamento">
                  <AutocompleteField
                    value={medSearch}
                    options={medOptions}
                    hideOptionsUntilSearch
                    onChange={(value, option) => {
                      setMedSearch(option ? option.label : value);
                      setSelectedMed(medicamentosCatalog.find((item) => item.medicamentoId === option?.value));
                    }}
                  />
                </Field>
                <Field label="Dosis">
                  <input value={medDose} onChange={(event) => setMedDose(event.target.value)} className={inputClass} />
                </Field>
                <Field label="Cantidad">
                  <input type="number" min="1" value={medQty} onChange={(event) => setMedQty(event.target.value)} className={inputClass} />
                </Field>
                <button type="button" onClick={addMedicamento} className="rounded-md bg-[#005B84] px-3 py-2 text-sm font-semibold text-white">Agregar</button>
              </div>
              <OrderList
                rows={medicamentos.map((item) => `${item.nombre} ${item.presentacion || ""} - ${item.dosis || "Sin dosis"} - Cant. ${item.cantidad}`)}
                onRemove={(index) => setMedicamentos((items) => items.filter((_, itemIndex) => itemIndex !== index))}
              />
              <button type="button" onClick={() => setConfirmFarmacia(true)} className="mt-3 rounded-md bg-[#D71920] px-4 py-2 text-sm font-semibold text-white">Enviar orden a Farmacia</button>
              {ordenFarmacia && <p className="mt-2 text-sm font-semibold text-[#166534]">Código: {ordenFarmacia.codigo}</p>}
            </Section>

            <Section id="attn-laboratorio" title="Orden a Laboratorio">
              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                <Field label="Estudio complementario">
                  <AutocompleteField
                    value={labSearch}
                    options={labOptions}
                    hideOptionsUntilSearch
                    onChange={(value, option) => {
                      setLabSearch(option ? option.label : value);
                      setSelectedLab(laboratorioCatalog.find((item) => item.pruebaId === option?.value));
                    }}
                  />
                </Field>
                <button type="button" onClick={addEstudio} className="rounded-md bg-[#005B84] px-3 py-2 text-sm font-semibold text-white">Agregar</button>
              </div>
              <OrderList rows={estudios.map((item) => item.nombre)} onRemove={(index) => setEstudios((items) => items.filter((_, itemIndex) => itemIndex !== index))} />
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={sendLab} className="ubu-btn ubu-btn-primary">Enviar orden</button>
                <button type="button" onClick={downloadLaboratorio} className="ubu-btn ubu-btn-secondary">Descargar solicitud</button>
              </div>
              {ordenLaboratorio && <p className="mt-2 text-sm font-semibold text-[#166534]">Código: {ordenLaboratorio.codigo}</p>}
            </Section>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Section title="Indicaciones a Enfermería">
              <Field label="Indicaciones">
                <textarea value={indicacionTexto} onChange={(event) => setIndicacionTexto(event.target.value)} className={`${inputClass} min-h-28`} />
              </Field>
              <button type="button" onClick={sendNursing} className="mt-3 rounded-md bg-[#005B84] px-4 py-2 text-sm font-semibold text-white">Enviar a Enfermeria</button>
              {indicacionEnfermeria && <p className="mt-2 text-sm font-semibold text-[#166534]">Código: {indicacionEnfermeria.codigo}</p>}
            </Section>

            <Section id="attn-certificados" title="Certificado médico">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setCertModal("atencion")} className="rounded-md border border-[#005B84] px-4 py-2 text-sm font-semibold text-[#005B84]">Generar certificado de atención</button>
                <button type="button" onClick={() => setCertModal("reposo")} className="rounded-md border border-[#005B84] px-4 py-2 text-sm font-semibold text-[#005B84]">Generar certificado de reposo</button>
              </div>
              <OrderList rows={certificados.map((item) => `${item.tipo} - ${new Date(item.fecha).toLocaleString("es-EC")}`)} onRemove={(index) => setCertificados((items) => items.filter((_, itemIndex) => itemIndex !== index))} />
            </Section>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Section title="Procedimiento invasivo y no invasivo">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#0F2F44]">
                <input type="checkbox" checked={procedimiento.realizado} onChange={(event) => setProcedimiento((row) => ({ ...row, realizado: event.target.checked }))} />
                Se realizo un procedimiento durante esta atencion
              </label>
              {procedimiento.realizado && (
                <div className="mt-3 grid gap-3">
                  <Field label="Tipo de procedimiento">
                    <select value={procedimiento.tipo} onChange={(event) => setProcedimiento((row) => ({ ...row, tipo: event.target.value as ProcedimientoAtencion["tipo"] }))} className={selectClass}>
                      <option value="">Seleccione...</option>
                      <option>Invasivo</option>
                      <option>No invasivo</option>
                      <option>Cirugía menor</option>
                    </select>
                  </Field>
                  <Field label="Descripción"><textarea value={procedimiento.descripcion} onChange={(event) => setProcedimiento((row) => ({ ...row, descripcion: event.target.value }))} className={`${inputClass} min-h-24`} /></Field>
                  <Field label="Observaciones"><textarea value={procedimiento.observaciones} onChange={(event) => setProcedimiento((row) => ({ ...row, observaciones: event.target.value }))} className={`${inputClass} min-h-20`} /></Field>
                  <Field label="Complicaciones"><textarea value={procedimiento.complicaciones} onChange={(event) => setProcedimiento((row) => ({ ...row, complicaciones: event.target.value }))} className={`${inputClass} min-h-20`} /></Field>
                </div>
              )}
            </Section>

            <Section id="attn-referencia" title="Referencia / Derivación">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#0F2F44]">
                <input type="checkbox" checked={referencia.emitida} onChange={(event) => setReferencia((row) => ({ ...row, emitida: event.target.checked }))} />
                Se emitió una referencia o derivación
              </label>
              {referencia.emitida && (
                <div className="mt-3 grid gap-3">
                  <Field label="Motivo"><textarea value={referencia.motivo} onChange={(event) => setReferencia((row) => ({ ...row, motivo: event.target.value }))} className={`${inputClass} min-h-20`} /></Field>
                  <Field label="Destino"><input value={referencia.destino} onChange={(event) => setReferencia((row) => ({ ...row, destino: event.target.value }))} className={inputClass} /></Field>
                  <Field label="Diagnóstico asociado"><input value={referencia.diagnostico} onChange={(event) => setReferencia((row) => ({ ...row, diagnostico: event.target.value }))} placeholder={diagnosticoPrincipal ? `${diagnosticoPrincipal.codigo} ${diagnosticoPrincipal.descripcion}` : ""} className={inputClass} /></Field>
                  <Field label="Prioridad">
                    <select value={referencia.prioridad} onChange={(event) => setReferencia((row) => ({ ...row, prioridad: event.target.value as ReferenciaDerivacion["prioridad"] }))} className={selectClass}>
                      <option>Normal</option>
                      <option>Preferente</option>
                      <option>Urgente</option>
                    </select>
                  </Field>
                  <Field label="Observaciones"><textarea value={referencia.observaciones} onChange={(event) => setReferencia((row) => ({ ...row, observaciones: event.target.value }))} className={`${inputClass} min-h-20`} /></Field>
                </div>
              )}
            </Section>
          </div>

          <Section title="Historial de atenciones">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead className="bg-[#EEF6FA] text-left text-[11px] uppercase tracking-wide text-[#64748B]">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Fecha</th>
                    <th className="px-3 py-2 font-semibold">Servicio</th>
                    <th className="px-3 py-2 font-semibold">Profesional</th>
                    <th className="px-3 py-2 font-semibold">Diagnóstico / motivo</th>
                    <th className="px-3 py-2 font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D7E3EC]">
                  {historial.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">{(item.fechaAtencion || item.fechaInicio).slice(0, 10)}</td>
                      <td className="px-3 py-2">{item.servicio}</td>
                      <td className="px-3 py-2">{item.profesionalNombre || item.profesionalId}</td>
                      <td className="px-3 py-2">{item.diagnosticoPrincipal ? `${item.diagnosticoPrincipal.codigo} ${item.diagnosticoPrincipal.descripcion}` : item.motivoConsulta || "No registra"}</td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => setHistoryDetail(item)} className="rounded-md border border-[#D7E3EC] px-3 py-1.5 text-xs font-semibold text-[#005B84]">Ver</button>
                      </td>
                    </tr>
                  ))}
                  {historial.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-5 text-center text-sm font-semibold text-[#64748B]">Sin atenciones previas registradas.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>
      </Modal>

      {historyDetail && (
        <SmallModal title="Detalle de la atención" onClose={() => setHistoryDetail(undefined)}>
          <div className="space-y-3">
            <MiniInfo label="Fecha" value={(historyDetail.fechaAtencion || historyDetail.fechaInicio).slice(0, 10)} />
            <MiniInfo label="Diagnóstico" value={historyDetail.diagnosticoPrincipal ? `${historyDetail.diagnosticoPrincipal.codigo} - ${historyDetail.diagnosticoPrincipal.descripcion}` : historyDetail.motivoConsulta} />
            <MiniInfo label="Enfermedad actual" value={historyDetail.enfermedadActual} />
            <MiniInfo label="Examen físico" value={historyDetail.examenFisico} />
            <MiniInfo label="Plan de tratamiento" value={historyDetail.planTratamiento} />
          </div>
        </SmallModal>
      )}

      {confirmFarmacia && (
        <SmallModal title="Confirmar orden a Farmacia" onClose={() => setConfirmFarmacia(false)}>
          <OrderList rows={medicamentos.map((item) => `${item.nombre} - ${item.dosis || "Sin dosis"} - Cant. ${item.cantidad}`)} onRemove={(index) => setMedicamentos((items) => items.filter((_, itemIndex) => itemIndex !== index))} />
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setConfirmFarmacia(false)} className="rounded-md border border-[#D7E3EC] px-4 py-2 text-sm font-semibold text-[#0F2F44]">Cancelar</button>
            <button type="button" onClick={confirmOrdenFarmacia} className="rounded-md bg-[#D71920] px-4 py-2 text-sm font-semibold text-white">Confirmar envío</button>
          </div>
        </SmallModal>
      )}

      {success && (
        <SmallModal title={success.title} onClose={() => setSuccess(undefined)}>
          <p className="text-sm font-semibold text-[#0F2F44]">Código: {success.code}</p>
          <p className="mt-2 text-sm text-[#52677A]">La orden se registrará al guardar la atención.</p>
        </SmallModal>
      )}

      {certModal && (
        <CertificateModal
          tipo={certModal}
          paciente={paciente}
          cedula={cedula}
          doctor={doctor}
          fechaAtencion={fechaAtencion}
          horaLlegada={derivacion.horaLlegada}
          diagnostico={diagnosticoPrincipal}
          onClose={() => setCertModal(undefined)}
          onGenerated={(certificado) => {
            setCertificados((items) => [...items, certificado]);
            setCertModal(undefined);
          }}
        />
      )}
    </>
  );
}

function OrderList({ rows, onRemove }: { rows: string[]; onRemove: (index: number) => void }) {
  if (rows.length === 0) {
    return <div className="mt-3 rounded-md border border-dashed border-[#BFD2DE] bg-[#F8FBFD] px-3 py-3 text-sm font-semibold text-[#64748B]">Sin registros agregados.</div>;
  }
  return (
    <div className="mt-3 space-y-2">
      {rows.map((row, index) => (
        <div key={`${row}-${index}`} className="flex items-center justify-between gap-3 rounded-md border border-[#D7E3EC] bg-[#F8FBFD] px-3 py-2">
          <span className="text-sm text-[#0F2F44]">{row}</span>
          <button type="button" onClick={() => onRemove(index)} className="h-7 w-7 rounded-md border border-[#FCA5A5] text-xs font-semibold text-[#D71920]">X</button>
        </div>
      ))}
    </div>
  );
}

function SmallModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <Modal size="sm" overlayClassName="ubu-modal-overlay-nested" title={title} onClose={onClose}>
      {children}
    </Modal>
  );
}

function CertificateModal({
  tipo,
  paciente,
  cedula,
  doctor,
  fechaAtencion,
  horaLlegada,
  diagnostico,
  onClose,
  onGenerated,
}: {
  tipo: "atencion" | "reposo";
  paciente?: Paciente;
  cedula: string;
  doctor: ReturnType<typeof currentDoctor>;
  fechaAtencion: string;
  horaLlegada: string;
  diagnostico?: DiagnosticoAtencion;
  onClose: () => void;
  onGenerated: (certificado: CertificadoMedico) => void;
}) {
  const [form, setForm] = useState<CertificateForm>({
    ciudadFecha: formatCityDate(fechaAtencion),
    medico: doctor.nombre,
    cargo: "MÉDICO DE LA UNIDAD DE BIENESTAR UNIVERSITARIO UNL.",
    paciente: patientName(paciente),
    cedula,
    dependencia: patientProgram(paciente),
    horaLlegada: formatTime24(horaLlegada),
    horaSalida: formatTime24(new Date().toTimeString()),
    diagnostico: diagnostico ? `${diagnostico.codigo} - ${diagnostico.descripcion}` : "",
    diasReposo: "1",
    desde: fechaAtencion,
    hasta: addDaysInclusive(fechaAtencion, "1"),
  });
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewBytes, setPreviewBytes] = useState<Uint8Array>();
  const [previewLoading, setPreviewLoading] = useState(true);

  function change(key: keyof typeof form, value: string) {
    setPreviewLoading(true);
    setPreviewBytes(undefined);
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "diasReposo" || key === "desde") {
        const days = Math.max(Number(key === "diasReposo" ? value : next.diasReposo) || 1, 1);
        const start = new Date(`${key === "desde" ? value : next.desde}T00:00:00`);
        if (!Number.isNaN(start.getTime())) {
          start.setDate(start.getDate() + days - 1);
          next.hasta = start.toISOString().slice(0, 10);
        }
      }
      return next;
    });
  }

  const fieldLabels: Record<keyof CertificateForm, string> = {
    ciudadFecha: "Ciudad y fecha",
    medico: "Médico responsable",
    cargo: "Cargo",
    paciente: "Paciente",
    cedula: "Cédula",
    dependencia: "Carrera / Facultad o dependencia",
    horaLlegada: "Hora de llegada",
    horaSalida: "Hora de salida",
    diagnostico: "Diagnóstico",
    diasReposo: "Días de reposo",
    desde: "Fecha de inicio del reposo",
    hasta: "Fecha de fin del reposo",
  };

  const sections: Array<{ title: string; keys: Array<keyof CertificateForm> }> = [
    { title: "Datos generales", keys: ["ciudadFecha", "medico", "cargo"] },
    { title: "Datos del paciente", keys: ["paciente", "cedula", "dependencia"] },
    {
      title: "Atención médica",
      keys: tipo === "atencion" ? ["horaLlegada", "horaSalida", "diagnostico"] : ["horaLlegada", "horaSalida", "diagnostico", "diasReposo", "desde", "hasta"],
    },
  ];

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      generateCertificatePdf(tipo, form, doctor)
        .then((bytes) => {
          if (cancelled) return;
          const data = new Uint8Array(bytes.length);
          data.set(bytes);
          const blob = new Blob([data.buffer], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          setPreviewBytes(data);
          setPreviewUrl((current) => {
            if (current) URL.revokeObjectURL(current);
            return url;
          });
        })
        .finally(() => {
          if (!cancelled) setPreviewLoading(false);
        });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [doctor, form, tipo]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function download() {
    const pdfBytes = previewBytes ?? await generateCertificatePdf(tipo, form, doctor);
    const filename = `${tipo === "atencion" ? "certificado-atencion" : "certificado-reposo"}-${safeFilenamePart(form.cedula)}-${fechaAtencion}.pdf`;
    downloadBlob(filename, pdfBytes);
    onGenerated({ id: createId("cert"), tipo, fecha: new Date().toISOString(), datos: form });
  }

  return (
    <Modal
      size="xl"
      overlayClassName="ubu-modal-overlay-nested ubu-modal-overlay-dark"
      title={
        <>
          Generar certificado médico
          <span className="rounded-full bg-[#EEF6FA] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#005B84]">
            {tipo === "atencion" ? "Certificado de atención" : "Certificado de reposo"}
          </span>
        </>
      }
      subtitle="Revise los datos antes de descargar el documento institucional."
      onClose={onClose}
      bodyClassName="grid gap-5 lg:grid-cols-[45fr_55fr]"
      footer={
        <>
          <button type="button" onClick={onClose} className="ubu-btn ubu-btn-secondary">Cancelar</button>
          <button
            type="button"
            onClick={download}
            disabled={previewLoading || !previewBytes}
            className="ubu-btn ubu-btn-primary disabled:bg-[#94A3B8]"
          >
            {previewLoading ? "Generando PDF..." : "Descargar certificado"}
          </button>
        </>
      }
    >
          <div className="min-w-0">
            <h4 className="text-base font-bold text-[#0F2F44]">Datos del certificado</h4>
            <div className="mt-4 space-y-5">
              {sections.map((section) => (
                <section key={section.title}>
                  <h5 className="text-[13px] font-bold uppercase tracking-wide text-[#005B84]">{section.title}</h5>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {section.keys.map((key) => (
                      <label key={key} className={key === "medico" || key === "cargo" || key === "paciente" || key === "diagnostico" || key === "dependencia" ? "md:col-span-2" : ""}>
                        <span className="text-[13px] font-semibold text-[#0F2F44]">{fieldLabels[key]}</span>
                        <input
                          type={key === "desde" || key === "hasta" ? "date" : key === "diasReposo" ? "number" : "text"}
                          min={key === "diasReposo" ? 1 : undefined}
                          max={key === "diasReposo" ? 30 : undefined}
                          value={form[key]}
                          onChange={(event) => change(key, event.target.value)}
                          title={form[key]}
                          className="mt-1.5 h-11 w-full rounded-[10px] border border-[#D8E1EA] bg-[#FAFCFE] px-3 text-sm font-medium text-[#0F2F44] outline-none transition focus:border-[#005B84] focus:bg-white focus:ring-2 focus:ring-[#005B84]/15"
                        />
                      </label>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
          <div className="flex min-w-0 flex-col">
            <h4 className="text-base font-bold text-[#0F2F44]">Vista previa del certificado</h4>
            <div className="mt-4 min-h-[460px] flex-1 overflow-hidden rounded-xl border border-[#D7E3EC] bg-[#E8EEF3] p-2 sm:p-3">
              {previewUrl ? (
                <iframe title="Vista previa del certificado" src={`${previewUrl}#toolbar=0&navpanes=0&view=FitH`} className="h-full min-h-[460px] w-full rounded-lg border-0 bg-white shadow-sm" />
              ) : (
                <div className="flex h-full min-h-[460px] items-center justify-center rounded-lg bg-white text-sm font-semibold text-[#64748B]">
                  {previewLoading ? "Generando vista previa..." : "No se pudo generar la vista previa."}
                </div>
              )}
            </div>
          </div>
    </Modal>
  );
}
