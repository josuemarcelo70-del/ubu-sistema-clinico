import { BrandLogo } from "@/components/brand/BrandLogo";
import type { SimulatedSession } from "@/lib/mock-users";

type HeaderProps = {
  serviceName?: string;
  session?: SimulatedSession;
  onMenuClick?: () => void;
};

export function Header({ session, onMenuClick }: HeaderProps) {
  const userName = session
    ? `${session.nombres} ${session.apellidos}`.trim()
    : undefined;

  return (
    <header className="sticky top-0 z-30 border-b border-[#D7E3EC] bg-white/94 shadow-[0_1px_0_rgba(8,47,73,0.03)] backdrop-blur">
      <div className="flex min-h-16 items-center gap-3 px-4 py-2 sm:px-6 lg:px-7">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Abrir menú"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#D7E3EC] bg-[#F5F8FB] text-[#062B49] transition hover:border-[#005B84] hover:text-[#005B84] focus:outline-none focus:ring-2 focus:ring-[#005B84]/20 lg:hidden"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            className="h-5 w-5"
          >
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          <div className="hidden sm:block">
            <BrandLogo size="sm" />
          </div>
          <div className="sm:hidden">
            <p className="truncate text-sm font-bold text-[#082F49]">
              Universidad Nacional de Loja
            </p>
            <p className="truncate text-xs font-semibold text-[#64748B]">
              Bienestar Universitario
            </p>
          </div>
        </div>

        <div className="hidden min-w-0 items-center gap-3 md:flex md:justify-end">
          {session && (
            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-bold text-[#082F49]">
                {userName}
              </p>
              <p className="mt-0.5 truncate text-xs font-semibold text-[#64748B]">
                {session.cargo}
              </p>
            </div>
          )}
          {!session && (
            <div className="min-w-0 text-right">
              <p className="text-sm font-bold text-[#082F49]">Institucional</p>
            </div>
          )}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#062B49] text-xs font-bold text-white shadow-sm">
            {userName
              ?.split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase() ?? "UB"}
          </div>
        </div>
      </div>
      <div className="h-0.5 w-full bg-[linear-gradient(90deg,#D71920_0%,#D71920_16%,#005B84_16%,#062B49_100%)]" />
    </header>
  );
}
