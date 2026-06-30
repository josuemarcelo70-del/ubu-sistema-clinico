import type { Role, RoleRouteConfig } from "@/types/auth";

export const roleRoutes: Record<Role, RoleRouteConfig> = {
  medicina: {
    role: "medicina",
    label: "Medicina",
    path: "/medicina",
    navItems: [
      { label: "Atenciones pendientes", href: "/medicina" },
      { label: "Pacientes", href: "/medicina" },
      { label: "Historia clínica", href: "/medicina" },
      { label: "Certificados", href: "/medicina" },
      { label: "Solicitudes de laboratorio", href: "/medicina" },
      { label: "Prescripciones", href: "/medicina" },
      { label: "Informe mensual", href: "/medicina" },
    ],
  },
  enfermeria: {
    role: "enfermeria",
    label: "Enfermería",
    path: "/enfermeria",
    navItems: [
      { label: "Triaje", href: "/enfermeria" },
      { label: "Signos vitales", href: "/enfermeria" },
      { label: "Derivaciones", href: "/enfermeria" },
      { label: "Indicaciones pendientes", href: "/enfermeria" },
      { label: "Procedimientos", href: "/enfermeria" },
      { label: "Informe mensual", href: "/enfermeria" },
    ],
  },
  laboratorio: {
    role: "laboratorio",
    label: "Laboratorio Clínico",
    path: "/laboratorio",
    navItems: [
      { label: "Solicitudes pendientes", href: "/laboratorio" },
      { label: "Registro de resultados", href: "/laboratorio" },
      { label: "Catálogo de pruebas", href: "/laboratorio" },
      { label: "Reportes emitidos", href: "/laboratorio" },
      { label: "Informe mensual", href: "/laboratorio" },
    ],
  },
  odontologia: {
    role: "odontologia",
    label: "Odontología",
    path: "/odontologia",
    navItems: [
      { label: "Atenciones odontológicas", href: "/odontologia" },
      { label: "Odontograma", href: "/odontologia" },
      { label: "Procedimientos", href: "/odontologia" },
      { label: "Certificados", href: "/odontologia" },
      { label: "Informe mensual", href: "/odontologia" },
    ],
  },
  psicologia: {
    role: "psicologia",
    label: "Psicología Clínica",
    path: "/psicologia",
    navItems: [
      { label: "Atenciones psicológicas", href: "/psicologia" },
      { label: "Sesiones", href: "/psicologia" },
      { label: "Seguimientos", href: "/psicologia" },
      { label: "Referencias", href: "/psicologia" },
      { label: "Informe mensual", href: "/psicologia" },
    ],
  },
  farmacia: {
    role: "farmacia",
    label: "Farmacia",
    path: "/farmacia",
    navItems: [
      { label: "Prescripciones pendientes", href: "/farmacia" },
      { label: "Entrega de medicamentos", href: "/farmacia" },
      { label: "Stock", href: "/farmacia" },
      { label: "Kardex", href: "/farmacia" },
      { label: "Alertas", href: "/farmacia" },
      { label: "Informe mensual", href: "/farmacia" },
    ],
  },
  admin: {
    role: "admin",
    label: "Administración",
    path: "/admin",
    navItems: [
      { label: "Usuarios", href: "/admin" },
      { label: "Roles", href: "/admin" },
      { label: "Catálogos", href: "/admin" },
      { label: "Plantillas", href: "/admin" },
      { label: "Auditoría", href: "/admin" },
      { label: "Configuración", href: "/admin" },
    ],
  },
};

export const loginRedirectByRole = Object.fromEntries(
  Object.values(roleRoutes).map(({ role, path }) => [role, path]),
) as Record<Role, string>;

export const allowedRoutesByRole = Object.fromEntries(
  Object.values(roleRoutes).map(({ role, path }) => [role, [path, "/perfil"]]),
) as Record<Role, string[]>;
