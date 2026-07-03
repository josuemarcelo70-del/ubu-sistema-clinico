export const facultades = [
  {
    id: "fsh",
    nombre: "Facultad de la Salud Humana",
    carreras: [
      { id: "medicina", nombre: "Medicina" },
      { id: "enfermeria", nombre: "Enfermería" },
      { id: "laboratorio", nombre: "Laboratorio Clínico" },
    ],
    posgrados: [
      { id: "epidemiologia", nombre: "Maestría en Epidemiología" },
      { id: "salud-publica", nombre: "Maestría en Salud Pública" },
    ],
  },
  {
    id: "fjsa",
    nombre: "Facultad Jurídica, Social y Administrativa",
    carreras: [
      { id: "derecho", nombre: "Derecho" },
      { id: "administracion", nombre: "Administración de Empresas" },
      { id: "contabilidad", nombre: "Contabilidad y Auditoría" },
    ],
    posgrados: [
      { id: "derecho-procesal", nombre: "Maestría en Derecho Procesal" },
      { id: "gestion-publica", nombre: "Maestría en Gestión Pública" },
    ],
  },
  {
    id: "fed",
    nombre: "Facultad de la Educación, el Arte y la Comunicación",
    carreras: [
      { id: "educacion-basica", nombre: "Educación Básica" },
      { id: "psicopedagogia", nombre: "Psicopedagogía" },
      { id: "comunicacion", nombre: "Comunicación" },
    ],
    posgrados: [
      { id: "educacion", nombre: "Maestría en Educación" },
      { id: "comunicacion-digital", nombre: "Maestría en Comunicación Digital" },
    ],
  },
  {
    id: "farnr",
    nombre: "Facultad Agropecuaria y de Recursos Naturales Renovables",
    carreras: [
      { id: "agronomia", nombre: "Agronomía" },
      { id: "veterinaria", nombre: "Medicina Veterinaria" },
      { id: "forestal", nombre: "Ingeniería Forestal" },
    ],
    posgrados: [
      { id: "agroecologia", nombre: "Maestría en Agroecología" },
      { id: "recursos-naturales", nombre: "Maestría en Recursos Naturales" },
    ],
  },
  {
    id: "fiet",
    nombre: "Facultad de la Energía, las Industrias y los Recursos Naturales no Renovables",
    carreras: [
      { id: "software", nombre: "Computación" },
      { id: "electromecanica", nombre: "Electromecánica" },
      { id: "telecomunicaciones", nombre: "Telecomunicaciones" },
    ],
    posgrados: [
      { id: "software-posgrado", nombre: "Maestría en Ingeniería de Software" },
      { id: "energia", nombre: "Maestría en Energía" },
    ],
  },
];

export const periodosAcademicos = [
  { id: "2026-1", nombre: "Abril 2026 - Septiembre 2026" },
  { id: "2026-2", nombre: "Octubre 2026 - Marzo 2027" },
];

export const ciclos = [
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
];

export function getFacultadById(id?: string) {
  return facultades.find((facultad) => facultad.id === id);
}
