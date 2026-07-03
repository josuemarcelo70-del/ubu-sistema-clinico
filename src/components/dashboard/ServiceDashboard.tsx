"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { CatalogAdmin } from "@/components/admin/CatalogAdmin";
import { MedicineQueue } from "@/components/clinical/MedicineQueue";
import { TriageFlow } from "@/components/clinical/TriageFlow";
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
  const [activeView, setActiveView] = useState<
    "dashboard" | "medicina-pendientes" | "triaje" | "catalogos"
  >("dashboard");

  if (role === "medicina" && activeView === "medicina-pendientes") {
    return (
      <AppShell role={role}>
        <MedicineQueue onBack={() => setActiveView("dashboard")} />
      </AppShell>
    );
  }

  if (role === "enfermeria" && activeView === "triaje") {
    return (
      <AppShell role={role}>
        <TriageFlow onBack={() => setActiveView("dashboard")} />
      </AppShell>
    );
  }

  if (role === "admin" && activeView === "catalogos") {
    return (
      <AppShell role={role}>
        <CatalogAdmin onBack={() => setActiveView("dashboard")} />
      </AppShell>
    );
  }

  function openDashboardItem(label: string) {
    if (role === "medicina" && label === "Atenciones pendientes") {
      setActiveView("medicina-pendientes");
      return;
    }
    if (role === "enfermeria" && label === "Triaje") {
      setActiveView("triaje");
      return;
    }
    if (role === "admin" && label === "Catálogos") {
      setActiveView("catalogos");
    }
  }

  return (
    <AppShell role={role}>
      <section className="dashboard-fade mx-auto max-w-7xl space-y-5">
        <div className="relative overflow-hidden rounded-lg border border-[#C9DAE5] bg-[#062B49] shadow-[0_18px_46px_rgba(8,47,73,0.12)]">
          <Image
            src={serviceHeroImages[role]}
            alt={`Imagen institucional de ${routeConfig.label}`}
            fill
            priority
            sizes="(min-width: 1280px) 1180px, 100vw"
            className="object-cover opacity-95"
          />
          <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(6,43,73,0.93)_0%,rgba(0,91,132,0.76)_52%,rgba(6,43,73,0.26)_100%)]" />
          <div className="relative min-h-[164px] px-5 py-5 sm:min-h-[176px] sm:px-6 lg:min-h-[190px] lg:px-7">
            <div className="absolute inset-y-0 left-0 w-1 bg-[#D71920]" />
            <div className="flex h-full min-h-[124px] flex-col justify-between gap-6">
              <div className="h-1 w-36 bg-[#D71920]" />
              <div className="flex flex-col justify-end gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <h1 className="text-3xl font-bold leading-tight text-white sm:text-[34px] lg:text-[38px]">
                    {routeConfig.label}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/86 sm:text-[15px]">
                    {serviceSubtitles[role]}
                  </p>
                </div>
                <div className="w-fit border border-white/18 bg-white/12 px-3 py-2 text-sm font-semibold text-white backdrop-blur">
                  {routeConfig.navItems.length} áreas disponibles
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid auto-rows-fr gap-3 md:grid-cols-2 xl:grid-cols-4">
          {routeConfig.navItems.map((item, index) => {
            const isFunctional =
              (role === "medicina" && item.label === "Atenciones pendientes") ||
              (role === "enfermeria" && item.label === "Triaje") ||
              (role === "admin" && item.label === "Catálogos");
            const cardContent = (
              <>
                <div className="h-0.5 bg-[linear-gradient(90deg,#D71920_0%,#D71920_30%,#005B84_30%,#E5EEF4_30%,#E5EEF4_100%)]" />
                <div className="flex flex-1 flex-col p-3.5">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#EEF6FA] text-[#005B84] ring-1 ring-[#D7E3EC] transition group-hover:bg-[#005B84] group-hover:text-white">
                      <ModuleIcon label={item.label} className="h-[18px] w-[18px]" />
                    </span>
                    <span className="rounded bg-[#F5F8FB] px-2 py-0.5 text-[10px] font-bold text-[#062B49] ring-1 ring-[#D7E3EC]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h2 className="mt-3 text-[15px] font-bold leading-snug text-[#082F49]">
                    {item.label}
                  </h2>
                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-[#64748B]">
                    {navDescriptions[item.label] ?? "Gestión del servicio."}
                  </p>
                  <div className="mt-auto flex items-center justify-end pt-3">
                    <span className="text-xs font-bold text-[#005B84] transition group-hover:text-[#D71920]">
                      Abrir
                    </span>
                  </div>
                </div>
              </>
            );

            if (isFunctional) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => openDashboardItem(item.label)}
                  className="dashboard-card group flex min-h-[132px] flex-col overflow-hidden rounded-lg border border-[#D7E3EC] bg-white text-left shadow-[0_8px_22px_rgba(8,47,73,0.055)] transition hover:-translate-y-0.5 hover:border-[#BFD2DE] hover:shadow-[0_16px_30px_rgba(8,47,73,0.1)] focus:outline-none focus:ring-2 focus:ring-[#005B84]/20"
                >
                  {cardContent}
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className="dashboard-card group flex min-h-[132px] flex-col overflow-hidden rounded-lg border border-[#D7E3EC] bg-white shadow-[0_8px_22px_rgba(8,47,73,0.055)] transition hover:-translate-y-0.5 hover:border-[#BFD2DE] hover:shadow-[0_16px_30px_rgba(8,47,73,0.1)] focus:outline-none focus:ring-2 focus:ring-[#005B84]/20"
              >
                {cardContent}
              </Link>
            );
          })}
        </div>

        {role === "admin" && <AdminUsersPanel />}
      </section>
    </AppShell>
  );
}

function AdminUsersPanel() {
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, "activo" | "inactivo">
  >({});

  function toggleStatus(userId: string, currentEstado: "activo" | "inactivo") {
    const nextEstado = currentEstado === "activo" ? "inactivo" : "activo";
    setStatusOverrides((current) => ({ ...current, [userId]: nextEstado }));
  }

  return (
    <section className="panel-slide overflow-hidden rounded-lg border border-[#D7E3EC] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#D7E3EC] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFD_100%)] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#005B84]">
            Administración
          </p>
          <h2 className="mt-1 text-[17px] font-bold text-[#082F49]">
            Usuarios del sistema
          </h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="rounded-md border border-[#D7E3EC] bg-white px-3 py-1.5 text-xs font-semibold text-[#64748B]">
            {mockUsers.length} usuarios registrados
          </div>
          <button
            type="button"
            className="w-fit rounded-md bg-[#062B49] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#005B84] focus:outline-none focus:ring-2 focus:ring-[#005B84]/30"
          >
            Crear usuario
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[860px] w-full border-collapse text-left text-sm">
          <thead className="bg-[#EEF6FA] text-xs uppercase tracking-wide text-[#64748B]">
            <tr>
              <th className="px-4 py-2.5 font-bold">Nombre completo</th>
              <th className="px-4 py-2.5 font-bold">Username</th>
              <th className="px-4 py-2.5 font-bold">Cargo</th>
              <th className="px-4 py-2.5 font-bold">Dependencia</th>
              <th className="px-4 py-2.5 font-bold">Roles</th>
              <th className="px-4 py-2.5 font-bold">Estado</th>
              <th className="px-4 py-2.5 font-bold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D7E3EC]">
            {mockUsers.map((user) => {
              const estado = statusOverrides[user.id] ?? user.estado;

              return (
                <tr key={user.id} className="text-[#082F49] transition hover:bg-[#F8FBFD]">
                  <td className="px-4 py-3 font-semibold">
                    {`${user.nombres} ${user.apellidos}`.trim()}
                  </td>
                  <td className="px-4 py-3 text-[#64748B]">{user.username}</td>
                  <td className="px-4 py-3 text-[#64748B]">{user.cargo}</td>
                  <td className="px-4 py-3 text-[#64748B]">
                    {user.dependencia}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className="rounded-full bg-[#EEF6FA] px-2 py-0.5 text-[11px] font-bold text-[#005B84]"
                        >
                          {roleRoutes[role].label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        estado === "activo"
                          ? "bg-[#ECFDF3] text-[#16A34A]"
                          : "bg-[#FEF2F2] text-[#B91C1C]"
                      }`}
                    >
                      {estado === "activo" ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-md border border-[#D7E3EC] px-2.5 py-1.5 text-xs font-semibold text-[#082F49] transition hover:border-[#005B84] hover:text-[#005B84]">
                        Editar
                      </button>
                      {estado === "activo" ? (
                        <button
                          type="button"
                          onClick={() => toggleStatus(user.id, estado)}
                          className="rounded-md border border-[#D7E3EC] px-2.5 py-1.5 text-xs font-semibold text-[#D71920] transition hover:border-[#D71920] hover:bg-[#FEF2F2]"
                        >
                          Desactivar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleStatus(user.id, estado)}
                          className="rounded-md border border-[#D7E3EC] px-2.5 py-1.5 text-xs font-semibold text-[#16A34A] transition hover:border-[#16A34A] hover:bg-[#ECFDF3]"
                        >
                          Reactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-[#D7E3EC] bg-[#F8FBFD] px-4 py-2.5 text-xs font-medium text-[#64748B]">
        Los usuarios se desactivan o reactivan conservando su historial.
      </div>
    </section>
  );
}
