---
name: verify
description: Cómo compilar, lanzar y conducir el sistema UBU clínico para verificar cambios de UI en tiempo de ejecución (Next.js + localStorage, sin backend).
---

# Verificar el sistema UBU clínico

App Next.js 100% cliente: todos los datos viven en localStorage; no hay base de datos ni API.

## Compilar y lanzar

```bash
npm run build          # next build
npm run start &        # producción en http://localhost:3000
# o npm run dev (puerto 3000, más lento)
```

## Conducir con navegador headless

Hay navegadores Playwright cacheados en `~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome`.
Instalar `playwright-core` en el scratchpad (no en el proyecto) y lanzar con `executablePath` apuntando a ese binario.

## Sembrar estado (clave)

No hay login real: la sesión y los datos se siembran por `addInitScript` en localStorage **antes** de navegar:

- `ubu-sistema-clinico-session` — objeto `SimulatedSession` (ver `src/lib/mock-users.ts`); usuario medicina: `userId: "jhoely-lalangui"`, `roles: ["medicina"]`, `activeRole: "medicina"`.
- `ubu_pacientes`, `ubu_historias_clinicas`, `ubu_derivaciones`, `ubu_atenciones`, `ubu_signos_vitales` — arreglos JSON (tipos en `src/types/clinical.ts`, claves en `src/lib/clinical-storage.ts`).

Gotchas:
- `hasHistoriaClinica` exige un registro real en `ubu_historias_clinicas` cuyo `numeroHistoriaClinica` sea la cédula.
- La pestaña gineco-obstétrica solo aparece si `paciente.sexo === "Femenino"` (exacto).
- Sin sesión válida el AppShell redirige a `/acceso-denegado`.

## Flujos que valen la pena

- **Atención médica**: `/medicina/atenciones-pendientes` → botón "Iniciar atención" (requiere derivación `pendiente` a medicina + HC activa). El modal usa tabs reales; el historial de atenciones/estudios está en la pestaña "Historial".
- **Detalle de atención previa**: en Historial → "Ver"; descarga de resumen PDF (necesita `public/fonts/montserrat-*.ttf` y `public/brand/fondo-documentos.jpg`, servidos por el mismo server).
- **Historia clínica**: `/medicina/historia-clinica` → tarjeta de categoría → "Abrir" en la fila del paciente.

Capturar `pageerror`/`console.error` del navegador: la app no muestra stacktraces en UI.
