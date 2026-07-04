import type {
  AntecedentesGinecoObstetricos,
  CondicionGinecoAtencion,
} from "@/types/clinical";

export const orientacionSexualOptions = [
  "Heterosexual",
  "Homosexual",
  "Bisexual",
  "Pansexual",
  "Asexual",
  "Otro",
  "Prefiere no responder",
];

export const puebloNacionalidadOptions = [
  "Mestizo/a",
  "Afroecuatoriano/a",
  "Montubio/a",
  "Indígena",
  "Blanco/a",
  "Shuar",
  "Kichwa",
  "Saraguro",
  "Achuar",
  "Waorani",
  "Siona",
  "Secoya",
  "Cofán",
  "Zápara",
  "Andoa",
  "Shiwiar",
  "Otro",
  "No especifica",
];

export const tipoDiscapacidadOptions = [
  "Física",
  "Intelectual",
  "Visual",
  "Auditiva",
  "Psicosocial",
  "Lenguaje",
  "Múltiple",
  "Otra",
];

export const cicloMenstrualOptions = ["Regular", "Irregular", "Amenorrea", "No aplica"];

export const metodoAnticonceptivoOptions = [
  "Ninguno",
  "Preservativo",
  "Anticonceptivos orales",
  "Anticonceptivo inyectable",
  "Implante subdérmico",
  "DIU",
  "Anticoncepción de emergencia",
  "Método natural",
  "Otro",
];

export const inicioVidaSexualOptions = ["No", "Sí", "Prefiere no responder"];

export const riesgoObstetricoOptions = ["Bajo", "Alto", "No determinado"];

export const tipoLactanciaOptions = ["Exclusiva", "Mixta", "Complementaria"];

export function esSexoFemenino(sexo?: string) {
  return (sexo ?? "").trim().toLowerCase() === "femenino";
}

export const emptyGineco: AntecedentesGinecoObstetricos = {
  menarquia: "",
  fum: "",
  cicloMenstrual: "",
  duracionCiclo: "",
  duracionSangrado: "",
  dismenorrea: "",
  inicioVidaSexual: "",
  metodoAnticonceptivo: "",
  gestas: "",
  partos: "",
  cesareas: "",
  abortos: "",
  hijosVivos: "",
  antecedenteIts: "",
  ultimoPapanicolaou: "",
  ultimoControlGinecologico: "",
  observacionesGinecoObstetricas: "",
  gestaActual: "",
  fumGestacion: "",
  edadGestacionalSemanas: undefined,
  edadGestacionalDias: undefined,
  fechaProbableParto: "",
  controlesPrenatales: "",
  riesgoObstetrico: "",
  observacionesGestacion: "",
  lactanciaActual: "",
  tipoLactancia: "",
  edadLactante: "",
  observacionesLactancia: "",
};

export const emptyCondicionGineco: CondicionGinecoAtencion = {
  gestaActual: "",
  fumGestacion: "",
  edadGestacionalSemanas: undefined,
  edadGestacionalDias: undefined,
  fechaProbableParto: "",
  controlesPrenatales: "",
  riesgoObstetrico: "",
  observacionesGestacion: "",
  lactanciaActual: "",
  tipoLactancia: "",
  edadLactante: "",
  observacionesLactancia: "",
  observaciones: "",
};

// Límite superior clínicamente razonable para una gestación en curso (43 semanas).
const MAX_DIAS_GESTACION = 43 * 7;

export type EdadGestacional = {
  valido: boolean;
  error?: string;
  semanas?: number;
  dias?: number;
  fechaProbableParto?: string;
  texto?: string;
};

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function toIsoLocalDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function hoyIsoLocal() {
  return toIsoLocalDate(new Date());
}

export function calcularEdadGestacional(fum: string): EdadGestacional {
  const value = (fum ?? "").trim();
  if (!value) return { valido: false };
  const fumDate = parseLocalDate(value);
  if (!fumDate) {
    return { valido: false, error: "La FUM ingresada no es una fecha válida." };
  }
  const today = new Date();
  const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (fumDate.getTime() > todayLocal.getTime()) {
    return { valido: false, error: "La FUM no puede ser una fecha futura." };
  }
  const diffDays = Math.floor((todayLocal.getTime() - fumDate.getTime()) / 86400000);
  if (diffDays > MAX_DIAS_GESTACION) {
    return {
      valido: false,
      error:
        "La FUM excede el rango razonable para una gestación actual (más de 43 semanas). Verifique la fecha.",
    };
  }
  const parto = new Date(fumDate);
  parto.setDate(parto.getDate() + 280);
  const semanas = Math.floor(diffDays / 7);
  const dias = diffDays % 7;
  return {
    valido: true,
    semanas,
    dias,
    fechaProbableParto: toIsoLocalDate(parto),
    texto: formatearEdadGestacional(semanas, dias),
  };
}

export function formatearEdadGestacional(semanas?: number, dias?: number) {
  if (semanas === undefined || dias === undefined) return "";
  return `${semanas} ${semanas === 1 ? "semana" : "semanas"} + ${dias} ${dias === 1 ? "día" : "días"}`;
}

// Convierte strings vacíos en undefined para no guardar datos basura.
export function compactarRegistro<T extends Record<string, unknown>>(row: T): T {
  const next = { ...row };
  (Object.keys(next) as Array<keyof T>).forEach((key) => {
    const value = next[key];
    if (typeof value === "string" && !value.trim()) next[key] = undefined as T[keyof T];
  });
  return next;
}

export function tieneDatosGineco(row: Record<string, unknown>) {
  return Object.values(row).some(
    (value) => (typeof value === "string" && value.trim()) || typeof value === "number",
  );
}
