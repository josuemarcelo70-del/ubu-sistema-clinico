"use client";

import { useState } from "react";

import {
  actualizarCarrera,
  actualizarCiclo,
  actualizarDependencia,
  actualizarFacultad,
  actualizarPeriodoAcademico,
  agregarCarrera,
  guardarCiclo,
  guardarDependencia,
  guardarFacultad,
  guardarPeriodoAcademico,
  obtenerCiclos,
  obtenerDependencias,
  obtenerFacultades,
  obtenerPeriodosAcademicos,
} from "@/lib/academic-catalogs";
import { Field, inputClass, selectClass } from "@/components/clinical/ClinicalFormFields";

type Tab = "facultades" | "ciclos" | "periodos" | "dependencias";

function useCatalogRefresh() {
  const [tick, setTick] = useState(0);
  return { tick, refresh: () => setTick((value) => value + 1) };
}

export function CatalogAdmin({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("facultades");
  const { tick, refresh } = useCatalogRefresh();

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "facultades", label: "Facultades y carreras" },
    { key: "ciclos", label: "Ciclos" },
    { key: "periodos", label: "Periodos académicos" },
    { key: "dependencias", label: "Dependencias / áreas" },
  ];

  return (
    <section className="dashboard-fade mx-auto max-w-7xl space-y-4">
      <div className="rounded-lg border border-[#D7E3EC] bg-white shadow-sm">
        <div className="h-1 bg-[linear-gradient(90deg,#D71920_0%,#D71920_26%,#005B84_26%,#005B84_100%)]" />
        <div className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#005B84]">
              Administración
            </p>
            <h1 className="mt-1 text-2xl font-black text-[#082F49]">Catálogos institucionales</h1>
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

      <div className="flex flex-wrap gap-2 rounded-lg border border-[#D7E3EC] bg-white p-2 shadow-sm">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`rounded-md px-3 py-2 text-sm font-semibold ${
              tab === item.key ? "bg-[#005B84] text-white" : "text-[#0F2F44] hover:bg-[#EEF6FA]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "facultades" && <FacultadesPanel key={tick} onChanged={refresh} />}
      {tab === "ciclos" && <CiclosPanel key={tick} onChanged={refresh} />}
      {tab === "periodos" && <PeriodosPanel key={tick} onChanged={refresh} />}
      {tab === "dependencias" && <DependenciasPanel key={tick} onChanged={refresh} />}
    </section>
  );
}

function PanelShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="ubu-card overflow-hidden">
      <div className="border-b border-[#D7E3EC] px-4 py-3">
        <h2 className="text-base font-black text-[#082F49]">{title}</h2>
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </div>
  );
}

function ActivoToggle({ activo, onToggle }: { activo: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
        activo ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FFE4E6] text-[#BE123C]"
      }`}
    >
      {activo ? "ACTIVO" : "INACTIVO"}
    </button>
  );
}

function FacultadesPanel({ onChanged }: { onChanged: () => void }) {
  const [facultades, setFacultades] = useState(obtenerFacultades());
  const [nombre, setNombre] = useState("");
  const [carreraDrafts, setCarreraDrafts] = useState<Record<string, string>>({});

  function reload() {
    setFacultades(obtenerFacultades());
    onChanged();
  }

  return (
    <PanelShell title="Facultades y carreras">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          placeholder="Nombre de la nueva facultad"
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => {
            if (!nombre.trim()) return;
            guardarFacultad(nombre);
            setNombre("");
            reload();
          }}
          className="ubu-btn ubu-btn-primary"
        >
          Agregar facultad
        </button>
      </div>

      <div className="space-y-3">
        {facultades.map((facultad) => (
          <div key={facultad.id} className="rounded-md border border-[#D7E3EC] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-black text-[#082F49]">{facultad.nombre}</p>
              <ActivoToggle
                activo={facultad.activo}
                onToggle={() => {
                  actualizarFacultad(facultad.id, { activo: !facultad.activo });
                  reload();
                }}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {facultad.carreras.map((carrera) => (
                <span
                  key={carrera.id}
                  className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    carrera.activo ? "bg-[#EEF6FA] text-[#005B84]" : "bg-[#F1F5F9] text-[#94A3B8] line-through"
                  }`}
                  onClick={() => {
                    actualizarCarreraLocal(facultad.id, carrera.id, !carrera.activo);
                    reload();
                  }}
                >
                  {carrera.nombre}
                </span>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={carreraDrafts[facultad.id] ?? ""}
                onChange={(event) =>
                  setCarreraDrafts((current) => ({ ...current, [facultad.id]: event.target.value }))
                }
                placeholder="Nueva carrera para esta facultad"
                className={`${inputClass} sm:max-w-xs`}
              />
              <button
                type="button"
                onClick={() => {
                  const value = carreraDrafts[facultad.id]?.trim();
                  if (!value) return;
                  agregarCarrera(facultad.id, value);
                  setCarreraDrafts((current) => ({ ...current, [facultad.id]: "" }));
                  reload();
                }}
                className="ubu-btn ubu-btn-secondary ubu-btn-sm"
              >
                Agregar carrera
              </button>
            </div>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

function actualizarCarreraLocal(facultadId: string, carreraId: string, activo: boolean) {
  actualizarCarrera(facultadId, carreraId, { activo });
}

function CiclosPanel({ onChanged }: { onChanged: () => void }) {
  const [ciclos, setCiclos] = useState(obtenerCiclos());
  const [nombre, setNombre] = useState("");

  function reload() {
    setCiclos(obtenerCiclos());
    onChanged();
  }

  return (
    <PanelShell title="Ciclos académicos">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          placeholder="Nombre del nuevo ciclo (p.ej. Undécimo)"
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => {
            if (!nombre.trim()) return;
            guardarCiclo(nombre);
            setNombre("");
            reload();
          }}
          className="ubu-btn ubu-btn-primary"
        >
          Agregar ciclo
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {ciclos.map((ciclo) => (
          <span
            key={ciclo.id}
            className="inline-flex items-center gap-2 rounded-full border border-[#D7E3EC] px-3 py-1.5 text-sm font-semibold text-[#082F49]"
          >
            {ciclo.nombre}
            <ActivoToggle
              activo={ciclo.activo}
              onToggle={() => {
                actualizarCiclo(ciclo.id, { activo: !ciclo.activo });
                reload();
              }}
            />
          </span>
        ))}
      </div>
    </PanelShell>
  );
}

function PeriodosPanel({ onChanged }: { onChanged: () => void }) {
  const [periodos, setPeriodos] = useState(obtenerPeriodosAcademicos());
  const [nombre, setNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [tipo, setTipo] = useState<"ordinario" | "interciclo">("ordinario");
  const [message, setMessage] = useState("");

  function reload() {
    setPeriodos(obtenerPeriodosAcademicos());
    onChanged();
  }

  function add() {
    if (!nombre.trim() || !fechaInicio || !fechaFin) {
      setMessage("Complete nombre, fecha de inicio y fecha de fin.");
      return;
    }
    if (fechaFin < fechaInicio) {
      setMessage("La fecha de fin no puede ser anterior a la fecha de inicio.");
      return;
    }
    guardarPeriodoAcademico({ nombre, fechaInicio, fechaFin, tipo });
    setNombre("");
    setFechaInicio("");
    setFechaFin("");
    setMessage("");
    reload();
  }

  return (
    <PanelShell title="Periodos académicos">
      <p className="text-xs font-medium text-[#64748B]">
        El periodo activo en el formulario de Medicina se determina automáticamente comparando la fecha
        actual con estos rangos.
      </p>
      {message && (
        <div className="rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm font-semibold text-[#B91C1C]">
          {message}
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Nombre">
          <input value={nombre} onChange={(event) => setNombre(event.target.value)} className={inputClass} />
        </Field>
        <Field label="Fecha inicio">
          <input type="date" value={fechaInicio} onChange={(event) => setFechaInicio(event.target.value)} className={inputClass} />
        </Field>
        <Field label="Fecha fin">
          <input type="date" value={fechaFin} onChange={(event) => setFechaFin(event.target.value)} className={inputClass} />
        </Field>
        <Field label="Tipo">
          <select value={tipo} onChange={(event) => setTipo(event.target.value as "ordinario" | "interciclo")} className={selectClass}>
            <option value="ordinario">Ordinario</option>
            <option value="interciclo">Interciclo</option>
          </select>
        </Field>
      </div>
      <button type="button" onClick={add} className="ubu-btn ubu-btn-primary">
        Agregar periodo
      </button>

      <div className="overflow-x-auto">
        <table className="ubu-table min-w-[720px]">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Tipo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {periodos.map((periodo) => (
              <tr key={periodo.id}>
                <td className="font-bold">{periodo.nombre}</td>
                <td>{periodo.fechaInicio}</td>
                <td>{periodo.fechaFin}</td>
                <td className="capitalize">{periodo.tipo}</td>
                <td>
                  <ActivoToggle
                    activo={periodo.activo}
                    onToggle={() => {
                      actualizarPeriodoAcademico(periodo.id, { activo: !periodo.activo });
                      reload();
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PanelShell>
  );
}

function DependenciasPanel({ onChanged }: { onChanged: () => void }) {
  const [dependencias, setDependencias] = useState(obtenerDependencias());
  const [nombre, setNombre] = useState("");

  function reload() {
    setDependencias(obtenerDependencias());
    onChanged();
  }

  return (
    <PanelShell title="Dependencias / áreas">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          placeholder="Nombre de la nueva dependencia o área"
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => {
            if (!nombre.trim()) return;
            guardarDependencia(nombre);
            setNombre("");
            reload();
          }}
          className="ubu-btn ubu-btn-primary"
        >
          Agregar dependencia
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {dependencias.map((dependencia) => (
          <span
            key={dependencia.id}
            className="inline-flex items-center gap-2 rounded-full border border-[#D7E3EC] px-3 py-1.5 text-sm font-semibold text-[#082F49]"
          >
            {dependencia.nombre}
            <ActivoToggle
              activo={dependencia.activo}
              onToggle={() => {
                actualizarDependencia(dependencia.id, { activo: !dependencia.activo });
                reload();
              }}
            />
          </span>
        ))}
      </div>
    </PanelShell>
  );
}
