import type { PrioridadTriaje } from "@/types/clinical";

export type TriageOption = {
  value: PrioridadTriaje;
  label: string;
  color: string;
  tiempoEsperaLabel: string;
};

export const triageOptions: TriageOption[] = [
  { value: "rojo", label: "Emergencia inmediata", color: "#DC2626", tiempoEsperaLabel: "Atención inmediata" },
  { value: "naranja", label: "Muy urgente", color: "#F97316", tiempoEsperaLabel: "Hasta 10 minutos" },
  { value: "amarillo", label: "Urgente", color: "#EAB308", tiempoEsperaLabel: "Hasta 60 minutos" },
  { value: "verde", label: "Menor urgencia", color: "#16A34A", tiempoEsperaLabel: "Hasta 120 minutos" },
  { value: "azul", label: "No urgente", color: "#2563EB", tiempoEsperaLabel: "Hasta 240 minutos" },
];

export function getTriageOption(value: PrioridadTriaje) {
  return triageOptions.find((option) => option.value === value) ?? triageOptions[3];
}
