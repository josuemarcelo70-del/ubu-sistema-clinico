import Image from "next/image";

import { AppShell } from "@/components/layout/AppShell";
import { ModuleIcon } from "@/components/ui/ModuleIcon";
import { mockUsers } from "@/lib/mock-users";
import { roleRoutes } from "@/lib/routes";
import type { Role } from "@/types/auth";

type ServiceDashboardProps = {
  role: Role;
};

const navDescriptions: Record<string, string> = {
  "Atenciones pendientes": "Pacientes derivados para atención.",
  Pacientes: "Registro y búsqueda de pacientes.",
  "Historia clínica": "Archivo clínico del paciente.",
  Certificados: "Emisión de certificados.",
  "Solicitudes de laboratorio": "Órdenes y resultados.",
  Prescripciones: "Medicamentos indicados.",
  "Informe mensual": "Consolidado del servicio.",
  Triaje: "Recepción y prioridad clínica.",
  "Signos vitales": "Registro de controles básicos.",
  Derivaciones: "Canalización entre servicios.",
  "Indicaciones pendientes": "Tareas clínicas por completar.",
  Procedimientos: "Registro de procedimientos.",
  "Solicitudes pendientes": "Órdenes por procesar.",
  "Registro de resultados": "Carga y revisión de resultados.",
  "Catálogo de pruebas": "Pruebas disponibles del servicio.",
  "Reportes emitidos": "Informes entregados.",
  "Atenciones odontológicas": "Consultas y tratamientos dentales.",
  Odontograma: "Mapa dental del paciente.",
  "Atenciones psicológicas": "Consultas del servicio.",
  Sesiones: "Registro de sesiones clínicas.",
  Seguimientos: "Control de evolución.",
  Referencias: "Derivaciones y referencias.",
  "Prescripciones pendientes": "Recetas por despachar.",
  "Entrega de medicamentos": "Dispensación registrada.",
  Stock: "Disponibilidad de medicamentos.",
  Kardex: "Movimientos de inventario.",
  Alertas: "Avisos operativos del servicio.",
  Usuarios: "Administración de cuentas.",
  Roles: "Asignación de perfiles.",
  Catálogos: "Parámetros institucionales.",
  Plantillas: "Formatos del sistema.",
  Auditoría: "Revisión de actividad.",
  Configuración: "Ajustes generales.",
};

const serviceHeroImages: Record<Role, string> = {
  medicina: "/brand/services/publicbrandservicesmedicina-consulta.jpg",
  enfermeria: "/brand/services/publicbrandservicesenfermeria-valoracion.jpg",
  laboratorio: "/brand/services/publicbrandserviceslaboratorio-procesamiento.jpg",
  odontologia: "/brand/services/publicbrandservicesodontologia-atencion.jpg",
  psicologia: "/brand/photos/publicbrandphotosbloques-unl.jpg",
  farmacia: "/brand/services/publicbrandservicesfarmacia-dispensacion.jpg",
  admin: "/brand/photos/publicbrandphotoscampus-aereo-unl.jpg",
};

const serviceSubtitles: Record<Role, string> = {
  medicina: "Atención médica y seguimiento clínico.",
  enfermeria: "Valoración, triaje y procedimientos.",
  laboratorio: "Gestión de órdenes y resultados.",
  odontologia: "Atención odontológica institucional.",
  psicologia: "Acompañamiento y seguimiento clínico.",
  farmacia: "Dispensación e inventario de medicamentos.",
  admin: "Gestión institucional del sistema.",
};

export function ServiceDashboard({ role }: ServiceDashboardProps) {
  const routeConfig = roleRoutes[role];

  return (
    <AppShell role={role}>
      <section className="dashboard-fade mx-auto max-w-7xl space-y-5">
        <div className="relative overflow-hidden rounded-lg border border-[#D9E5EC] bg-[#0B2E59] shadow-[0_18px_45px_rgba(8,47,73,0.08)]">
          <Image
            src={serviceHeroImages[role]}
            alt={`Imagen institucional de ${routeConfig.label}`}
            fill
            priority
            sizes="(min-width: 1280px) 1180px, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,46,89,0.93),rgba(0,91,132,0.78),rgba(11,46,89,0.52))]" />
          <div className="relative min-h-48 px-5 py-6 sm:px-7">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-[#D71920]" />
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/78">
              Unidad de Bienestar Universitario
            </p>
            <div className="mt-3 flex min-h-28 flex-col justify-end gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
                  {routeConfig.label}
                </h1>
                <p className="mt-3 text-sm font-medium leading-6 text-white/84">
                  {serviceSubtitles[role]}
                </p>
              </div>
              <span className="inline-flex w-fit rounded-full border border-white/25 bg-white/12 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white">
                UNL
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {routeConfig.navItems.map((item, index) => (
            <article
              key={item.label}
              className="dashboard-card group overflow-hidden rounded-lg border border-[#D9E5EC] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#BFD2DE] hover:shadow-[0_18px_36px_rgba(8,47,73,0.11)]"
            >
              <div className="h-1 bg-[#0B2E59]">
                <div className="h-1 w-16 bg-[#D71920] transition group-hover:w-24" />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#EAF3F8] text-[#005B84] ring-1 ring-[#D9E5EC]">
                    <ModuleIcon label={item.label} />
                  </span>
                  <span className="rounded-full bg-[#F4F8FB] px-2.5 py-1 text-xs font-bold text-[#0B2E59] ring-1 ring-[#D9E5EC]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h2 className="mt-5 text-base font-bold text-[#082F49]">
                  {item.label}
                </h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-[#64748B]">
                  {navDescriptions[item.label] ?? "Gestión del servicio."}
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-[#D9E5EC] pt-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                    Estado
                  </span>
                  <span className="rounded-full bg-[#ECFDF3] px-2.5 py-1 text-xs font-bold text-[#16A34A]">
                    Disponible
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {role === "admin" && <AdminUsersPanel />}
      </section>
    </AppShell>
  );
}

function AdminUsersPanel() {
  return (
    <section className="overflow-hidden rounded-lg border border-[#D9E5EC] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#D9E5EC] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#005B84]">
            Administración
          </p>
          <h2 className="mt-1 text-lg font-bold text-[#082F49]">
            Usuarios del sistema
          </h2>
        </div>
        <button
          type="button"
          className="w-fit rounded-md bg-[#0B2E59] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#005B84] focus:outline-none focus:ring-2 focus:ring-[#005B84]/30"
        >
          Crear usuario
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[860px] w-full border-collapse text-left text-sm">
          <thead className="bg-[#F4F8FB] text-xs uppercase tracking-wide text-[#64748B]">
            <tr>
              <th className="px-5 py-3 font-bold">Nombre completo</th>
              <th className="px-5 py-3 font-bold">Username</th>
              <th className="px-5 py-3 font-bold">Cargo</th>
              <th className="px-5 py-3 font-bold">Dependencia</th>
              <th className="px-5 py-3 font-bold">Roles</th>
              <th className="px-5 py-3 font-bold">Estado</th>
              <th className="px-5 py-3 font-bold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9E5EC]">
            {mockUsers.map((user) => (
              <tr key={user.id} className="text-[#082F49]">
                <td className="px-5 py-4 font-semibold">
                  {`${user.nombres} ${user.apellidos}`.trim()}
                </td>
                <td className="px-5 py-4 text-[#64748B]">{user.username}</td>
                <td className="px-5 py-4 text-[#64748B]">{user.cargo}</td>
                <td className="px-5 py-4 text-[#64748B]">
                  {user.dependencia}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className="rounded-full bg-[#EAF4FA] px-2.5 py-1 text-xs font-bold text-[#005B84]"
                      >
                        {roleRoutes[role].label}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      user.estado === "activo"
                        ? "bg-[#ECFDF3] text-[#16A34A]"
                        : "bg-[#FEF2F2] text-[#B91C1C]"
                    }`}
                  >
                    {user.estado === "activo" ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-md border border-[#D9E5EC] px-2.5 py-1.5 text-xs font-semibold text-[#082F49] transition hover:border-[#005B84] hover:text-[#005B84]">
                      Editar
                    </button>
                    {user.estado === "activo" ? (
                      <button className="rounded-md border border-[#D9E5EC] px-2.5 py-1.5 text-xs font-semibold text-[#D71920] transition hover:border-[#D71920]">
                        Desactivar
                      </button>
                    ) : (
                      <button className="rounded-md border border-[#D9E5EC] px-2.5 py-1.5 text-xs font-semibold text-[#16A34A] transition hover:border-[#16A34A]">
                        Reactivar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-[#D9E5EC] bg-[#F8FBFD] px-5 py-3 text-xs font-medium text-[#64748B]">
        Los usuarios se desactivan o reactivan conservando su historial.
      </div>
    </section>
  );
}
