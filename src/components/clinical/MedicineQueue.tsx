"use client";

import { useEffect, useMemo, useState } from "react";

import {
  actualizarDerivacion,
  buscarPacientePorCedula,
  buscarPacientePorHistoriaClinica,
  cancelarDerivacion,
  createId,
  getHoraLlegada,
  getTriajePriority,
  guardarHistoriaClinicaInicial,
  guardarDerivacion,
  guardarPaciente,
  hasHistoriaClinica,
  iniciarAtencionDesdeDerivacion,
  obtenerAtenciones,
  obtenerAtencionEnProcesoPorDerivacion,
  obtenerDerivacionesActivasPorServicio,
  obtenerDerivacionesPendientesPorServicio,
  obtenerPacientes,
  obtenerSignosPorId,
} from "@/lib/clinical-storage";
import { cie10Catalog } from "@/lib/cie10-catalog";
import { SIMULATED_SESSION_KEY, type SimulatedSession } from "@/lib/mock-users";
import type {
  Atencion,
  AntecedenteFamiliar,
  AntecedentePatologico,
  Cie10Diagnostico,
  Derivacion,
  HabitosPersonales,
  Paciente,
  PrioridadTriaje,
  ServicioDestino,
  SignosVitales,
} from "@/types/clinical";
import { Modal } from "@/components/ui/Modal";
import { AutocompleteField, type AutocompleteOption } from "./AutocompleteField";
import { DynamicAcademicFields, Field, inputClass, selectClass } from "./ClinicalFormFields";
import { MedicalAttention } from "./MedicalAttention";
import { TriageBadge, TriageSelect } from "./TriageBadge";

type QueueRow = {
  derivacion: Derivacion;
  paciente?: Paciente;
  signos?: SignosVitales;
};

const emptyPaciente: Partial<Paciente> = {
  cedula: "",
  historiaClinicaNumero: "",
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
};

function currentUserId() {
  if (typeof window === "undefined") return "usuario-simulado";
  try {
    const session = JSON.parse(
      window.localStorage.getItem(SIMULATED_SESSION_KEY) || "{}",
    ) as Partial<SimulatedSession>;
    return session.userId || session.username || "usuario-simulado";
  } catch {
    return "usuario-simulado";
  }
}

function patientName(paciente?: Paciente) {
  return paciente ? `${paciente.apellidos} ${paciente.nombres}`.trim() : "";
}

function patientProgram(paciente?: Paciente) {
  if (!paciente) return "";
  if (paciente.tipoUsuario === "estudiante" && paciente.nivelAcademico === "pregrado") {
    return [paciente.carreraNombre, paciente.facultadNombre].filter(Boolean).join(" / ");
  }
  if (paciente.tipoUsuario === "estudiante" && paciente.nivelAcademico === "posgrado") {
    return [paciente.programaPosgradoNombre, paciente.facultadNombre].filter(Boolean).join(" / ");
  }
  if (paciente.tipoUsuario === "docente") {
    return [paciente.facultadNombre || paciente.dependencia, paciente.cargo].filter(Boolean).join(" / ");
  }
  if (paciente.tipoUsuario === "administrativo" || paciente.tipoUsuario === "trabajador") {
    return [paciente.dependencia, paciente.cargo].filter(Boolean).join(" / ");
  }
  return "";
}

function patientPeriod(paciente?: Paciente) {
  if (!paciente) return "";
  if (paciente.tipoUsuario === "estudiante" && paciente.nivelAcademico === "pregrado") {
    return [paciente.ciclo, paciente.periodoAcademicoNombre].filter(Boolean).join(" / ");
  }
  if (paciente.tipoUsuario === "estudiante" && paciente.nivelAcademico === "posgrado") {
    return ["Postgrado", paciente.periodoAcademicoNombre].filter(Boolean).join(" / ");
  }
  return "No aplica";
}

function calculateAgeFromBirthDate(value: string) {
  const birth = new Date(`${value}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return "";
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) years -= 1;
  return String(Math.max(years, 0));
}

export function MedicineQueue({ onBack }: { onBack: () => void }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [vitalSigns, setVitalSigns] = useState<SignosVitales | undefined>();
  const [hcTarget, setHcTarget] = useState<QueueRow | undefined>();
  const [attentionTarget, setAttentionTarget] = useState<QueueRow | undefined>();
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"espera" | "realizadas">("espera");

  useEffect(() => {
    function handleUpdate() {
      setRefreshKey((value) => value + 1);
    }
    window.addEventListener("ubu-clinical-storage-updated", handleUpdate);
    return () => window.removeEventListener("ubu-clinical-storage-updated", handleUpdate);
  }, []);

  const rows = useMemo(() => {
    void refreshKey;
    const pacientes = obtenerPacientes();
    const term = query.trim().toLowerCase();
    return obtenerDerivacionesActivasPorServicio("medicina")
      .map((derivacion) => {
        const paciente = pacientes.find((item) => item.id === derivacion.pacienteId);
        return {
          derivacion,
          paciente,
          signos: obtenerSignosPorId(derivacion.signosVitalesId),
        };
      })
      .filter((row) => {
        if (!term) return true;
        const paciente = row.paciente;
        return [
          paciente?.nombres,
          paciente?.apellidos,
          paciente?.cedula,
          paciente?.historiaClinica,
          paciente?.historiaClinicaNumero,
          paciente?.carreraNombre,
          paciente?.facultadNombre,
          paciente?.programaPosgradoNombre,
          row.derivacion.motivoConsultaBreve,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .sort((a, b) => {
        const priority =
          getTriajePriority(a.derivacion.prioridadTriaje) -
          getTriajePriority(b.derivacion.prioridadTriaje);
        if (priority !== 0) return priority;
        return a.derivacion.fechaDerivacion.localeCompare(b.derivacion.fechaDerivacion);
      });
  }, [query, refreshKey]);

  function startAttention(row: QueueRow, tipo: "apertura_hc" | "subsecuente") {
    const enProceso = obtenerAtencionEnProcesoPorDerivacion(row.derivacion.id);
    if (enProceso) {
      // Ya hay una atención en curso (borrador): se retoma sin reiniciar el registro.
      setAttentionTarget(row);
      return;
    }
    iniciarAtencionDesdeDerivacion(row.derivacion, currentUserId(), tipo);
    const updated = {
      ...row,
      derivacion: {
        ...row.derivacion,
        estado: "en_atencion" as const,
        fechaInicioAtencion: new Date().toISOString(),
        atendidoPorUserId: currentUserId(),
      },
    };
    setAttentionTarget(updated);
    setRefreshKey((value) => value + 1);
  }

  function cancelRow(row: QueueRow) {
    const ok = window.confirm("¿Cancelar esta derivación? El paciente y sus datos se conservarán.");
    if (!ok) return;
    cancelarDerivacion(row.derivacion.id);
    setMessage("Derivación cancelada. No se eliminó el paciente.");
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
            <h1 className="mt-1 text-2xl font-black text-[#082F49]">Pacientes en espera</h1>
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
              onClick={() => setAddOpen(true)}
              className="rounded-md bg-[#062B49] px-3 py-2 text-sm font-black text-white transition hover:bg-[#005B84]"
            >
              Agregar paciente
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className="rounded-md border border-[#BFD2DE] bg-[#EEF6FA] px-4 py-3 text-sm font-bold text-[#005B84]">
          {message}
        </div>
      )}

      <div className="flex flex-wrap gap-2 rounded-lg border border-[#D7E3EC] bg-white p-2 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("espera")}
          className={`rounded-md px-3 py-2 text-sm font-semibold ${
            activeTab === "espera" ? "bg-[#005B84] text-white" : "text-[#0F2F44] hover:bg-[#EEF6FA]"
          }`}
        >
          Pacientes en espera
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("realizadas")}
          className={`rounded-md px-3 py-2 text-sm font-semibold ${
            activeTab === "realizadas" ? "bg-[#005B84] text-white" : "text-[#0F2F44] hover:bg-[#EEF6FA]"
          }`}
        >
          Atenciones realizadas
        </button>
      </div>

      {activeTab === "espera" && <div className="ubu-card overflow-hidden">
        <div className="border-b border-[#D7E3EC] p-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombres, cédula, HC, carrera, facultad o motivo"
            className={inputClass}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="ubu-table min-w-[1120px]">
            <thead>
              <tr>
                <th>Prioridad / Triaje</th>
                <th>Hora de ingreso</th>
                <th>Paciente</th>
                <th>Cédula</th>
                <th>Tipo de usuario</th>
                <th>Motivo de consulta</th>
                <th>Servicio origen</th>
                <th>Historia / Seguimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const paciente = row.paciente;
                const existsHc = hasHistoriaClinica(paciente);
                const enProceso = obtenerAtencionEnProcesoPorDerivacion(row.derivacion.id);
                const enAtencion = row.derivacion.estado === "en_atencion";
                return (
                  <tr key={row.derivacion.id} className={row.derivacion.prioridadTriaje === "rojo" || row.derivacion.prioridadTriaje === "naranja" ? "bg-[#FFF7F7]" : ""}>
                    <td>
                      <TriageBadge value={row.derivacion.prioridadTriaje} />
                    </td>
                    <td className="font-bold">{getHoraLlegada(row.derivacion)}</td>
                    <td className="font-black">
                      <div>{paciente ? `${paciente.apellidos} ${paciente.nombres}` : "Paciente no encontrado"}</div>
                      <div className="mt-1 max-w-[260px] text-xs font-semibold text-[#64748B]">{patientProgram(paciente)}</div>
                    </td>
                    <td className="text-[#64748B]">{paciente?.cedula}</td>
                    <td className="text-[#64748B]">
                      <span className="capitalize">{paciente?.tipoUsuario ?? "No registra"}</span>
                      <span className="mt-1 block text-xs">{patientPeriod(paciente)}</span>
                    </td>
                    <td className="max-w-[260px] text-[#64748B]">
                      {row.derivacion.motivoConsultaBreve}
                    </td>
                    <td className="text-[#64748B]">
                      {row.derivacion.origen === "enfermeria" ? "Enfermería / Triaje" : "Medicina"}
                    </td>
                    <td>
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${
                            existsHc
                              ? "bg-[#DCFCE7] text-[#166534]"
                              : "bg-[#FFE4E6] text-[#BE123C]"
                          }`}
                        >
                          {existsHc ? "HC ACTIVA" : "NO CONSTA EN BASE"}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${
                            enAtencion
                              ? "bg-[#DBEAFE] text-[#1E3A8A]"
                              : "bg-[#F1F5F9] text-[#334155]"
                          }`}
                        >
                          {enAtencion ? "EN ATENCIÓN" : "EN ESPERA"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!existsHc) setHcTarget(row);
                          else startAttention(row, "subsecuente");
                        }}
                        className="ubu-btn ubu-btn-info ubu-btn-sm"
                      >
                        {!existsHc ? "Aperturar HC" : enProceso ? "Continuar atención" : "Iniciar atención"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setVitalSigns(row.signos)}
                        disabled={!row.signos}
                        className="ubu-btn ubu-btn-secondary ubu-btn-sm"
                      >
                        Ver datos
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelRow(row)}
                        className="ubu-btn ubu-btn-sm border border-[#FCA5A5] text-[#D71920] hover:bg-[#FEF2F2]"
                        aria-label="Cancelar derivación"
                      >
                        Retirar
                      </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm font-bold text-[#64748B]">
                    No hay pacientes pendientes para Medicina.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>}

      {activeTab === "realizadas" && <AtencionesRealizadas refreshKey={refreshKey} />}

      {addOpen && (
        <AddPatientModal
          onClose={() => setAddOpen(false)}
          onSaved={(text) => {
            setMessage(text);
            setAddOpen(false);
            setRefreshKey((value) => value + 1);
          }}
        />
      )}
      {vitalSigns && <VitalSignsModal signos={vitalSigns} onClose={() => setVitalSigns(undefined)} />}
      {hcTarget && (
        <HistoriaClinicaModal
          row={hcTarget}
          onClose={() => setHcTarget(undefined)}
          onSaved={(row) => {
            setHcTarget(undefined);
            startAttention(row, "apertura_hc");
            setRefreshKey((value) => value + 1);
          }}
        />
      )}
      {attentionTarget && (
        <MedicalAttention
          derivacion={attentionTarget.derivacion}
          paciente={attentionTarget.paciente}
          signos={attentionTarget.signos}
          onClose={() => setAttentionTarget(undefined)}
          onSaved={(text) => {
            setAttentionTarget(undefined);
            setMessage(text);
            setRefreshKey((value) => value + 1);
            setActiveTab("realizadas");
          }}
        />
      )}
    </section>
  );
}

function AddPatientModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [paciente, setPaciente] = useState<Partial<Paciente>>(emptyPaciente);
  const [prioridadTriaje, setPrioridadTriaje] = useState<PrioridadTriaje>("verde");
  const [horaLlegada, setHoraLlegada] = useState(
    new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" }),
  );
  const [motivo, setMotivo] = useState("");
  const [observacion, setObservacion] = useState("");
  const [servicioDestino, setServicioDestino] = useState<ServicioDestino>("medicina");
  const [modalMessage, setModalMessage] = useState("");

  function autocompleteByCedula(value: string) {
    const cedula = value.trim();
    setPaciente((row) => ({
      ...row,
      cedula: value,
      historiaClinica: cedula,
      historiaClinicaNumero: cedula,
      numeroHistoriaClinica: cedula,
    }));
    const found = buscarPacientePorCedula(value);
    if (found) {
      setPaciente(found);
      setModalMessage("Datos autocompletados por cédula.");
    }
  }

  function autocompleteByHc(value: string) {
    autocompleteByCedula(value);
    const found = buscarPacientePorHistoriaClinica(value);
    if (found) {
      setPaciente(found);
      setModalMessage("Datos autocompletados por historia clínica.");
    }
  }

  function save() {
    if (
      !paciente.cedula ||
      !paciente.apellidos ||
      !paciente.nombres ||
      !paciente.sexo ||
      !paciente.fechaNacimiento ||
      !motivo
    ) {
      setModalMessage("Complete cédula, apellidos, nombres, sexo, fecha de nacimiento y motivo de consulta.");
      return;
    }
    if (paciente.fechaNacimiento > new Date().toISOString().slice(0, 10)) {
      setModalMessage("La fecha de nacimiento no puede ser una fecha futura.");
      return;
    }

    const now = new Date().toISOString();
    const savedPaciente = guardarPaciente({
      ...emptyPaciente,
      ...paciente,
      id: paciente.id || createId("pac"),
      cedula: paciente.cedula.trim(),
      historiaClinica: paciente.cedula.trim(),
      historiaClinicaNumero: paciente.cedula.trim(),
      numeroHistoriaClinica: paciente.cedula.trim(),
      nombres: paciente.nombres.trim(),
      apellidos: paciente.apellidos.trim(),
      sexo: paciente.sexo || "",
      fechaNacimiento: paciente.fechaNacimiento || "",
      edad: paciente.edad || "",
      telefono: paciente.telefono || "",
      correo: paciente.correo || "",
      correoInstitucional: paciente.correoInstitucional || "",
      direccion: observacion || paciente.direccion || "",
      tipoUsuario: paciente.tipoUsuario || "estudiante",
      fechaCreacion: paciente.fechaCreacion || now,
      fechaActualizacion: now,
    } as Paciente);

    const before = obtenerDerivacionesPendientesPorServicio(servicioDestino).length;
    guardarDerivacion({
      id: createId("der"),
      pacienteId: savedPaciente.id,
      servicioDestino,
      motivoConsultaBreve: motivo,
      prioridadTriaje,
      estado: "pendiente",
      fechaDerivacion: now,
      horaLlegada,
      derivadoPorUserId: currentUserId(),
      origen: "medicina_manual",
      coberturaAtencion: paciente.coberturaAtencion,
    });
    const after = obtenerDerivacionesPendientesPorServicio(servicioDestino).length;
    onSaved(
      after === before
        ? `El paciente ya tenía una derivación pendiente a ${servicioDestino}.`
        : "Paciente agregado a la cola clínica.",
    );
  }

  return (
    <ModalFrame
      onClose={onClose}
      title="Agregar paciente a cola de Medicina"
      subtitle="Registro clínico inicial con autocompletado por cédula o historia clínica."
      footer={
        <>
          <button type="button" onClick={onClose} className="ubu-btn ubu-btn-secondary">
            Cancelar
          </button>
          <button type="button" onClick={save} className="ubu-btn ubu-btn-primary">
            Guardar en cola
          </button>
        </>
      }
    >
      {modalMessage && (
        <div className="mb-4 rounded-[10px] border border-[#BFD2DE] bg-[#EEF6FA] px-4 py-3 text-sm font-bold text-[#005B84]">
          {modalMessage}
        </div>
      )}
      <div>
        <section className="ubu-form-section">
          <h3 className="ubu-section-title ubu-form-section-title">1. Identificación del paciente</h3>
          <p className="ubu-form-section-description">
            La cédula autocompleta los datos si el paciente ya existe.
          </p>
          <div className="ubu-form-grid mt-4">
            <Field label="Cédula / documento *">
              <input value={paciente.cedula ?? ""} onChange={(event) => autocompleteByCedula(event.target.value)} className={inputClass} />
            </Field>
            <Field label="Historia clínica">
              <input value={paciente.historiaClinicaNumero ?? paciente.cedula?.trim() ?? ""} onChange={(event) => autocompleteByHc(event.target.value)} className={`${inputClass} bg-white`} />
            </Field>
            <Field label="Nombres *">
              <input value={paciente.nombres ?? ""} onChange={(event) => setPaciente((row) => ({ ...row, nombres: event.target.value }))} className={inputClass} />
            </Field>
            <Field label="Apellidos *">
              <input value={paciente.apellidos ?? ""} onChange={(event) => setPaciente((row) => ({ ...row, apellidos: event.target.value }))} className={inputClass} />
            </Field>
            <Field label="Sexo *">
              <select value={paciente.sexo ?? ""} onChange={(event) => setPaciente((row) => ({ ...row, sexo: event.target.value }))} className={selectClass}>
                <option value="">Seleccione...</option>
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
                <option value="Otro">Otro</option>
              </select>
            </Field>
            <Field label="Fecha de nacimiento *">
              <input
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={paciente.fechaNacimiento ?? ""}
                onChange={(event) =>
                  setPaciente((row) => ({
                    ...row,
                    fechaNacimiento: event.target.value,
                    edad: calculateAgeFromBirthDate(event.target.value),
                  }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Edad automática">
              <input value={paciente.edad ?? ""} readOnly className={`${inputClass} bg-[#F1F5F9]`} />
            </Field>
            <Field label="Teléfono">
              <input value={paciente.telefono ?? ""} onChange={(event) => setPaciente((row) => ({ ...row, telefono: event.target.value }))} className={inputClass} />
            </Field>
            <Field label="Correo institucional">
              <input value={paciente.correoInstitucional ?? ""} onChange={(event) => setPaciente((row) => ({ ...row, correoInstitucional: event.target.value, correo: event.target.value }))} className={inputClass} />
            </Field>
          </div>
        </section>

        <section className="ubu-form-section ubu-form-section-white">
          <h3 className="ubu-section-title ubu-form-section-title">2. Tipo de usuario</h3>
          <div className="ubu-form-grid mt-4">
            <DynamicAcademicFields values={paciente} onChange={(changes) => setPaciente((row) => ({ ...row, ...changes }))} />
          </div>
        </section>

        <section className="ubu-form-section ubu-form-section-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="ubu-section-title ubu-form-section-title">3. Datos clínicos iniciales</h3>
            <TriageBadge value={prioridadTriaje} />
          </div>
          <div className="ubu-form-grid mt-4">
            <Field label="Motivo de consulta *">
              <textarea value={motivo} onChange={(event) => setMotivo(event.target.value)} className={`${inputClass} min-h-24 resize-y`} />
            </Field>
            <div className="space-y-1.5 text-[13px] font-semibold text-[#34495C]">
              <span>Nivel de triaje</span>
              <TriageSelect value={prioridadTriaje} onChange={setPrioridadTriaje} />
            </div>
            <Field label="Servicio de destino">
              <select value={servicioDestino} onChange={(event) => setServicioDestino(event.target.value as ServicioDestino)} className={selectClass}>
                <option value="medicina">Medicina</option>
                <option value="odontologia">Odontología</option>
                <option value="psicologia">Psicología clínica</option>
              </select>
            </Field>
            <Field label="Hora de ingreso">
              <input type="time" value={horaLlegada} onChange={(event) => setHoraLlegada(event.target.value)} className={inputClass} />
            </Field>
            <label className="space-y-1.5 text-[13px] font-semibold text-[#34495C] md:col-span-2 lg:col-span-3">
              <span>Observación inicial</span>
              <textarea value={observacion} onChange={(event) => setObservacion(event.target.value)} className={`${inputClass} min-h-24 resize-y`} />
            </label>
          </div>
        </section>
      </div>
    </ModalFrame>
  );
}

function HistoriaClinicaModal({
  row,
  onClose,
  onSaved,
}: {
  row: QueueRow;
  onClose: () => void;
  onSaved: (row: QueueRow) => void;
}) {
  const initialHc = row.paciente?.cedula?.trim() ?? "";
  const [paciente, setPaciente] = useState<Partial<Paciente>>({
    ...emptyPaciente,
    ...row.paciente,
    historiaClinica: initialHc,
    historiaClinicaNumero: initialHc,
    numeroHistoriaClinica: initialHc,
  });
  const [step, setStep] = useState<"datos" | "habitos" | "antecedentes">("datos");
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [habitos, setHabitos] = useState<HabitosPersonales>({
    miccion: "",
    deposiciones: "",
    alimentacion: "",
    alcohol: "",
    alcoholObservacion: "",
    tabaco: "",
    tabacoObservacion: "",
    otrasSustancias: "",
    medicacionHabitual: "",
    actividadFisica: "",
    actividadFisicaObservacion: "",
  });
  const [personalSearch, setPersonalSearch] = useState("");
  const [selectedPersonal, setSelectedPersonal] = useState<Cie10Diagnostico>();
  const [personalAntecedentes, setPersonalAntecedentes] = useState<AntecedentePatologico[]>([]);
  const [personalObservacion, setPersonalObservacion] = useState(row.paciente?.antecedentesPersonales ?? "");
  const [familySearch, setFamilySearch] = useState("");
  const [familyMember, setFamilyMember] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<Cie10Diagnostico>();
  const [familyAntecedentes, setFamilyAntecedentes] = useState<AntecedenteFamiliar[]>([]);
  const [familyObservacion, setFamilyObservacion] = useState(row.paciente?.antecedentesFamiliares ?? "");
  const [antecedentesQuirurgicos, setAntecedentesQuirurgicos] = useState(row.paciente?.antecedentesQuirurgicos ?? "");
  const [alergias, setAlergias] = useState(row.paciente?.alergias ?? "");

  function changePaciente(changes: Partial<Paciente>) {
    setPaciente((data) => {
      const nextCedula =
        changes.cedula !== undefined ? changes.cedula.trim() : data.cedula?.trim() ?? "";
      return {
        ...data,
        ...changes,
        historiaClinica: nextCedula,
        historiaClinicaNumero: nextCedula,
        numeroHistoriaClinica: nextCedula,
      };
    });
    setDirty(true);
  }

  function close() {
    if (dirty && !window.confirm("Hay datos escritos sin guardar. ¿Cerrar la apertura de historia clínica?")) return;
    onClose();
  }

  function setBirthDate(value: string) {
    const birth = new Date(`${value}T00:00:00`);
    const today = new Date();
    let age = "";
    if (!Number.isNaN(birth.getTime())) {
      let years = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) years -= 1;
      age = String(Math.max(years, 0));
    }
    changePaciente({ fechaNacimiento: value, edad: age });
  }

  function validate() {
    const nextErrors: Record<string, string> = {};
    if (!paciente.cedula?.trim()) nextErrors.cedula = "La cédula es obligatoria.";
    if (!paciente.nombres?.trim()) nextErrors.nombres = "Los nombres son obligatorios.";
    if (!paciente.apellidos?.trim()) nextErrors.apellidos = "Los apellidos son obligatorios.";
    if (!paciente.sexo?.trim()) nextErrors.sexo = "Seleccione sexo o género.";
    if (!paciente.fechaNacimiento?.trim()) nextErrors.fechaNacimiento = "La fecha de nacimiento es obligatoria.";
    else if (paciente.fechaNacimiento > new Date().toISOString().slice(0, 10)) {
      nextErrors.fechaNacimiento = "La fecha de nacimiento no puede ser una fecha futura.";
    }
    if (!paciente.tipoUsuario?.trim()) nextErrors.tipoUsuario = "Seleccione el tipo de usuario.";
    if (!paciente.cedula?.trim()) nextErrors.historiaClinicaNumero = "La historia clínica se asigna con la cédula.";

    if (paciente.tipoUsuario === "estudiante") {
      if (!paciente.facultadNombre?.trim()) nextErrors.facultad = "Seleccione facultad.";
      if (paciente.nivelAcademico === "posgrado") {
        if (!paciente.programaPosgradoNombre?.trim()) nextErrors.carrera = "Seleccione programa de posgrado.";
      } else if (!paciente.carreraNombre?.trim()) {
        nextErrors.carrera = "Seleccione carrera.";
      }
      if (!paciente.ciclo?.trim() && paciente.nivelAcademico !== "posgrado") nextErrors.ciclo = "Seleccione ciclo.";
      if (!paciente.periodoAcademicoNombre?.trim()) nextErrors.periodo = "Seleccione periodo académico.";
    }
    if (paciente.tipoUsuario === "docente") {
      if (!(paciente.dependencia || paciente.facultadNombre)?.trim()) nextErrors.dependencia = "Registre dependencia o facultad.";
      if (!paciente.cargo?.trim()) nextErrors.cargo = "Registre cargo o área.";
    }
    if (
      (paciente.tipoUsuario === "administrativo" || paciente.tipoUsuario === "trabajador") &&
      !paciente.dependencia?.trim()
    ) {
      nextErrors.dependencia = "Registre dependencia o unidad administrativa.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) setStep("datos");
    return Object.keys(nextErrors).length === 0;
  }

  function save() {
    if (!row.paciente?.id) return;
    if (hasHistoriaClinica(row.paciente)) {
      onSaved(row);
      return;
    }
    if (!validate()) return;

    const now = new Date().toISOString();
    const cedula = paciente.cedula?.trim() || row.paciente.cedula;
    const normalizedPaciente = {
      ...row.paciente,
      ...paciente,
      id: row.paciente.id,
      cedula,
      historiaClinica: cedula,
      historiaClinicaNumero: cedula,
      numeroHistoriaClinica: cedula,
      nombres: paciente.nombres?.trim() || row.paciente.nombres,
      apellidos: paciente.apellidos?.trim() || row.paciente.apellidos,
      sexo: paciente.sexo || "",
      telefono: paciente.telefono || "",
      correo: paciente.correo || paciente.correoInstitucional || "",
      correoInstitucional: paciente.correoInstitucional || paciente.correo || "",
      direccion: paciente.direccion || "",
      tipoUsuario: paciente.tipoUsuario || "estudiante",
      antecedentesPersonales: personalObservacion,
      antecedentesFamiliares: familyObservacion,
      antecedentesQuirurgicos,
      alergias: alergias.trim() || "No refiere",
      fechaCreacion: row.paciente.fechaCreacion,
      fechaActualizacion: now,
    } as Paciente;

    const saved = guardarHistoriaClinicaInicial({
      paciente: normalizedPaciente,
      historia: {
        numeroHistoriaClinica: cedula,
        medicoResponsable: currentUserId(),
        datosPersonales: normalizedPaciente,
        habitosPersonales: habitos,
        antecedentesPersonales: personalAntecedentes,
        antecedentesFamiliares: familyAntecedentes,
        antecedentesPersonalesObservacion: personalObservacion,
        antecedentesFamiliaresObservacion: familyObservacion,
        antecedentesQuirurgicos,
        alergias: alergias.trim() || "No refiere",
      },
    });
    setDirty(false);
    const derivacion =
      saved.paciente.id === row.derivacion.pacienteId
        ? row.derivacion
        : actualizarDerivacion(row.derivacion.id, { pacienteId: saved.paciente.id }) ??
          row.derivacion;
    onSaved({ ...row, derivacion, paciente: saved.paciente });
  }

  function addPersonalAntecedente() {
    if (!selectedPersonal) return;
    if (personalAntecedentes.some((item) => item.codigo === selectedPersonal.codigo)) return;
    setPersonalAntecedentes((items) => [...items, selectedPersonal]);
    setSelectedPersonal(undefined);
    setPersonalSearch("");
    setDirty(true);
  }

  function addFamilyAntecedente() {
    if (!selectedFamily || !familyMember.trim()) return;
    setFamilyAntecedentes((items) => [
      ...items,
      { ...selectedFamily, familiar: familyMember.trim() },
    ]);
    setSelectedFamily(undefined);
    setFamilySearch("");
    setFamilyMember("");
    setDirty(true);
  }

  return (
    <ModalFrame
      onClose={close}
      title="Apertura de historia clínica"
      subtitle="Complete los datos personales, hábitos y antecedentes para continuar a atención."
      footer={
        <>
          <button
            type="button"
            onClick={close}
            className="rounded-lg border border-[#D7E3EC] px-4 py-2.5 text-sm font-semibold text-[#0F2F44] transition hover:border-[#005B84] hover:text-[#005B84]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={save}
            className="rounded-lg bg-[#D71920] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B9151B]"
          >
            Guardar historia clínica y continuar a atención
          </button>
        </>
      }
    >
      <div className="grid gap-3 md:grid-cols-4">
        <Info label="Paciente" value={`${paciente.apellidos ?? ""} ${paciente.nombres ?? ""}`.trim()} />
        <Info label="Cédula" value={paciente.cedula ?? ""} />
        <Info label="Historia clínica" value={paciente.historiaClinicaNumero ?? ""} />
        <Info label="Condición" value={hasHistoriaClinica(row.paciente) ? "HC activa" : "No consta en base"} />
      </div>
      {Object.keys(errors).length > 0 && (
        <div className="mt-4 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm font-semibold text-[#B91C1C]">
          Revise los campos marcados antes de guardar la historia clínica.
        </div>
      )}
      <div className="mt-5 flex flex-wrap gap-2 border-b border-[#D7E3EC] pb-3">
        {[
          ["datos", "Datos personales"],
          ["habitos", "Hábitos personales"],
          ["antecedentes", "Antecedentes personales"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setStep(key as typeof step)}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
              step === key ? "bg-[#005B84] text-white" : "border border-[#D7E3EC] text-[#082F49] hover:border-[#005B84]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {step === "datos" && (
        <DatosPersonalesStep paciente={paciente} errors={errors} onChange={changePaciente} onBirthDate={setBirthDate} />
      )}
      {step === "habitos" && (
        <HabitosStep
          habitos={habitos}
          onChange={(changes) => {
            setHabitos((data) => ({ ...data, ...changes }));
            setDirty(true);
          }}
        />
      )}
      {step === "antecedentes" && (
        <AntecedentesStep
          personalSearch={personalSearch}
          selectedPersonal={selectedPersonal}
          personalAntecedentes={personalAntecedentes}
          personalObservacion={personalObservacion}
          familySearch={familySearch}
          selectedFamily={selectedFamily}
          familyMember={familyMember}
          familyAntecedentes={familyAntecedentes}
          familyObservacion={familyObservacion}
          antecedentesQuirurgicos={antecedentesQuirurgicos}
          alergias={alergias}
          onPersonalSearch={setPersonalSearch}
          onSelectPersonal={setSelectedPersonal}
          onAddPersonal={addPersonalAntecedente}
          onRemovePersonal={(codigo) => setPersonalAntecedentes((items) => items.filter((item) => item.codigo !== codigo))}
          onPersonalObservacion={(value) => {
            setPersonalObservacion(value);
            setDirty(true);
          }}
          onFamilySearch={setFamilySearch}
          onSelectFamily={setSelectedFamily}
          onFamilyMember={setFamilyMember}
          onAddFamily={addFamilyAntecedente}
          onRemoveFamily={(index) => setFamilyAntecedentes((items) => items.filter((_, itemIndex) => itemIndex !== index))}
          onFamilyObservacion={(value) => {
            setFamilyObservacion(value);
            setDirty(true);
          }}
          onAntecedentesQuirurgicos={(value) => {
            setAntecedentesQuirurgicos(value);
            setDirty(true);
          }}
          onAlergias={(value) => {
            setAlergias(value);
            setDirty(true);
          }}
        />
      )}

    </ModalFrame>
  );
}

const sexoOptions: AutocompleteOption[] = [
  { value: "Femenino", label: "Femenino" },
  { value: "Masculino", label: "Masculino" },
  { value: "Otro", label: "Otro" },
];

const estadoCivilOptions: AutocompleteOption[] = [
  { value: "Soltero/a", label: "Soltero/a" },
  { value: "Casado/a", label: "Casado/a" },
  { value: "Union libre", label: "Union libre" },
  { value: "Divorciado/a", label: "Divorciado/a" },
  { value: "Viudo/a", label: "Viudo/a" },
];

const etniaOptions: AutocompleteOption[] = [
  { value: "Mestizo/a", label: "Mestizo/a" },
  { value: "Indigena", label: "Indigena" },
  { value: "Afroecuatoriano/a", label: "Afroecuatoriano/a" },
  { value: "Montubio/a", label: "Montubio/a" },
  { value: "Blanco/a", label: "Blanco/a" },
  { value: "Otro", label: "Otro" },
];

const familiarOptions: AutocompleteOption[] = [
  "Padre",
  "Madre",
  "Abuelo paterno",
  "Abuela paterna",
  "Abuelo materno",
  "Abuela materna",
  "Hermano/a",
  "Hijo/a",
  "Tio/a",
  "Primo/a",
  "Otro",
].map((value) => ({ value, label: value }));

const quickHabitOptions: AutocompleteOption[] = ["Si", "No", "Ocasional"].map((value) => ({
  value,
  label: value,
}));

const tabacoOptions: AutocompleteOption[] = ["Si", "No", "Ocasional", "Exfumador"].map((value) => ({
  value,
  label: value,
}));

function ErrorText({ value }: { value?: string }) {
  if (!value) return null;
  return <p className="mt-1 text-xs font-semibold normal-case tracking-normal text-[#B91C1C]">{value}</p>;
}

function DatosPersonalesStep({
  paciente,
  errors,
  onChange,
  onBirthDate,
}: {
  paciente: Partial<Paciente>;
  errors: Record<string, string>;
  onChange: (changes: Partial<Paciente>) => void;
  onBirthDate: (value: string) => void;
}) {
  return (
    <div className="mt-5 grid gap-x-[18px] gap-y-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Cédula">
        <input value={paciente.cedula ?? ""} onChange={(event) => onChange({ cedula: event.target.value })} className={inputClass} />
        <ErrorText value={errors.cedula} />
      </Field>
      <Field label="Número de historia clínica">
        <input value={paciente.historiaClinicaNumero ?? ""} readOnly className={`${inputClass} bg-[#F8FBFD]`} />
        <ErrorText value={errors.historiaClinicaNumero} />
      </Field>
      <Field label="Apellidos">
        <input value={paciente.apellidos ?? ""} onChange={(event) => onChange({ apellidos: event.target.value })} className={inputClass} />
        <ErrorText value={errors.apellidos} />
      </Field>
      <Field label="Nombres">
        <input value={paciente.nombres ?? ""} onChange={(event) => onChange({ nombres: event.target.value })} className={inputClass} />
        <ErrorText value={errors.nombres} />
      </Field>
      <Field label="Estado civil">
        <AutocompleteField value={paciente.estadoCivil ?? ""} options={estadoCivilOptions} onChange={(value) => onChange({ estadoCivil: value })} />
      </Field>
      <Field label="Etnia">
        <AutocompleteField value={paciente.etnia ?? ""} options={etniaOptions} onChange={(value) => onChange({ etnia: value })} />
      </Field>
      <Field label="Género / Sexo">
        <AutocompleteField value={paciente.sexo ?? ""} options={sexoOptions} onChange={(value) => onChange({ sexo: value })} />
        <ErrorText value={errors.sexo} />
      </Field>
      <Field label="Fecha de nacimiento">
        <input
          type="date"
          max={new Date().toISOString().slice(0, 10)}
          value={paciente.fechaNacimiento ?? ""}
          onChange={(event) => onBirthDate(event.target.value)}
          className={inputClass}
        />
        <ErrorText value={errors.fechaNacimiento} />
      </Field>
      <Field label="Edad">
        <input value={paciente.edad ?? ""} readOnly className={`${inputClass} bg-[#F8FBFD]`} />
      </Field>
      <DynamicAcademicFields values={paciente} onChange={onChange} />
      <ErrorText value={errors.tipoUsuario || errors.facultad || errors.carrera || errors.ciclo || errors.periodo || errors.dependencia || errors.cargo} />
      <Field label="Teléfono personal">
        <input value={paciente.telefono ?? ""} onChange={(event) => onChange({ telefono: event.target.value })} className={inputClass} />
      </Field>
      <Field label="Correo institucional">
        <input value={paciente.correoInstitucional ?? ""} onChange={(event) => onChange({ correoInstitucional: event.target.value, correo: event.target.value })} className={inputClass} />
      </Field>
      <Field label="Dirección">
        <input value={paciente.direccion ?? ""} onChange={(event) => onChange({ direccion: event.target.value })} className={inputClass} />
      </Field>
      <Field label="Contacto de emergencia">
        <input value={paciente.contactoEmergenciaNombre ?? ""} onChange={(event) => onChange({ contactoEmergenciaNombre: event.target.value })} className={inputClass} />
      </Field>
      <Field label="Teléfono de emergencia">
        <input value={paciente.contactoEmergenciaTelefono ?? ""} onChange={(event) => onChange({ contactoEmergenciaTelefono: event.target.value })} className={inputClass} />
      </Field>
    </div>
  );
}

function HabitosStep({
  habitos,
  onChange,
}: {
  habitos: HabitosPersonales;
  onChange: (changes: Partial<HabitosPersonales>) => void;
}) {
  return (
    <div className="mt-5 grid gap-x-[18px] gap-y-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Micción">
        <input value={habitos.miccion} onChange={(event) => onChange({ miccion: event.target.value })} className={inputClass} />
      </Field>
      <Field label="Deposiciones">
        <input value={habitos.deposiciones} onChange={(event) => onChange({ deposiciones: event.target.value })} className={inputClass} />
      </Field>
      <Field label="Alimentación">
        <input value={habitos.alimentacion} onChange={(event) => onChange({ alimentacion: event.target.value })} className={inputClass} />
      </Field>
      <Field label="Consumo de alcohol">
        <AutocompleteField value={habitos.alcohol} options={quickHabitOptions} onChange={(value) => onChange({ alcohol: value })} />
      </Field>
      <Field label="Observación alcohol">
        <input value={habitos.alcoholObservacion ?? ""} onChange={(event) => onChange({ alcoholObservacion: event.target.value })} className={inputClass} />
      </Field>
      <Field label="Tabaco">
        <AutocompleteField value={habitos.tabaco} options={tabacoOptions} onChange={(value) => onChange({ tabaco: value })} />
      </Field>
      <Field label="Observación tabaco">
        <input value={habitos.tabacoObservacion ?? ""} onChange={(event) => onChange({ tabacoObservacion: event.target.value })} className={inputClass} />
      </Field>
      <Field label="Otras sustancias">
        <input value={habitos.otrasSustancias} onChange={(event) => onChange({ otrasSustancias: event.target.value })} className={inputClass} />
      </Field>
      <Field label="Medicación habitual">
        <input value={habitos.medicacionHabitual} onChange={(event) => onChange({ medicacionHabitual: event.target.value })} className={inputClass} />
      </Field>
      <Field label="Actividad física">
        <AutocompleteField value={habitos.actividadFisica} options={quickHabitOptions} onChange={(value) => onChange({ actividadFisica: value })} />
      </Field>
      <Field label="Observación actividad física">
        <input value={habitos.actividadFisicaObservacion ?? ""} onChange={(event) => onChange({ actividadFisicaObservacion: event.target.value })} className={inputClass} />
      </Field>
    </div>
  );
}

function Cie10Autocomplete({
  value,
  onSearch,
  onSelect,
  placeholder,
}: {
  value: string;
  onSearch: (value: string) => void;
  onSelect: (value: Cie10Diagnostico) => void;
  placeholder: string;
}) {
  return (
    <AutocompleteField
      value={value}
      options={cie10Catalog.map((item) => ({
        value: item.codigo,
        label: item.codigo,
        helper: item.descripcion,
      }))}
      placeholder={placeholder}
      limit={10}
      hideOptionsUntilSearch
      onChange={(nextValue, option) => {
        onSearch(option ? `${option.value} - ${option.helper}` : nextValue);
        if (option) onSelect({ codigo: option.value, descripcion: option.helper ?? "" });
      }}
    />
  );
}

function AntecedentesStep({
  personalSearch,
  selectedPersonal,
  personalAntecedentes,
  personalObservacion,
  familySearch,
  selectedFamily,
  familyMember,
  familyAntecedentes,
  familyObservacion,
  antecedentesQuirurgicos,
  alergias,
  onPersonalSearch,
  onSelectPersonal,
  onAddPersonal,
  onRemovePersonal,
  onPersonalObservacion,
  onFamilySearch,
  onSelectFamily,
  onFamilyMember,
  onAddFamily,
  onRemoveFamily,
  onFamilyObservacion,
  onAntecedentesQuirurgicos,
  onAlergias,
}: {
  personalSearch: string;
  selectedPersonal?: Cie10Diagnostico;
  personalAntecedentes: AntecedentePatologico[];
  personalObservacion: string;
  familySearch: string;
  selectedFamily?: Cie10Diagnostico;
  familyMember: string;
  familyAntecedentes: AntecedenteFamiliar[];
  familyObservacion: string;
  antecedentesQuirurgicos: string;
  alergias: string;
  onPersonalSearch: (value: string) => void;
  onSelectPersonal: (value: Cie10Diagnostico) => void;
  onAddPersonal: () => void;
  onRemovePersonal: (codigo: string) => void;
  onPersonalObservacion: (value: string) => void;
  onFamilySearch: (value: string) => void;
  onSelectFamily: (value: Cie10Diagnostico) => void;
  onFamilyMember: (value: string) => void;
  onAddFamily: () => void;
  onRemoveFamily: (index: number) => void;
  onFamilyObservacion: (value: string) => void;
  onAntecedentesQuirurgicos: (value: string) => void;
  onAlergias: (value: string) => void;
}) {
  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-md border border-[#D7E3EC] p-4">
        <h3 className="text-sm font-semibold text-[#0F2F44]">Antecedentes patológicos personales</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <Field label="Buscar diagnóstico CIE-10">
            <Cie10Autocomplete value={personalSearch} onSearch={onPersonalSearch} onSelect={onSelectPersonal} placeholder="Buscar por código o diagnóstico" />
          </Field>
          <button type="button" onClick={onAddPersonal} disabled={!selectedPersonal} className="rounded-md bg-[#005B84] px-3 py-2 text-sm font-semibold text-white disabled:opacity-45">
            Agregar antecedente
          </button>
        </div>
        <AntecedentesList items={personalAntecedentes} onRemove={(index, item) => onRemovePersonal(item.codigo)} />
        <Field label="Observaciones de antecedentes patológicos personales">
          <textarea value={personalObservacion} onChange={(event) => onPersonalObservacion(event.target.value)} className={`${inputClass} min-h-20`} />
        </Field>
      </div>

      <div className="rounded-md border border-[#D7E3EC] p-4">
        <h3 className="text-sm font-semibold text-[#0F2F44]">Antecedentes patológicos familiares</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_240px_auto] md:items-end">
          <Field label="Buscar diagnóstico CIE-10">
            <Cie10Autocomplete value={familySearch} onSearch={onFamilySearch} onSelect={onSelectFamily} placeholder="Buscar por código o diagnóstico" />
          </Field>
          <Field label="Familiar afectado">
            <AutocompleteField value={familyMember} options={familiarOptions} onChange={onFamilyMember} />
          </Field>
          <button type="button" onClick={onAddFamily} disabled={!selectedFamily || !familyMember.trim()} className="rounded-md bg-[#005B84] px-3 py-2 text-sm font-semibold text-white disabled:opacity-45">
            Agregar
          </button>
        </div>
        <AntecedentesList items={familyAntecedentes} onRemove={onRemoveFamily} />
        <Field label="Observaciones de antecedentes patológicos familiares">
          <textarea value={familyObservacion} onChange={(event) => onFamilyObservacion(event.target.value)} className={`${inputClass} min-h-20`} />
        </Field>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Antecedentes quirúrgicos">
          <textarea value={antecedentesQuirurgicos} onChange={(event) => onAntecedentesQuirurgicos(event.target.value)} placeholder="Escriba antecedentes quirúrgicos" className={`${inputClass} min-h-28`} />
        </Field>
        <Field label="Alergias">
          <textarea value={alergias} onChange={(event) => onAlergias(event.target.value)} placeholder="Escriba alergias conocidas" className={`${inputClass} min-h-28`} />
        </Field>
      </div>
    </div>
  );
}

function AntecedentesList({
  items,
  onRemove,
}: {
  items: Array<AntecedentePatologico | AntecedenteFamiliar>;
  onRemove: (index: number, item: AntecedentePatologico | AntecedenteFamiliar) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="my-3 rounded-md border border-dashed border-[#BFD2DE] bg-[#F8FBFD] px-3 py-3 text-sm font-semibold text-[#64748B]">
        SIN ANTECEDENTES AGREGADOS.
      </div>
    );
  }

  return (
    <div className="my-3 overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead className="bg-[#EEF6FA] text-left text-[11px] uppercase tracking-wide text-[#64748B]">
          <tr>
            <th className="px-3 py-2 font-semibold">Código</th>
            <th className="px-3 py-2 font-semibold">Descripción</th>
            <th className="px-3 py-2 font-semibold">Familiar</th>
            <th className="px-3 py-2 font-semibold">Eliminar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D7E3EC]">
          {items.map((item, index) => (
            <tr key={`${item.codigo}-${index}`}>
              <td className="px-3 py-2 font-semibold text-[#082F49]">{item.codigo}</td>
              <td className="px-3 py-2 text-[#64748B]">{item.descripcion}</td>
              <td className="px-3 py-2 text-[#64748B]">{"familiar" in item ? item.familiar : "No aplica"}</td>
              <td className="px-3 py-2">
                <button type="button" onClick={() => onRemove(index, item)} className="h-8 w-8 rounded-md border border-[#FCA5A5] text-sm font-semibold text-[#D71920]">
                  X
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AtencionesRealizadas({ refreshKey }: { refreshKey: number }) {
  const [filter, setFilter] = useState<"dia" | "mes" | "rango">("dia");
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [detail, setDetail] = useState<{ atencion: Atencion; paciente?: Paciente }>();
  const pacientes = obtenerPacientes();
  const rows = useMemo(() => {
    void refreshKey;
    const term = query.trim().toLowerCase();
    return obtenerAtenciones()
      .filter((atencion) => atencion.servicio === "medicina" && atencion.estado === "finalizada")
      .filter((atencion) => {
        const date = (atencion.fechaAtencion || atencion.fechaFinalizacion || atencion.fechaInicio).slice(0, 10);
        if (filter === "dia") return date === new Date().toISOString().slice(0, 10);
        if (filter === "mes") return date.startsWith(month);
        return date >= from && date <= to;
      })
      .map((atencion) => ({
        atencion,
        paciente: pacientes.find((item) => item.id === atencion.pacienteId),
      }))
      .filter(({ atencion, paciente }) => {
        if (!term) return true;
        return [
          paciente?.nombres,
          paciente?.apellidos,
          paciente?.cedula,
          paciente?.historiaClinicaNumero,
          atencion.historiaClinica,
          atencion.motivoConsulta,
          atencion.diagnosticoPrincipal?.codigo,
          atencion.diagnosticoPrincipal?.descripcion,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .sort((a, b) =>
        (b.atencion.fechaFinalizacion || b.atencion.fechaInicio).localeCompare(
          a.atencion.fechaFinalizacion || a.atencion.fechaInicio,
        ),
      );
  }, [filter, from, month, pacientes, query, refreshKey, to]);

  return (
    <div className="rounded-lg border border-[#D7E3EC] bg-white shadow-sm">
      <div className="grid gap-3 border-b border-[#D7E3EC] p-4 lg:grid-cols-[180px_1fr_auto] lg:items-end">
        <Field label="Filtro">
          <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className={selectClass}>
            <option value="dia">Hoy</option>
            <option value="mes">Mes</option>
            <option value="rango">Rango</option>
          </select>
        </Field>
        <Field label="Buscar">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Paciente, cédula, HC, diagnóstico o motivo" className={inputClass} />
        </Field>
        <div className="grid gap-2 sm:grid-cols-2">
          {filter === "mes" && (
            <Field label="Mes">
              <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className={inputClass} />
            </Field>
          )}
          {filter === "rango" && (
            <>
              <Field label="Desde">
                <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={inputClass} />
              </Field>
              <Field label="Hasta">
                <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className={inputClass} />
              </Field>
            </>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead className="bg-[#EEF6FA] text-[11px] uppercase tracking-wide text-[#64748B]">
            <tr>
              <th className="px-3 py-3 font-semibold">Fecha</th>
              <th className="px-3 py-3 font-semibold">Paciente</th>
              <th className="px-3 py-3 font-semibold">Cédula / HC</th>
              <th className="px-3 py-3 font-semibold">Diagnóstico principal</th>
              <th className="px-3 py-3 font-semibold">Motivo</th>
              <th className="px-3 py-3 font-semibold">Médico</th>
              <th className="px-3 py-3 font-semibold">Ver</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D7E3EC]">
            {rows.map(({ atencion, paciente }) => (
              <tr key={atencion.id} className="text-[#0F2F44] hover:bg-[#F8FBFD]">
                <td className="px-3 py-3">{(atencion.fechaAtencion || atencion.fechaInicio).slice(0, 10)}</td>
                <td className="px-3 py-3 font-semibold">{patientName(paciente)}</td>
                <td className="px-3 py-3 text-[#52677A]">{paciente?.cedula || atencion.cedulaPaciente} / {atencion.historiaClinica || paciente?.cedula}</td>
                <td className="px-3 py-3 text-[#52677A]">
                  {atencion.diagnosticoPrincipal
                    ? `${atencion.diagnosticoPrincipal.codigo} ${atencion.diagnosticoPrincipal.descripcion}`
                    : "No registra"}
                </td>
                <td className="px-3 py-3 text-[#52677A]">{atencion.motivoConsulta}</td>
                <td className="px-3 py-3 text-[#52677A]">{atencion.profesionalNombre || atencion.profesionalId}</td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => setDetail({ atencion, paciente })}
                    className="rounded-md border border-[#D7E3EC] px-3 py-1.5 text-xs font-semibold text-[#005B84]"
                  >
                    Ver
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm font-semibold text-[#64748B]">
                  Sin atenciones realizadas para el filtro seleccionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {detail && (
        <ModalFrame title="Detalle de la atención" subtitle={patientName(detail.paciente)} onClose={() => setDetail(undefined)}>
          <div className="grid gap-3 md:grid-cols-2">
            <Info label="Fecha" value={(detail.atencion.fechaAtencion || detail.atencion.fechaInicio).slice(0, 10)} />
            <Info label="Diagnóstico" value={detail.atencion.diagnosticoPrincipal ? `${detail.atencion.diagnosticoPrincipal.codigo} - ${detail.atencion.diagnosticoPrincipal.descripcion}` : detail.atencion.motivoConsulta || ""} />
            <Info label="Enfermedad actual" value={detail.atencion.enfermedadActual || ""} />
            <Info label="Examen físico" value={detail.atencion.examenFisico || ""} />
            <Info label="Plan de tratamiento" value={detail.atencion.planTratamiento || ""} />
          </div>
        </ModalFrame>
      )}
    </div>
  );
}

function VitalSignsModal({ signos, onClose }: { signos: SignosVitales; onClose: () => void }) {
  return (
    <ModalFrame onClose={onClose} title="SIGNOS VITALES">
      <VitalSignsPanel signos={signos} />
    </ModalFrame>
  );
}

function VitalSignsPanel({ signos }: { signos: SignosVitales }) {
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-3">
      <Info label="PA" value={signos.presionArterial} />
      <Info label="FC" value={signos.frecuenciaCardiaca} />
      <Info label="FR" value={signos.frecuenciaRespiratoria} />
      <Info label="Temperatura" value={signos.temperatura} />
      <Info label="SpO2" value={signos.saturacionOxigeno} />
      <Info label="Peso" value={signos.peso} />
      <Info label="Talla" value={signos.talla} />
      <Info label="IMC" value={signos.imc} />
      <Info label="Nota de enfermería" value={signos.observaciones} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#D7E3EC] bg-[#F8FBFD] px-3 py-2">
      <p className="text-[11px] font-semibold text-[#52677A]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#0F2F44]">{value || "No registra"}</p>
    </div>
  );
}

function ModalFrame({
  title,
  subtitle,
  children,
  footer,
  onClose,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Modal size="xl" title={title} subtitle={subtitle} footer={footer} onClose={onClose}>
      {children}
    </Modal>
  );
}
