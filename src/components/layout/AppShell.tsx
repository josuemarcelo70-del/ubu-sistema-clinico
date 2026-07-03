"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  SIMULATED_SESSION_KEY,
  type SimulatedSession,
} from "@/lib/mock-users";
import { roleRoutes } from "@/lib/routes";
import type { Role } from "@/types/auth";

type AppShellProps = {
  role?: Role;
  serviceName?: string;
  children: React.ReactNode;
};

export function AppShell({ role, serviceName, children }: AppShellProps) {
  const router = useRouter();
  const [session, setSession] = useState<SimulatedSession | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    function loadSession() {
      const storedSession = localStorage.getItem(SIMULATED_SESSION_KEY);

      if (!storedSession) {
        router.replace("/login");
        return;
      }

      const parsedSession = JSON.parse(storedSession) as SimulatedSession;
      const activeRole =
        role ??
        (parsedSession.roles.includes(parsedSession.activeRole)
          ? parsedSession.activeRole
          : parsedSession.servicioPrincipal);

      if (!parsedSession.roles.includes(activeRole)) {
        router.replace("/acceso-denegado");
        return;
      }

      const currentSession = { ...parsedSession, activeRole };
      localStorage.setItem(SIMULATED_SESSION_KEY, JSON.stringify(currentSession));
      setSession(currentSession);
      setIsCheckingSession(false);
    }

    function handleSessionUpdated() {
      try {
        loadSession();
      } catch {
        localStorage.removeItem(SIMULATED_SESSION_KEY);
        router.replace("/login");
      }
    }

    const stateUpdateTimer = setTimeout(handleSessionUpdated, 0);

    window.addEventListener("ubu-session-updated", handleSessionUpdated);

    return () => {
      clearTimeout(stateUpdateTimer);
      window.removeEventListener("ubu-session-updated", handleSessionUpdated);
    };
  }, [role, router]);

  function handleLogout() {
    localStorage.removeItem(SIMULATED_SESSION_KEY);
    router.replace("/login");
  }

  if (isCheckingSession || !session) {
    return (
      <div className="min-h-screen bg-[#F4F8FB]" aria-label="Cargando sesión" />
    );
  }

  const routeConfig = roleRoutes[session.activeRole];

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#F5F8FB] text-[#082F49]">
      <div className="flex min-h-dvh">
        {isSidebarOpen && (
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-[#062B49]/45 backdrop-blur-[1px] lg:hidden"
          />
        )}
        <Sidebar
          activeRole={session.activeRole}
          availableRoles={session.roles}
          serviceName={routeConfig.label}
          navItems={routeConfig.navItems}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            serviceName={serviceName ?? routeConfig.label}
            session={session}
            onMenuClick={() => setIsSidebarOpen(true)}
          />
          <main className="min-w-0 flex-1 bg-[#F5F8FB] px-4 py-4 sm:px-6 lg:px-6 lg:py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
