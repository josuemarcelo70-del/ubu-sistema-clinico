import type { PrioridadTriaje } from "@/types/clinical";
import { triageOptions } from "@/lib/triage-catalog";

type TriageBadgeProps = {
  value: PrioridadTriaje;
};

const triageStyles: Record<PrioridadTriaje, string> = {
  rojo: "triage-pulse-rojo bg-[#FEE2E2] text-[#991B1B] ring-[#DC2626]/25",
  naranja: "triage-pulse-naranja bg-[#FFEDD5] text-[#9A3412] ring-[#F97316]/25",
  amarillo: "triage-pulse-amarillo bg-[#FEF9C3] text-[#854D0E] ring-[#EAB308]/25",
  verde: "triage-pulse-verde bg-[#DCFCE7] text-[#166534] ring-[#16A34A]/25",
  azul: "triage-pulse-azul bg-[#DBEAFE] text-[#1E3A8A] ring-[#2563EB]/25",
};

export function TriageBadge({ value }: TriageBadgeProps) {
  return (
    <span
      className={`inline-flex min-w-20 items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide shadow-sm ring-1 ${triageStyles[value]}`}
    >
      {value}
    </span>
  );
}

export function TriageSelect({
  value,
  onChange,
}: {
  value: PrioridadTriaje;
  onChange: (value: PrioridadTriaje) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {triageOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex flex-col items-start gap-1 rounded-md border px-3 py-2 text-left transition ${
            value === option.value ? "border-[#082F49] bg-[#F8FBFD] shadow-sm" : "border-[#D7E3EC] bg-white"
          }`}
        >
          <span className="flex items-center gap-2 text-sm font-black" style={{ color: option.color }}>
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: option.color }} />
            {option.value.toUpperCase()} · {option.label}
          </span>
          <span className="text-xs font-semibold text-[#64748B]">
            Tiempo de espera: {option.tiempoEsperaLabel}
          </span>
        </button>
      ))}
    </div>
  );
}
