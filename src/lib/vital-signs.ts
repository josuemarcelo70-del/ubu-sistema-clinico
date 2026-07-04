// Utilidades compartidas para registro y visualización de signos vitales.
// La talla se maneja SIEMPRE en centímetros; los registros antiguos guardados
// en metros (< 3) se normalizan al leerlos para no duplicar conversiones.

export type VitalFieldDef = {
  key: string;
  label: string;
  placeholder: string;
  inputMode?: "decimal" | "numeric" | "text";
};

export const vitalFieldDefs: VitalFieldDef[] = [
  { key: "presionArterial", label: "Presión arterial (mmHg)", placeholder: "Ej. 120/80", inputMode: "text" },
  { key: "frecuenciaCardiaca", label: "Frecuencia cardíaca (lpm)", placeholder: "Ej. 75", inputMode: "numeric" },
  { key: "frecuenciaRespiratoria", label: "Frecuencia respiratoria (rpm)", placeholder: "Ej. 18", inputMode: "numeric" },
  { key: "temperatura", label: "Temperatura (°C)", placeholder: "Ej. 36.5", inputMode: "decimal" },
  { key: "saturacionOxigeno", label: "Saturación O₂ (%)", placeholder: "Ej. 98", inputMode: "numeric" },
  { key: "talla", label: "Talla (cm)", placeholder: "Ej. 170", inputMode: "decimal" },
  { key: "peso", label: "Peso (kg)", placeholder: "Ej. 70", inputMode: "decimal" },
];

export const TALLA_CM_MIN = 50;
export const TALLA_CM_MAX = 250;

function toNumber(value: string | number | undefined) {
  if (value === undefined || value === null) return NaN;
  return Number(String(value).replace(",", "."));
}

/**
 * Normaliza una talla a centímetros como texto listo para mostrar/guardar.
 * - < 3  → se asume metros y se convierte (1.70 → "170").
 * - >= 3 → se asume que ya está en centímetros.
 * Devuelve "" si el valor no es numérico.
 */
export function normalizarTallaCm(value: string | number | undefined): string {
  const raw = toNumber(value);
  if (!Number.isFinite(raw) || raw <= 0) return "";
  const cm = raw < 3 ? raw * 100 : raw;
  return Number.isInteger(cm) ? String(cm) : String(Number(cm.toFixed(1)));
}

export function tallaFueraDeRango(tallaCm: string | number | undefined) {
  const cm = toNumber(tallaCm);
  if (!Number.isFinite(cm) || !cm) return false;
  return cm < TALLA_CM_MIN || cm > TALLA_CM_MAX;
}

export function clasificarImc(imc: number) {
  if (!Number.isFinite(imc) || imc <= 0) return "No registra";
  if (imc < 18.5) return "Bajo peso";
  if (imc < 25) return "Normal";
  if (imc < 30) return "Sobrepeso";
  if (imc < 35) return "Obesidad grado I";
  if (imc < 40) return "Obesidad grado II";
  return "Obesidad grado III";
}

/**
 * IMC = peso_kg / (talla_cm / 100)².
 * Acepta tallas antiguas en metros (se normalizan antes de calcular).
 * Devuelve valores vacíos si falta peso o talla, o si la talla está fuera
 * del rango clínicamente razonable (50–250 cm).
 */
export function calcularImcDesdeCm(peso: string | number | undefined, talla: string | number | undefined) {
  const kg = toNumber(peso);
  const cm = toNumber(normalizarTallaCm(talla));
  if (!Number.isFinite(kg) || !Number.isFinite(cm) || kg <= 0 || cm <= 0) {
    return { imc: "", clasificacionImc: "" };
  }
  if (cm < TALLA_CM_MIN || cm > TALLA_CM_MAX) {
    return { imc: "", clasificacionImc: "" };
  }
  const meters = cm / 100;
  const value = kg / (meters * meters);
  if (!Number.isFinite(value)) return { imc: "", clasificacionImc: "" };
  const imc = value.toFixed(1);
  return { imc, clasificacionImc: clasificarImc(Number(imc)) };
}

/** Deja solo el dato numérico limpio (sin unidades) para persistir. */
export function limpiarValorNumerico(value: string) {
  const cleaned = String(value).replace(",", ".").replace(/[^\d./]/g, "");
  return cleaned;
}
