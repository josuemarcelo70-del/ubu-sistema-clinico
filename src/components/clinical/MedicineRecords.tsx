"use client";

import { useEffect, useMemo, useState } from "react";

import { obtenerAtenciones, obtenerPacientes } from "@/lib/clinical-storage";
import type { Atencion, Paciente } from "@/types/clinical";
import { Field, inputClass } from "./ClinicalFormFields";

// Vistas de consulta del área médica construidas sobre las atenciones ya
// registradas. No modifican datos: listan lo emitido en cada atención.

type AtencionRow = { atencion: Atencion; paciente?: Paciente };

function useAtencionesMedicina(): AtencionRow[] {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    function handleUpdate() {
      setRefreshKey((value) => value + 1);
    }
    window.addEventListener("ubu-clinical-storage-updated", handleUpdate);
    return () => window.removeEventListener("ubu-clinical-storage-updated", handleUpdate);
  }, []);

  return useMemo(() => {
    void refreshKey;
    const pacientes = obtenerPacientes();
    return obtenerAtenciones()
      .filter((atencion) => atencion.servicio === "medicina" && atencion.estado === "finalizada")
      .map((atencion) => ({
        atencion,
        paciente: pacientes.find((item) => item.id === atencion.pacienteId),
      }))
      .sort((a, b) =>
        (b.atencion.fechaFinalizacion || b.atencion.fechaInicio).localeCompare(
          a.atencion.fechaFinalizacion || a.atencion.fechaInicio,
        ),
      );
  }, [refreshKey]);
}

function patientName(paciente?: Paciente) {
  return paciente ? `${paciente.apellidos} ${paciente.nombres}`.trim() : "Paciente no encontrado";
}

function ModuleFrame({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="dashboard-fade mx-auto max-w-7xl space-y-4">
      <div className="rounded-lg border border-[#D7E3EC] bg-white shadow-sm">
        <div className="h-1 bg-[linear-gradient(90deg,#D71920_0%,#D71920_26%,#005B84_26%,#005B84_100%)]" />
        <div className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#005B84]">
              Medicina general
            </p>
            <h1 className="mt-1 text-2xl font-black text-[#082F49]">{title}</h1>
            <p className="mt-1 text-sm font-semibold text-[#64748B]">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="w-fit rounded-md border border-[#D7E3EC] px-3 py-2 text-sm font-bold text-[#082F49] transition hover:border-[#005B84] hover:text-[#005B84]"
          >
            Volver
          </button>
        </div>
      </div>
      {children}
    </section>
  );
}

function RecordsTable({
  headers,
  rows,
  emptyMessage,
}: {
  headers: string[];
  rows: Array<{ key: string; cells: React.ReactNode[] }>;
  emptyMessage: string;
}) {
  return (
    <div className="ubu-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="ubu-table min-w-[820px]">
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                {row.cells.map((cell, index) => (
                  <td key={index} className={index === 0 ? "font-bold" : "text-[#64748B]"}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-4 py-8 text-center text-sm font-bold text-[#64748B]"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CertificadosModule({ onBack }: { onBack: () => void }) {
  const atenciones = useAtencionesMedicina();
  const rows = atenciones.flatMap(({ atencion, paciente }) =>
    (atencion.certificados ?? []).map((certificado, index) => ({
      key: `${atencion.id}-${certificado.id || index}`,
      cells: [
        certificado.fecha.slice(0, 10),
        patientName(paciente),
        paciente?.cedula || atencion.cedulaPaciente || "No registra",
        certificado.tipo === "reposo" ? "Certificado de reposo" : "Certificado de atención",
        atencion.diagnosticoPrincipal
          ? `${atencion.diagnosticoPrincipal.codigo} ${atencion.diagnosticoPrincipal.descripcion}`
          : "No registra",
      ],
    })),
  );

  return (
    <ModuleFrame
      title="Certificados"
      subtitle="Certificados médicos emitidos durante las atenciones"
      onBack={onBack}
    >
      <RecordsTable
        headers={["Fecha", "Paciente", "Cédula", "Tipo", "Diagnóstico"]}
        rows={rows}
        emptyMessage="No existen certificados emitidos."
      />
    </ModuleFrame>
  );
}

export function PrescripcionesModule({ onBack }: { onBack: () => void }) {
  const atenciones = useAtencionesMedicina();
  const rows = atenciones
    .filter(({ atencion }) => atencion.ordenFarmacia)
    .map(({ atencion, paciente }) => ({
      key: atencion.id,
      cells: [
        atencion.ordenFarmacia!.codigo,
        (atencion.fechaAtencion || atencion.fechaInicio).slice(0, 10),
        patientName(paciente),
        paciente?.cedula || atencion.cedulaPaciente || "No registra",
        atencion.ordenFarmacia!.medicamentos
          .map((item) => `${item.nombre} x${item.cantidad}`)
          .join("; ") || "Sin medicamentos",
        atencion.ordenFarmacia!.estado,
      ],
    }));

  return (
    <ModuleFrame
      title="Prescripciones"
      subtitle="Órdenes de farmacia emitidas desde las atenciones médicas"
      onBack={onBack}
    >
      <RecordsTable
        headers={["Código", "Fecha", "Paciente", "Cédula", "Medicamentos", "Estado"]}
        rows={rows}
        emptyMessage="No existen prescripciones emitidas."
      />
    </ModuleFrame>
  );
}

export function LaboratorioModule({ onBack }: { onBack: () => void }) {
  const atenciones = useAtencionesMedicina();
  const rows = atenciones
    .filter(({ atencion }) => atencion.ordenLaboratorio)
    .map(({ atencion, paciente }) => ({
      key: atencion.id,
      cells: [
        atencion.ordenLaboratorio!.codigo,
        (atencion.fechaAtencion || atencion.fechaInicio).slice(0, 10),
        patientName(paciente),
        paciente?.cedula || atencion.cedulaPaciente || "No registra",
        atencion.ordenLaboratorio!.estudios.map((item) => item.nombre).join("; ") ||
          "Sin estudios",
        atencion.ordenLaboratorio!.estado,
      ],
    }));

  return (
    <ModuleFrame
      title="Solicitudes de laboratorio"
      subtitle="Órdenes de laboratorio emitidas desde las atenciones médicas"
      onBack={onBack}
    >
      <RecordsTable
        headers={["Código", "Fecha", "Paciente", "Cédula", "Estudios", "Estado"]}
        rows={rows}
        emptyMessage="No existen solicitudes de laboratorio emitidas."
      />
    </ModuleFrame>
  );
}

export function InformeMensualModule({ onBack }: { onBack: () => void }) {
  const atenciones = useAtencionesMedicina();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const delMes = atenciones.filter(({ atencion }) =>
    (atencion.fechaAtencion || atencion.fechaFinalizacion || atencion.fechaInicio).startsWith(month),
  );
  const primeras = delMes.filter(({ atencion }) => atencion.tipoAtencion === "apertura_hc").length;
  const certificados = delMes.reduce(
    (total, { atencion }) => total + (atencion.certificados?.length ?? 0),
    0,
  );
  const conFarmacia = delMes.filter(({ atencion }) => atencion.ordenFarmacia).length;
  const conLaboratorio = delMes.filter(({ atencion }) => atencion.ordenLaboratorio).length;

  const diagnosticos = new Map<string, number>();
  for (const { atencion } of delMes) {
    const diagnostico = atencion.diagnosticoPrincipal;
    if (!diagnostico) continue;
    const key = `${diagnostico.codigo} ${diagnostico.descripcion}`;
    diagnosticos.set(key, (diagnosticos.get(key) ?? 0) + 1);
  }
  const topDiagnosticos = [...diagnosticos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <ModuleFrame
      title="Informe mensual"
      subtitle="Consolidado mensual de las atenciones del servicio de Medicina"
      onBack={onBack}
    >
      <div className="ubu-card p-4">
        <div className="max-w-xs">
          <Field label="Mes del informe">
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {(
            [
              ["Atenciones finalizadas", delMes.length],
              ["Primeras atenciones", primeras],
              ["Atenciones subsecuentes", delMes.length - primeras],
              ["Certificados emitidos", certificados],
              ["Órdenes farmacia / laboratorio", `${conFarmacia} / ${conLaboratorio}`],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-md border border-[#D7E3EC] bg-[#F8FBFD] px-3 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#52677A]">{label}</p>
              <p className="mt-1 text-2xl font-black text-[#082F49]">{value}</p>
            </div>
          ))}
        </div>
      </div>
      <RecordsTable
        headers={["Diagnóstico principal (CIE-10)", "Atenciones"]}
        rows={topDiagnosticos.map(([diagnostico, total]) => ({
          key: diagnostico,
          cells: [diagnostico, String(total)],
        }))}
        emptyMessage="Sin diagnósticos registrados en el mes seleccionado."
      />
    </ModuleFrame>
  );
}
