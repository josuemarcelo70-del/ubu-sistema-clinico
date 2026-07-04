"use client";

import { useEffect } from "react";

import {
  getFacultadById,
  getPeriodoAcademicoActivo,
  obtenerCiclosActivos,
  obtenerDependenciasActivas,
  obtenerFacultadesActivas,
  obtenerPeriodosAcademicosActivos,
  obtenerPosgradosPorFacultad,
} from "@/lib/academic-catalogs";
import type { CoberturaAtencion, NivelAcademico, Paciente, TipoUsuario } from "@/types/clinical";
import { AutocompleteField, type AutocompleteOption } from "./AutocompleteField";

type FieldProps = {
  label: string;
  children: React.ReactNode;
};

export function Field({ label, children }: FieldProps) {
  return (
    <label className="block min-w-0 space-y-1.5 text-[13px] font-semibold text-[#34495C]">
      <span>
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "min-h-11 w-full rounded-[10px] border border-[#D7E3EC] bg-white px-3 py-2 text-sm font-medium text-[#0F2F44] outline-none transition placeholder:text-[#94A3B8] focus:border-[#005B84] focus:ring-2 focus:ring-[#005B84]/15 disabled:cursor-not-allowed disabled:bg-[#F1F5F9] disabled:text-[#64748B]";

export const selectClass = inputClass;

const tipoUsuarioOptions: AutocompleteOption[] = [
  { value: "estudiante", label: "Estudiante" },
  { value: "docente", label: "Docente" },
  { value: "administrativo", label: "Administrativo" },
  { value: "trabajador", label: "Trabajador" },
];

const coberturaOptions: Array<{ value: CoberturaAtencion; label: string }> = [
  { value: "bienestar_universitario", label: "Bienestar Universitario" },
  { value: "iess", label: "IESS" },
];

export function updateCatalogNames(values: Partial<Paciente>) {
  const facultad = getFacultadById(values.facultadId);
  const carrera = facultad?.carreras.find((item) => item.id === values.carreraId);
  const posgrado = facultad?.posgrados.find(
    (item) => item.id === values.programaPosgradoId,
  );
  const periodo = obtenerPeriodosAcademicosActivos().find(
    (item) => item.id === values.periodoAcademicoId,
  );

  return {
    ...values,
    facultadNombre: facultad?.nombre ?? values.facultadNombre,
    carreraNombre: carrera?.nombre ?? values.carreraNombre,
    programaPosgradoNombre: posgrado?.nombre ?? values.programaPosgradoNombre,
    periodoAcademicoNombre: periodo?.nombre ?? values.periodoAcademicoNombre,
  };
}

export function DynamicAcademicFields({
  values,
  onChange,
}: {
  values: Partial<Paciente>;
  onChange: (changes: Partial<Paciente>) => void;
}) {
  const tipoUsuario = values.tipoUsuario ?? "estudiante";
  const nivelAcademico = values.nivelAcademico ?? "pregrado";
  const facultades = obtenerFacultadesActivas();
  const ciclos = obtenerCiclosActivos();
  const periodosAcademicos = obtenerPeriodosAcademicosActivos();
  const dependencias = obtenerDependenciasActivas();
  const facultad = getFacultadById(values.facultadId);
  const carrerasActivas = (facultad?.carreras ?? []).filter((carrera) => carrera.activo);
  const posgradosActivos = obtenerPosgradosPorFacultad(values.facultadId);

  const facultadOptions: AutocompleteOption[] = facultades.map((item) => ({
    value: item.id,
    label: item.nombre,
  }));
  const carreraOptions: AutocompleteOption[] = carrerasActivas.map((item) => ({
    value: item.id,
    label: item.nombre,
  }));
  const posgradoOptions: AutocompleteOption[] = posgradosActivos.map((item) => ({
    value: item.id,
    label: item.nombre,
  }));
  const cicloOptions: AutocompleteOption[] = ciclos.map((item) => ({ value: item.nombre, label: item.nombre }));
  const periodoOptions: AutocompleteOption[] = periodosAcademicos.map((item) => ({
    value: item.id,
    label: item.nombre,
  }));
  const dependenciaOptions: AutocompleteOption[] = dependencias.map((item) => ({
    value: item.nombre,
    label: item.nombre,
  }));

  const periodoActivoHoy = getPeriodoAcademicoActivo();

  // El periodo académico se recalcula según la fecha actual al abrir el formulario,
  // sin depender solo del valor previamente guardado en la historia clínica.
  useEffect(() => {
    if ((values.tipoUsuario ?? "estudiante") === "estudiante" && periodoActivoHoy) {
      onChange({
        periodoAcademicoId: periodoActivoHoy.id,
        periodoAcademicoNombre: periodoActivoHoy.nombre,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeTipoUsuario(next: TipoUsuario) {
    const nextPeriodo = next === "estudiante" ? getPeriodoAcademicoActivo() : undefined;
    onChange({
      tipoUsuario: next,
      nivelAcademico: next === "estudiante" ? "pregrado" : undefined,
      facultadId: "",
      facultadNombre: "",
      carreraId: "",
      carreraNombre: "",
      programaPosgradoId: "",
      programaPosgradoNombre: "",
      ciclo: "",
      periodoAcademicoId: nextPeriodo?.id ?? "",
      periodoAcademicoNombre: nextPeriodo?.nombre ?? "",
      dependencia: "",
      cargo: "",
      coberturaAtencion: undefined,
    });
  }

  function changeNivelAcademico(next: NivelAcademico) {
    onChange({
      nivelAcademico: next,
      carreraId: "",
      carreraNombre: "",
      programaPosgradoId: "",
      programaPosgradoNombre: "",
      ciclo: "",
    });
  }

  return (
    <>
      <Field label="Tipo de usuario">
        <AutocompleteField
          value={tipoUsuarioOptions.find((option) => option.value === tipoUsuario)?.label ?? ""}
          options={tipoUsuarioOptions}
          onChange={(value, option) => changeTipoUsuario((option?.value ?? value) as TipoUsuario)}
        />
      </Field>

      {tipoUsuario === "estudiante" && (
        <>
          <Field label="Nivel académico">
            <select
              value={nivelAcademico}
              onChange={(event) =>
                changeNivelAcademico(event.target.value as NivelAcademico)
              }
              className={selectClass}
            >
              <option value="pregrado">Pregrado</option>
              <option value="posgrado">Posgrado</option>
            </select>
          </Field>
          <Field label="Facultad">
            <AutocompleteField
              value={values.facultadNombre ?? ""}
              options={facultadOptions}
              onChange={(value, option) =>
                onChange(
                  updateCatalogNames({
                    ...values,
                    facultadId: option?.value ?? "",
                    facultadNombre: option?.label ?? value,
                    carreraId: "",
                    carreraNombre: "",
                    programaPosgradoId: "",
                    programaPosgradoNombre: "",
                  }),
                )
              }
            />
          </Field>
          {nivelAcademico === "pregrado" ? (
            <>
              <Field label="Carrera">
                <AutocompleteField
                  value={values.carreraNombre ?? ""}
                  options={carreraOptions}
                  disabled={!values.facultadId}
                  onChange={(value, option) =>
                    onChange(
                      updateCatalogNames({
                        ...values,
                        carreraId: option?.value ?? "",
                        carreraNombre: option?.label ?? value,
                      }),
                    )
                  }
                />
                {values.facultadId && carreraOptions.length === 0 && (
                  <span className="mt-1 block text-xs font-medium text-[#94A3B8]">
                    No hay carreras configuradas para esta facultad.
                  </span>
                )}
              </Field>
              <Field label="Ciclo">
                <AutocompleteField
                  value={values.ciclo ?? ""}
                  options={cicloOptions}
                  onChange={(value, option) => onChange({ ciclo: option?.label ?? value })}
                />
              </Field>
            </>
          ) : (
            <Field label="Programa posgrado">
              <AutocompleteField
                value={values.programaPosgradoNombre ?? ""}
                options={posgradoOptions}
                disabled={!values.facultadId}
                onChange={(value, option) =>
                  onChange(
                    updateCatalogNames({
                      ...values,
                      programaPosgradoId: option?.value ?? "",
                      programaPosgradoNombre: option?.label ?? value,
                    }),
                  )
                }
              />
            </Field>
          )}
          <Field label="Periodo académico">
            <AutocompleteField
              value={values.periodoAcademicoNombre ?? ""}
              options={periodoOptions}
              onChange={(value, option) =>
                onChange(
                  updateCatalogNames({
                    ...values,
                    periodoAcademicoId: option?.value ?? "",
                    periodoAcademicoNombre: option?.label ?? value,
                  }),
                )
              }
            />
            {!values.periodoAcademicoNombre && !periodoActivoHoy && (
              <span className="mt-1 block text-xs font-medium text-[#DC2626]">
                Sin periodo académico configurado para la fecha actual.
              </span>
            )}
          </Field>
        </>
      )}

      {(tipoUsuario === "docente" || tipoUsuario === "administrativo" || tipoUsuario === "trabajador") && (
        <>
          <Field label="Cobertura de atención">
            <select
              value={values.coberturaAtencion ?? ""}
              onChange={(event) =>
                onChange({ coberturaAtencion: (event.target.value || undefined) as CoberturaAtencion | undefined })
              }
              className={selectClass}
            >
              <option value="">Seleccione...</option>
              {coberturaOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
          {tipoUsuario === "docente" && (
            <Field label="Facultad">
              <AutocompleteField
                value={values.facultadNombre ?? ""}
                options={facultadOptions}
                onChange={(value, option) =>
                  onChange(updateCatalogNames({ ...values, facultadId: option?.value ?? "", facultadNombre: option?.label ?? value }))
                }
              />
            </Field>
          )}
          <Field label="Dependencia / área">
            <AutocompleteField
              value={values.dependencia ?? ""}
              options={dependenciaOptions}
              onChange={(value) => onChange({ dependencia: value })}
            />
          </Field>
          <Field label="Cargo">
            <input
              value={values.cargo ?? ""}
              onChange={(event) => onChange({ cargo: event.target.value })}
              className={inputClass}
            />
          </Field>
        </>
      )}
    </>
  );
}
