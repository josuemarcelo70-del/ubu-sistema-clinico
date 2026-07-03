export type TipoUsuario = "estudiante" | "docente" | "administrativo" | "externo";
export type NivelAcademico = "pregrado" | "posgrado";
export type ServicioDestino = "medicina" | "odontologia" | "psicologia";
export type PrioridadTriaje = "rojo" | "naranja" | "amarillo" | "verde" | "azul";
export type EstadoDerivacion = "pendiente" | "en_atencion" | "atendido" | "cancelado";
export type OrigenDerivacion =
  | "enfermeria"
  | "medicina_manual"
  | "odontologia_manual"
  | "psicologia_manual";

export type Paciente = {
  id: string;
  cedula: string;
  historiaClinica?: string;
  historiaClinicaNumero?: string;
  numeroHistoriaClinica?: string;
  hc?: string;
  historiaClinicaId?: string;
  nombres: string;
  apellidos: string;
  sexo: string;
  fechaNacimiento: string;
  edad: string;
  telefono: string;
  correo: string;
  correoInstitucional: string;
  direccion: string;
  tipoUsuario: TipoUsuario;
  nivelAcademico?: NivelAcademico;
  facultadId?: string;
  facultadNombre?: string;
  carreraId?: string;
  carreraNombre?: string;
  programaPosgradoId?: string;
  programaPosgradoNombre?: string;
  ciclo?: string;
  periodoAcademicoId?: string;
  periodoAcademicoNombre?: string;
  dependencia?: string;
  cargo?: string;
  institucionProcedencia?: string;
  antecedentesPersonales?: string;
  antecedentesFamiliares?: string;
  alergias?: string;
  antecedentesQuirurgicos?: string;
  estadoCivil?: string;
  etnia?: string;
  grupoSanguineo?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaAperturaHistoriaClinica?: string;
};

export type Cie10Diagnostico = {
  codigo: string;
  descripcion: string;
};

export type AntecedentePatologico = Cie10Diagnostico & {
  observacion?: string;
};

export type AntecedenteFamiliar = Cie10Diagnostico & {
  familiar: string;
  observacion?: string;
};

export type HabitosPersonales = {
  miccion: string;
  deposiciones: string;
  alimentacion: string;
  alcohol: string;
  alcoholObservacion?: string;
  tabaco: string;
  tabacoObservacion?: string;
  otrasSustancias: string;
  medicacionHabitual: string;
  actividadFisica: string;
  actividadFisicaObservacion?: string;
};

export type HistoriaClinica = {
  id: string;
  pacienteId: string;
  numeroHistoriaClinica: string;
  fechaApertura: string;
  medicoResponsable: string;
  datosPersonales: Partial<Paciente>;
  habitosPersonales: HabitosPersonales;
  antecedentesPersonales: AntecedentePatologico[];
  antecedentesFamiliares: AntecedenteFamiliar[];
  antecedentesPersonalesObservacion?: string;
  antecedentesFamiliaresObservacion?: string;
  antecedentesQuirurgicos: string;
  alergias: string;
  estado: "activa";
};

export type SignosVitales = {
  id: string;
  pacienteId: string;
  fecha: string;
  presionArterial: string;
  presionArterialSistolica?: string;
  presionArterialDiastolica?: string;
  frecuenciaCardiaca: string;
  frecuenciaRespiratoria: string;
  temperatura: string;
  saturacionOxigeno: string;
  peso: string;
  talla: string;
  imc: string;
  observaciones: string;
  registradoPorUserId: string;
};

export type DiagnosticoAtencion = Cie10Diagnostico & {
  tipo: "Presuntivo" | "Definitivo";
  principal: boolean;
};

export type MedicamentoOrden = {
  medicamentoId: string;
  nombre: string;
  presentacion?: string;
  dosis: string;
  cantidad: number;
  stockAlMomento: number;
};

export type OrdenFarmacia = {
  codigo: string;
  estado: "pendiente" | "recibido" | "procesado" | "entregado" | "finalizado";
  medicamentos: MedicamentoOrden[];
  fecha: string;
  pacienteId: string;
  cedulaPaciente: string;
  medicoId: string;
};

export type EstudioLaboratorio = {
  pruebaId: string;
  nombre: string;
  stockAlMomento?: number;
};

export type OrdenLaboratorio = {
  codigo: string;
  estado: "pendiente" | "recibido" | "procesado" | "entregado" | "finalizado";
  estudios: EstudioLaboratorio[];
  fecha: string;
  pacienteId: string;
  cedulaPaciente: string;
  medicoId: string;
};

export type IndicacionEnfermeria = {
  codigo: string;
  indicaciones: string;
  estado: "pendiente" | "recibido" | "procesado" | "entregado" | "finalizado";
  fecha: string;
  pacienteId: string;
  cedulaPaciente: string;
  medicoId: string;
};

export type CertificadoMedico = {
  id: string;
  tipo: "atencion" | "reposo";
  fecha: string;
  datos: Record<string, string>;
};

export type ProcedimientoAtencion = {
  realizado: boolean;
  tipo: "" | "Invasivo" | "No invasivo" | "Cirugía menor";
  descripcion: string;
  observaciones: string;
  complicaciones: string;
};

export type ReferenciaDerivacion = {
  emitida: boolean;
  motivo: string;
  destino: string;
  diagnostico: string;
  prioridad: "Normal" | "Preferente" | "Urgente";
  observaciones: string;
};

export type Derivacion = {
  id: string;
  pacienteId: string;
  signosVitalesId?: string;
  servicioDestino: ServicioDestino;
  motivoConsultaBreve: string;
  prioridadTriaje: PrioridadTriaje;
  estado: EstadoDerivacion;
  fechaDerivacion: string;
  horaLlegada: string;
  derivadoPorUserId: string;
  origen: OrigenDerivacion;
  fechaInicioAtencion?: string;
  atendidoPorUserId?: string;
};

export type Atencion = {
  id: string;
  derivacionId: string;
  pacienteId: string;
  servicio: ServicioDestino;
  tipoAtencion: "apertura_hc" | "subsecuente";
  estado: "en_proceso" | "finalizada" | "cancelada";
  fechaInicio: string;
  fechaFinalizacion?: string;
  profesionalId: string;
  cedulaPaciente?: string;
  historiaClinica?: string;
  fechaAtencion?: string;
  horaInicio?: string;
  horaFin?: string;
  profesionalNombre?: string;
  origen?: OrigenDerivacion;
  signosVitales?: SignosVitales & { clasificacionImc?: string };
  motivoConsulta?: string;
  enfermedadActual?: string;
  examenFisico?: string;
  diagnosticos?: DiagnosticoAtencion[];
  diagnosticoPrincipal?: DiagnosticoAtencion;
  planTratamiento?: string;
  ordenFarmacia?: OrdenFarmacia;
  ordenLaboratorio?: OrdenLaboratorio;
  indicacionEnfermeria?: IndicacionEnfermeria;
  certificados?: CertificadoMedico[];
  procedimiento?: ProcedimientoAtencion;
  referenciaDerivacion?: ReferenciaDerivacion;
  createdAt?: string;
  updatedAt?: string;
};
