"use client";

import { createId } from "@/lib/clinical-storage";
import type {
  CarreraCatalogo,
  CicloCatalogo,
  DependenciaCatalogo,
  FacultadCatalogo,
  PeriodoAcademicoCatalogo,
  ProgramaPosgradoCatalogo,
} from "@/types/clinical";

const FACULTADES_KEY = "ubu_catalogo_facultades";
const PERIODOS_KEY = "ubu_catalogo_periodos";
const CICLOS_KEY = "ubu_catalogo_ciclos";
const DEPENDENCIAS_KEY = "ubu_catalogo_dependencias";

const seedFacultades: FacultadCatalogo[] = [
  {
    id: "fsh",
    nombre: "Facultad de la Salud Humana",
    activo: true,
    carreras: [
      { id: "medicina", nombre: "Medicina", activo: true },
      { id: "enfermeria", nombre: "Enfermería", activo: true },
      { id: "laboratorio", nombre: "Laboratorio Clínico", activo: true },
      { id: "odontologia", nombre: "Odontología", activo: true },
      { id: "psicologia-clinica", nombre: "Psicología Clínica", activo: true },
    ],
    posgrados: [
      { id: "epidemiologia", nombre: "Maestría en Epidemiología", activo: true },
      { id: "salud-publica", nombre: "Maestría en Salud Pública", activo: true },
    ],
  },
  {
    id: "fjsa",
    nombre: "Facultad Jurídica, Social y Administrativa",
    activo: true,
    carreras: [
      { id: "derecho", nombre: "Derecho", activo: true },
      { id: "administracion", nombre: "Administración de Empresas", activo: true },
      { id: "contabilidad", nombre: "Contabilidad y Auditoría", activo: true },
    ],
    posgrados: [
      { id: "derecho-procesal", nombre: "Maestría en Derecho Procesal", activo: true },
      { id: "gestion-publica", nombre: "Maestría en Gestión Pública", activo: true },
    ],
  },
  {
    id: "fed",
    nombre: "Facultad de la Educación, el Arte y la Comunicación",
    activo: true,
    carreras: [
      { id: "educacion-basica", nombre: "Educación Básica", activo: true },
      { id: "psicopedagogia", nombre: "Psicopedagogía", activo: true },
      { id: "comunicacion", nombre: "Comunicación", activo: true },
    ],
    posgrados: [
      { id: "educacion", nombre: "Maestría en Educación", activo: true },
      { id: "comunicacion-digital", nombre: "Maestría en Comunicación Digital", activo: true },
    ],
  },
  {
    id: "farnr",
    nombre: "Facultad Agropecuaria y de Recursos Naturales Renovables",
    activo: true,
    carreras: [
      { id: "agronomia", nombre: "Agronomía", activo: true },
      { id: "veterinaria", nombre: "Medicina Veterinaria", activo: true },
      { id: "forestal", nombre: "Ingeniería Forestal", activo: true },
    ],
    posgrados: [
      { id: "agroecologia", nombre: "Maestría en Agroecología", activo: true },
      { id: "recursos-naturales", nombre: "Maestría en Recursos Naturales", activo: true },
    ],
  },
  {
    id: "fiet",
    nombre: "Facultad de la Energía, las Industrias y los Recursos Naturales no Renovables",
    activo: true,
    carreras: [
      { id: "software", nombre: "Computación", activo: true },
      { id: "electromecanica", nombre: "Electromecánica", activo: true },
      { id: "telecomunicaciones", nombre: "Telecomunicaciones", activo: true },
    ],
    posgrados: [
      { id: "software-posgrado", nombre: "Maestría en Ingeniería de Software", activo: true },
      { id: "energia", nombre: "Maestría en Energía", activo: true },
    ],
  },
];

const seedPeriodos: PeriodoAcademicoCatalogo[] = [
  {
    id: "2026-1",
    nombre: "Marzo 2026 - Agosto 2026",
    fechaInicio: "2026-03-01",
    fechaFin: "2026-08-15",
    activo: true,
    tipo: "ordinario",
  },
  {
    id: "2026-interciclo-1",
    nombre: "Interciclo Agosto - Septiembre 2026",
    fechaInicio: "2026-08-16",
    fechaFin: "2026-08-31",
    activo: true,
    tipo: "interciclo",
  },
  {
    id: "2026-2",
    nombre: "Septiembre 2026 - Febrero 2027",
    fechaInicio: "2026-09-01",
    fechaFin: "2027-02-28",
    activo: true,
    tipo: "ordinario",
  },
];

const seedCiclos: CicloCatalogo[] = [
  "Primero",
  "Segundo",
  "Tercero",
  "Cuarto",
  "Quinto",
  "Sexto",
  "Séptimo",
  "Octavo",
  "Noveno",
  "Décimo",
].map((nombre) => ({ id: nombre.toLowerCase(), nombre, activo: true }));

const seedDependencias: DependenciaCatalogo[] = [
  "Bienestar Universitario",
  "Medicina",
  "Enfermería",
  "Odontología",
  "Psicología Clínica",
  "Laboratorio Clínico",
  "Talento Humano",
  "Secretaría General",
  "Financiero",
  "Vicerrectorado Académico",
].map((nombre) => ({ id: createId("dep"), nombre, activo: true }));

function readStorage<T>(key: string, seed: T[]): T[] {
  if (typeof window === "undefined") return seed;
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    window.localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : seed;
  } catch {
    return seed;
  }
}

function writeStorage<T>(key: string, rows: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(rows));
  window.dispatchEvent(new Event("ubu-clinical-storage-updated"));
}

export function obtenerFacultades(): FacultadCatalogo[] {
  return readStorage(FACULTADES_KEY, seedFacultades);
}

export function obtenerFacultadesActivas(): FacultadCatalogo[] {
  return obtenerFacultades().filter((facultad) => facultad.activo);
}

export function getFacultadById(id?: string) {
  if (!id) return undefined;
  return obtenerFacultades().find((facultad) => facultad.id === id);
}

export function guardarFacultad(nombre: string) {
  const facultades = obtenerFacultades();
  const nueva: FacultadCatalogo = {
    id: createId("fac"),
    nombre: nombre.trim(),
    activo: true,
    carreras: [],
    posgrados: [],
  };
  writeStorage(FACULTADES_KEY, [...facultades, nueva]);
  return nueva;
}

export function actualizarFacultad(id: string, changes: Partial<FacultadCatalogo>) {
  const facultades = obtenerFacultades();
  const updated = facultades.map((facultad) =>
    facultad.id === id ? { ...facultad, ...changes, id } : facultad,
  );
  writeStorage(FACULTADES_KEY, updated);
  return updated.find((facultad) => facultad.id === id);
}

export function agregarCarrera(facultadId: string, nombre: string) {
  const carrera: CarreraCatalogo = { id: createId("car"), nombre: nombre.trim(), activo: true };
  const facultad = getFacultadById(facultadId);
  if (!facultad) return undefined;
  actualizarFacultad(facultadId, { carreras: [...facultad.carreras, carrera] });
  return carrera;
}

export function actualizarCarrera(facultadId: string, carreraId: string, changes: Partial<CarreraCatalogo>) {
  const facultad = getFacultadById(facultadId);
  if (!facultad) return undefined;
  const carreras = facultad.carreras.map((carrera) =>
    carrera.id === carreraId ? { ...carrera, ...changes, id: carreraId } : carrera,
  );
  actualizarFacultad(facultadId, { carreras });
}

export function agregarProgramaPosgrado(facultadId: string, nombre: string) {
  const posgrado: ProgramaPosgradoCatalogo = { id: createId("pos"), nombre: nombre.trim(), activo: true };
  const facultad = getFacultadById(facultadId);
  if (!facultad) return undefined;
  actualizarFacultad(facultadId, { posgrados: [...facultad.posgrados, posgrado] });
  return posgrado;
}

export function obtenerCarrerasPorFacultad(facultadId?: string) {
  const facultad = getFacultadById(facultadId);
  return (facultad?.carreras ?? []).filter((carrera) => carrera.activo);
}

export function obtenerPosgradosPorFacultad(facultadId?: string) {
  const facultad = getFacultadById(facultadId);
  return (facultad?.posgrados ?? []).filter((posgrado) => posgrado.activo);
}

export function obtenerCiclos(): CicloCatalogo[] {
  return readStorage(CICLOS_KEY, seedCiclos);
}

export function obtenerCiclosActivos() {
  return obtenerCiclos().filter((ciclo) => ciclo.activo);
}

export function guardarCiclo(nombre: string) {
  const ciclos = obtenerCiclos();
  const nuevo: CicloCatalogo = { id: createId("cic"), nombre: nombre.trim(), activo: true };
  writeStorage(CICLOS_KEY, [...ciclos, nuevo]);
  return nuevo;
}

export function actualizarCiclo(id: string, changes: Partial<CicloCatalogo>) {
  const updated = obtenerCiclos().map((ciclo) => (ciclo.id === id ? { ...ciclo, ...changes, id } : ciclo));
  writeStorage(CICLOS_KEY, updated);
  return updated.find((ciclo) => ciclo.id === id);
}

export function obtenerPeriodosAcademicos(): PeriodoAcademicoCatalogo[] {
  return readStorage(PERIODOS_KEY, seedPeriodos);
}

export function obtenerPeriodosAcademicosActivos() {
  return obtenerPeriodosAcademicos().filter((periodo) => periodo.activo);
}

export function guardarPeriodoAcademico(periodo: {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  tipo: "ordinario" | "interciclo";
}) {
  const periodos = obtenerPeriodosAcademicos();
  const nuevo: PeriodoAcademicoCatalogo = {
    id: createId("per"),
    nombre: periodo.nombre.trim(),
    fechaInicio: periodo.fechaInicio,
    fechaFin: periodo.fechaFin,
    tipo: periodo.tipo,
    activo: true,
  };
  writeStorage(PERIODOS_KEY, [...periodos, nuevo]);
  return nuevo;
}

export function actualizarPeriodoAcademico(id: string, changes: Partial<PeriodoAcademicoCatalogo>) {
  const updated = obtenerPeriodosAcademicos().map((periodo) =>
    periodo.id === id ? { ...periodo, ...changes, id } : periodo,
  );
  writeStorage(PERIODOS_KEY, updated);
  return updated.find((periodo) => periodo.id === id);
}

export function getPeriodoAcademicoActivo(fecha: Date = new Date()) {
  const value = fecha.toISOString().slice(0, 10);
  return obtenerPeriodosAcademicosActivos().find(
    (periodo) => periodo.fechaInicio <= value && value <= periodo.fechaFin,
  );
}

export function obtenerDependencias(): DependenciaCatalogo[] {
  return readStorage(DEPENDENCIAS_KEY, seedDependencias);
}

export function obtenerDependenciasActivas() {
  return obtenerDependencias().filter((dependencia) => dependencia.activo);
}

export function guardarDependencia(nombre: string) {
  const dependencias = obtenerDependencias();
  const nueva: DependenciaCatalogo = { id: createId("dep"), nombre: nombre.trim(), activo: true };
  writeStorage(DEPENDENCIAS_KEY, [...dependencias, nueva]);
  return nueva;
}

export function actualizarDependencia(id: string, changes: Partial<DependenciaCatalogo>) {
  const updated = obtenerDependencias().map((dependencia) =>
    dependencia.id === id ? { ...dependencia, ...changes, id } : dependencia,
  );
  writeStorage(DEPENDENCIAS_KEY, updated);
  return updated.find((dependencia) => dependencia.id === id);
}
