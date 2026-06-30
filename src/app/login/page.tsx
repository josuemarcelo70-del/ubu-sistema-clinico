"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  createSimulatedSession,
  mockUsers,
  SIMULATED_SESSION_KEY,
} from "@/lib/mock-users";
import { loginRedirectByRole, roleRoutes } from "@/lib/routes";
import type { Role } from "@/types/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | "">("");
  const [errorMessage, setErrorMessage] = useState("");

  const matchedUser = useMemo(
    () =>
      mockUsers.find(
        (user) => user.username.toLowerCase() === username.trim().toLowerCase(),
      ),
    [username],
  );

  const canSelectModule = Boolean(matchedUser && matchedUser.roles.length > 1);

  function handleUsernameChange(value: string) {
    const user = mockUsers.find(
      (currentUser) =>
        currentUser.username.toLowerCase() === value.trim().toLowerCase(),
    );
    setUsername(value);
    setSelectedRole(user && user.roles.length > 1 ? user.servicioPrincipal : "");
    setErrorMessage("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!matchedUser || matchedUser.password !== password) {
      setErrorMessage("Usuario o contraseña incorrectos.");
      return;
    }

    if (matchedUser.estado !== "activo") {
      setErrorMessage("Usuario inactivo. Contacte al administrador.");
      return;
    }

    const activeRole =
      matchedUser.roles.length > 1
        ? selectedRole || matchedUser.servicioPrincipal
        : matchedUser.servicioPrincipal;

    if (!matchedUser.roles.includes(activeRole)) {
      setErrorMessage("Usuario o contraseña incorrectos.");
      return;
    }

    localStorage.setItem(
      SIMULATED_SESSION_KEY,
      JSON.stringify(createSimulatedSession(matchedUser, activeRole)),
    );

    router.push(loginRedirectByRole[activeRole]);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F4F8FB] text-[#082F49]">
      <div className="login-fade grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.76fr)]">
        <section className="relative min-h-72 overflow-hidden bg-[#0B2E59] lg:min-h-screen">
          <Image
            src="/brand/photos/publicbrandphotosbienestar-entrada.jpg"
            alt="Entrada de Bienestar Universitario"
            fill
            priority
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="subtle-zoom object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(11,46,89,0.9),rgba(0,91,132,0.74))]" />
          <div className="absolute left-0 top-0 h-full w-1.5 bg-[#D71920]" />
          <div className="absolute bottom-6 right-6 hidden h-28 w-28 rounded-full border border-white/12 bg-white/5 lg:block" />
          <div className="relative mx-auto flex h-full min-h-72 max-w-3xl flex-col justify-end px-5 py-7 sm:px-8 lg:min-h-screen lg:justify-center lg:px-12">
            <BrandLogo size="lg" compact />
            <div className="mt-8 max-w-2xl text-white sm:mt-10">
              <div className="mb-5 h-1 w-20 rounded-full bg-[#D71920]" />
              <p className="text-2xl font-bold uppercase leading-tight tracking-wide text-white sm:text-3xl xl:text-[34px]">
                UNIVERSIDAD NACIONAL DE LOJA
              </p>
              <p className="mt-3 text-lg font-semibold text-white/92 sm:text-xl">
                Unidad de Bienestar Universitario
              </p>
              <h1 className="mt-4 text-base font-medium leading-tight text-white/85 sm:text-lg">
                Sistema Integral de Gestión Clínica
              </h1>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="login-card w-full max-w-[410px] rounded-lg border border-[#D9E5EC] bg-white p-6 shadow-[0_22px_52px_rgba(8,47,73,0.13)] sm:p-7">
            <div className="flex justify-center">
              <BrandLogo size="md" compact />
            </div>

            <div className="mt-5 text-center text-[#082F49]">
              <p className="text-xs font-bold uppercase tracking-wide text-[#0B2E59]">
                UNIVERSIDAD NACIONAL DE LOJA
              </p>
              <p className="mt-1.5 text-sm font-semibold text-[#005B84]">
                Unidad de Bienestar Universitario
              </p>
              <h1 className="mt-5 text-xl font-bold tracking-wide">
                INICIAR SESIÓN
              </h1>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-sm font-semibold text-[#082F49]">
                  Usuario
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => handleUsernameChange(event.target.value)}
                  autoComplete="username"
                  className="mt-2 w-full rounded-md border border-[#D9E5EC] bg-[#F8FBFD] px-3.5 py-3 text-sm font-medium text-[#082F49] outline-none transition focus:border-[#005B84] focus:bg-white focus:ring-2 focus:ring-[#005B84]/15"
                />
              </label>

              {canSelectModule && (
                <label className="block">
                  <span className="text-sm font-semibold text-[#082F49]">
                    Módulo
                  </span>
                  <select
                    value={selectedRole}
                    onChange={(event) =>
                      setSelectedRole(event.target.value as Role)
                    }
                    className="mt-2 w-full rounded-md border border-[#D9E5EC] bg-[#F8FBFD] px-3.5 py-3 text-sm font-medium text-[#082F49] outline-none transition focus:border-[#005B84] focus:bg-white focus:ring-2 focus:ring-[#005B84]/15"
                  >
                    {matchedUser?.roles.map((role) => (
                      <option key={role} value={role}>
                        {roleRoutes[role].label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="block">
                <span className="text-sm font-semibold text-[#082F49]">
                  Contraseña
                </span>
                <div className="relative mt-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setErrorMessage("");
                    }}
                    autoComplete="current-password"
                    className="w-full rounded-md border border-[#D9E5EC] bg-[#F8FBFD] px-3.5 py-3 pr-11 text-sm font-medium text-[#082F49] outline-none transition focus:border-[#005B84] focus:bg-white focus:ring-2 focus:ring-[#005B84]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[#64748B] transition hover:text-[#005B84] focus:outline-none focus:ring-2 focus:ring-[#005B84]/30"
                  >
                    {showPassword ? (
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
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.4 5.5A10.4 10.4 0 0 1 12 5c5 0 9 4 10 7a12 12 0 0 1-3.2 4.3M6.5 6.7C4.6 8 3 9.9 2 12c1 3 5 7 10 7 1.2 0 2.3-.2 3.4-.6" />
                      </svg>
                    ) : (
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
                        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </label>

              {errorMessage && (
                <p className="login-error rounded-md bg-[#FEF2F2] px-3 py-2 text-sm font-medium text-[#B91C1C]">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-md bg-[#0B2E59] px-4 py-3 text-sm font-bold tracking-wide text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#005B84] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#005B84] focus:ring-offset-2"
              >
                INICIAR SESIÓN
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
