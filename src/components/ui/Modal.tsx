"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

type ModalSize = "sm" | "md" | "lg" | "xl";

type ModalProps = {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  subtitle?: React.ReactNode;
  size?: ModalSize;
  onClose: () => void;
  /** Fila sólida (tabs/pasos) integrada entre el encabezado y el cuerpo. */
  subheader?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  bodyClassName?: string;
  closeLabel?: string;
};

let openModalCount = 0;

function lockBodyScroll() {
  openModalCount += 1;
  document.body.classList.add("modal-open");
}

function unlockBodyScroll() {
  openModalCount = Math.max(0, openModalCount - 1);
  if (openModalCount === 0) {
    document.body.classList.remove("modal-open");
  }
}

export function Modal({
  title,
  eyebrow,
  subtitle,
  size = "md",
  onClose,
  subheader,
  footer,
  children,
  className = "",
  overlayClassName = "",
  bodyClassName = "",
  closeLabel = "Cerrar modal",
}: ModalProps) {
  useEffect(() => {
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, []);

  return createPortal(
    <div className={`ubu-modal-overlay ${overlayClassName}`}>
      <div className={`ubu-modal ubu-modal-${size} ${className}`}>
        <div className="ubu-modal-header">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#005B84]">
                {eyebrow}
              </p>
            )}
            <h2 className="flex flex-wrap items-center gap-3 text-xl font-bold leading-tight text-[#0F2F44]">
              {title}
            </h2>
            {subtitle && <p className="mt-1 text-[13px] font-normal text-[#52677A]">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="ubu-modal-close" aria-label={closeLabel}>
            X
          </button>
        </div>
        {subheader && <div className="ubu-modal-subheader">{subheader}</div>}
        <div className={`ubu-modal-body text-sm ${bodyClassName}`}>{children}</div>
        {footer && <div className="ubu-modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
