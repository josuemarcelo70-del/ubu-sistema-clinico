"use client";

import { useMemo, useState } from "react";

import {
  downloadBlob,
  generateResumenAtencionPdf,
  safeFilenamePart,
  splitIndicaciones,
} from "@/lib/attention-pdf";
import {
  coberturaLabel,
  origenLabel,
  patientName,
  patientProgram,
  servicioLabel,
} from "@/lib/patient-format";
import { calcularImcDesdeCm, normalizarTallaCm } from "@/lib/vital-signs";
import type { Atencion, Paciente } from "@/types/clinical";
import { Modal } from "@/components/ui/Modal";

const farmaciaEstadoLabels: Record<string, string> = {
  pendiente: "Pendiente de entrega",
  recibido: "Recibido en Farmacia",
  procesado: "En proceso",
  entregado: "Entregado",
  finalizado: "Entregado",
};

const laboratorioEstadoLabels: Record<string, string> = {
  pendiente: "Solicitado",
  recibido: "Recibido en Laboratorio",
  procesado: "En proceso",
  entregado: "Reportado",
  finalizado: "Reportado",
};

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-md border border-[#D7E3EC] bg-[#F8FBFD] px-3 py-2">
      <p className="text-[11px] font-semibold text-[#52677A]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#0F2F44]">{value || "No registra"}</p>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-[#D7E3EC] bg-white p-4">
      <h3 className="ubu-section-title">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

// Detalle completo de una atención finalizada (solo lectura). Se monta
// únicamente cuando el usuario pulsa "Ver" sobre una atención previa.
export function AttentionDetail({
  atencion,
  paciente,
  onClose,
}: {
  atencion: Atencion;
  paciente?: Paciente;
  onClose: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const fecha = (atencion.fechaAtencion || atencion.fechaInicio).slice(0, 10);
  const hora = [atencion.horaInicio, atencion.horaFin].filter(Boolean).join(" - ");
  const signos = atencion.signosVitales;
  const tallaCm = normalizarTallaCm(signos?.talla);
  const imcCalculado = useMemo(
    () => calcularImcDesdeCm(signos?.peso, signos?.talla),
    [signos?.peso, signos?.talla],
  );
  const diagnosticos = atencion.diagnosticos?.length
    ? atencion.diagnosticos
    : atencion.diagnosticoPrincipal
      ? [atencion.diagnosticoPrincipal]
      : [];
  const indicaciones = atencion.planTratamiento?.trim()
    ? splitIndicaciones(atencion.planTratamiento)
    : [];
  const certificados = atencion.certificados ?? [];

  async function downloadResumen() {
    setDownloading(true);
    setDownloadError("");
    try {
      const cedula = paciente?.cedula || atencion.cedulaPaciente || "";
      const bytes = await generateResumenAtencionPdf({
        atencion,
        pacienteNombre: patientName(paciente) || atencion.pacienteId,
        cedula,
        historiaClinica: atencion.historiaClinica || cedula,
        programa: patientProgram(paciente),
        servicio: servicioLabel(atencion.servicio),
      });
      downloadBlob(`resumen-atencion-${safeFilenamePart(cedula)}-${fecha}.pdf`, bytes);
    } catch {
      setDownloadError("No se pudo generar el resumen. Intente nuevamente.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Modal
      size="xl"
      overlayClassName="ubu-modal-overlay-nested ubu-modal-overlay-dark"
      className="bg-[#F6FAFD]"
      bodyClassName="space-y-4 bg-[#F6FAFD]"
      eyebrow={servicioLabel(atencion.servicio)}
      title="Detalle de la atención"
      subtitle={[patientName(paciente), fecha].filter(Boolean).join(" · ")}
      onClose={onClose}
      closeLabel="Cerrar detalle de la atención"
      footer={
        <>
          {downloadError && (
            <span className="mr-auto self-center text-sm font-semibold text-[#B91C1C]">{downloadError}</span>
          )}
          <button type="button" onClick={onClose} className="ubu-btn ubu-btn-secondary">
            Cerrar
          </button>
          <button
            type="button"
            onClick={downloadResumen}
            disabled={downloading}
            className="ubu-btn ubu-btn-primary disabled:bg-[#94A3B8]"
          >
            {downloading ? "Generando resumen..." : "Descargar resumen de atención"}
          </button>
        </>
      }
    >
      <DetailSection title="Datos generales de la atención">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          <Info label="Fecha" value={fecha} />
          <Info label="Hora" value={hora} />
          <Info label="Servicio" value={servicioLabel(atencion.servicio)} />
          <Info label="Profesional" value={atencion.profesionalNombre || atencion.profesionalId} />
          <Info
            label="Tipo de atención"
            value={atencion.tipoAtencion === "apertura_hc" ? "Primera atención" : "Atención subsecuente"}
          />
          <Info label="Origen" value={origenLabel(atencion.origen)} />
          <Info label="Cobertura de atención" value={coberturaLabel(atencion.coberturaAtencion)} />
          <Info
            label="Cédula / historia clínica"
            value={[paciente?.cedula || atencion.cedulaPaciente, atencion.historiaClinica]
              .filter(Boolean)
              .join(" / ")}
          />
        </div>
      </DetailSection>

      <DetailSection title="Signos vitales registrados">
        {signos ? (
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
            <Info label="Presión arterial (mmHg)" value={signos.presionArterial} />
            <Info label="Frecuencia cardíaca (lpm)" value={signos.frecuenciaCardiaca} />
            <Info label="Frecuencia respiratoria (rpm)" value={signos.frecuenciaRespiratoria} />
            <Info label="Temperatura (°C)" value={signos.temperatura} />
            <Info label="Saturación O₂ (%)" value={signos.saturacionOxigeno} />
            <Info label="Talla (cm)" value={tallaCm} />
            <Info label="Peso (kg)" value={signos.peso} />
            <Info label="IMC (kg/m²)" value={signos.imc || imcCalculado.imc} />
            <Info
              label="Clasificación IMC"
              value={signos.clasificacionImc || imcCalculado.clasificacionImc}
            />
            <Info label="Observaciones" value={signos.observaciones} />
          </div>
        ) : (
          <p className="text-sm font-semibold text-[#64748B]">Sin signos vitales registrados.</p>
        )}
      </DetailSection>

      <DetailSection title="Consulta médica">
        <div className="grid gap-3 md:grid-cols-2">
          <Info label="Motivo de consulta" value={atencion.motivoConsulta} />
          <Info label="Enfermedad actual" value={atencion.enfermedadActual} />
          <Info label="Examen físico" value={atencion.examenFisico} />
          <Info
            label="Condición gineco-obstétrica"
            value={
              atencion.condicionGinecoObstetrica
                ? [
                    atencion.condicionGinecoObstetrica.gestaActual
                      ? `Gesta actual: ${atencion.condicionGinecoObstetrica.gestaActual}`
                      : "",
                    atencion.condicionGinecoObstetrica.lactanciaActual
                      ? `Lactancia: ${atencion.condicionGinecoObstetrica.lactanciaActual}`
                      : "",
                    atencion.condicionGinecoObstetrica.observaciones ?? "",
                  ]
                    .filter(Boolean)
                    .join("; ")
                : ""
            }
          />
        </div>
      </DetailSection>

      <DetailSection title="Diagnósticos CIE-10">
        {diagnosticos.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead className="bg-[#EEF6FA] text-left text-[11px] uppercase tracking-wide text-[#64748B]">
                <tr>
                  <th className="px-3 py-2 font-semibold">Código</th>
                  <th className="px-3 py-2 font-semibold">Descripción</th>
                  <th className="px-3 py-2 font-semibold">Tipo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D7E3EC]">
                {diagnosticos.map((diagnostico) => (
                  <tr key={diagnostico.codigo} className="text-[#0F2F44]">
                    <td className="px-3 py-2 font-semibold">
                      {diagnostico.codigo}
                      {diagnostico.principal && (
                        <span className="ml-2 rounded bg-[#EEF6FA] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#005B84]">
                          Principal
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-[#52677A]">{diagnostico.descripcion}</td>
                    <td className="px-3 py-2 text-[#52677A]">{diagnostico.tipo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm font-semibold text-[#64748B]">Sin diagnósticos registrados.</p>
        )}
      </DetailSection>

      <DetailSection title="Plan de tratamiento / indicaciones">
        {indicaciones.length ? (
          <ol className="list-decimal space-y-1 pl-5 text-sm text-[#0F2F44]">
            {indicaciones.map((indicacion, index) => (
              <li key={index}>{indicacion}</li>
            ))}
          </ol>
        ) : (
          <p className="text-sm font-semibold text-[#64748B]">Sin indicaciones registradas.</p>
        )}
      </DetailSection>

      <div className="grid gap-4 xl:grid-cols-2">
        <DetailSection title="Medicamentos / Farmacia">
          {atencion.ordenFarmacia ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Info label="Código de farmacia" value={atencion.ordenFarmacia.codigo} />
                <Info
                  label="Estado de entrega"
                  value={farmaciaEstadoLabels[atencion.ordenFarmacia.estado] || atencion.ordenFarmacia.estado}
                />
              </div>
              <ul className="space-y-2">
                {atencion.ordenFarmacia.medicamentos.map((medicamento) => (
                  <li
                    key={medicamento.medicamentoId}
                    className="rounded-md border border-[#D7E3EC] bg-[#F8FBFD] px-3 py-2 text-sm text-[#0F2F44]"
                  >
                    <span className="font-semibold">{medicamento.nombre}</span>{" "}
                    {medicamento.presentacion} · {medicamento.dosis || "Sin dosis"} · Cant.{" "}
                    {medicamento.cantidad}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm font-semibold text-[#64748B]">Sin orden de farmacia registrada.</p>
          )}
        </DetailSection>

        <DetailSection title="Laboratorio">
          {atencion.ordenLaboratorio ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Info label="Código de solicitud" value={atencion.ordenLaboratorio.codigo} />
                <Info
                  label="Estado"
                  value={
                    laboratorioEstadoLabels[atencion.ordenLaboratorio.estado] ||
                    atencion.ordenLaboratorio.estado
                  }
                />
              </div>
              <ul className="space-y-2">
                {atencion.ordenLaboratorio.estudios.map((estudio) => (
                  <li
                    key={estudio.pruebaId}
                    className="rounded-md border border-[#D7E3EC] bg-[#F8FBFD] px-3 py-2 text-sm text-[#0F2F44]"
                  >
                    {estudio.nombre}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm font-semibold text-[#64748B]">Sin estudios de laboratorio solicitados.</p>
          )}
        </DetailSection>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DetailSection title="Procedimiento invasivo / no invasivo">
          {atencion.procedimiento?.realizado ? (
            <div className="grid gap-3">
              <Info label="Registrado" value="Sí" />
              <Info label="Tipo de procedimiento" value={atencion.procedimiento.tipo} />
              <Info label="Descripción" value={atencion.procedimiento.descripcion} />
              <Info label="Observaciones" value={atencion.procedimiento.observaciones} />
            </div>
          ) : (
            <p className="text-sm font-semibold text-[#64748B]">No registrado.</p>
          )}
        </DetailSection>

        <DetailSection title="Referencia / derivación">
          {atencion.referenciaDerivacion?.emitida ? (
            <div className="grid gap-3">
              <Info label="Registrada" value="Sí" />
              <Info label="Destino" value={atencion.referenciaDerivacion.destino} />
              <Info label="Motivo" value={atencion.referenciaDerivacion.motivo} />
              <Info label="Prioridad" value={atencion.referenciaDerivacion.prioridad} />
              <Info label="Observaciones" value={atencion.referenciaDerivacion.observaciones} />
            </div>
          ) : (
            <p className="text-sm font-semibold text-[#64748B]">No registrada.</p>
          )}
        </DetailSection>
      </div>

      <DetailSection title="Certificados médicos">
        {certificados.length ? (
          <ul className="space-y-2">
            {certificados.map((certificado) => (
              <li
                key={certificado.id}
                className="rounded-md border border-[#D7E3EC] bg-[#F8FBFD] px-3 py-2 text-sm text-[#0F2F44]"
              >
                <span className="font-semibold">
                  {certificado.tipo === "atencion" ? "Certificado de atención" : "Certificado de reposo"}
                </span>{" "}
                · Emitido el {new Date(certificado.fecha).toLocaleString("es-EC")}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm font-semibold text-[#64748B]">Sin certificados emitidos.</p>
        )}
      </DetailSection>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Tablas de historial compartidas entre la atención médica y la historia
// clínica: atenciones previas y estudios complementarios.
// ---------------------------------------------------------------------------

export function AttentionHistoryTable({
  atenciones,
  onVer,
}: {
  atenciones: Atencion[];
  onVer: (atencion: Atencion) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead className="bg-[#EEF6FA] text-[11px] uppercase tracking-wide text-[#64748B]">
          <tr>
            <th className="px-3 py-2 font-semibold">Fecha</th>
            <th className="px-3 py-2 font-semibold">Servicio</th>
            <th className="px-3 py-2 font-semibold">Profesional</th>
            <th className="px-3 py-2 font-semibold">Diagnóstico / motivo</th>
            <th className="px-3 py-2 font-semibold">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D7E3EC]">
          {atenciones.map((atencion) => (
            <tr key={atencion.id} className="text-[#0F2F44] hover:bg-[#F8FBFD]">
              <td className="px-3 py-2">{(atencion.fechaAtencion || atencion.fechaInicio).slice(0, 10)}</td>
              <td className="px-3 py-2">{servicioLabel(atencion.servicio)}</td>
              <td className="px-3 py-2 text-[#52677A]">
                {atencion.profesionalNombre || atencion.profesionalId}
              </td>
              <td className="px-3 py-2 text-[#52677A]">
                {atencion.diagnosticoPrincipal
                  ? `${atencion.diagnosticoPrincipal.codigo} ${atencion.diagnosticoPrincipal.descripcion} - ${atencion.diagnosticoPrincipal.tipo}`
                  : atencion.motivoConsulta || "No registra"}
              </td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  onClick={() => onVer(atencion)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#D7E3EC] px-3 py-1.5 text-xs font-semibold text-[#005B84] transition hover:border-[#005B84]"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="h-3.5 w-3.5"
                    aria-hidden
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.8-3.8" />
                  </svg>
                  Ver
                </button>
              </td>
            </tr>
          ))}
          {atenciones.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-5 text-center text-sm font-semibold text-[#64748B]">
                Sin atenciones previas registradas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export type EstudioHistorialRow = {
  id: string;
  fecha: string;
  examen: string;
  origen: string;
  estado: string;
  atencion: Atencion;
};

/** Aplana los estudios de laboratorio solicitados en las atenciones previas. */
export function estudiosDeAtenciones(atenciones: Atencion[]): EstudioHistorialRow[] {
  return atenciones.flatMap((atencion) => {
    const orden = atencion.ordenLaboratorio;
    if (!orden) return [];
    return orden.estudios.map((estudio) => ({
      id: `${atencion.id}-${estudio.pruebaId}`,
      fecha: (atencion.fechaAtencion || atencion.fechaInicio).slice(0, 10),
      examen: estudio.nombre,
      origen: servicioLabel(atencion.servicio),
      estado: laboratorioEstadoLabels[orden.estado] || orden.estado,
      atencion,
    }));
  });
}

export function EstudiosHistoryTable({
  estudios,
  onVer,
}: {
  estudios: EstudioHistorialRow[];
  onVer: (atencion: Atencion) => void;
}) {
  if (estudios.length === 0) {
    return (
      <p className="text-sm font-semibold text-[#64748B]">Sin estudios complementarios registrados.</p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead className="bg-[#EEF6FA] text-[11px] uppercase tracking-wide text-[#64748B]">
          <tr>
            <th className="px-3 py-2 font-semibold">Fecha</th>
            <th className="px-3 py-2 font-semibold">Examen</th>
            <th className="px-3 py-2 font-semibold">Origen</th>
            <th className="px-3 py-2 font-semibold">Estado</th>
            <th className="px-3 py-2 font-semibold">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D7E3EC]">
          {estudios.map((estudio) => (
            <tr key={estudio.id} className="text-[#0F2F44] hover:bg-[#F8FBFD]">
              <td className="px-3 py-2">{estudio.fecha}</td>
              <td className="px-3 py-2">{estudio.examen}</td>
              <td className="px-3 py-2 text-[#52677A]">{estudio.origen}</td>
              <td className="px-3 py-2 text-[#52677A]">{estudio.estado}</td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  onClick={() => onVer(estudio.atencion)}
                  className="rounded-md border border-[#D7E3EC] px-3 py-1.5 text-xs font-semibold text-[#005B84] transition hover:border-[#005B84]"
                >
                  Ver atención
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
