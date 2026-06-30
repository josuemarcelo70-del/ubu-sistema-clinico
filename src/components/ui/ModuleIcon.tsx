type ModuleIconProps = {
  label: string;
  className?: string;
};

const iconPaths = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
    </>
  ),
  list: (
    <>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </>
  ),
  user: (
    <>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
    </>
  ),
  document: (
    <>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v5h5" />
      <path d="M10 13h7" />
      <path d="M10 17h5" />
    </>
  ),
  seal: (
    <>
      <path d="M12 3 9.8 5.2 6.7 4.8 6.3 7.9 3.8 9.8 5.3 12l-1.5 2.2 2.5 1.9.4 3.1 3.1-.4L12 21l2.2-2.2 3.1.4.4-3.1 2.5-1.9-1.5-2.2 1.5-2.2-2.5-1.9-.4-3.1-3.1.4z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  flask: (
    <>
      <path d="M9 3h6" />
      <path d="M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3" />
      <path d="M7.5 16h9" />
    </>
  ),
  pill: (
    <>
      <path d="M10.5 20.5 20.5 10.5a4.2 4.2 0 0 0-6-6L4.5 14.5a4.2 4.2 0 0 0 6 6Z" />
      <path d="m8.5 10.5 5 5" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h17" />
      <path d="M8 16v-5" />
      <path d="M13 16V8" />
      <path d="M18 16v-3" />
    </>
  ),
  settings: (
    <>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3.4-.2-.1a1.7 1.7 0 0 0-2 .4l-.6.3-.5 2h-5l-.5-2-.6-.3a1.7 1.7 0 0 0-2-.4l-.2.1-2-3.4.1-.1A1.7 1.7 0 0 0 4.6 15l-.1-.7-1.5-1v-4l1.5-1 .1-.7a1.7 1.7 0 0 0-.3-1.9l-.1-.1 2-3.4.2.1a1.7 1.7 0 0 0 2-.4l.6-.3.5-2h5l.5 2 .6.3a1.7 1.7 0 0 0 2 .4l.2-.1 2 3.4-.1.1a1.7 1.7 0 0 0-.3 1.9l.1.7 1.5 1v4l-1.5 1Z" />
    </>
  ),
};

function iconKey(label: string): keyof typeof iconPaths {
  const normalized = label.toLowerCase();

  if (normalized.includes("paciente") || normalized.includes("usuario") || normalized.includes("perfil")) return "user";
  if (normalized.includes("laboratorio") || normalized.includes("prueba") || normalized.includes("resultado")) return "flask";
  if (normalized.includes("prescrip") || normalized.includes("medicamento") || normalized.includes("farmacia") || normalized.includes("stock") || normalized.includes("kardex")) return "pill";
  if (normalized.includes("informe") || normalized.includes("auditor")) return "chart";
  if (normalized.includes("certificado") || normalized.includes("plantilla")) return "seal";
  if (normalized.includes("historia") || normalized.includes("sesion") || normalized.includes("catálogo") || normalized.includes("catalogo")) return "document";
  if (normalized.includes("config") || normalized.includes("rol")) return "settings";
  if (normalized.includes("inicio")) return "home";

  return "list";
}

export function ModuleIcon({ label, className = "h-5 w-5" }: ModuleIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {iconPaths[iconKey(label)]}
    </svg>
  );
}
