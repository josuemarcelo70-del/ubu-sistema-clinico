"use client";

import type {
  AntecedentesGinecoObstetricos,
  CondicionGinecoAtencion,
  GestacionActual,
  LactanciaActual,
} from "@/types/clinical";
import {
  calcularEdadGestacional,
  cicloMenstrualOptions,
  formatearEdadGestacional,
  hoyIsoLocal,
  inicioVidaSexualOptions,
  metodoAnticonceptivoOptions,
  riesgoObstetricoOptions,
  tipoLactanciaOptions,
} from "@/lib/gineco";
import { Field, inputClass, selectClass } from "./ClinicalFormFields";

function ErrorText({ value }: { value?: string }) {
  if (!value) return null;
  return <p className="mt-1 text-xs font-semibold normal-case tracking-normal text-[#B91C1C]">{value}</p>;
}

// Al cambiar la FUM se recalculan automáticamente la edad gestacional y la
// fecha probable de parto; si la FUM no es válida los derivados quedan vacíos.
export function gestacionConFum<T extends GestacionActual>(value: T, fum: string): T {
  const calculo = calcularEdadGestacional(fum);
  return {
    ...value,
    fumGestacion: fum,
    edadGestacionalSemanas: calculo.valido ? calculo.semanas : undefined,
    edadGestacionalDias: calculo.valido ? calculo.dias : undefined,
    fechaProbableParto: calculo.valido ? calculo.fechaProbableParto : "",
  };
}

export function gestacionConEstado<T extends GestacionActual>(
  value: T,
  gestaActual: GestacionActual["gestaActual"],
): T {
  if (gestaActual === "Sí") return { ...value, gestaActual };
  // Si ya no hay gestación, se limpian los campos dependientes para no guardar basura.
  return {
    ...value,
    gestaActual,
    fumGestacion: "",
    edadGestacionalSemanas: undefined,
    edadGestacionalDias: undefined,
    fechaProbableParto: "",
    controlesPrenatales: "",
    riesgoObstetrico: "",
    observacionesGestacion: "",
  };
}

export function lactanciaConEstado<T extends LactanciaActual>(
  value: T,
  lactanciaActual: LactanciaActual["lactanciaActual"],
): T {
  if (lactanciaActual === "Sí") return { ...value, lactanciaActual };
  return {
    ...value,
    lactanciaActual,
    tipoLactancia: "",
    edadLactante: "",
    observacionesLactancia: "",
  };
}

export function GestacionActualFields<T extends GestacionActual>({
  value,
  onChange,
  errorFum,
}: {
  value: T;
  onChange: (next: T) => void;
  errorFum?: string;
}) {
  const calculo = calcularEdadGestacional(value.fumGestacion ?? "");
  return (
    <>
      <Field label="¿Gesta actual?">
        <select
          value={value.gestaActual ?? ""}
          onChange={(event) =>
            onChange(gestacionConEstado(value, event.target.value as GestacionActual["gestaActual"]))
          }
          className={selectClass}
        >
          <option value="">Seleccione...</option>
          <option value="No">No</option>
          <option value="Sí">Sí</option>
          <option value="No sabe">No sabe</option>
        </select>
      </Field>
      {value.gestaActual === "Sí" && (
        <>
          <Field label="Fecha de última menstruación (FUM) *">
            <input
              type="date"
              max={hoyIsoLocal()}
              value={value.fumGestacion ?? ""}
              onChange={(event) => onChange(gestacionConFum(value, event.target.value))}
              className={inputClass}
            />
            <ErrorText value={calculo.error || errorFum} />
          </Field>
          <Field label="Edad gestacional automática">
            <input
              value={formatearEdadGestacional(value.edadGestacionalSemanas, value.edadGestacionalDias)}
              readOnly
              placeholder="Se calcula con la FUM"
              className={`${inputClass} bg-[#F8FBFD]`}
            />
          </Field>
          <Field label="Fecha probable de parto automática">
            <input
              type="date"
              value={value.fechaProbableParto ?? ""}
              readOnly
              className={`${inputClass} bg-[#F8FBFD]`}
            />
          </Field>
          <Field label="Número de controles prenatales">
            <input
              type="number"
              min="0"
              value={value.controlesPrenatales ?? ""}
              onChange={(event) => onChange({ ...value, controlesPrenatales: event.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Riesgo obstétrico">
            <select
              value={value.riesgoObstetrico ?? ""}
              onChange={(event) =>
                onChange({ ...value, riesgoObstetrico: event.target.value as GestacionActual["riesgoObstetrico"] })
              }
              className={selectClass}
            >
              <option value="">Seleccione...</option>
              {riesgoObstetricoOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </Field>
          <Field label="Observaciones de gestación actual">
            <input
              value={value.observacionesGestacion ?? ""}
              onChange={(event) => onChange({ ...value, observacionesGestacion: event.target.value })}
              className={inputClass}
            />
          </Field>
        </>
      )}
    </>
  );
}

export function LactanciaFields<T extends LactanciaActual>({
  value,
  onChange,
}: {
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <>
      <Field label="¿Lactancia actual?">
        <select
          value={value.lactanciaActual ?? ""}
          onChange={(event) =>
            onChange(lactanciaConEstado(value, event.target.value as LactanciaActual["lactanciaActual"]))
          }
          className={selectClass}
        >
          <option value="">Seleccione...</option>
          <option value="No">No</option>
          <option value="Sí">Sí</option>
        </select>
      </Field>
      {value.lactanciaActual === "Sí" && (
        <>
          <Field label="Tipo de lactancia">
            <select
              value={value.tipoLactancia ?? ""}
              onChange={(event) =>
                onChange({ ...value, tipoLactancia: event.target.value as LactanciaActual["tipoLactancia"] })
              }
              className={selectClass}
            >
              <option value="">Seleccione...</option>
              {tipoLactanciaOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </Field>
          <Field label="Edad del lactante (opcional)">
            <input
              value={value.edadLactante ?? ""}
              onChange={(event) => onChange({ ...value, edadLactante: event.target.value })}
              placeholder="Ej.: 4 meses"
              className={inputClass}
            />
          </Field>
          <Field label="Observaciones de lactancia (opcional)">
            <input
              value={value.observacionesLactancia ?? ""}
              onChange={(event) => onChange({ ...value, observacionesLactancia: event.target.value })}
              className={inputClass}
            />
          </Field>
        </>
      )}
    </>
  );
}

export function GinecoObstetricosStep({
  value,
  onChange,
  errorFum,
}: {
  value: AntecedentesGinecoObstetricos;
  onChange: (next: AntecedentesGinecoObstetricos) => void;
  errorFum?: string;
}) {
  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-md border border-[#D7E3EC] p-4">
        <h3 className="text-sm font-semibold text-[#0F2F44]">Antecedentes menstruales</h3>
        <div className="mt-3 grid gap-x-[18px] gap-y-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Menarquia (edad)">
            <input
              value={value.menarquia ?? ""}
              onChange={(event) => onChange({ ...value, menarquia: event.target.value })}
              placeholder="Ej.: 12 años"
              className={inputClass}
            />
          </Field>
          <Field label="Fecha de última menstruación (FUM)">
            <input
              type="date"
              max={hoyIsoLocal()}
              value={value.fum ?? ""}
              onChange={(event) => onChange({ ...value, fum: event.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Ciclo menstrual">
            <select
              value={value.cicloMenstrual ?? ""}
              onChange={(event) => onChange({ ...value, cicloMenstrual: event.target.value })}
              className={selectClass}
            >
              <option value="">Seleccione...</option>
              {cicloMenstrualOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </Field>
          <Field label="Duración del ciclo (días)">
            <input
              type="number"
              min="1"
              value={value.duracionCiclo ?? ""}
              onChange={(event) => onChange({ ...value, duracionCiclo: event.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Duración del sangrado (días)">
            <input
              type="number"
              min="1"
              value={value.duracionSangrado ?? ""}
              onChange={(event) => onChange({ ...value, duracionSangrado: event.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Dismenorrea">
            <select
              value={value.dismenorrea ?? ""}
              onChange={(event) => onChange({ ...value, dismenorrea: event.target.value })}
              className={selectClass}
            >
              <option value="">Seleccione...</option>
              <option value="No">No</option>
              <option value="Sí">Sí</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="rounded-md border border-[#D7E3EC] p-4">
        <h3 className="text-sm font-semibold text-[#0F2F44]">Vida sexual y anticoncepción</h3>
        <div className="mt-3 grid gap-x-[18px] gap-y-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Inicio de vida sexual">
            <select
              value={value.inicioVidaSexual ?? ""}
              onChange={(event) => onChange({ ...value, inicioVidaSexual: event.target.value })}
              className={selectClass}
            >
              <option value="">Seleccione...</option>
              {inicioVidaSexualOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </Field>
          <Field label="Método anticonceptivo">
            <select
              value={value.metodoAnticonceptivo ?? ""}
              onChange={(event) => onChange({ ...value, metodoAnticonceptivo: event.target.value })}
              className={selectClass}
            >
              <option value="">Seleccione...</option>
              {metodoAnticonceptivoOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </Field>
          <Field label="Antecedentes de ITS">
            <input
              value={value.antecedenteIts ?? ""}
              onChange={(event) => onChange({ ...value, antecedenteIts: event.target.value })}
              placeholder="No refiere / detalle"
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      <div className="rounded-md border border-[#D7E3EC] p-4">
        <h3 className="text-sm font-semibold text-[#0F2F44]">Antecedentes obstétricos</h3>
        <div className="mt-3 grid grid-cols-2 gap-x-[18px] gap-y-4 md:grid-cols-3 xl:grid-cols-5">
          {(
            [
              ["Gestas", "gestas"],
              ["Partos", "partos"],
              ["Cesáreas", "cesareas"],
              ["Abortos", "abortos"],
              ["Hijos vivos", "hijosVivos"],
            ] as const
          ).map(([label, key]) => (
            <Field key={key} label={label}>
              <input
                type="number"
                min="0"
                value={value[key] ?? ""}
                onChange={(event) => onChange({ ...value, [key]: event.target.value })}
                className={inputClass}
              />
            </Field>
          ))}
        </div>
        <div className="mt-4 grid gap-x-[18px] gap-y-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Fecha último Papanicolaou (opcional)">
            <input
              type="date"
              max={hoyIsoLocal()}
              value={value.ultimoPapanicolaou ?? ""}
              onChange={(event) => onChange({ ...value, ultimoPapanicolaou: event.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Fecha último control ginecológico (opcional)">
            <input
              type="date"
              max={hoyIsoLocal()}
              value={value.ultimoControlGinecologico ?? ""}
              onChange={(event) => onChange({ ...value, ultimoControlGinecologico: event.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Observaciones gineco-obstétricas">
            <input
              value={value.observacionesGinecoObstetricas ?? ""}
              onChange={(event) => onChange({ ...value, observacionesGinecoObstetricas: event.target.value })}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      <div className="rounded-md border border-[#D7E3EC] p-4">
        <h3 className="text-sm font-semibold text-[#0F2F44]">Gestación actual</h3>
        <div className="mt-3 grid gap-x-[18px] gap-y-4 md:grid-cols-2 xl:grid-cols-3">
          <GestacionActualFields value={value} onChange={onChange} errorFum={errorFum} />
        </div>
      </div>

      <div className="rounded-md border border-[#D7E3EC] p-4">
        <h3 className="text-sm font-semibold text-[#0F2F44]">Lactancia</h3>
        <div className="mt-3 grid gap-x-[18px] gap-y-4 md:grid-cols-2 xl:grid-cols-3">
          <LactanciaFields value={value} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}

export function CondicionGinecoSection({
  value,
  onChange,
  errorFum,
}: {
  value: CondicionGinecoAtencion;
  onChange: (next: CondicionGinecoAtencion) => void;
  errorFum?: string;
}) {
  return (
    <div className="grid gap-x-[18px] gap-y-4 md:grid-cols-2 xl:grid-cols-3">
      <GestacionActualFields value={value} onChange={onChange} errorFum={errorFum} />
      <LactanciaFields value={value} onChange={onChange} />
      <Field label="Observaciones">
        <input
          value={value.observaciones ?? ""}
          onChange={(event) => onChange({ ...value, observaciones: event.target.value })}
          className={inputClass}
        />
      </Field>
    </div>
  );
}
