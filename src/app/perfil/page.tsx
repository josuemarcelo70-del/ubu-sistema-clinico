"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import {
  mockUsers,
  SIMULATED_SESSION_KEY,
  type SimulatedSession,
} from "@/lib/mock-users";
import type { UserProfile } from "@/types/auth";

const PROFILE_STORAGE_PREFIX = "ubu_profile_";

type TextFieldProps = {
  label: string;
  value: string;
  type?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
};

function profileStorageKey(userId: string) {
  return `${PROFILE_STORAGE_PREFIX}${userId}`;
}

function createFallbackProfile(session: SimulatedSession): UserProfile {
  return {
    nombres: session.nombres,
    apellidos: session.apellidos,
    cedula: "",
    correoInstitucional: `${session.username}@unl.edu.ec`,
    telefono: "",
    direccionInstitucional: "",
    professional: {
      tituloProfesional: "",
      cargoInstitucional: session.cargo,
      servicioDependencia: session.dependencia,
      tipoContratacion: "",
      fechaInicioContrato: "",
      registroSenescyt: "",
      registroAcess: "",
      cedulaProfesional: "",
    },
    documentSettings: {
      inicialesInforme: "",
      firmaDigitalizada: "",
      selloProfesional: "",
      nombreDocumento: `${session.nombres} ${session.apellidos}`.trim(),
      responsableInformesMensuales: false,
      puedeEmitirCertificados: false,
      puedeFirmarReportes: false,
      puedeValidarDocumentosExternos: false,
    },
  };
}

function TextField({
  label,
  value,
  type = "text",
  disabled = false,
  onChange,
}: TextFieldProps) {
  return (
    <label className="block min-w-0">
      <span className="text-sm font-semibold text-[#082F49]">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.value)}
        className="mt-1.5 w-full rounded-md border border-[#D7E3EC] bg-[#F8FBFD] px-3 py-2.5 text-sm font-medium text-[#082F49] outline-none transition focus:border-[#005B84] focus:bg-white focus:ring-2 focus:ring-[#005B84]/15 disabled:cursor-not-allowed disabled:bg-[#EEF6FA] disabled:text-[#64748B]"
      />
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[#D7E3EC] bg-white shadow-sm">
      <div className="border-b border-[#D7E3EC] px-4 py-3">
        <h2 className="text-base font-bold text-[#082F49]">{title}</h2>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function SwitchField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex min-h-11 items-center justify-between gap-4 rounded-md border border-[#D7E3EC] bg-[#F8FBFD] px-3 py-2 text-left text-sm font-semibold text-[#082F49] transition hover:border-[#BFD2DE] focus:outline-none focus:ring-2 focus:ring-[#005B84]/20"
      aria-pressed={checked}
    >
      <span>{label}</span>
      <span
        className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition ${
          checked ? "bg-[#005B84]" : "bg-[#CBD5E1]"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<SimulatedSession | null>(null);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    function loadProfile() {
      const storedSession = localStorage.getItem(SIMULATED_SESSION_KEY);

      if (!storedSession) {
        router.replace("/login");
        return;
      }

      const parsedSession = JSON.parse(storedSession) as SimulatedSession;
      const mockUser = mockUsers.find((user) => user.id === parsedSession.userId);
      const initialProfile = mockUser?.profile ?? createFallbackProfile(parsedSession);
      const storedProfile = localStorage.getItem(
        profileStorageKey(parsedSession.userId),
      );

      setSession(parsedSession);
      setProfile(
        storedProfile
          ? ({ ...initialProfile, ...JSON.parse(storedProfile) } as UserProfile)
          : initialProfile,
      );
    }

    function handleLoadProfile() {
      try {
        loadProfile();
      } catch {
        localStorage.removeItem(SIMULATED_SESSION_KEY);
        router.replace("/login");
      }
    }

    const loadTimer = setTimeout(handleLoadProfile, 0);

    return () => {
      clearTimeout(loadTimer);
    };
  }, [router]);

  const signatureLines = useMemo(() => {
    if (!profile) return [];

    return [
      profile.documentSettings.nombreDocumento,
      profile.professional.cargoInstitucional,
      profile.cedula ? `Cédula: ${profile.cedula}` : "Cédula:",
      profile.professional.registroSenescyt
        ? `Registro Senescyt: ${profile.professional.registroSenescyt}`
        : "Registro Senescyt:",
      profile.correoInstitucional,
      profile.telefono ? `Tel.: ${profile.telefono}` : "Tel.:",
    ];
  }, [profile]);

  function updatePersonal(field: keyof UserProfile, value: string) {
    setSavedMessage("");
    setProfile((current) => (current ? { ...current, [field]: value } : current));
  }

  function updateProfessional(
    field: keyof UserProfile["professional"],
    value: string,
  ) {
    setSavedMessage("");
    setProfile((current) =>
      current
        ? {
            ...current,
            professional: { ...current.professional, [field]: value },
          }
        : current,
    );
  }

  function updateDocumentSettings(
    field: keyof UserProfile["documentSettings"],
    value: string | boolean,
  ) {
    setSavedMessage("");
    setProfile((current) =>
      current
        ? {
            ...current,
            documentSettings: { ...current.documentSettings, [field]: value },
          }
        : current,
    );
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile || !session) return;

    localStorage.setItem(profileStorageKey(session.userId), JSON.stringify(profile));

    const storedSession = localStorage.getItem(SIMULATED_SESSION_KEY);
    if (storedSession) {
      const currentSession = JSON.parse(storedSession) as SimulatedSession;
      localStorage.setItem(
        SIMULATED_SESSION_KEY,
        JSON.stringify({
          ...currentSession,
          nombres: profile.nombres,
          apellidos: profile.apellidos,
          cargo: profile.professional.cargoInstitucional,
          dependencia: profile.professional.servicioDependencia,
        }),
      );
      window.dispatchEvent(new Event("ubu-session-updated"));
    }

    setSavedMessage("Perfil actualizado correctamente.");
  }

  if (!profile) {
    return (
      <AppShell serviceName="Perfil institucional">
        <div className="min-h-96" aria-label="Cargando perfil" />
      </AppShell>
    );
  }

  return (
    <AppShell serviceName="Perfil institucional">
      <form
        onSubmit={handleSave}
        className="dashboard-fade mx-auto max-w-7xl space-y-4"
      >
        <div className="overflow-hidden rounded-lg border border-[#D7E3EC] bg-white shadow-sm">
          <div className="h-1 bg-[linear-gradient(90deg,#D71920_0%,#D71920_18%,#005B84_18%,#062B49_100%)]" />
          <div className="grid gap-4 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#005B84]">
                Perfil institucional
              </p>
              <h1 className="mt-1.5 text-xl font-bold leading-tight text-[#082F49]">
                Perfil del usuario
              </h1>
              <p className="mt-1.5 text-sm font-medium text-[#64748B]">
                {profile.professional.servicioDependencia}
              </p>
            </div>
            <div className="rounded-lg border border-[#D7E3EC] bg-[#EEF6FA] p-3 lg:w-80">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#062B49] text-xs font-bold text-white">
                  {profile.documentSettings.inicialesInforme ||
                    `${profile.nombres[0] ?? ""}${profile.apellidos[0] ?? ""}`.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#082F49]">
                    {`${profile.nombres} ${profile.apellidos}`.trim()}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-[#64748B]">
                    {profile.professional.cargoInstitucional}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:col-span-2 lg:justify-end">
              {savedMessage && (
                <span className="rounded-md bg-[#ECFDF3] px-3 py-1.5 text-sm font-semibold text-[#15803D]">
                  {savedMessage}
                </span>
              )}
              <button
                type="submit"
                className="rounded-md bg-[#062B49] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#005B84] focus:outline-none focus:ring-2 focus:ring-[#005B84]/30"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>

        <Section title="Datos personales">
          <TextField
            label="Nombres completos"
            value={profile.nombres}
            onChange={(value) => updatePersonal("nombres", value)}
          />
          <TextField
            label="Apellidos completos"
            value={profile.apellidos}
            onChange={(value) => updatePersonal("apellidos", value)}
          />
          <TextField
            label="Cédula"
            value={profile.cedula}
            onChange={(value) => updatePersonal("cedula", value)}
          />
          <TextField
            label="Correo institucional"
            type="email"
            value={profile.correoInstitucional}
            onChange={(value) => updatePersonal("correoInstitucional", value)}
          />
          <TextField
            label="Teléfono"
            value={profile.telefono}
            onChange={(value) => updatePersonal("telefono", value)}
          />
          <TextField
            label="Dirección institucional o ciudad"
            value={profile.direccionInstitucional}
            onChange={(value) => updatePersonal("direccionInstitucional", value)}
          />
        </Section>

        <Section title="Datos profesionales">
          <TextField
            label="Título profesional"
            value={profile.professional.tituloProfesional}
            onChange={(value) => updateProfessional("tituloProfesional", value)}
          />
          <TextField
            label="Cargo institucional"
            value={profile.professional.cargoInstitucional}
            onChange={(value) => updateProfessional("cargoInstitucional", value)}
          />
          <TextField
            label="Servicio o dependencia"
            value={profile.professional.servicioDependencia}
            onChange={(value) => updateProfessional("servicioDependencia", value)}
          />
          <TextField
            label="Tipo de contratación"
            value={profile.professional.tipoContratacion}
            onChange={(value) => updateProfessional("tipoContratacion", value)}
          />
          <TextField
            label="Fecha de inicio de contrato"
            type="date"
            value={profile.professional.fechaInicioContrato}
            onChange={(value) => updateProfessional("fechaInicioContrato", value)}
          />
          <TextField
            label="Número de registro Senescyt"
            value={profile.professional.registroSenescyt}
            onChange={(value) => updateProfessional("registroSenescyt", value)}
          />
          <TextField
            label="Número de registro ACESS"
            value={profile.professional.registroAcess}
            onChange={(value) => updateProfessional("registroAcess", value)}
          />
          <TextField
            label="Número de cédula profesional o equivalente"
            value={profile.professional.cedulaProfesional}
            onChange={(value) => updateProfessional("cedulaProfesional", value)}
          />
        </Section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <Section title="Datos para documentos institucionales">
            <TextField
              label="Iniciales para códigos de informe"
              value={profile.documentSettings.inicialesInforme}
              onChange={(value) =>
                updateDocumentSettings("inicialesInforme", value)
              }
            />
            <TextField
              label="Nombre como debe aparecer en documentos"
              value={profile.documentSettings.nombreDocumento}
              onChange={(value) =>
                updateDocumentSettings("nombreDocumento", value)
              }
            />
            <TextField
              label="Firma digitalizada"
              value="Sin archivo cargado"
              disabled
            />
            <TextField
              label="Sello profesional"
              value="Sin archivo cargado"
              disabled
            />
          </Section>

          <section className="rounded-lg border border-[#D7E3EC] bg-white shadow-sm">
            <div className="border-b border-[#D7E3EC] px-4 py-3">
              <h2 className="text-base font-bold text-[#082F49]">
                Pie de firma automático
              </h2>
            </div>
            <div className="p-4">
              <div className="min-h-44 rounded-md border border-dashed border-[#BFD2DE] bg-[#F8FBFD] p-4">
                <div className="mb-4 h-10 w-36 border-b border-[#94A3B8]" />
                <div className="space-y-1 text-sm font-medium text-[#082F49]">
                  {signatureLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </section>

        <section className="rounded-lg border border-[#D7E3EC] bg-white shadow-sm">
          <div className="border-b border-[#D7E3EC] px-4 py-3">
            <h2 className="text-base font-bold text-[#082F49]">
              Configuración documental
            </h2>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2">
            <SwitchField
              label="Responsable de informes mensuales"
              checked={profile.documentSettings.responsableInformesMensuales}
              onChange={(checked) =>
                updateDocumentSettings("responsableInformesMensuales", checked)
              }
            />
            <SwitchField
              label="Puede emitir certificados"
              checked={profile.documentSettings.puedeEmitirCertificados}
              onChange={(checked) =>
                updateDocumentSettings("puedeEmitirCertificados", checked)
              }
            />
            <SwitchField
              label="Puede firmar reportes"
              checked={profile.documentSettings.puedeFirmarReportes}
              onChange={(checked) =>
                updateDocumentSettings("puedeFirmarReportes", checked)
              }
            />
            <SwitchField
              label="Puede validar documentos externos"
              checked={profile.documentSettings.puedeValidarDocumentosExternos}
              onChange={(checked) =>
                updateDocumentSettings("puedeValidarDocumentosExternos", checked)
              }
            />
          </div>
        </section>
      </form>
    </AppShell>
  );
}
