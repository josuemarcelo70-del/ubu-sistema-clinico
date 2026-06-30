export type Role =
  | "medicina"
  | "enfermeria"
  | "laboratorio"
  | "odontologia"
  | "psicologia"
  | "farmacia"
  | "admin";

export type PermissionKey =
  | "view_dashboard"
  | "manage_profile"
  | "manage_patients"
  | "manage_clinical_records"
  | "issue_certificates"
  | "request_laboratory"
  | "manage_prescriptions"
  | "view_monthly_report"
  | "manage_triage"
  | "manage_vital_signs"
  | "manage_referrals"
  | "manage_procedures"
  | "manage_laboratory_requests"
  | "manage_laboratory_results"
  | "manage_test_catalog"
  | "manage_dental_chart"
  | "manage_sessions"
  | "manage_followups"
  | "manage_medication_delivery"
  | "manage_stock"
  | "manage_kardex"
  | "manage_alerts"
  | "manage_users"
  | "manage_roles"
  | "manage_catalogs"
  | "manage_templates"
  | "view_audit"
  | "manage_settings";

export type NavItem = {
  label: string;
  href: string;
};

export type RoleRouteConfig = {
  role: Role;
  label: string;
  path: string;
  navItems: NavItem[];
};

export type ProfessionalProfile = {
  tituloProfesional: string;
  cargoInstitucional: string;
  servicioDependencia: string;
  tipoContratacion: string;
  fechaInicioContrato: string;
  registroSenescyt: string;
  registroAcess: string;
  cedulaProfesional: string;
};

export type DocumentProfileSettings = {
  inicialesInforme: string;
  firmaDigitalizada: string;
  selloProfesional: string;
  nombreDocumento: string;
  responsableInformesMensuales: boolean;
  puedeEmitirCertificados: boolean;
  puedeFirmarReportes: boolean;
  puedeValidarDocumentosExternos: boolean;
};

export type UserProfile = {
  nombres: string;
  apellidos: string;
  cedula: string;
  correoInstitucional: string;
  telefono: string;
  direccionInstitucional: string;
  professional: ProfessionalProfile;
  documentSettings: DocumentProfileSettings;
};
