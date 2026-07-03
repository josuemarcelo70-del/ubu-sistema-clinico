"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ModuleIcon } from "@/components/ui/ModuleIcon";
import { roleRoutes } from "@/lib/routes";
import type { NavItem, Role } from "@/types/auth";

type SidebarProps = {
  activeRole: Role;
  availableRoles: Role[];
  serviceName: string;
  navItems: NavItem[];
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
};

export function Sidebar({
  activeRole,
  availableRoles,
  serviceName,
  navItems,
  onLogout,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const navigationItems = [...navItems, { label: "Perfil", href: "/perfil" }];
  const firstMatchIndex = navigationItems.findIndex(
    (item) => item.href === pathname,
  );
  const activeIndex =
    firstMatchIndex === -1 && pathname === "/" ? 0 : firstMatchIndex;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-dvh min-h-dvh w-[min(84vw,268px)] min-w-0 flex-col bg-[linear-gradient(180deg,#005B84_0%,#005174_56%,#063A5C_100%)] text-white shadow-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:z-20 lg:w-[252px] lg:translate-x-0 lg:shadow-none ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex min-h-[112px] items-start justify-between gap-3 border-b border-white/12 px-4 py-4">
        <div className="min-w-0">
          <div className="border-l-4 border-[#D71920] pl-3">
            <p className="text-[11px] font-bold uppercase leading-none tracking-[0.18em] text-white/68">
              UBU
            </p>
            <p className="mt-2 text-sm font-bold leading-tight text-white">
              Sistema Integral
            </p>
            <p className="mt-0.5 text-xs font-semibold leading-tight text-white/80">
              Gestión Clínica
            </p>
          </div>
          <div className="mt-3 min-w-0">
            <p className="text-xs font-semibold leading-snug text-white/90">
              Bienestar Universitario
            </p>
            <p className="mt-0.5 truncate text-[11px] font-medium text-white/68">
              {serviceName}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar menú"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/10 text-white/78 transition hover:bg-white/16 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/25 lg:hidden"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            className="h-4 w-4"
          >
            <path d="M6 6l12 12" />
            <path d="M18 6L6 18" />
          </svg>
        </button>
      </div>
      {availableRoles.length > 1 && (
        <div className="border-b border-white/12 px-3 py-2.5">
          <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase text-white/58">
            Accesos
          </p>
          <div className="ubu-scrollbar flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
            {availableRoles.map((role) => (
              <Link
                key={role}
                href={roleRoutes[role].path}
                onClick={onClose}
                className={`block shrink-0 rounded-md px-2.5 py-1.5 text-xs font-semibold transition lg:shrink ${
                  role === activeRole
                    ? "bg-white/16 text-white ring-1 ring-white/16"
                    : "text-white/76 hover:bg-white/10 hover:text-white"
                }`}
              >
                {roleRoutes[role].label}
              </Link>
            ))}
          </div>
        </div>
      )}
      <nav className="ubu-scrollbar flex min-w-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
        {navigationItems.map((item, index) => {
          const isActive = index === activeIndex;

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={`group flex min-h-10 shrink-0 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition ${
                isActive
                  ? "bg-[#D71920] text-white shadow-[0_10px_22px_rgba(0,0,0,0.16)]"
                  : "text-white/82 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition ${
                  isActive
                    ? "text-white"
                    : "text-white/82 group-hover:text-white"
                }`}
              >
                <ModuleIcon label={item.label} className="h-4 w-4" />
              </span>
              <span className="min-w-0 leading-snug">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/12 p-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] font-semibold text-white/78 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/25"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
              <path d="M21 3v18" />
            </svg>
          </span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
