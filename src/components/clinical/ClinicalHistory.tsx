"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import {
  createId,
  eliminarHistoriaClinicaCompleta,
  hasHistoriaClinica,
  obtenerAtencionesPorPaciente,
  obtenerHistoriaClinicaPorPaciente,
  obtenerPacientes,
} from "@/lib/clinical-storage";
import { formatearEdadGestacional } from "@/lib/gineco";
import { SIMULATED_SESSION_KEY, type SimulatedSession } from "@/lib/mock-users";
import { normalizarTallaCm } from "@/lib/vital-signs";
import type { Atencion, HistoriaClinica, Paciente } from "@/types/clinical";
import { Modal } from "@/components/ui/Modal";
import { inputClass } from "./ClinicalFormFields";
import { HistoriaClinicaModal } from "./MedicineQueue";

const tipoUsuarioLabels: Record<string, string> = {
  estudiante: "Estudiante",
  docente: "Docente",
  administrativo: "Administrativo",
  trabajador: "Trabajador",
};

function facultadDependencia(paciente: Paciente) {
  if (paciente.tipoUsuario === "estudiante") {
    return [
      paciente.facultadNombre,
      paciente.nivelAcademico === "posgrado" ? paciente.programaPosgradoNombre : paciente.carreraNombre,
    ]
      .filter(Boolean)
      .join(" / ");
  }
  return [paciente.dependencia || paciente.facultadNombre, paciente.cargo].filter(Boolean).join(" / ");
}

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

// Paciente vacío para aperturar una historia clínica desde cero (estudiante,
// docente, administrativo o trabajador). Solo se persiste al guardar el modal.
function nuevoPacienteBase(): Paciente {
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
    tipoUsuario: "estudiante",
    nivelAcademico: "pregrado",
    fechaCreacion: now,
    fechaActualizacion: now,
  };
}

// Módulo oficial de gestión clínica del paciente: búsqueda, apertura y
// seguimiento de historias clínicas. La atención médica se inicia desde
// "Atenciones pendientes"; aquí se consulta y apertura el expediente.
export function ClinicalHistory({ onBack }: { onBack: () => void }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
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

  const rows = useMemo(() => {
    void refreshKey;
    const term = query.trim().toLowerCase();
    return obtenerPacientes()
      .filter((paciente) => {
        if (!term) return true;
        return [
          paciente.cedula,
          paciente.historiaClinicaNumero,
          paciente.historiaClinica,
          paciente.nombres,
          paciente.apellidos,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .map((paciente) => {
        const historia = obtenerHistoriaClinicaPorPaciente(paciente.id);
        const ultimaAtencion = obtenerAtencionesPorPaciente(paciente.id)
          .map((atencion) => atencion.fechaAtencion || atencion.fechaFinalizacion || atencion.fechaInicio)
          .filter(Boolean)
          .sort()
          .at(-1);
        return {
          paciente,
          existsHc: hasHistoriaClinica(paciente),
          fechaApertura: (historia?.fechaApertura || paciente.fechaAperturaHistoriaClinica || "").slice(0, 10),
          ultimaAtencion: (ultimaAtencion || "").slice(0, 10),
        };
      })
      .sort((a, b) =>
        `${a.paciente.apellidos} ${a.paciente.nombres}`.localeCompare(
          `${b.paciente.apellidos} ${b.paciente.nombres}`,
        ),
      );
  }, [query, refreshKey]);

  function deleteHistoria(paciente: Paciente) {
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
  }

  return (
    <section className="dashboard-fade mx-auto max-w-7xl space-y-4">
      <div className="rounded-lg border border-[#D7E3EC] bg-white shadow-sm">
        <div className="h-1 bg-[linear-gradient(90deg,#D71920_0%,#D71920_26%,#005B84_26%,#005B84_100%)]" />
        <div className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#005B84]">
              Medicina general
            </p>
            <h1 className="mt-1 text-2xl font-black text-[#082F49]">Historia clínica</h1>
            <p className="mt-1 text-sm font-semibold text-[#64748B]">
              Archivo clínico: consulta, apertura y edición de historias clínicas de estudiantes,
              docentes, administrativos y trabajadores
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onBack}
              className="rounded-md border border-[#D7E3EC] px-3 py-2 text-sm font-bold text-[#082F49] transition hover:border-[#005B84] hover:text-[#005B84]"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={() => setAperturaTarget(nuevoPacienteBase())}
              className="rounded-md bg-[#062B49] px-3 py-2 text-sm font-black text-white transition hover:bg-[#005B84]"
            >
              Añadir historia clínica
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className="rounded-md border border-[#BFD2DE] bg-[#EEF6FA] px-4 py-3 text-sm font-bold text-[#005B84]">
          {message}
        </div>
      )}

      <div className="ubu-card overflow-hidden">
        <div className="border-b border-[#D7E3EC] p-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por cédula, nombres, apellidos o número de historia clínica"
            className={inputClass}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="ubu-table min-w-[1180px]">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Cédula</th>
                <th>Historia clínica</th>
                <th>Edad / sexo</th>
                <th>Tipo de usuario</th>
                <th>Apertura / Última atención</th>
                <th>Estado HC</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ paciente, existsHc, fechaApertura, ultimaAtencion }) => (
                <tr key={paciente.id}>
                  <td className="font-black">
                    <div>
                      {paciente.apellidos} {paciente.nombres}
                    </div>
                    <div className="mt-1 max-w-[240px] text-xs font-semibold text-[#64748B]">
                      {facultadDependencia(paciente)}
                    </div>
                  </td>
                  <td className="text-[#64748B]">{paciente.cedula}</td>
                  <td className="text-[#64748B]">{paciente.historiaClinicaNumero || paciente.cedula}</td>
                  <td className="text-[#64748B]">
                    {[paciente.edad, paciente.sexo].filter(Boolean).join(" / ") || "No registra"}
                  </td>
                  <td className="text-[#64748B]">
                    {tipoUsuarioLabels[paciente.tipoUsuario] ?? "No registra"}
                  </td>
                  <td className="text-[#64748B]">
                    <div>{fechaApertura || "Sin apertura"}</div>
                    <div className="mt-1 text-xs">{ultimaAtencion || "Sin atenciones"}</div>
                  </td>
                  <td>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${
                        existsHc ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FFE4E6] text-[#BE123C]"
                      }`}
                    >
                      {existsHc ? "HC ABIERTA" : "SIN HISTORIA CLÍNICA"}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      {existsHc ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setDetailTarget(paciente)}
                            className="ubu-btn ubu-btn-info ubu-btn-sm"
                          >
                            Abrir
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditTarget(paciente)}
                            className="ubu-btn ubu-btn-secondary ubu-btn-sm"
                          >
                            Editar
                          </button>
                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={() => deleteHistoria(paciente)}
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
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAperturaTarget(paciente)}
                          className="ubu-btn ubu-btn-primary ubu-btn-sm"
                        >
                          Aperturar historia clínica
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm font-bold text-[#64748B]">
                    No se encontraron pacientes registrados para la búsqueda. Use “Añadir historia
                    clínica” para registrar un nuevo paciente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!isAdmin && (
          <div className="border-t border-[#D7E3EC] bg-[#F8FBFD] px-4 py-2.5 text-xs font-semibold text-[#64748B]">
            Solo el administrador puede eliminar historias clínicas.
          </div>
        )}
      </div>

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
        <HistoriaClinicaDetail paciente={detailTarget} onClose={() => setDetailTarget(undefined)} />
      )}
    </section>
  );
}

function DetailInfo({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-md border border-[#D7E3EC] bg-[#F8FBFD] px-3 py-2">
      <p className="text-[11px] font-semibold text-[#52677A]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#0F2F44]">{value || "No registra"}</p>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-[#D7E3EC] p-4">
      <h3 className="ubu-section-title">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function HistoriaClinicaDetail({
  paciente,
  onClose,
}: {
  paciente: Paciente;
  onClose: () => void;
}) {
  const historia: HistoriaClinica | undefined = obtenerHistoriaClinicaPorPaciente(paciente.id);
  const atenciones: Atencion[] = obtenerAtencionesPorPaciente(paciente.id);
  const gineco = historia?.antecedentesGinecoObstetricos;

  return (
    <Modal
      size="xl"
      title="Historia clínica"
      subtitle={`${paciente.apellidos} ${paciente.nombres} · HC ${paciente.historiaClinicaNumero || paciente.cedula}`}
      onClose={onClose}
      footer={
        <button type="button" onClick={onClose} className="ubu-btn ubu-btn-secondary">
          Cerrar
        </button>
      }
    >
      <div className="space-y-4">
        <DetailSection title="Datos personales">
          <div className="grid gap-3 md:grid-cols-3">
            <DetailInfo label="Cédula" value={paciente.cedula} />
            <DetailInfo label="Fecha de nacimiento" value={paciente.fechaNacimiento} />
            <DetailInfo label="Edad / sexo" value={[paciente.edad, paciente.sexo].filter(Boolean).join(" / ")} />
            <DetailInfo label="Orientación sexual" value={paciente.orientacionSexual} />
            <DetailInfo label="Pueblo o nacionalidad" value={paciente.puebloNacionalidad} />
            <DetailInfo
              label="Discapacidad"
              value={
                paciente.discapacidad === "Sí"
                  ? [
                      paciente.tipoDiscapacidad,
                      paciente.porcentajeDiscapacidad ? `${paciente.porcentajeDiscapacidad}%` : "",
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Sí"
                  : paciente.discapacidad
              }
            />
            <DetailInfo label="Teléfono" value={paciente.telefono} />
            <DetailInfo label="Correo institucional" value={paciente.correoInstitucional} />
            <DetailInfo label="Dirección" value={paciente.direccion} />
          </div>
        </DetailSection>

        <DetailSection title="Hábitos personales">
          {historia ? (
            <div className="grid gap-3 md:grid-cols-3">
              <DetailInfo label="Alimentación" value={historia.habitosPersonales.alimentacion} />
              <DetailInfo label="Alcohol" value={historia.habitosPersonales.alcohol} />
              <DetailInfo label="Tabaco" value={historia.habitosPersonales.tabaco} />
              <DetailInfo label="Otras sustancias" value={historia.habitosPersonales.otrasSustancias} />
              <DetailInfo label="Medicación habitual" value={historia.habitosPersonales.medicacionHabitual} />
              <DetailInfo label="Actividad física" value={historia.habitosPersonales.actividadFisica} />
            </div>
          ) : (
            <p className="text-sm font-semibold text-[#64748B]">Sin registro de hábitos.</p>
          )}
        </DetailSection>

        <DetailSection title="Antecedentes">
          {historia ? (
            <div className="grid gap-3 md:grid-cols-2">
              <DetailInfo
                label="Antecedentes personales"
                value={
                  historia.antecedentesPersonales.length
                    ? historia.antecedentesPersonales
                        .map((item) => `${item.codigo} - ${item.descripcion}`)
                        .join("; ")
                    : historia.antecedentesPersonalesObservacion
                }
              />
              <DetailInfo
                label="Antecedentes familiares"
                value={
                  historia.antecedentesFamiliares.length
                    ? historia.antecedentesFamiliares
                        .map((item) => `${item.familiar}: ${item.codigo} - ${item.descripcion}`)
                        .join("; ")
                    : historia.antecedentesFamiliaresObservacion
                }
              />
              <DetailInfo label="Antecedentes quirúrgicos" value={historia.antecedentesQuirurgicos} />
              <DetailInfo label="Alergias" value={historia.alergias} />
            </div>
          ) : (
            <p className="text-sm font-semibold text-[#64748B]">Sin antecedentes registrados.</p>
          )}
        </DetailSection>

        {gineco && (
          <DetailSection title="Antecedentes gineco-obstétricos">
            <div className="grid gap-3 md:grid-cols-3">
              <DetailInfo label="Menarquia" value={gineco.menarquia} />
              <DetailInfo label="Ciclo menstrual" value={gineco.cicloMenstrual} />
              <DetailInfo
                label="G / P / C / A / HV"
                value={`G${gineco.gestas ?? 0} P${gineco.partos ?? 0} C${gineco.cesareas ?? 0} A${gineco.abortos ?? 0} HV${gineco.hijosVivos ?? 0}`}
              />
              <DetailInfo label="Método anticonceptivo" value={gineco.metodoAnticonceptivo} />
              <DetailInfo
                label="Gestación actual"
                value={
                  gineco.gestaActual === "Sí"
                    ? [
                        "Sí",
                        formatearEdadGestacional(
                          gineco.edadGestacionalSemanas,
                          gineco.edadGestacionalDias,
                        ),
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : gineco.gestaActual
                }
              />
              <DetailInfo
                label="Lactancia"
                value={
                  gineco.lactanciaActual === "Sí"
                    ? ["Sí", gineco.tipoLactancia].filter(Boolean).join(" · ")
                    : gineco.lactanciaActual
                }
              />
              <DetailInfo label="Observaciones" value={gineco.observacionesGinecoObstetricas} />
            </div>
          </DetailSection>
        )}

        <DetailSection title="Historial de atenciones">
          {atenciones.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead className="bg-[#EEF6FA] text-[11px] uppercase tracking-wide text-[#64748B]">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Fecha</th>
                    <th className="px-3 py-2 font-semibold">Diagnóstico principal</th>
                    <th className="px-3 py-2 font-semibold">Motivo</th>
                    <th className="px-3 py-2 font-semibold">Signos vitales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D7E3EC]">
                  {atenciones.map((atencion) => (
                    <tr key={atencion.id} className="text-[#0F2F44]">
                      <td className="px-3 py-2">
                        {(atencion.fechaAtencion || atencion.fechaInicio).slice(0, 10)}
                      </td>
                      <td className="px-3 py-2 text-[#52677A]">
                        {atencion.diagnosticoPrincipal
                          ? `${atencion.diagnosticoPrincipal.codigo} ${atencion.diagnosticoPrincipal.descripcion}`
                          : "No registra"}
                      </td>
                      <td className="px-3 py-2 text-[#52677A]">{atencion.motivoConsulta || "No registra"}</td>
                      <td className="px-3 py-2 text-[#52677A]">
                        {atencion.signosVitales
                          ? [
                              atencion.signosVitales.presionArterial &&
                                `PA ${atencion.signosVitales.presionArterial} mmHg`,
                              atencion.signosVitales.temperatura &&
                                `T° ${atencion.signosVitales.temperatura} °C`,
                              atencion.signosVitales.talla &&
                                `Talla ${normalizarTallaCm(atencion.signosVitales.talla)} cm`,
                              atencion.signosVitales.peso && `Peso ${atencion.signosVitales.peso} kg`,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "No registra"
                          : "No registra"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm font-semibold text-[#64748B]">
              Sin atenciones finalizadas. Las atenciones se inician desde “Atenciones pendientes”.
            </p>
          )}
        </DetailSection>
      </div>
    </Modal>
  );
}
