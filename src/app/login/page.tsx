"use client";

import Image from "next/image";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  createSimulatedSession,
  mockUsers,
  SIMULATED_SESSION_KEY,
} from "@/lib/mock-users";
import { loginRedirectByRole, roleRoutes } from "@/lib/routes";
import type { Role } from "@/types/auth";

const institutionalValues = [
  {
    label: "Atención centrada en la persona",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M12 21s-7-4.3-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 11c0 5.7-7 10-7 10Z" />
      </svg>
    ),
  },
  {
    label: "Confidencialidad y seguridad",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M12 22s8-3.8 8-10V5l-8-3-8 3v7c0 6.2 8 10 8 10Z" />
        <path d="m9.5 12 1.7 1.7 3.8-4" />
      </svg>
    ),
  },
  {
    label: "Bienestar integral universitario",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M12 3v18" />
        <path d="M18 7c-3.6 0-6 2.4-6 6 3.6 0 6-2.4 6-6Z" />
        <path d="M6 7c3.6 0 6 2.4 6 6-3.6 0-6-2.4-6-6Z" />
      </svg>
    ),
  },
];

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
    <main className="min-h-screen overflow-x-hidden bg-[#F5F8FB] font-sans text-[#082F49] lg:h-screen lg:overflow-hidden">
      <div className="login-fade grid min-h-screen lg:h-screen lg:grid-cols-[minmax(0,3fr)_minmax(420px,2fr)]">
        <section className="relative min-h-[500px] overflow-hidden bg-[#031B34] lg:h-screen lg:min-h-0">
          <Image
            src="/brand/photos/publicbrandphotosbienestar-entrada.jpg"
            alt="Entrada de Bienestar Universitario"
            fill
            priority
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="subtle-zoom object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,27,52,0.94)_0%,rgba(3,27,52,0.88)_34%,rgba(0,67,100,0.72)_70%,rgba(3,27,52,0.48)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.08),transparent_28%),linear-gradient(0deg,rgba(3,27,52,0.82)_0%,transparent_38%)]" />
          <div className="login-line-pattern absolute bottom-8 left-0 hidden h-44 w-72 opacity-35 lg:block" />

          <div className="relative flex h-full min-h-[500px] flex-col px-6 py-8 sm:px-10 lg:h-screen lg:min-h-0 lg:px-16 lg:pb-10 lg:pt-14 xl:px-[76px]">
            <div className="w-[190px] sm:w-[230px] lg:w-[260px]">
              <Image
                src="/brand/logo-unl-blanco.png"
                alt="Logo Universidad Nacional de Loja"
                width={404}
                height={150}
                priority
                className="h-auto w-full object-contain"
              />
            </div>

            <div className="mt-10 max-w-[640px] text-white sm:mt-12 lg:mt-12 xl:mt-14">
              <div className="mb-4 flex items-center gap-4">
                <span className="h-1 w-[42px] rounded-full bg-[#D71920]" />
                <span className="text-[13px] font-semibold uppercase tracking-[0.26em] text-white/75">
                  Bienestar que transforma
                </span>
              </div>
              <h1 className="max-w-[650px] text-[36px] font-extrabold leading-[1.04] text-white sm:text-[38px] lg:text-[44px] xl:text-[52px]">
                Sistema Integral de
                <br />
                Gestión Clínica
              </h1>
              <div className="mt-6 h-1 w-[190px] rounded-full bg-[#D71920] sm:w-[220px]" />
              <p className="mt-5 text-lg font-semibold leading-7 text-white/92 sm:text-xl">
                Unidad de Bienestar Universitario
              </p>
            </div>

            <div className="mt-auto hidden max-w-[780px] grid-cols-3 pt-8 lg:grid">
              {institutionalValues.map((value, index) => (
                <div
                  key={value.label}
                  className={`flex items-center gap-3 pr-5 ${
                    index > 0 ? "border-l border-white/18 pl-5" : ""
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/22 bg-white/10 text-white backdrop-blur-sm">
                    {value.icon}
                  </span>
                  <span className="text-[13px] font-semibold leading-5 text-white/90">
                    {value.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative flex min-h-[620px] items-center justify-center overflow-hidden px-5 py-8 sm:px-8 lg:h-screen lg:min-h-0 lg:px-10 lg:py-6 xl:px-12">
          <Image
            src="/brand/photos/publicbrandphotoscampus-aereo-unl.jpg"
            alt="Campus de la Universidad Nacional de Loja"
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(245,248,251,0.88),rgba(245,248,251,0.88))]" />
          <div className="absolute inset-y-0 left-0 hidden w-px bg-white/90 lg:block" />
          <div className="login-card relative w-full max-w-[500px] overflow-hidden rounded-[20px] border border-[#D7E3EC]/80 bg-white shadow-[0_34px_86px_rgba(8,47,73,0.18)]">
            <div className="flex h-1.5">
              <span className="w-1/3 bg-[#D71920]" />
              <span className="flex-1 bg-[#005B84]" />
            </div>
            <div className="px-6 pb-7 pt-7 sm:px-9 sm:pb-8 sm:pt-8">
              <div className="flex justify-center">
                <Image
                  src="/brand/logo-unl.png"
                  alt="Logo Universidad Nacional de Loja"
                  width={404}
                  height={150}
                  priority
                  className="h-auto w-[132px] object-contain sm:w-[148px]"
                />
              </div>

              <div className="mt-5 text-center text-[#082F49]">
                <h2 className="text-[30px] font-extrabold leading-tight sm:text-[34px]">
                  Iniciar sesión
                </h2>
                <p className="mt-3 text-[15px] font-medium leading-6 text-[#64748B] sm:text-base">
                  Acceso institucional para la gestión clínica.
                </p>
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="text-[15px] font-semibold text-[#082F49]">
                    Usuario
                  </span>
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex w-14 items-center justify-center text-[#6B8394]">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <path d="M20 21a8 8 0 0 0-16 0" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(event) =>
                        handleUsernameChange(event.target.value)
                      }
                      autoComplete="username"
                      className="h-[54px] w-full rounded-xl border border-[#D7E3EC] bg-[#F8FBFE] pl-14 pr-4 text-base font-medium text-[#082F49] outline-none transition duration-200 hover:border-[#B7CBD9] focus:border-[#005B84] focus:bg-white focus:ring-[3px] focus:ring-[#005B84]/15"
                    />
                  </div>
                </label>

                {canSelectModule && (
                  <label className="block">
                    <span className="text-[15px] font-semibold text-[#082F49]">
                      Módulo
                    </span>
                    <select
                      value={selectedRole}
                      onChange={(event) =>
                        setSelectedRole(event.target.value as Role)
                      }
                      className="mt-2 h-[54px] w-full rounded-xl border border-[#D7E3EC] bg-[#F8FBFE] px-4 text-base font-medium text-[#082F49] outline-none transition duration-200 hover:border-[#B7CBD9] focus:border-[#005B84] focus:bg-white focus:ring-[3px] focus:ring-[#005B84]/15"
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
                  <span className="text-[15px] font-semibold text-[#082F49]">
                    Contraseña
                  </span>
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex w-14 items-center justify-center text-[#6B8394]">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <rect width="16" height="11" x="4" y="11" rx="2" />
                        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setErrorMessage("");
                      }}
                      autoComplete="current-password"
                      className="h-[54px] w-full rounded-xl border border-[#D7E3EC] bg-[#F8FBFE] pl-14 pr-14 text-base font-medium text-[#082F49] outline-none transition duration-200 hover:border-[#B7CBD9] focus:border-[#005B84] focus:bg-white focus:ring-[3px] focus:ring-[#005B84]/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={
                        showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                      }
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-[#64748B] transition duration-200 hover:text-[#005B84] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#005B84]/30"
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
                  <p className="login-error rounded-xl bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#B91C1C]">
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  className="h-[54px] w-full rounded-xl bg-[#062B49] px-4 text-lg font-semibold text-white shadow-[0_16px_32px_rgba(6,43,73,0.24)] transition duration-200 hover:bg-[#005B84] hover:shadow-[0_18px_36px_rgba(0,91,132,0.26)] focus:outline-none focus:ring-2 focus:ring-[#005B84] focus:ring-offset-2"
                >
                  Iniciar sesión
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
