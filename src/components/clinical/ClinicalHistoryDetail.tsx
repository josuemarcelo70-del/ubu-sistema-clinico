"use client";

import { useMemo, useState } from "react";

import {
  obtenerAtencionesPorPaciente,
  obtenerHistoriaClinicaPorPaciente,
} from "@/lib/clinical-storage";
import { formatearEdadGestacional } from "@/lib/gineco";
import type { Atencion, Paciente } from "@/types/clinical";
import { Modal } from "@/components/ui/Modal";
import {
  AttentionDetail,
  AttentionHistoryTable,
  EstudiosHistoryTable,
  estudiosDeAtenciones,
} from "./AttentionDetail";

function DetailInfo({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-md border border-[#D7E3EC] bg-[#F8FBFD] px-3 py-2">
      <p className="text-[11px] font-semibold text-[#52677A]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#0F2F44]">{value || "No registra"}</p>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-[#D7E3EC] p-4">
      <h3 className="ubu-section-title">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

// Modal de solo lectura con el expediente completo del paciente y su
// historial de atenciones. Los datos se leen una única vez por paciente.
export function ClinicalHistoryDetail({
  paciente,
  onClose,
}: {
  paciente: Paciente;
  onClose: () => void;
}) {
  const { historia, atenciones } = useMemo(
    () => ({
      historia: obtenerHistoriaClinicaPorPaciente(paciente.id),
      atenciones: obtenerAtencionesPorPaciente(paciente.id),
    }),
    [paciente.id],
  );
  const estudios = useMemo(() => estudiosDeAtenciones(atenciones), [atenciones]);
  // El detalle de la atención se monta solo al pulsar "Ver".
  const [detalleAtencion, setDetalleAtencion] = useState<Atencion>();
  const gineco = historia?.antecedentesGinecoObstetricos;

  return (
    <Modal
      size="xl"
      title="Historia clínica"
      subtitle={`${paciente.apellidos} ${paciente.nombres} · HC ${paciente.historiaClinicaNumero || paciente.cedula}`}
      onClose={onClose}
      footer={
        <button type="button" onClick={onClose} className="ubu-btn ubu-btn-secondary">
          Cerrar
        </button>
      }
    >
      <div className="space-y-4">
        <DetailSection title="Datos personales">
          <div className="grid gap-3 md:grid-cols-3">
            <DetailInfo label="Cédula" value={paciente.cedula} />
            <DetailInfo label="Fecha de nacimiento" value={paciente.fechaNacimiento} />
            <DetailInfo label="Edad / sexo" value={[paciente.edad, paciente.sexo].filter(Boolean).join(" / ")} />
            <DetailInfo label="Orientación sexual" value={paciente.orientacionSexual} />
            <DetailInfo label="Pueblo o nacionalidad" value={paciente.puebloNacionalidad} />
            <DetailInfo
              label="Discapacidad"
              value={
                paciente.discapacidad === "Sí"
                  ? [
                      paciente.tipoDiscapacidad,
                      paciente.porcentajeDiscapacidad ? `${paciente.porcentajeDiscapacidad}%` : "",
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Sí"
                  : paciente.discapacidad
              }
            />
            <DetailInfo label="Teléfono" value={paciente.telefono} />
            <DetailInfo label="Correo institucional" value={paciente.correoInstitucional} />
            <DetailInfo label="Dirección" value={paciente.direccion} />
          </div>
        </DetailSection>

        <DetailSection title="Hábitos personales">
          {historia ? (
            <div className="grid gap-3 md:grid-cols-3">
              <DetailInfo label="Alimentación" value={historia.habitosPersonales.alimentacion} />
              <DetailInfo label="Alcohol" value={historia.habitosPersonales.alcohol} />
              <DetailInfo label="Tabaco" value={historia.habitosPersonales.tabaco} />
              <DetailInfo label="Otras sustancias" value={historia.habitosPersonales.otrasSustancias} />
              <DetailInfo label="Medicación habitual" value={historia.habitosPersonales.medicacionHabitual} />
              <DetailInfo label="Actividad física" value={historia.habitosPersonales.actividadFisica} />
            </div>
          ) : (
            <p className="text-sm font-semibold text-[#64748B]">Sin registro de hábitos.</p>
          )}
        </DetailSection>

        <DetailSection title="Antecedentes">
          {historia ? (
            <div className="grid gap-3 md:grid-cols-2">
              <DetailInfo
                label="Antecedentes personales"
                value={
                  historia.antecedentesPersonales.length
                    ? historia.antecedentesPersonales
                        .map((item) => `${item.codigo} - ${item.descripcion}`)
                        .join("; ")
                    : historia.antecedentesPersonalesObservacion
                }
              />
              <DetailInfo
                label="Antecedentes familiares"
                value={
                  historia.antecedentesFamiliares.length
                    ? historia.antecedentesFamiliares
                        .map((item) => `${item.familiar}: ${item.codigo} - ${item.descripcion}`)
                        .join("; ")
                    : historia.antecedentesFamiliaresObservacion
                }
              />
              <DetailInfo label="Antecedentes quirúrgicos" value={historia.antecedentesQuirurgicos} />
              <DetailInfo label="Alergias" value={historia.alergias} />
            </div>
          ) : (
            <p className="text-sm font-semibold text-[#64748B]">Sin antecedentes registrados.</p>
          )}
        </DetailSection>

        {gineco && (
          <DetailSection title="Antecedentes gineco-obstétricos">
            <div className="grid gap-3 md:grid-cols-3">
              <DetailInfo label="Menarquia" value={gineco.menarquia} />
              <DetailInfo label="Ciclo menstrual" value={gineco.cicloMenstrual} />
              <DetailInfo
                label="G / P / C / A / HV"
                value={`G${gineco.gestas ?? 0} P${gineco.partos ?? 0} C${gineco.cesareas ?? 0} A${gineco.abortos ?? 0} HV${gineco.hijosVivos ?? 0}`}
              />
              <DetailInfo label="Método anticonceptivo" value={gineco.metodoAnticonceptivo} />
              <DetailInfo
                label="Gestación actual"
                value={
                  gineco.gestaActual === "Sí"
                    ? [
                        "Sí",
                        formatearEdadGestacional(
                          gineco.edadGestacionalSemanas,
                          gineco.edadGestacionalDias,
                        ),
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : gineco.gestaActual
                }
              />
              <DetailInfo
                label="Lactancia"
                value={
                  gineco.lactanciaActual === "Sí"
                    ? ["Sí", gineco.tipoLactancia].filter(Boolean).join(" · ")
                    : gineco.lactanciaActual
                }
              />
              <DetailInfo label="Observaciones" value={gineco.observacionesGinecoObstetricas} />
            </div>
          </DetailSection>
        )}

        <DetailSection title="Historial de atenciones de Medicina y Odontología">
          {atenciones.length ? (
            <AttentionHistoryTable atenciones={atenciones} onVer={setDetalleAtencion} />
          ) : (
            <p className="text-sm font-semibold text-[#64748B]">
              Sin atenciones finalizadas. Las atenciones se inician desde “Atenciones pendientes”.
            </p>
          )}
        </DetailSection>

        <DetailSection title="Historial de estudios complementarios">
          <EstudiosHistoryTable estudios={estudios} onVer={setDetalleAtencion} />
        </DetailSection>
      </div>

      {detalleAtencion && (
        <AttentionDetail
          atencion={detalleAtencion}
          paciente={paciente}
          onClose={() => setDetalleAtencion(undefined)}
        />
      )}
    </Modal>
  );
}
