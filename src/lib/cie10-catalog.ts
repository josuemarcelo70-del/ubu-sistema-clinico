import type { Cie10Diagnostico } from "@/types/clinical";

export const cie10Catalog: Cie10Diagnostico[] = [
  { codigo: "E10", descripcion: "Diabetes mellitus insulinodependiente" },
  { codigo: "E11", descripcion: "Diabetes mellitus no insulinodependiente" },
  { codigo: "E14", descripcion: "Diabetes mellitus no especificada" },
  { codigo: "I10", descripcion: "Hipertensión esencial primaria" },
  { codigo: "I11", descripcion: "Enfermedad cardíaca hipertensiva" },
  { codigo: "J45", descripcion: "Asma" },
  { codigo: "J46", descripcion: "Estado asmático" },
  { codigo: "J00", descripcion: "Rinofaringitis aguda (resfriado común)" },
  { codigo: "K29", descripcion: "Gastritis y duodenitis" },
  { codigo: "G43", descripcion: "Migraña" },
  { codigo: "N39", descripcion: "Otros trastornos del sistema urinario" },
  { codigo: "M54", descripcion: "Dorsalgia" },
  { codigo: "F41", descripcion: "Otros trastornos de ansiedad" },
  { codigo: "F32", descripcion: "Episodio depresivo" },
  { codigo: "Z41", descripcion: "Procedimientos para otros propósitos que no sean mejorar el estado de salud" },
  { codigo: "Z88", descripcion: "Historia personal de alergia a drogas, medicamentos y sustancias biológicas" },
  { codigo: "Z91", descripcion: "Historia personal de factores de riesgo no clasificados en otra parte" },
  { codigo: "T78", descripcion: "Efectos adversos no clasificados en otra parte" },
  { codigo: "A09", descripcion: "Diarrea y gastroenteritis de presunto origen infeccioso" },
  { codigo: "R51", descripcion: "Cefalea" },
];

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
