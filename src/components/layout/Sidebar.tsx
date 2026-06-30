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
};

export function Sidebar({
  activeRole,
  availableRoles,
  serviceName,
  navItems,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();
  const navigationItems = [...navItems, { label: "Perfil", href: "/perfil" }];

  return (
    <aside className="flex min-w-0 flex-col border-r border-[#004A68] bg-[#00577C] text-white lg:w-72">
      <div className="px-4 pb-3 pt-5 lg:px-5 lg:pb-4 lg:pt-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/62">
          Módulo activo
        </p>
        <h2 className="mt-2 text-lg font-bold leading-tight text-white lg:text-xl">
          {serviceName}
        </h2>
        <div className="mt-3 h-1 w-12 rounded-full bg-[#D71920]" />
      </div>
      {availableRoles.length > 1 && (
        <div className="border-t border-white/12 px-4 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/58">
            Accesos
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1.5 lg:overflow-visible lg:pb-0">
            {availableRoles.map((role) => (
              <Link
                key={role}
                href={roleRoutes[role].path}
                className={`block shrink-0 rounded-md px-3 py-2 text-sm font-semibold transition lg:shrink ${
                  role === activeRole
                    ? "bg-[#D71920] text-white shadow-sm"
                    : "text-white/78 hover:bg-white/10 hover:text-white"
                }`}
              >
                {roleRoutes[role].label}
              </Link>
            ))}
          </div>
        </div>
      )}
      <nav className="flex min-w-0 gap-2 overflow-x-auto border-t border-white/12 p-3 lg:block lg:flex-1 lg:space-y-1.5 lg:overflow-visible lg:px-4 lg:py-4">
        {navigationItems.map((item, index) => {
          const isActive =
            pathname === item.href || (pathname === "/" && index === 0);

          return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition lg:shrink ${
              isActive
                ? "bg-[#D71920] text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
                : "text-white/82 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10">
              <ModuleIcon label={item.label} className="h-[18px] w-[18px]" />
            </span>
            <span className="whitespace-nowrap lg:whitespace-normal">
              {item.label}
            </span>
          </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/12 p-3 lg:px-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-md border border-white/18 px-3 py-2.5 text-left text-sm font-semibold text-white/78 transition hover:border-white/35 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/25"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-[18px] w-[18px]"
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
