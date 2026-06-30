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
    <div className="min-h-screen overflow-x-hidden bg-[#F4F8FB] text-[#082F49]">
      <Header serviceName={serviceName ?? routeConfig.label} session={session} />
      <div className="flex flex-col lg:min-h-[calc(100vh-81px)] lg:flex-row">
        <Sidebar
          activeRole={session.activeRole}
          availableRoles={session.roles}
          serviceName={routeConfig.label}
          navItems={routeConfig.navItems}
          onLogout={handleLogout}
        />
        <main className="flex-1 bg-[#F4F8FB] px-4 py-7 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
