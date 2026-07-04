"use client";

import { useMemo, useState } from "react";

import {
  buscarPacientePorCedula,
  buscarPacientePorHistoriaClinica,
  createId,
  guardarDerivacion,
  guardarPaciente,
  guardarSignosVitales,
  obtenerPacientes,
} from "@/lib/clinical-storage";
import { SIMULATED_SESSION_KEY, type SimulatedSession } from "@/lib/mock-users";
import {
  calcularImcDesdeCm,
  limpiarValorNumerico,
  normalizarTallaCm,
  tallaFueraDeRango,
  vitalFieldDefs,
} from "@/lib/vital-signs";
import type { Derivacion, Paciente, PrioridadTriaje, ServicioDestino } from "@/types/clinical";
import { DynamicAcademicFields, Field, inputClass, selectClass } from "./ClinicalFormFields";
import { TriageSelect } from "./TriageBadge";

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

const emptySignos = {
  presionArterial: "",
  frecuenciaCardiaca: "",
  frecuenciaRespiratoria: "",
  temperatura: "",
  saturacionOxigeno: "",
  peso: "",
  talla: "",
  observaciones: "",
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

function calculateAgeFromBirthDate(value: string) {
  const birth = new Date(`${value}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return "";
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) years -= 1;
  return String(Math.max(years, 0));
}


export function TriageFlow({ onBack }: { onBack: () => void }) {
  const [search, setSearch] = useState("");
  const [paciente, setPaciente] = useState<Partial<Paciente>>(emptyPaciente);
  const [signos, setSignos] = useState(emptySignos);
  const [motivo, setMotivo] = useState("");
  const [prioridadTriaje, setPrioridadTriaje] = useState<PrioridadTriaje>("verde");
  const [servicioDestino, setServicioDestino] = useState<ServicioDestino>("medicina");
  const [message, setMessage] = useState("");

  const matches = useMemo(() => {
    void message;
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return obtenerPacientes()
      .filter((row) =>
        [
          row.cedula,
          row.historiaClinicaNumero,
          row.historiaClinica,
          row.nombres,
          row.apellidos,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term),
      )
      .slice(0, 6);
  }, [search, message]);

  const { imc, clasificacionImc } = calcularImcDesdeCm(signos.peso, signos.talla);
  const tallaInvalida = tallaFueraDeRango(normalizarTallaCm(signos.talla));

  function fillPaciente(row: Paciente) {
    setPaciente(row);
    setSearch(`${row.apellidos} ${row.nombres}`.trim());
    setMessage("Paciente encontrado. Datos autocompletados.");
  }

  function searchPaciente() {
    const byCedula = buscarPacientePorCedula(search);
    const byHc = buscarPacientePorHistoriaClinica(search);
    const found = byCedula || byHc || matches[0];
    if (found) fillPaciente(found);
    else setMessage("Paciente no encontrado. Complete los datos básicos para registrarlo.");
  }

  function saveTriage() {
    if (!paciente.cedula || !paciente.nombres || !paciente.apellidos || !motivo) {
      setMessage("Complete cédula, apellidos, nombres y motivo de consulta.");
      return;
    }
    const saturacion = Number(limpiarValorNumerico(signos.saturacionOxigeno));
    if (signos.saturacionOxigeno.trim() && (!Number.isFinite(saturacion) || saturacion < 0 || saturacion > 100)) {
      setMessage("La saturación O₂ debe estar entre 0 y 100 %.");
      return;
    }
    if (tallaInvalida) {
      setMessage("La talla debe registrarse en centímetros, entre 50 y 250 cm.");
      return;
    }

    const now = new Date();
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
      direccion: paciente.direccion || "",
      tipoUsuario: paciente.tipoUsuario || "estudiante",
      fechaCreacion: paciente.fechaCreacion || now.toISOString(),
      fechaActualizacion: now.toISOString(),
    } as Paciente);

    // Se guardan solo los datos limpios: números sin unidades y talla en cm.
    const savedSignos = guardarSignosVitales({
      id: createId("sv"),
      pacienteId: savedPaciente.id,
      fecha: now.toISOString(),
      presionArterial: signos.presionArterial.trim(),
      frecuenciaCardiaca: limpiarValorNumerico(signos.frecuenciaCardiaca),
      frecuenciaRespiratoria: limpiarValorNumerico(signos.frecuenciaRespiratoria),
      temperatura: limpiarValorNumerico(signos.temperatura),
      saturacionOxigeno: limpiarValorNumerico(signos.saturacionOxigeno),
      peso: limpiarValorNumerico(signos.peso),
      talla: normalizarTallaCm(signos.talla),
      imc,
      observaciones: signos.observaciones,
      registradoPorUserId: currentUserId(),
    });

    const derivacion: Derivacion = guardarDerivacion({
      id: createId("der"),
      pacienteId: savedPaciente.id,
      signosVitalesId: savedSignos.id,
      servicioDestino,
      motivoConsultaBreve: motivo,
      prioridadTriaje,
      estado: "pendiente",
      fechaDerivacion: now.toISOString(),
      horaLlegada: now.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" }),
      derivadoPorUserId: currentUserId(),
      origen: "enfermeria",
      coberturaAtencion: paciente.coberturaAtencion,
    });

    setMessage(
      derivacion.estado === "pendiente"
        ? "Derivación guardada. El paciente queda en espera del servicio seleccionado."
        : "Ya existía una derivación pendiente para ese servicio.",
    );
    setPaciente(emptyPaciente);
    setSignos(emptySignos);
    setMotivo("");
    setPrioridadTriaje("verde");
    setServicioDestino("medicina");
    setSearch("");
  }

  return (
    <section className="dashboard-fade mx-auto max-w-7xl space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-[#D7E3EC] bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#005B84]">
            Enfermería
          </p>
          <h1 className="mt-1 text-2xl font-black text-[#082F49]">Triaje y derivación</h1>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="w-fit rounded-md border border-[#D7E3EC] px-3 py-2 text-sm font-bold text-[#082F49] transition hover:border-[#005B84] hover:text-[#005B84]"
        >
          Volver
        </button>
      </div>

      {message && (
        <div className="rounded-md border border-[#BFD2DE] bg-[#EEF6FA] px-4 py-3 text-sm font-bold text-[#005B84]">
          {message}
        </div>
      )}

      <div className="rounded-lg border border-[#D7E3EC] bg-white shadow-sm">
        <div className="border-b border-[#D7E3EC] bg-[#F8FBFD] px-4 py-3">
          <h2 className="text-base font-black text-[#082F49]">Buscar o registrar paciente</h2>
        </div>
        <div className="grid gap-4 p-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por cédula, historia clínica, nombres o apellidos"
                className={inputClass}
              />
              <button
                type="button"
                onClick={searchPaciente}
                className="rounded-md bg-[#062B49] px-4 py-2 text-sm font-black text-white transition hover:bg-[#005B84]"
              >
                Buscar
              </button>
            </div>
            {matches.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {matches.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => fillPaciente(row)}
                    className="rounded-md border border-[#D7E3EC] px-3 py-2 text-left text-sm font-bold text-[#082F49] transition hover:border-[#005B84]"
                  >
                    {row.apellidos} {row.nombres}
                    <span className="block text-xs font-medium text-[#64748B]">{row.cedula}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Cédula">
                <input
                  value={paciente.cedula ?? ""}
                  onChange={(event) => {
                    const cedula = event.target.value.trim();
                    setPaciente((row) => ({
                      ...row,
                      cedula: event.target.value,
                      historiaClinica: cedula,
                      historiaClinicaNumero: cedula,
                      numeroHistoriaClinica: cedula,
                    }));
                  }}
                  className={inputClass}
                />
              </Field>
              <Field label="Historia clínica">
                <input
                  value={paciente.cedula?.trim() ?? ""}
                  readOnly
                  className={`${inputClass} bg-[#F8FBFD]`}
                />
              </Field>
              <Field label="Sexo">
                <select
                  value={paciente.sexo ?? ""}
                  onChange={(event) => setPaciente((row) => ({ ...row, sexo: event.target.value }))}
                  className={selectClass}
                >
                  <option value="">Seleccione...</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Otro">Otro</option>
                </select>
              </Field>
              <Field label="Apellidos">
                <input
                  value={paciente.apellidos ?? ""}
                  onChange={(event) =>
                    setPaciente((row) => ({ ...row, apellidos: event.target.value }))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Nombres">
                <input
                  value={paciente.nombres ?? ""}
                  onChange={(event) => setPaciente((row) => ({ ...row, nombres: event.target.value }))}
                  className={inputClass}
                />
              </Field>
              <Field label="Edad">
                <input
                  value={paciente.edad ?? ""}
                  onChange={(event) => setPaciente((row) => ({ ...row, edad: event.target.value }))}
                  className={inputClass}
                />
              </Field>
              <Field label="Fecha nacimiento">
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
              <Field label="Teléfono">
                <input
                  value={paciente.telefono ?? ""}
                  onChange={(event) =>
                    setPaciente((row) => ({ ...row, telefono: event.target.value }))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Correo institucional">
                <input
                  value={paciente.correoInstitucional ?? ""}
                  onChange={(event) =>
                    setPaciente((row) => ({ ...row, correoInstitucional: event.target.value }))
                  }
                  className={inputClass}
                />
              </Field>
              <DynamicAcademicFields
                values={paciente}
                onChange={(changes) => setPaciente((row) => ({ ...row, ...changes }))}
              />
            </div>
          </div>

          <div className="rounded-lg border border-[#D7E3EC] bg-[#F8FBFD] p-3">
            <h3 className="text-sm font-black text-[#082F49]">Signos vitales</h3>
            <div className="mt-3 grid gap-3">
              {vitalFieldDefs.map(({ key, label, placeholder, inputMode }) => (
                <Field key={key} label={label}>
                  <input
                    inputMode={inputMode}
                    placeholder={placeholder}
                    value={signos[key as keyof typeof signos]}
                    onChange={(event) =>
                      setSignos((row) => ({ ...row, [key]: event.target.value }))
                    }
                    className={inputClass}
                  />
                </Field>
              ))}
              {tallaInvalida && (
                <p className="text-xs font-semibold text-[#B45309]">
                  La talla debe estar entre 50 y 250 cm; el IMC no se calculará.
                </p>
              )}
              <div className="rounded-md border border-[#D7E3EC] bg-white px-3 py-2 text-sm font-black text-[#082F49]">
                IMC (kg/m²): {imc || "No registra"}
                <span className="mt-0.5 block text-xs font-bold text-[#52677A]">
                  Clasificación: {clasificacionImc || "No registra"}
                </span>
              </div>
              <Field label="Nota de enfermería">
                <textarea
                  value={signos.observaciones}
                  onChange={(event) =>
                    setSignos((row) => ({ ...row, observaciones: event.target.value }))
                  }
                  className={`${inputClass} min-h-20 resize-y`}
                />
              </Field>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[#D7E3EC] bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
          <Field label="Motivo de consulta">
            <textarea
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              className={`${inputClass} min-h-24 resize-y`}
            />
          </Field>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#64748B]">
              Nivel de triaje
            </p>
            <TriageSelect value={prioridadTriaje} onChange={setPrioridadTriaje} />
          </div>
          <div className="space-y-3">
            <Field label="Servicio destino">
              <select
                value={servicioDestino}
                onChange={(event) => setServicioDestino(event.target.value as ServicioDestino)}
                className={selectClass}
              >
                <option value="medicina">Enviar a Medicina</option>
                <option value="odontologia">Enviar a Odontología</option>
                <option value="psicologia">Enviar a Psicología Clínica</option>
              </select>
            </Field>
            <button
              type="button"
              onClick={saveTriage}
              className="w-full rounded-md bg-[#D71920] px-4 py-3 text-sm font-black text-white transition hover:bg-[#B9151B]"
            >
              Guardar derivación
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
