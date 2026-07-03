import type { PrioridadTriaje } from "@/types/clinical";

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
