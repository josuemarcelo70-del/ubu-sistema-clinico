-- =============================================================================
-- Migración: talla de signos vitales en centímetros
--   * La talla se registra y guarda SIEMPRE en centímetros (número limpio,
--     sin unidades). Ejemplo: 170, no '170 cm' ni 1.70.
--   * Normaliza registros históricos guardados en metros: talla < 3 se asume
--     en metros y se convierte multiplicando por 100.
--   * Evita conversiones duplicadas: valores >= 3 no se tocan (>= 50 ya son
--     centímetros; el frontend también normaliza defensivamente al leer).
--
-- Segura de ejecutar más de una vez. No elimina datos y no altera RLS.
--
-- NOTA: el frontend actual persiste en localStorage
-- (src/lib/clinical-storage.ts); este script deja el esquema y los datos
-- listos para cuando se conecte Supabase.
-- =============================================================================

do $$
begin
  -- Signos vitales registrados por enfermería/triaje.
  if to_regclass('public.signos_vitales') is not null then
    update public.signos_vitales
      set talla = talla * 100
      where talla is not null
        and talla > 0
        and talla < 3;
  end if;

  -- Signos vitales guardados dentro de la atención médica (si la tabla los
  -- almacena en columnas propias).
  if to_regclass('public.atenciones') is not null
     and exists (
       select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'atenciones'
          and column_name = 'talla'
     ) then
    update public.atenciones
      set talla = talla * 100
      where talla is not null
        and talla > 0
        and talla < 3;
  end if;
end $$;

-- Rango clínicamente razonable para nuevos registros (50–250 cm). Se valida
-- también en el frontend; el CHECK admite NULL para no bloquear registros
-- incompletos.
do $$
begin
  if to_regclass('public.signos_vitales') is not null
     and not exists (
       select 1 from pg_constraint
        where conname = 'signos_vitales_talla_cm_chk'
     ) then
    alter table public.signos_vitales
      add constraint signos_vitales_talla_cm_chk
      check (talla is null or (talla >= 50 and talla <= 250))
      not valid; -- NOT VALID: no bloquea filas históricas fuera de rango.
  end if;
end $$;
