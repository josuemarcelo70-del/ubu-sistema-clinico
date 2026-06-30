import { BrandLogo } from "@/components/brand/BrandLogo";
import type { SimulatedSession } from "@/lib/mock-users";

type HeaderProps = {
  serviceName?: string;
  session?: SimulatedSession;
};

export function Header({ serviceName, session }: HeaderProps) {
  const userName = session
    ? `${session.nombres} ${session.apellidos}`.trim()
    : undefined;

  return (
    <header className="relative border-b border-[#D9E5EC] bg-white shadow-sm shadow-slate-200/50">
      <div className="flex min-h-18 flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <BrandLogo size="sm" />
        {serviceName && (
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 md:w-auto md:justify-end md:text-right">
            <div className="min-w-0 rounded-md border border-[#D9E5EC] bg-[#F4F8FB] px-3 py-2 sm:px-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                Servicio activo
              </p>
              <p className="mt-0.5 truncate text-sm font-bold text-[#082F49]">
                {serviceName}
              </p>
            </div>
            {session && (
              <div className="min-w-0 flex-1 rounded-md border border-[#D9E5EC] bg-white px-3 py-2 text-left sm:max-w-72 sm:px-4 md:flex-none">
                <p className="truncate text-sm font-bold text-[#082F49]">
                  {userName}
                </p>
                <p className="mt-0.5 truncate text-xs font-medium text-[#64748B]">
                  {session.dependencia}
                </p>
              </div>
            )}
            {!session && (
              <div className="rounded-md border border-[#D9E5EC] bg-white px-4 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                  Usuario
                </p>
                <p className="mt-0.5 text-sm font-bold text-[#082F49]">
                  Institucional
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-[linear-gradient(90deg,#D71920_0%,#D71920_18%,#0B2E59_18%,#0B2E59_100%)]" />
    </header>
  );
}
