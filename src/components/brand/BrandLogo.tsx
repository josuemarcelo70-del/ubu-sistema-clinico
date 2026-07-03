import Image from "next/image";

type BrandLogoProps = {
  compact?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  lightText?: boolean;
};

const logoSizes = {
  sm: {
    frame: "w-28",
    image: "h-10",
  },
  md: {
    frame: "w-36",
    image: "h-12",
  },
  lg: {
    frame: "w-48",
    image: "h-16",
  },
  xl: {
    frame: "w-64",
    image: "h-24",
  },
};

export function BrandLogo({
  compact = false,
  size = "sm",
  lightText = false,
}: BrandLogoProps) {
  const currentSize = logoSizes[size];
  const primaryText = lightText ? "text-white" : "text-[#12324A]";
  const secondaryText = lightText ? "text-white/75" : "text-[#5B7083]";

  return (
    <div className="flex items-center gap-3">
      <div className={`flex ${currentSize.frame} shrink-0 items-center`}>
        <Image
          src="/brand/logo-unl.png"
          alt="Logo Universidad Nacional de Loja"
          width={404}
          height={150}
          priority
          className={`${currentSize.image} w-auto object-contain`}
        />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className={`text-sm font-bold uppercase ${primaryText}`}>
            UNIVERSIDAD NACIONAL DE LOJA
          </p>
          <p className={`text-xs font-medium ${secondaryText}`}>
            Unidad de Bienestar Universitario
          </p>
        </div>
      )}
    </div>
  );
}
