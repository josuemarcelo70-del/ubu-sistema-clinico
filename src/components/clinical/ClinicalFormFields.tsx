"use client";

import { ciclos, facultades, getFacultadById, periodosAcademicos } from "@/lib/academic-catalogs";
import type { NivelAcademico, Paciente, TipoUsuario } from "@/types/clinical";

type FieldProps = {
  label: string;
  children: React.ReactNode;
};

export function Field({ label, children }: FieldProps) {
  return (
    <label className="space-y-1.5 text-[13px] font-semibold text-[#34495C]">
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

export function updateCatalogNames(values: Partial<Paciente>) {
  const facultad = getFacultadById(values.facultadId);
  const carrera = facultad?.carreras.find((item) => item.id === values.carreraId);
  const posgrado = facultad?.posgrados.find(
    (item) => item.id === values.programaPosgradoId,
  );
  const periodo = periodosAcademicos.find(
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
  const facultad = getFacultadById(values.facultadId);

  function changeTipoUsuario(next: TipoUsuario) {
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
      periodoAcademicoId: "",
      periodoAcademicoNombre: "",
      dependencia: "",
      cargo: "",
      institucionProcedencia: "",
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
        <select
          value={tipoUsuario}
          onChange={(event) => changeTipoUsuario(event.target.value as TipoUsuario)}
          className={selectClass}
        >
          <option value="estudiante">Estudiante</option>
          <option value="docente">Docente</option>
          <option value="administrativo">Administrativo</option>
          <option value="externo">Externo</option>
        </select>
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
            <select
              value={values.facultadId ?? ""}
              onChange={(event) =>
                onChange(
                  updateCatalogNames({
                    ...values,
                    facultadId: event.target.value,
                    carreraId: "",
                    programaPosgradoId: "",
                  }),
                )
              }
              className={selectClass}
            >
              <option value="">Seleccione...</option>
              {facultades.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </Field>
          {nivelAcademico === "pregrado" ? (
            <>
              <Field label="Carrera">
                <select
                  value={values.carreraId ?? ""}
                  onChange={(event) =>
                    onChange(updateCatalogNames({ ...values, carreraId: event.target.value }))
                  }
                  className={selectClass}
                >
                  <option value="">Seleccione...</option>
                  {facultad?.carreras.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Ciclo">
                <select
                  value={values.ciclo ?? ""}
                  onChange={(event) => onChange({ ciclo: event.target.value })}
                  className={selectClass}
                >
                  <option value="">Seleccione...</option>
                  {ciclos.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          ) : (
            <Field label="Programa posgrado">
              <select
                value={values.programaPosgradoId ?? ""}
                onChange={(event) =>
                  onChange(
                    updateCatalogNames({
                      ...values,
                      programaPosgradoId: event.target.value,
                    }),
                  )
                }
                className={selectClass}
              >
                <option value="">Seleccione...</option>
                {facultad?.posgrados.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Periodo académico">
            <select
              value={values.periodoAcademicoId ?? ""}
              onChange={(event) =>
                onChange(
                  updateCatalogNames({
                    ...values,
                    periodoAcademicoId: event.target.value,
                  }),
                )
              }
              className={selectClass}
            >
              <option value="">Seleccione...</option>
              {periodosAcademicos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}

      {tipoUsuario === "docente" && (
        <>
          <Field label="Facultad">
            <select
              value={values.facultadId ?? ""}
              onChange={(event) =>
                onChange(updateCatalogNames({ ...values, facultadId: event.target.value }))
              }
              className={selectClass}
            >
              <option value="">Seleccione...</option>
              {facultades.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Dependencia">
            <input
              value={values.dependencia ?? ""}
              onChange={(event) => onChange({ dependencia: event.target.value })}
              className={inputClass}
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

      {tipoUsuario === "administrativo" && (
        <>
          <Field label="Dependencia">
            <input
              value={values.dependencia ?? ""}
              onChange={(event) => onChange({ dependencia: event.target.value })}
              className={inputClass}
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

      {tipoUsuario === "externo" && (
        <Field label="Institución procedencia">
          <input
            value={values.institucionProcedencia ?? ""}
            onChange={(event) => onChange({ institucionProcedencia: event.target.value })}
            className={inputClass}
          />
        </Field>
      )}
    </>
  );
}
