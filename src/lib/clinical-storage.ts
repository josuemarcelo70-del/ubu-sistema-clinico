"use client";

import type {
  Atencion,
  Derivacion,
  HistoriaClinica,
  Paciente,
  PrioridadTriaje,
  ServicioDestino,
  SignosVitales,
} from "@/types/clinical";

const PACIENTES_KEY = "ubu_pacientes";
const SIGNOS_KEY = "ubu_signos_vitales";
const DERIVACIONES_KEY = "ubu_derivaciones";
const ATENCIONES_KEY = "ubu_atenciones";
const HISTORIAS_KEY = "ubu_historias_clinicas";

function readStorage<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeStorage<T>(key: string, rows: T[]) {
  window.localStorage.setItem(key, JSON.stringify(rows));
  window.dispatchEvent(new Event("ubu-clinical-storage-updated"));
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function obtenerPacientes() {
  return readStorage<Paciente>(PACIENTES_KEY);
}

export function obtenerHistoriasClinicas() {
  return readStorage<HistoriaClinica>(HISTORIAS_KEY);
}

export function obtenerHistoriaClinicaPorPaciente(pacienteId: string) {
  return obtenerHistoriasClinicas().find((historia) => historia.pacienteId === pacienteId);
}

export function obtenerHistoriaClinicaPorNumero(numeroHistoriaClinica: string) {
  const clean = numeroHistoriaClinica.trim().toLowerCase();
  if (!clean) return undefined;
  return obtenerHistoriasClinicas().find(
    (historia) => historia.numeroHistoriaClinica.toLowerCase() === clean,
  );
}

export function buscarPacientePorCedula(cedula: string) {
  const clean = cedula.trim();
  if (!clean) return undefined;
  return obtenerPacientes().find((paciente) => paciente.cedula === clean);
}

export function buscarPacientePorHistoriaClinica(historiaClinica: string) {
  const clean = historiaClinica.trim().toLowerCase();
  if (!clean) return undefined;
  return obtenerPacientes().find((paciente) =>
    [
      paciente.historiaClinica,
      paciente.historiaClinicaNumero,
      paciente.numeroHistoriaClinica,
      paciente.hc,
      paciente.historiaClinicaId,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase() === clean),
  );
}

export function evitarDuplicadoPaciente(paciente: Partial<Paciente>) {
  return (
    (paciente.cedula && buscarPacientePorCedula(paciente.cedula)) ||
    (paciente.historiaClinicaNumero &&
      buscarPacientePorHistoriaClinica(paciente.historiaClinicaNumero)) ||
    (paciente.historiaClinica &&
      buscarPacientePorHistoriaClinica(paciente.historiaClinica)) ||
    undefined
  );
}

function normalizePacienteHistoriaClinica<T extends Partial<Paciente>>(paciente: T): T {
  const cedula = paciente.cedula?.trim();
  if (!cedula) return paciente;
  return {
    ...paciente,
    cedula,
    historiaClinica: cedula,
    historiaClinicaNumero: cedula,
    numeroHistoriaClinica: cedula,
  };
}

export function guardarPaciente(paciente: Paciente) {
  const normalizedInput = normalizePacienteHistoriaClinica(paciente);
  const pacientes = obtenerPacientes();
  const existente = evitarDuplicadoPaciente(normalizedInput);
  const now = new Date().toISOString();

  if (existente) {
    return (
      actualizarPaciente(existente.id, {
      ...normalizedInput,
      id: existente.id,
      fechaCreacion: existente.fechaCreacion,
      fechaActualizacion: now,
      }) ?? existente
    );
  }

  const nuevoPaciente = {
    ...normalizedInput,
    id: normalizedInput.id || createId("pac"),
    fechaCreacion: normalizedInput.fechaCreacion || now,
    fechaActualizacion: now,
  };
  writeStorage(PACIENTES_KEY, [...pacientes, nuevoPaciente]);
  return nuevoPaciente;
}

export function guardarHistoriaClinicaInicial({
  paciente,
  historia,
}: {
  paciente: Paciente;
  historia: Omit<HistoriaClinica, "id" | "pacienteId" | "fechaApertura" | "estado"> &
    Partial<Pick<HistoriaClinica, "id" | "fechaApertura" | "estado">>;
}) {
  const cedula = paciente.cedula.trim();
  const numeroHistoriaClinica = cedula;
  const existentePorCedula = buscarPacientePorCedula(cedula);
  const pacienteBase = existentePorCedula ?? paciente;
  const now = historia.fechaApertura || new Date().toISOString();
  const savedPaciente = guardarPaciente({
    ...pacienteBase,
    ...paciente,
    id: pacienteBase.id,
    cedula,
    historiaClinica: numeroHistoriaClinica,
    historiaClinicaNumero: numeroHistoriaClinica,
    numeroHistoriaClinica,
    fechaAperturaHistoriaClinica: pacienteBase.fechaAperturaHistoriaClinica || now,
  });

  const historias = obtenerHistoriasClinicas();
  const historiaExistente =
    historias.find((item) => item.numeroHistoriaClinica === numeroHistoriaClinica) ||
    historias.find((item) => item.pacienteId === pacienteBase.id || item.pacienteId === savedPaciente.id);

  if (historiaExistente) {
    const updatedHistoria: HistoriaClinica = {
      ...historiaExistente,
      ...historia,
      id: historiaExistente.id,
      pacienteId: savedPaciente.id,
      numeroHistoriaClinica,
      fechaApertura: historiaExistente.fechaApertura || now,
      estado: "activa",
    };
    writeStorage(
      HISTORIAS_KEY,
      historias.map((item) => (item.id === historiaExistente.id ? updatedHistoria : item)),
    );
    return { paciente: savedPaciente, historia: updatedHistoria, created: false };
  }

  const nuevaHistoria: HistoriaClinica = {
    ...historia,
    id: historia.id || createId("hc"),
    pacienteId: savedPaciente.id,
    numeroHistoriaClinica,
    fechaApertura: now,
    estado: "activa",
  };
  writeStorage(HISTORIAS_KEY, [...obtenerHistoriasClinicas(), nuevaHistoria]);
  return { paciente: savedPaciente, historia: nuevaHistoria, created: true };
}

export function actualizarPaciente(id: string, changes: Partial<Paciente>) {
  const pacientes = obtenerPacientes();
  const normalizedChanges = normalizePacienteHistoriaClinica(changes);
  const updated = pacientes.map((paciente) =>
    paciente.id === id
      ? { ...paciente, ...normalizedChanges, id, fechaActualizacion: new Date().toISOString() }
      : paciente,
  );
  writeStorage(PACIENTES_KEY, updated);
  return updated.find((paciente) => paciente.id === id);
}

export function obtenerSignosVitales() {
  return readStorage<SignosVitales>(SIGNOS_KEY);
}

export function guardarSignosVitales(signos: SignosVitales) {
  const row = { ...signos, id: signos.id || createId("sv") };
  writeStorage(SIGNOS_KEY, [...obtenerSignosVitales(), row]);
  return row;
}

export function obtenerSignosPorPaciente(pacienteId: string) {
  return obtenerSignosVitales()
    .filter((signos) => signos.pacienteId === pacienteId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function obtenerSignosPorId(id?: string) {
  if (!id) return undefined;
  return obtenerSignosVitales().find((signos) => signos.id === id);
}

export function obtenerDerivaciones() {
  return readStorage<Derivacion>(DERIVACIONES_KEY);
}

export function guardarDerivacion(derivacion: Derivacion) {
  const existente = obtenerDerivaciones().find(
    (row) =>
      row.pacienteId === derivacion.pacienteId &&
      row.servicioDestino === derivacion.servicioDestino &&
      row.estado === "pendiente",
  );
  if (existente) return existente;

  const row = { ...derivacion, id: derivacion.id || createId("der") };
  writeStorage(DERIVACIONES_KEY, [...obtenerDerivaciones(), row]);
  return row;
}

export function actualizarDerivacion(id: string, changes: Partial<Derivacion>) {
  const derivaciones = obtenerDerivaciones();
  const updated = derivaciones.map((derivacion) =>
    derivacion.id === id ? { ...derivacion, ...changes } : derivacion,
  );
  writeStorage(DERIVACIONES_KEY, updated);
  return updated.find((derivacion) => derivacion.id === id);
}

export function cancelarDerivacion(id: string) {
  return actualizarDerivacion(id, { estado: "cancelado" });
}

export function obtenerDerivacionesPorServicio(servicio: ServicioDestino) {
  return obtenerDerivaciones().filter(
    (derivacion) => derivacion.servicioDestino === servicio,
  );
}

export function obtenerDerivacionesPendientesPorServicio(servicio: ServicioDestino) {
  return obtenerDerivacionesPorServicio(servicio).filter(
    (derivacion) => derivacion.estado === "pendiente",
  );
}

export function obtenerDerivacionesActivasPorServicio(servicio: ServicioDestino) {
  return obtenerDerivacionesPorServicio(servicio).filter(
    (derivacion) => derivacion.estado === "pendiente" || derivacion.estado === "en_atencion",
  );
}

export function obtenerAtenciones() {
  return readStorage<Atencion>(ATENCIONES_KEY);
}

export function guardarAtencion(atencion: Atencion) {
  const existente = obtenerAtenciones().find(
    (row) => row.derivacionId === atencion.derivacionId && row.estado === "en_proceso",
  );
  if (existente) return existente;

  const row = { ...atencion, id: atencion.id || createId("ate") };
  writeStorage(ATENCIONES_KEY, [...obtenerAtenciones(), row]);
  return row;
}

export function actualizarAtencion(id: string, changes: Partial<Atencion>) {
  const now = new Date().toISOString();
  const atenciones = obtenerAtenciones();
  const updated = atenciones.map((atencion) =>
    atencion.id === id ? { ...atencion, ...changes, id, updatedAt: now } : atencion,
  );
  writeStorage(ATENCIONES_KEY, updated);
  return updated.find((atencion) => atencion.id === id);
}

export function obtenerAtencionEnProcesoPorDerivacion(derivacionId: string) {
  return obtenerAtenciones().find(
    (atencion) => atencion.derivacionId === derivacionId && atencion.estado === "en_proceso",
  );
}

export function obtenerAtencionesPorPaciente(pacienteId: string) {
  return obtenerAtenciones()
    .filter((atencion) => atencion.pacienteId === pacienteId && atencion.estado === "finalizada")
    .sort((a, b) => (b.fechaFinalizacion || b.fechaInicio).localeCompare(a.fechaFinalizacion || a.fechaInicio));
}

export function finalizarAtencion(atencionId: string, changes: Partial<Atencion>) {
  const now = new Date().toISOString();
  const current = obtenerAtenciones().find((atencion) => atencion.id === atencionId);
  if (!current) return undefined;
  const finalizada = actualizarAtencion(atencionId, {
    ...changes,
    estado: "finalizada",
    fechaFinalizacion: changes.fechaFinalizacion || now,
    horaFin:
      changes.horaFin ||
      new Date(now).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" }),
  });
  if (finalizada) {
    actualizarDerivacion(finalizada.derivacionId, {
      estado: "atendido",
      atendidoPorUserId: finalizada.profesionalId,
    });
  }
  return finalizada;
}

export function iniciarAtencionDesdeDerivacion(
  derivacion: Derivacion,
  profesionalId: string,
  tipoAtencion: Atencion["tipoAtencion"],
) {
  const now = new Date().toISOString();
  actualizarDerivacion(derivacion.id, {
    estado: "en_atencion",
    fechaInicioAtencion: now,
    atendidoPorUserId: profesionalId,
  });

  return guardarAtencion({
    id: createId("ate"),
    derivacionId: derivacion.id,
    pacienteId: derivacion.pacienteId,
    servicio: derivacion.servicioDestino,
    tipoAtencion,
    estado: "en_proceso",
    fechaInicio: now,
    fechaAtencion: now.slice(0, 10),
    horaInicio: new Date(now).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" }),
    profesionalId,
    origen: derivacion.origen,
    createdAt: now,
    updatedAt: now,
  });
}

export function getTriajePriority(prioridadTriaje?: string) {
  const normalized = (prioridadTriaje || "verde").toLowerCase();
  const compatible: Record<string, PrioridadTriaje> = {
    urgente: "naranja",
    preferente: "amarillo",
    normal: "verde",
    "": "verde",
  };
  const value = compatible[normalized] ?? normalized;
  const priorities: Record<PrioridadTriaje, number> = {
    rojo: 1,
    naranja: 2,
    amarillo: 3,
    verde: 4,
    azul: 5,
  };
  return priorities[value as PrioridadTriaje] ?? priorities.verde;
}

export function normalizeTriaje(prioridadTriaje?: string): PrioridadTriaje {
  const values: PrioridadTriaje[] = ["rojo", "naranja", "amarillo", "verde", "azul"];
  const normalized = (prioridadTriaje || "verde").toLowerCase();
  if (values.includes(normalized as PrioridadTriaje)) {
    return normalized as PrioridadTriaje;
  }
  if (normalized === "urgente") return "naranja";
  if (normalized === "preferente") return "amarillo";
  return "verde";
}

export function hasHistoriaClinica(paciente?: Partial<Paciente>) {
  if (!paciente) return false;
  const cedula = paciente.cedula?.trim();
  if (!cedula) return false;
  // Solo cuenta como "tiene historia clínica" si existe un registro real en
  // ubu_historias_clinicas: que el campo historiaClinica del paciente coincida
  // con la cédula NO basta (se asigna automáticamente antes de aperturar la HC).
  if (obtenerHistoriaClinicaPorNumero(cedula)) return true;
  if (paciente.id && obtenerHistoriaClinicaPorPaciente(paciente.id)) return true;
  return false;
}

export function getHoraLlegada(derivacion: Derivacion) {
  if (derivacion.horaLlegada) return derivacion.horaLlegada;
  return new Date(derivacion.fechaDerivacion).toLocaleTimeString("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
