"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import {
  createId,
  eliminarHistoriaClinicaCompleta,
  obtenerAtenciones,
  obtenerHistoriasClinicas,
  obtenerPacientes,
} from "@/lib/clinical-storage";
import { SIMULATED_SESSION_KEY, type SimulatedSession } from "@/lib/mock-users";
import type { HistoriaClinica, Paciente, TipoUsuario } from "@/types/clinical";
import {
  categoriaConfig,
  categoriaDePaciente,
  ClinicalHistoryCategory,
  type CategoriaHc,
  type HcRow,
} from "./ClinicalHistoryCategory";
import { ClinicalHistoryDetail } from "./ClinicalHistoryDetail";

// El modal de apertura/edición vive en MedicineQueue junto con el flujo de
// atención (módulos grandes). Se carga bajo demanda para que abrir el módulo
// Historia clínica no descargue todo ese código de entrada.
const HistoriaClinicaModal = dynamic(
  () => import("./MedicineQueue").then((mod) => mod.HistoriaClinicaModal),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#062B49]/45">
        <div className="rounded-lg border border-[#D7E3EC] bg-white px-5 py-3 text-sm font-bold text-[#005B84] shadow-lg">
          Cargando formulario…
        </div>
      </div>
    ),
  },
);

// Solo el rol administrador puede borrar historias clínicas completas; el
// resto de roles ve la acción deshabilitada.
function subscribeToSession(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function isAdminSnapshot() {
  try {
    const session = JSON.parse(
      window.localStorage.getItem(SIMULATED_SESSION_KEY) || "{}",
    ) as Partial<SimulatedSession>;
    return (session.roles ?? []).includes("admin");
  } catch {
    return false;
  }
}

// Paciente vacío para aperturar una historia clínica desde cero con el tipo
// de usuario de la categoría activa. Solo se persiste al guardar el modal.
function nuevoPacienteBase(tipoUsuario: TipoUsuario): Paciente {
  const now = new Date().toISOString();
  return {
    id: createId("pac"),
    cedula: "",
    nombres: "",
    apellidos: "",
    sexo: "",
    fechaNacimiento: "",
    edad: "",
    telefono: "",
    correo: "",
    correoInstitucional: "",
    direccion: "",
    tipoUsuario,
    nivelAcademico: tipoUsuario === "estudiante" ? "pregrado" : undefined,
    fechaCreacion: now,
    fechaActualizacion: now,
  };
}

// Una sola lectura de localStorage por actualización: se indexan historias y
// atenciones en mapas para no repetir JSON.parse por cada paciente.
function construirFilas(): Record<CategoriaHc, HcRow[]> {
  const historiaPorPaciente = new Map<string, HistoriaClinica>();
  const historiaPorNumero = new Map<string, HistoriaClinica>();
  for (const historia of obtenerHistoriasClinicas()) {
    historiaPorPaciente.set(historia.pacienteId, historia);
    historiaPorNumero.set(historia.numeroHistoriaClinica.trim().toLowerCase(), historia);
  }

  const ultimaAtencionPorPaciente = new Map<string, string>();
  for (const atencion of obtenerAtenciones()) {
    if (atencion.estado !== "finalizada") continue;
    const fecha = atencion.fechaAtencion || atencion.fechaFinalizacion || atencion.fechaInicio || "";
    if (fecha > (ultimaAtencionPorPaciente.get(atencion.pacienteId) ?? "")) {
      ultimaAtencionPorPaciente.set(atencion.pacienteId, fecha);
    }
  }

  const porCategoria: Record<CategoriaHc, HcRow[]> = {
    estudiantes: [],
    docentes: [],
    personal: [],
  };
  for (const paciente of obtenerPacientes()) {
    const cedula = paciente.cedula?.trim().toLowerCase() ?? "";
    const historia =
      historiaPorPaciente.get(paciente.id) ??
      (cedula ? historiaPorNumero.get(cedula) : undefined);
    porCategoria[categoriaDePaciente(paciente)].push({
      paciente,
      existsHc: Boolean(cedula) && Boolean(historia),
      fechaApertura: (historia?.fechaApertura || paciente.fechaAperturaHistoriaClinica || "").slice(0, 10),
      ultimaAtencion: (ultimaAtencionPorPaciente.get(paciente.id) ?? "").slice(0, 10),
    });
  }
  for (const filas of Object.values(porCategoria)) {
    filas.sort((a, b) =>
      `${a.paciente.apellidos} ${a.paciente.nombres}`.localeCompare(
        `${b.paciente.apellidos} ${b.paciente.nombres}`,
      ),
    );
  }
  return porCategoria;
}

const categoriaIcons: Record<CategoriaHc, React.ReactNode> = {
  estudiantes: (
    <>
      <path d="M12 4 2.5 8.5 12 13l9.5-4.5z" />
      <path d="M6 10.5V16c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5v-5.5" />
      <path d="M21.5 8.5V14" />
    </>
  ),
  docentes: (
    <>
      <path d="M3 4h18v12H3z" />
      <path d="M7 20h10" />
      <path d="M12 16v4" />
      <path d="M7 8h6" />
      <path d="M7 11.5h4" />
    </>
  ),
  personal: (
    <>
      <path d="M4 8h16v12H4z" />
      <path d="M9 8V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V8" />
      <path d="M4 13h16" />
      <path d="M12 12v2.5" />
    </>
  ),
};

// Módulo oficial de gestión clínica del paciente. La vista principal muestra
// tarjetas de acceso por tipo de usuario; cada tarjeta abre el archivo de esa
// categoría. La atención médica se inicia desde "Atenciones pendientes".
export function ClinicalHistory({ onBack }: { onBack: () => void }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [categoria, setCategoria] = useState<CategoriaHc | null>(null);
  const [aperturaTarget, setAperturaTarget] = useState<Paciente>();
  const [editTarget, setEditTarget] = useState<Paciente>();
  const [detailTarget, setDetailTarget] = useState<Paciente>();
  const [message, setMessage] = useState("");
  const isAdmin = useSyncExternalStore(subscribeToSession, isAdminSnapshot, () => false);

  useEffect(() => {
    function handleUpdate() {
      setRefreshKey((value) => value + 1);
    }
    window.addEventListener("ubu-clinical-storage-updated", handleUpdate);
    return () => window.removeEventListener("ubu-clinical-storage-updated", handleUpdate);
  }, []);

  const filasPorCategoria = useMemo(() => {
    void refreshKey;
    return construirFilas();
  }, [refreshKey]);

  const abrirCategoria = useCallback((next: CategoriaHc) => {
    setCategoria(next);
    setMessage("");
  }, []);

  const volverATarjetas = useCallback(() => {
    setCategoria(null);
    setMessage("");
  }, []);

  const nuevaHistoria = useCallback((tipo: TipoUsuario) => {
    setAperturaTarget(nuevoPacienteBase(tipo));
  }, []);

  const abrirDetalle = useCallback((paciente: Paciente) => setDetailTarget(paciente), []);
  const editarHistoria = useCallback((paciente: Paciente) => setEditTarget(paciente), []);
  const aperturarHistoria = useCallback((paciente: Paciente) => setAperturaTarget(paciente), []);

  const eliminarHistoria = useCallback(
    (paciente: Paciente) => {
      if (!isAdmin) return;
      const ok = window.confirm(
        "Esta acción eliminará todo el contenido de la historia clínica. ¿Está seguro de continuar?",
      );
      if (!ok) return;
      const palabra = window.prompt(
        'Confirmación final: escriba "ELIMINAR" para borrar todo el contenido de la historia clínica.',
      );
      if ((palabra ?? "").trim().toUpperCase() !== "ELIMINAR") {
        setMessage("Eliminación cancelada: la palabra de confirmación no coincide.");
        return;
      }
      eliminarHistoriaClinicaCompleta(paciente.id);
      setMessage(
        `Historia clínica de ${paciente.apellidos} ${paciente.nombres} eliminada por el administrador.`,
      );
      setRefreshKey((value) => value + 1);
    },
    [isAdmin],
  );

  return (
    <section className="dashboard-fade mx-auto max-w-7xl space-y-4">
      {!categoria && (
        <div className="rounded-lg border border-[#D7E3EC] bg-white shadow-sm">
          <div className="h-1 bg-[linear-gradient(90deg,#D71920_0%,#D71920_26%,#005B84_26%,#005B84_100%)]" />
          <div className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#005B84]">
                Medicina general
              </p>
              <h1 className="mt-1 text-2xl font-black text-[#082F49]">Historia clínica</h1>
              <p className="mt-1 text-sm font-semibold text-[#64748B]">
                Archivo clínico: consulta, apertura y edición de historias clínicas.
              </p>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="w-fit rounded-md border border-[#D7E3EC] px-3 py-2 text-sm font-bold text-[#082F49] transition hover:border-[#005B84] hover:text-[#005B84]"
            >
              Volver
            </button>
          </div>
        </div>
      )}

      {message && (
        <div className="rounded-md border border-[#BFD2DE] bg-[#EEF6FA] px-4 py-3 text-sm font-bold text-[#005B84]">
          {message}
        </div>
      )}

      {!categoria && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(Object.keys(categoriaConfig) as CategoriaHc[]).map((key) => {
            const config = categoriaConfig[key];
            const filas = filasPorCategoria[key];
            const abiertas = filas.filter((fila) => fila.existsHc).length;
            return (
              <button
                key={key}
                type="button"
                onClick={() => abrirCategoria(key)}
                className="group flex min-h-[168px] flex-col overflow-hidden rounded-lg border border-[#D7E3EC] bg-white text-left shadow-[0_8px_22px_rgba(8,47,73,0.055)] transition hover:-translate-y-0.5 hover:border-[#BFD2DE] hover:shadow-[0_16px_30px_rgba(8,47,73,0.1)] focus:outline-none focus:ring-2 focus:ring-[#005B84]/20"
              >
                <div className="h-0.5 bg-[linear-gradient(90deg,#D71920_0%,#D71920_30%,#005B84_30%,#E5EEF4_30%,#E5EEF4_100%)]" />
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#EEF6FA] text-[#005B84] ring-1 ring-[#D7E3EC] transition group-hover:bg-[#005B84] group-hover:text-white">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                        aria-hidden
                      >
                        {categoriaIcons[key]}
                      </svg>
                    </span>
                    <span className="rounded bg-[#F5F8FB] px-2 py-0.5 text-[10px] font-bold text-[#062B49] ring-1 ring-[#D7E3EC]">
                      {abiertas === 1 ? "1 HC abierta" : `${abiertas} HC abiertas`}
                    </span>
                  </div>
                  <h2 className="mt-3 text-[15px] font-bold leading-snug text-[#082F49]">
                    {config.titulo}
                  </h2>
                  <p className="mt-1.5 text-[13px] leading-5 text-[#64748B]">{config.descripcion}</p>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="text-xs font-semibold text-[#64748B]">
                      {filas.length === 1 ? "1 paciente registrado" : `${filas.length} pacientes registrados`}
                    </span>
                    <span className="text-xs font-bold text-[#005B84] transition group-hover:text-[#D71920]">
                      Abrir
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {categoria && (
        <ClinicalHistoryCategory
          categoria={categoria}
          rows={filasPorCategoria[categoria]}
          isAdmin={isAdmin}
          onVolver={volverATarjetas}
          onNueva={nuevaHistoria}
          onAbrir={abrirDetalle}
          onEditar={editarHistoria}
          onAperturar={aperturarHistoria}
          onEliminar={eliminarHistoria}
        />
      )}

      {aperturaTarget && (
        <HistoriaClinicaModal
          paciente={aperturaTarget}
          onClose={() => setAperturaTarget(undefined)}
          onSaved={({ paciente }) => {
            setAperturaTarget(undefined);
            setMessage(
              `Historia clínica de ${paciente.apellidos} ${paciente.nombres} guardada correctamente.`,
            );
            setRefreshKey((value) => value + 1);
          }}
        />
      )}
      {editTarget && (
        <HistoriaClinicaModal
          paciente={editTarget}
          mode="edicion"
          onClose={() => setEditTarget(undefined)}
          onSaved={({ paciente }) => {
            setEditTarget(undefined);
            setMessage(
              `Historia clínica de ${paciente.apellidos} ${paciente.nombres} actualizada correctamente.`,
            );
            setRefreshKey((value) => value + 1);
          }}
        />
      )}
      {detailTarget && (
        <ClinicalHistoryDetail paciente={detailTarget} onClose={() => setDetailTarget(undefined)} />
      )}
    </section>
  );
}
