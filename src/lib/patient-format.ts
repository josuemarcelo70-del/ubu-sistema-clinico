// Helpers de presentación del paciente compartidos entre la atención médica,
// el detalle de atenciones previas y los documentos PDF.

import type { Paciente } from "@/types/clinical";

export function patientName(paciente?: Paciente) {
  return paciente ? `${paciente.apellidos} ${paciente.nombres}`.trim() : "";
}

export function patientProgram(paciente?: Paciente) {
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
  if (paciente.tipoUsuario === "administrativo" || paciente.tipoUsuario === "trabajador") {
    return [paciente.dependencia, paciente.cargo].filter(Boolean).join(" / ");
  }
  return "";
}

export function patientPeriod(paciente?: Paciente) {
  if (!paciente) return "";
  if (paciente.tipoUsuario === "estudiante" && paciente.nivelAcademico === "pregrado") {
    return [paciente.ciclo, paciente.periodoAcademicoNombre].filter(Boolean).join(" / ");
  }
  if (paciente.tipoUsuario === "estudiante" && paciente.nivelAcademico === "posgrado") {
    return ["Postgrado", paciente.periodoAcademicoNombre].filter(Boolean).join(" / ");
  }
  return "No aplica";
}

export const servicioLabels: Record<string, string> = {
  medicina: "Medicina",
  odontologia: "Odontología",
  psicologia: "Psicología",
};

export function servicioLabel(servicio?: string) {
  return (servicio && servicioLabels[servicio]) || servicio || "No registra";
}

export function origenLabel(origen?: string) {
  if (!origen) return "No registra";
  if (origen === "enfermeria") return "Enfermería / Triaje";
  if (origen === "medicina_manual") return "Medicina";
  if (origen === "odontologia_manual") return "Odontología";
  if (origen === "psicologia_manual") return "Psicología";
  return origen;
}

export function coberturaLabel(cobertura?: string) {
  if (cobertura === "bienestar_universitario") return "Bienestar Universitario";
  if (cobertura === "iess") return "IESS";
  return "";
}
