-- =============================================================================
-- Migración: campos clínicos, sociales y epidemiológicos
--   * Orientación sexual, pueblo/nacionalidad y discapacidad en pacientes.
--   * Antecedentes gineco-obstétricos, gestación actual y lactancia en la
--     historia clínica.
--   * Condición gineco-obstétrica registrada en cada atención.
--
-- Segura de ejecutar más de una vez (IF EXISTS / IF NOT EXISTS).
-- No elimina ni modifica datos existentes y no altera políticas RLS actuales.
--
-- NOTA IMPORTANTE: el frontend actual del sistema UBU persiste en
-- localStorage (src/lib/clinical-storage.ts); este script deja el esquema
-- listo para cuando se conecte Supabase. Los nombres de columna siguen la
-- convención snake_case solicitada.
-- =============================================================================

-- 1. Pacientes -----------------------------------------------------------------
alter table if exists public.pacientes
  add column if not exists orientacion_sexual        text,
  add column if not exists pueblo_nacionalidad       text,
  add column if not exists discapacidad              text,   -- 'No' | 'Sí'
  add column if not exists tipo_discapacidad         text,
  add column if not exists porcentaje_discapacidad   numeric(5,2)
    constraint pacientes_porcentaje_discapacidad_chk
    check (porcentaje_discapacidad is null
           or (porcentaje_discapacidad >= 1 and porcentaje_discapacidad <= 100)),
  add column if not exists carnet_discapacidad       text,
  add column if not exists observacion_discapacidad  text;

-- 2. Historias clínicas: antecedentes gineco-obstétricos ------------------------
alter table if exists public.historias_clinicas
  add column if not exists menarquia                          text,
  add column if not exists fum                                date,
  add column if not exists ciclo_menstrual                    text,  -- Regular | Irregular | Amenorrea | No aplica
  add column if not exists duracion_ciclo                     integer,
  add column if not exists duracion_sangrado                  integer,
  add column if not exists dismenorrea                        text,  -- No | Sí
  add column if not exists inicio_vida_sexual                 text,  -- No | Sí | Prefiere no responder
  add column if not exists metodo_anticonceptivo              text,
  add column if not exists gestas                             integer,
  add column if not exists partos                             integer,
  add column if not exists cesareas                           integer,
  add column if not exists abortos                            integer,
  add column if not exists hijos_vivos                        integer,
  add column if not exists antecedente_its                    text,
  add column if not exists ultimo_papanicolaou                date,
  add column if not exists ultimo_control_ginecologico        date,
  add column if not exists observaciones_gineco_obstetricas   text,
  -- Gestación actual (edad gestacional calculada con la FUM: FPP = FUM + 280 días)
  add column if not exists gesta_actual                       text,  -- No | Sí | No sabe
  add column if not exists fum_gestacion                      date,
  add column if not exists edad_gestacional_semanas           integer,
  add column if not exists edad_gestacional_dias              integer,
  add column if not exists fecha_probable_parto               date,
  add column if not exists controles_prenatales               integer,
  add column if not exists riesgo_obstetrico                  text,  -- Bajo | Alto | No determinado
  add column if not exists observaciones_gestacion            text,
  -- Lactancia
  add column if not exists lactancia_actual                   text,  -- No | Sí
  add column if not exists tipo_lactancia                     text,  -- Exclusiva | Mixta | Complementaria
  add column if not exists edad_lactante                      text,
  add column if not exists observaciones_lactancia            text;

-- 3. Atenciones: condición gineco-obstétrica al momento de la atención ----------
alter table if exists public.atenciones
  add column if not exists gesta_actual_atencion              text,  -- No | Sí | No sabe
  add column if not exists fum_gestacion_atencion             date,
  add column if not exists edad_gestacional_semanas_atencion  integer,
  add column if not exists edad_gestacional_dias_atencion     integer,
  add column if not exists fecha_probable_parto_atencion      date,
  add column if not exists controles_prenatales_atencion      integer,
  add column if not exists riesgo_obstetrico_atencion         text,
  add column if not exists lactancia_actual_atencion          text,  -- No | Sí
  add column if not exists tipo_lactancia_atencion            text,
  add column if not exists edad_lactante_atencion             text,
  add column if not exists observaciones_gineco_atencion      text;

-- 4. Índices para reportes epidemiológicos e institucionales --------------------
create index if not exists idx_pacientes_orientacion_sexual
  on public.pacientes (orientacion_sexual)
  where orientacion_sexual is not null;

create index if not exists idx_pacientes_pueblo_nacionalidad
  on public.pacientes (pueblo_nacionalidad)
  where pueblo_nacionalidad is not null;

create index if not exists idx_pacientes_discapacidad_tipo
  on public.pacientes (discapacidad, tipo_discapacidad)
  where discapacidad = 'Sí';

create index if not exists idx_historias_gesta_actual
  on public.historias_clinicas (gesta_actual)
  where gesta_actual = 'Sí';

create index if not exists idx_historias_lactancia_actual
  on public.historias_clinicas (lactancia_actual)
  where lactancia_actual = 'Sí';

create index if not exists idx_atenciones_gesta_actual
  on public.atenciones (gesta_actual_atencion)
  where gesta_actual_atencion = 'Sí';

create index if not exists idx_atenciones_lactancia_actual
  on public.atenciones (lactancia_actual_atencion)
  where lactancia_actual_atencion = 'Sí';

-- 5. RLS -------------------------------------------------------------------------
-- Las columnas nuevas quedan cubiertas por las políticas RLS existentes de cada
-- tabla (las políticas de Postgres operan a nivel de fila, no de columna), por lo
-- que el rol de medicina que hoy puede leer/escribir pacientes, historias
-- clínicas y atenciones puede hacerlo también sobre estos campos sin cambios.
-- Si alguna tabla usara GRANT a nivel de columna, ejecutar además, ajustando el
-- rol según el proyecto:
--
--   grant select, insert, update on public.pacientes          to authenticated;
--   grant select, insert, update on public.historias_clinicas to authenticated;
--   grant select, insert, update on public.atenciones         to authenticated;
