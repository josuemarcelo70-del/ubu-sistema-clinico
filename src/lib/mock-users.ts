import type { Role, UserProfile } from "@/types/auth";

export const SIMULATED_SESSION_KEY = "ubu-sistema-clinico-session";

export type MockUser = {
  id: string;
  nombres: string;
  apellidos: string;
  username: string;
  email: string;
  cargo: string;
  dependencia: string;
  servicioPrincipal: Role;
  roles: Role[];
  password: string;
  estado: "activo" | "inactivo";
  profile: UserProfile;
  debeCambiarPassword: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SimulatedSession = {
  userId: string;
  username: string;
  nombres: string;
  apellidos: string;
  cargo: string;
  dependencia: string;
  roles: Role[];
  servicioPrincipal: Role;
  activeRole: Role;
  estado: "activo" | "inactivo";
};

function createUserProfile({
  nombres,
  apellidos,
  cedula = "",
  correoInstitucional,
  telefono = "",
  direccionInstitucional = "",
  tituloProfesional,
  cargoInstitucional,
  servicioDependencia,
  tipoContratacion = "",
  fechaInicioContrato = "",
  registroSenescyt = "",
  registroAcess = "",
  cedulaProfesional = "",
  inicialesInforme = "",
  firmaDigitalizada = "",
  selloProfesional = "",
  nombreDocumento,
  responsableInformesMensuales = false,
  puedeEmitirCertificados = false,
  puedeFirmarReportes = false,
  puedeValidarDocumentosExternos = false,
}: {
  nombres: string;
  apellidos: string;
  cedula?: string;
  correoInstitucional: string;
  telefono?: string;
  direccionInstitucional?: string;
  tituloProfesional: string;
  cargoInstitucional: string;
  servicioDependencia: string;
  tipoContratacion?: string;
  fechaInicioContrato?: string;
  registroSenescyt?: string;
  registroAcess?: string;
  cedulaProfesional?: string;
  inicialesInforme?: string;
  firmaDigitalizada?: string;
  selloProfesional?: string;
  nombreDocumento: string;
  responsableInformesMensuales?: boolean;
  puedeEmitirCertificados?: boolean;
  puedeFirmarReportes?: boolean;
  puedeValidarDocumentosExternos?: boolean;
}): UserProfile {
  return {
    nombres,
    apellidos,
    cedula,
    correoInstitucional,
    telefono,
    direccionInstitucional,
    professional: {
      tituloProfesional,
      cargoInstitucional,
      servicioDependencia,
      tipoContratacion,
      fechaInicioContrato,
      registroSenescyt,
      registroAcess,
      cedulaProfesional,
    },
    documentSettings: {
      inicialesInforme,
      firmaDigitalizada,
      selloProfesional,
      nombreDocumento,
      responsableInformesMensuales,
      puedeEmitirCertificados,
      puedeFirmarReportes,
      puedeValidarDocumentosExternos,
    },
  };
}

export const mockUsers: MockUser[] = [
  {
    id: "jhoely-lalangui",
    nombres: "Jhoely",
    apellidos: "Lalangui",
    username: "jhoely.lalangui",
    email: "jhoely.lalangui@unl.edu.ec",
    cargo: "Médico de la Unidad de Bienestar Universitario",
    dependencia: "Medicina",
    servicioPrincipal: "medicina",
    roles: ["medicina"],
    password: "12345678",
    estado: "activo",
    profile: createUserProfile({
      nombres: "Jhoely",
      apellidos: "Lalangui",
      correoInstitucional: "jhoely.lalangui@unl.edu.ec",
      tituloProfesional: "Médico General",
      cargoInstitucional: "Médico de la Unidad de Bienestar Universitario",
      servicioDependencia: "Medicina",
      tipoContratacion: "Nombramiento provisional",
      nombreDocumento: "Md. Jhoely Michelle Lalangui Iñiguez",
      inicialesInforme: "JL",
      puedeEmitirCertificados: true,
      puedeFirmarReportes: true,
      puedeValidarDocumentosExternos: true,
    }),
    debeCambiarPassword: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "josue-chamba",
    nombres: "Josué Marcelo",
    apellidos: "Chamba León",
    username: "josue.chamba",
    email: "josue.chamba@unl.edu.ec",
    cargo: "Médico de la Unidad de Bienestar Universitario",
    dependencia: "Medicina",
    servicioPrincipal: "medicina",
    roles: ["medicina"],
    password: "12345678",
    estado: "activo",
    profile: createUserProfile({
      nombres: "Josué Marcelo",
      apellidos: "Chamba León",
      correoInstitucional: "josue.chamba@unl.edu.ec",
      telefono: "0987716499",
      tituloProfesional: "Médico General",
      cargoInstitucional: "Médico de la Unidad de Bienestar Universitario",
      servicioDependencia: "Medicina",
      registroSenescyt: "1008-2023-2714875",
      nombreDocumento: "Md. Josué Marcelo Chamba León",
      inicialesInforme: "JC",
      puedeEmitirCertificados: true,
      puedeFirmarReportes: true,
      puedeValidarDocumentosExternos: true,
    }),
    debeCambiarPassword: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "psicologia-clinica",
    nombres: "Psicología",
    apellidos: "Clínico",
    username: "psicologia.clinica",
    email: "psicologia@unl.edu.ec",
    cargo: "Psicólogo Clínico de la Unidad de Bienestar Universitario",
    dependencia: "Psicología Clínica",
    servicioPrincipal: "psicologia",
    roles: ["psicologia"],
    password: "12345678",
    estado: "activo",
    profile: createUserProfile({
      nombres: "Psicología",
      apellidos: "Clínico",
      correoInstitucional: "psicologia@unl.edu.ec",
      tituloProfesional: "Psicólogo Clínico",
      cargoInstitucional:
        "Psicólogo Clínico de la Unidad de Bienestar Universitario",
      servicioDependencia: "Psicología Clínica",
      nombreDocumento:
        "Psicólogo/a Clínico/a de la Unidad de Bienestar Universitario",
      puedeEmitirCertificados: false,
      puedeFirmarReportes: true,
      puedeValidarDocumentosExternos: false,
    }),
    debeCambiarPassword: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "enfermeria-bienestar",
    nombres: "Enfermería",
    apellidos: "Bienestar",
    username: "enfermeria.bienestar",
    email: "enfermeria@unl.edu.ec",
    cargo: "Enfermera de la Unidad de Bienestar Universitario",
    dependencia: "Enfermería",
    servicioPrincipal: "enfermeria",
    roles: ["enfermeria", "farmacia"],
    password: "12345678",
    estado: "activo",
    profile: createUserProfile({
      nombres: "Enfermería",
      apellidos: "Bienestar",
      correoInstitucional: "enfermeria@unl.edu.ec",
      tituloProfesional: "Enfermera",
      cargoInstitucional: "Enfermera de la Unidad de Bienestar Universitario",
      servicioDependencia: "Enfermería",
      nombreDocumento: "Enfermera de la Unidad de Bienestar Universitario",
      puedeEmitirCertificados: false,
      puedeFirmarReportes: true,
      puedeValidarDocumentosExternos: false,
    }),
    debeCambiarPassword: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "laboratorio-clinico",
    nombres: "Laboratorio",
    apellidos: "Clínico",
    username: "laboratorio.clinico",
    email: "laboratorio@unl.edu.ec",
    cargo: "Laboratorista de la Unidad de Bienestar Universitario",
    dependencia: "Laboratorio Clínico",
    servicioPrincipal: "laboratorio",
    roles: ["laboratorio"],
    password: "12345678",
    estado: "activo",
    profile: createUserProfile({
      nombres: "Laboratorio",
      apellidos: "Clínico",
      correoInstitucional: "laboratorio@unl.edu.ec",
      tituloProfesional: "Laboratorista",
      cargoInstitucional:
        "Laboratorista de la Unidad de Bienestar Universitario",
      servicioDependencia: "Laboratorio Clínico",
      nombreDocumento:
        "Laboratorista de la Unidad de Bienestar Universitario",
      puedeEmitirCertificados: false,
      puedeFirmarReportes: true,
      puedeValidarDocumentosExternos: false,
    }),
    debeCambiarPassword: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "odontologia-bienestar",
    nombres: "Odontología",
    apellidos: "Bienestar",
    username: "odontologia.bienestar",
    email: "odontologia@unl.edu.ec",
    cargo: "Odontólogo de la Unidad de Bienestar Universitario",
    dependencia: "Odontología",
    servicioPrincipal: "odontologia",
    roles: ["odontologia"],
    password: "12345678",
    estado: "activo",
    profile: createUserProfile({
      nombres: "Odontología",
      apellidos: "Bienestar",
      correoInstitucional: "odontologia@unl.edu.ec",
      tituloProfesional: "Odontólogo",
      cargoInstitucional:
        "Odontólogo de la Unidad de Bienestar Universitario",
      servicioDependencia: "Odontología",
      nombreDocumento: "Odontólogo de la Unidad de Bienestar Universitario",
      puedeEmitirCertificados: true,
      puedeFirmarReportes: true,
      puedeValidarDocumentosExternos: false,
    }),
    debeCambiarPassword: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "administrador",
    nombres: "Administrador",
    apellidos: "",
    username: "admin",
    email: "admin@unl.edu.ec",
    cargo: "Administrador del sistema",
    dependencia: "Administración",
    servicioPrincipal: "admin",
    roles: ["admin"],
    password: "12345678",
    estado: "activo",
    profile: createUserProfile({
      nombres: "Administrador",
      apellidos: "",
      correoInstitucional: "admin@unl.edu.ec",
      tituloProfesional: "Administrador",
      cargoInstitucional: "Administrador del sistema",
      servicioDependencia: "Administración",
      nombreDocumento: "Administrador del sistema",
      puedeEmitirCertificados: false,
      puedeFirmarReportes: false,
      puedeValidarDocumentosExternos: false,
    }),
    debeCambiarPassword: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export function createSimulatedSession(
  user: MockUser,
  activeRole: Role,
): SimulatedSession {
  return {
    userId: user.id,
    username: user.username,
    nombres: user.nombres,
    apellidos: user.apellidos,
    cargo: user.cargo,
    dependencia: user.dependencia,
    roles: user.roles,
    servicioPrincipal: user.servicioPrincipal,
    activeRole,
    estado: user.estado,
  };
}
