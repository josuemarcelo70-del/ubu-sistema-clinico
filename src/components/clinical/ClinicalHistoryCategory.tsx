"use client";

import { memo, useMemo, useState } from "react";

import type { Paciente, TipoUsuario } from "@/types/clinical";
import { Field, inputClass, selectClass } from "./ClinicalFormFields";

export type CategoriaHc = "estudiantes" | "docentes" | "personal";

// Fila precalculada del archivo clínico: el componente padre construye estas
// filas con una sola lectura de localStorage para evitar lecturas por paciente.
export type HcRow = {
  paciente: Paciente;
  existsHc: boolean;
  fechaApertura: string;
  ultimaAtencion: string;
};

export const categoriaConfig: Record<
  CategoriaHc,
  {
    titulo: string;
    descripcion: string;
    tiposNuevo: Array<{ tipo: TipoUsuario; label: string }>;
  }
> = {
  estudiantes: {
    titulo: "Historias clínicas de estudiantes",
    descripcion: "Consulta, apertura y edición de historias clínicas de estudiantes.",
    tiposNuevo: [{ tipo: "estudiante", label: "Estudiante" }],
  },
  docentes: {
    titulo: "Historias clínicas de docentes",
    descripcion: "Consulta, apertura y edición de historias clínicas de docentes.",
    tiposNuevo: [{ tipo: "docente", label: "Docente" }],
  },
  personal: {
    titulo: "Historias clínicas de administrativos y trabajadores",
    descripcion:
      "Consulta, apertura y edición de historias clínicas de personal administrativo y trabajadores.",
    tiposNuevo: [
      { tipo: "administrativo", label: "Administrativo" },
      { tipo: "trabajador", label: "Trabajador" },
    ],
  },
};

export function categoriaDePaciente(paciente: Paciente): CategoriaHc {
  if (paciente.tipoUsuario === "estudiante") return "estudiantes";
  if (paciente.tipoUsuario === "docente") return "docentes";
  return "personal";
}

type Filtros = {
  q: string;
  sexo: string;
  estadoHc: "" | "abierta" | "sin";
  apertura: string;
  ultima: string;
  facultad: string;
  carrera: string;
  ciclo: string;
  periodo: string;
  dependencia: string;
  cargo: string;
};

const filtrosVacios: Filtros = {
  q: "",
  sexo: "",
  estadoHc: "",
  apertura: "",
  ultima: "",
  facultad: "",
  carrera: "",
  ciclo: "",
  periodo: "",
  dependencia: "",
  cargo: "",
};

const PAGE_SIZE = 20;

function carreraDe(paciente: Paciente) {
  return paciente.nivelAcademico === "posgrado"
    ? paciente.programaPosgradoNombre ?? ""
    : paciente.carreraNombre ?? "";
}

function uniqueSorted(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value?.trim())))].sort(
    (a, b) => a.localeCompare(b),
  );
}

function EstadoHcBadge({ existsHc }: { existsHc: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${
        existsHc ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FFE4E6] text-[#BE123C]"
      }`}
    >
      {existsHc ? "HC ABIERTA" : "SIN HISTORIA CLÍNICA"}
    </span>
  );
}

function AccionesFila({
  row,
  isAdmin,
  onAbrir,
  onEditar,
  onAperturar,
  onEliminar,
}: {
  row: HcRow;
  isAdmin: boolean;
  onAbrir: (paciente: Paciente) => void;
  onEditar: (paciente: Paciente) => void;
  onAperturar: (paciente: Paciente) => void;
  onEliminar: (paciente: Paciente) => void;
}) {
  if (!row.existsHc) {
    return (
      <button
        type="button"
        onClick={() => onAperturar(row.paciente)}
        className="ubu-btn ubu-btn-primary ubu-btn-sm"
      >
        Aperturar historia clínica
      </button>
    );
  }
  return (
    <>
      <button
        type="button"
        onClick={() => onAbrir(row.paciente)}
        className="ubu-btn ubu-btn-info ubu-btn-sm"
      >
        Abrir
      </button>
      <button
        type="button"
        onClick={() => onEditar(row.paciente)}
        className="ubu-btn ubu-btn-secondary ubu-btn-sm"
      >
        Editar
      </button>
      {isAdmin ? (
        <button
          type="button"
          onClick={() => onEliminar(row.paciente)}
          className="ubu-btn ubu-btn-sm border border-[#FCA5A5] text-[#D71920] hover:bg-[#FEF2F2]"
        >
          Eliminar
        </button>
      ) : (
        <button
          type="button"
          disabled
          title="Solo el administrador puede eliminar historias clínicas."
          className="ubu-btn ubu-btn-sm cursor-not-allowed border border-[#E2E8F0] text-[#94A3B8]"
        >
          Eliminar
        </button>
      )}
    </>
  );
}

export const ClinicalHistoryCategory = memo(function ClinicalHistoryCategory({
  categoria,
  rows,
  isAdmin,
  onVolver,
  onNueva,
  onAbrir,
  onEditar,
  onAperturar,
  onEliminar,
}: {
  categoria: CategoriaHc;
  rows: HcRow[];
  isAdmin: boolean;
  onVolver: () => void;
  onNueva: (tipo: TipoUsuario) => void;
  onAbrir: (paciente: Paciente) => void;
  onEditar: (paciente: Paciente) => void;
  onAperturar: (paciente: Paciente) => void;
  onEliminar: (paciente: Paciente) => void;
}) {
  const config = categoriaConfig[categoria];
  const [filtros, setFiltros] = useState<Filtros>(filtrosVacios);
  const [page, setPage] = useState(0);
  const [menuNuevaAbierto, setMenuNuevaAbierto] = useState(false);

  function setFiltro(changes: Partial<Filtros>) {
    setFiltros((current) => ({ ...current, ...changes }));
    setPage(0);
  }

  const hayFiltros = useMemo(
    () => Object.values(filtros).some((value) => value !== ""),
    [filtros],
  );

  // Opciones de los selectores derivadas de los propios registros para que
  // todo filtro tenga al menos una coincidencia posible.
  const opciones = useMemo(() => {
    const pacientes = rows.map((row) => row.paciente);
    return {
      facultades: uniqueSorted(
        pacientes.map((p) =>
          categoria === "docentes" ? p.facultadNombre || p.dependencia : p.facultadNombre,
        ),
      ),
      carreras: uniqueSorted(pacientes.map((p) => carreraDe(p))),
      ciclos: uniqueSorted(pacientes.map((p) => p.ciclo)),
      periodos: uniqueSorted(pacientes.map((p) => p.periodoAcademicoNombre)),
      dependencias: uniqueSorted(pacientes.map((p) => p.dependencia)),
      cargos: uniqueSorted(pacientes.map((p) => p.cargo)),
    };
  }, [categoria, rows]);

  const filtradas = useMemo(() => {
    const term = filtros.q.trim().toLowerCase();
    return rows.filter(({ paciente, existsHc, fechaApertura, ultimaAtencion }) => {
      if (term) {
        const texto = [
          paciente.cedula,
          paciente.nombres,
          paciente.apellidos,
          paciente.historiaClinicaNumero,
          paciente.historiaClinica,
        ]
          .join(" ")
          .toLowerCase();
        if (!texto.includes(term)) return false;
      }
      if (filtros.sexo && paciente.sexo !== filtros.sexo) return false;
      if (filtros.estadoHc === "abierta" && !existsHc) return false;
      if (filtros.estadoHc === "sin" && existsHc) return false;
      if (filtros.apertura && fechaApertura !== filtros.apertura) return false;
      if (filtros.ultima && ultimaAtencion !== filtros.ultima) return false;
      if (categoria === "estudiantes") {
        if (filtros.facultad && paciente.facultadNombre !== filtros.facultad) return false;
        if (filtros.carrera && carreraDe(paciente) !== filtros.carrera) return false;
        if (filtros.ciclo && paciente.ciclo !== filtros.ciclo) return false;
        if (filtros.periodo && paciente.periodoAcademicoNombre !== filtros.periodo) return false;
      }
      if (categoria === "docentes") {
        if (
          filtros.facultad &&
          (paciente.facultadNombre || paciente.dependencia) !== filtros.facultad
        ) {
          return false;
        }
        if (filtros.cargo && paciente.cargo !== filtros.cargo) return false;
      }
      if (categoria === "personal") {
        if (filtros.dependencia && paciente.dependencia !== filtros.dependencia) return false;
        if (filtros.cargo && paciente.cargo !== filtros.cargo) return false;
      }
      return true;
    });
  }, [categoria, filtros, rows]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE));
  const paginaActual = Math.min(page, totalPaginas - 1);
  const visibles = useMemo(
    () => filtradas.slice(paginaActual * PAGE_SIZE, (paginaActual + 1) * PAGE_SIZE),
    [filtradas, paginaActual],
  );

  function celdas(paciente: Paciente): [string, string] {
    if (categoria === "estudiantes") {
      return [
        [paciente.facultadNombre, carreraDe(paciente)].filter(Boolean).join(" / "),
        [
          paciente.nivelAcademico === "posgrado" ? "Posgrado" : paciente.ciclo,
          paciente.periodoAcademicoNombre,
        ]
          .filter(Boolean)
          .join(" / "),
      ];
    }
    if (categoria === "docentes") {
      return [
        [paciente.facultadNombre, paciente.dependencia].filter(Boolean).join(" / "),
        paciente.cargo ?? "",
      ];
    }
    return [paciente.dependencia ?? "", paciente.cargo ?? ""];
  }

  const encabezados: [string, string] =
    categoria === "estudiantes"
      ? ["Facultad / carrera", "Ciclo / periodo académico"]
      : categoria === "docentes"
        ? ["Facultad / dependencia", "Cargo o área"]
        : ["Dependencia", "Cargo / área"];

  const acciones = { isAdmin, onAbrir, onEditar, onAperturar, onEliminar };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#D7E3EC] bg-white shadow-sm">
        <div className="h-1 bg-[linear-gradient(90deg,#D71920_0%,#D71920_26%,#005B84_26%,#005B84_100%)]" />
        <div className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#005B84]">
              Historia clínica
            </p>
            <h1 className="mt-1 text-2xl font-black text-[#082F49]">{config.titulo}</h1>
            <p className="mt-1 text-sm font-semibold text-[#64748B]">{config.descripcion}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onVolver}
              className="rounded-md border border-[#D7E3EC] px-3 py-2 text-sm font-bold text-[#082F49] transition hover:border-[#005B84] hover:text-[#005B84]"
            >
              Volver
            </button>
            {config.tiposNuevo.length === 1 ? (
              <button
                type="button"
                onClick={() => onNueva(config.tiposNuevo[0].tipo)}
                className="rounded-md bg-[#062B49] px-3 py-2 text-sm font-black text-white transition hover:bg-[#005B84]"
              >
                Añadir historia clínica
              </button>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuNuevaAbierto((value) => !value)}
                  className="w-full rounded-md bg-[#062B49] px-3 py-2 text-sm font-black text-white transition hover:bg-[#005B84] sm:w-auto"
                >
                  Añadir historia clínica ▾
                </button>
                {menuNuevaAbierto && (
                  <div className="absolute right-0 z-20 mt-1 w-full min-w-44 overflow-hidden rounded-md border border-[#D7E3EC] bg-white shadow-lg sm:w-auto">
                    {config.tiposNuevo.map((item) => (
                      <button
                        key={item.tipo}
                        type="button"
                        onClick={() => {
                          setMenuNuevaAbierto(false);
                          onNueva(item.tipo);
                        }}
                        className="block w-full px-3 py-2 text-left text-sm font-bold text-[#082F49] transition hover:bg-[#EEF6FA] hover:text-[#005B84]"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="ubu-card overflow-hidden">
        <div className="border-b border-[#D7E3EC] p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="md:col-span-2">
              <Field label="Buscar">
                <input
                  value={filtros.q}
                  onChange={(event) => setFiltro({ q: event.target.value })}
                  placeholder="Cédula, nombres, apellidos o número de historia clínica"
                  className={inputClass}
                />
              </Field>
            </div>
            {categoria === "estudiantes" && (
              <>
                <Field label="Facultad">
                  <select
                    value={filtros.facultad}
                    onChange={(event) => setFiltro({ facultad: event.target.value })}
                    className={selectClass}
                  >
                    <option value="">Todas</option>
                    {opciones.facultades.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Carrera / programa">
                  <select
                    value={filtros.carrera}
                    onChange={(event) => setFiltro({ carrera: event.target.value })}
                    className={selectClass}
                  >
                    <option value="">Todas</option>
                    {opciones.carreras.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Ciclo">
                  <select
                    value={filtros.ciclo}
                    onChange={(event) => setFiltro({ ciclo: event.target.value })}
                    className={selectClass}
                  >
                    <option value="">Todos</option>
                    {opciones.ciclos.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Periodo académico">
                  <select
                    value={filtros.periodo}
                    onChange={(event) => setFiltro({ periodo: event.target.value })}
                    className={selectClass}
                  >
                    <option value="">Todos</option>
                    {opciones.periodos.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </Field>
              </>
            )}
            {categoria === "docentes" && (
              <>
                <Field label="Facultad / dependencia">
                  <select
                    value={filtros.facultad}
                    onChange={(event) => setFiltro({ facultad: event.target.value })}
                    className={selectClass}
                  >
                    <option value="">Todas</option>
                    {opciones.facultades.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Cargo o área">
                  <select
                    value={filtros.cargo}
                    onChange={(event) => setFiltro({ cargo: event.target.value })}
                    className={selectClass}
                  >
                    <option value="">Todos</option>
                    {opciones.cargos.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </Field>
              </>
            )}
            {categoria === "personal" && (
              <>
                <Field label="Dependencia">
                  <select
                    value={filtros.dependencia}
                    onChange={(event) => setFiltro({ dependencia: event.target.value })}
                    className={selectClass}
                  >
                    <option value="">Todas</option>
                    {opciones.dependencias.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Cargo / área">
                  <select
                    value={filtros.cargo}
                    onChange={(event) => setFiltro({ cargo: event.target.value })}
                    className={selectClass}
                  >
                    <option value="">Todos</option>
                    {opciones.cargos.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </Field>
              </>
            )}
            <Field label="Sexo">
              <select
                value={filtros.sexo}
                onChange={(event) => setFiltro({ sexo: event.target.value })}
                className={selectClass}
              >
                <option value="">Todos</option>
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
                <option value="Otro">Otro</option>
              </select>
            </Field>
            <Field label="Estado de historia clínica">
              <select
                value={filtros.estadoHc}
                onChange={(event) =>
                  setFiltro({ estadoHc: event.target.value as Filtros["estadoHc"] })
                }
                className={selectClass}
              >
                <option value="">Todos</option>
                <option value="abierta">HC abierta</option>
                <option value="sin">Sin historia clínica</option>
              </select>
            </Field>
            <Field label="Fecha de apertura">
              <input
                type="date"
                value={filtros.apertura}
                onChange={(event) => setFiltro({ apertura: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Última atención">
              <input
                type="date"
                value={filtros.ultima}
                onChange={(event) => setFiltro({ ultima: event.target.value })}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-[#64748B]">
              {filtradas.length === 1
                ? "1 historia clínica encontrada"
                : `${filtradas.length} historias clínicas encontradas`}
            </p>
            {hayFiltros && (
              <button
                type="button"
                onClick={() => {
                  setFiltros(filtrosVacios);
                  setPage(0);
                }}
                className="rounded-md border border-[#D7E3EC] px-3 py-1.5 text-xs font-bold text-[#005B84] transition hover:border-[#005B84]"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Tabla en pantallas medianas y grandes */}
        <div className="hidden overflow-x-auto md:block">
          <table className="ubu-table min-w-[1080px]">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Cédula</th>
                <th>Historia clínica</th>
                <th>Edad / sexo</th>
                <th>{encabezados[0]}</th>
                <th>{encabezados[1]}</th>
                <th>Apertura / Última atención</th>
                <th>Estado HC</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((row) => {
                const { paciente } = row;
                const [celdaA, celdaB] = celdas(paciente);
                return (
                  <tr key={paciente.id}>
                    <td className="font-black">
                      {paciente.apellidos} {paciente.nombres}
                    </td>
                    <td className="text-[#64748B]">{paciente.cedula}</td>
                    <td className="text-[#64748B]">
                      {paciente.historiaClinicaNumero || paciente.cedula}
                    </td>
                    <td className="text-[#64748B]">
                      {[paciente.edad, paciente.sexo].filter(Boolean).join(" / ") || "No registra"}
                    </td>
                    <td className="max-w-[240px] text-[#64748B]">{celdaA || "No registra"}</td>
                    <td className="max-w-[200px] text-[#64748B]">{celdaB || "No registra"}</td>
                    <td className="text-[#64748B]">
                      <div>{row.fechaApertura || "Sin apertura"}</div>
                      <div className="mt-1 text-xs">{row.ultimaAtencion || "Sin atenciones"}</div>
                    </td>
                    <td>
                      <EstadoHcBadge existsHc={row.existsHc} />
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <AccionesFila row={row} {...acciones} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm font-bold text-[#64748B]">
                    No se encontraron historias clínicas con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Tarjetas en pantallas pequeñas */}
        <div className="space-y-3 p-4 md:hidden">
          {visibles.map((row) => {
            const { paciente } = row;
            const [celdaA, celdaB] = celdas(paciente);
            return (
              <article
                key={paciente.id}
                className="rounded-lg border border-[#D7E3EC] bg-[#F8FBFD] p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-[#082F49]">
                      {paciente.apellidos} {paciente.nombres}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-[#64748B]">
                      Cédula {paciente.cedula || "No registra"} · HC{" "}
                      {paciente.historiaClinicaNumero || paciente.cedula || "No registra"}
                    </p>
                  </div>
                  <EstadoHcBadge existsHc={row.existsHc} />
                </div>
                <dl className="mt-2 space-y-1 text-xs font-semibold text-[#52677A]">
                  <div>
                    Edad / sexo:{" "}
                    {[paciente.edad, paciente.sexo].filter(Boolean).join(" / ") || "No registra"}
                  </div>
                  <div>
                    {encabezados[0]}: {celdaA || "No registra"}
                  </div>
                  <div>
                    {encabezados[1]}: {celdaB || "No registra"}
                  </div>
                  <div>
                    Apertura: {row.fechaApertura || "Sin apertura"} · Última atención:{" "}
                    {row.ultimaAtencion || "Sin atenciones"}
                  </div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-2">
                  <AccionesFila row={row} {...acciones} />
                </div>
              </article>
            );
          })}
          {visibles.length === 0 && (
            <p className="px-2 py-6 text-center text-sm font-bold text-[#64748B]">
              No se encontraron historias clínicas con los filtros seleccionados.
            </p>
          )}
        </div>

        {totalPaginas > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#D7E3EC] bg-[#F8FBFD] px-4 py-2.5">
            <p className="text-xs font-semibold text-[#64748B]">
              Página {paginaActual + 1} de {totalPaginas}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={paginaActual === 0}
                onClick={() => setPage(paginaActual - 1)}
                className="rounded-md border border-[#D7E3EC] px-3 py-1.5 text-xs font-bold text-[#082F49] transition enabled:hover:border-[#005B84] enabled:hover:text-[#005B84] disabled:cursor-not-allowed disabled:text-[#94A3B8]"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={paginaActual >= totalPaginas - 1}
                onClick={() => setPage(paginaActual + 1)}
                className="rounded-md border border-[#D7E3EC] px-3 py-1.5 text-xs font-bold text-[#082F49] transition enabled:hover:border-[#005B84] enabled:hover:text-[#005B84] disabled:cursor-not-allowed disabled:text-[#94A3B8]"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {!isAdmin && (
          <div className="border-t border-[#D7E3EC] bg-[#F8FBFD] px-4 py-2.5 text-xs font-semibold text-[#64748B]">
            Solo el administrador puede eliminar historias clínicas.
          </div>
        )}
      </div>
    </div>
  );
});
