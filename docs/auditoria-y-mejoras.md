# Auditoría y mejoras (23 sep 2026)

Estado de referencia al cerrar: `npm run check` limpio, **364 tests** pasan (línea base: 265),
`npm run build` OK. Paquete principal 1125 kB → 429 kB. Sin commits ni cambios en datos de
`localStorage`; las reglas de negocio de Envasado, FIFO y cierre no se modificaron.

## Antes de hacer commit (importante)

Algunos archivos contienen **trabajo tuyo y mío mezclado**. No se pueden separar por archivo:

| Archivo | Qué hay mezclado |
| --- | --- |
| `pages/ProductionEntryPage.tsx` | Tus cambios de Congelamiento **más 3 ediciones mías** (ver abajo). |
| `model/freezing.ts` y `freezing.test.ts` | Tu explicación de disponibilidad **más mi comparativo** (`linkageExcessKg100`, `reviewReasons`). |
| `pages/DashboardPage.tsx` | Tu WIP del Dashboard reescrito por mí (copia previa en el scratchpad de la sesión). |
| `pages/BalancesPage.tsx` | Mis cambios de Saldos más tu `FreezingAvailabilityExplanation`. |
| `performance/*` (`OperationalPerformancePage`, `PerformanceShiftCard`, `performanceCalculations`) | Tu benchmark semanal más mis cambios de accesibilidad. |

**Mis 3 ediciones en `ProductionEntryPage.tsx`.** Si guardas ese archivo desde un editor que tenía una
versión anterior abierta, se pisarían. Compruébalas antes de commitear:

1. Existe `import { buildClosureObservations } from '../model/closureObservations'` y **no** existe
   `function buildClosureObservations(` dentro del archivo (se movió a `model/closureObservations.ts`).
2. El modal "Cambiar a …" usa `bg-white p-5 shadow-2xl sm:p-6` (antes `bg-[#0d1f2c]`, ilegible en claro).
3. Los fondos de modal usan `bg-black/60` y `bg-black/70` (antes `bg-slate-950/…`, velo casi blanco en oscuro).

Si falta el punto 1 la pantalla de captura falla en ejecución. `npm test` lo detecta.

## Agrupación sugerida para commits

1. **Seguridad de datos locales**: `storage/storageQuarantine.ts`, `storage/trabundaStorage.ts`,
   `state/ProductionDataContext.tsx` (+test), `settings/backup/backupService.ts` (+test),
   `settings/pages/DataBackupsPage.tsx` (+test).
2. **Estado de jornada y reglas**: `presentation/journeyStatus.ts` (+test),
   `model/closureObservations.ts`, `docs/reglas-de-negocio.md`.
3. **Comparativo Envasado vs Congelamiento**: `model/freezing.ts` (parte de comparativo),
   `presentation/freezingComparisonReasons.ts` (+test), `components/ProductionComparisonView.tsx` (+test),
   `components/DashboardProcessComparison.tsx`, `model/freezingOverLink.test.ts`, `src/test/productionFixtures.ts`.
4. **Componentes base**: `MetricCard` (+test), `index.css`, `ui/Modal.tsx` (+test), `ui/SegmentedTabs.tsx` (+test),
   `ProcessSelector`, `StatusBadge`, `components/CloseDayDialog.tsx`.
5. **Pantallas**: Dashboard (`DashboardPage`, `presentation/dashboardAttention.ts`), Jornadas
   (`ProductionDaysPage`), Detalle (`ProductionDayPage`), Saldos (`BalancesPage`, `BalancePanel`,
   `FreezingBalancesPanel`, `model/types.ts`, `model/calculations.ts`), Rendimiento, Resumen
   (`WeeklySummaryPage`, `WeeklyDaysTable`, `WeeklyProductSummary`).
6. **Carga y accesibilidad**: `app/router.tsx`, `config/localUser.ts` + `assets/profile/david-castillo-160.png`,
   `layouts/AdminLayout.tsx` y correcciones de contraste.
7. **Tests de reglas**: normalizadores, FIFO idempotente, parser de Congelamiento, saldo de Envasado en exceso.

## Cambios por fase

### B. Errores reales y red de seguridad
- **Pérdida silenciosa de datos** (`ProductionDataContext`): un JSON dañado, registros rechazados o jornadas locales
  que coinciden con el historial permanente se descartaban y el siguiente guardado los borraba. Ahora se copian
  a una cuarentena (`trabunda-storage-quarantine-v1`), que entra en el respaldo y no se borra al restaurar uno
  antiguo. `Datos y respaldos` la muestra (solo lectura, con exportación).
- **Estado de jornada coherente** (`presentation/journeyStatus.ts`): `CUADRADO` (verde), `CUADRADO · OBSERVADO`
  (amarillo), `POR REVISAR` (amarillo, borrador) y `NO CUADRADO` (rojo: cerrada sin cuadrar o integridad
  bloqueante). Las observaciones son las guardadas al cerrar o, si no hay, las advertencias de validación.
  Antes cada pantalla decidía distinto (la semana 41 salía observada en Dashboard, mixta en Jornadas y sin observar en Resumen).
- Modal "Cambiar proceso" ilegible en modo claro.
- Regla vigente de cierre de Congelamiento documentada en `docs/reglas-de-negocio.md`.

### Comparativo Envasado vs Congelamiento
El estado deja de depender de la diferencia neta. `calculateFreezingComparison` conserva por separado:
físico reportado, vinculado, físico sin origen, exceso de vinculación, exceso de origen y problemas de integridad,
y pasa a `REVISAR` si existe cualquiera (`reviewReasons`). Los valores existentes no cambian.
Un exceso de vinculación (80 t reportadas, 100 t vinculadas) ya no se muestra como `CONCILIADO`.

### C y D. Sistema visual y Dashboard
`MetricCard` sin altura mínima fija (la fila decide la altura). Dashboard: KPIs alineados, bloque central por contenido
(sin estirar tarjetas), colores por jerarquía (azul información, amarillo observación, rojo problema real, verde correcto),
accesos rápidos compactos, excepciones ordenadas por severidad con máximo 5 visibles, y las inconsistencias de
trazabilidad visibles en el Dashboard. Sin colores hex hardcodeados en esa pantalla.

### E. Jornadas y detalle
Estado unificado, diferencias en rojo solo si la jornada no cuadra, tabla sin scroll innecesario a 1440 px.
`Modal` compartido (Escape, foco atrapado y restaurado) y un solo `CloseDayDialog` en lugar de dos modales de ~235 líneas
casi idénticos; `ProductionDayPage` pasó de 1025 a 517 líneas.

### F. Saldos
Los orígenes con exceso ya no se ocultan (Congelamiento ni Envasado): `OutstandingBalancePosition.excessKg100`
conserva el exceso sin cambiar `pendingKg100`. Inconsistencias primero, luego FIFO. Enlaces a la jornada de origen.

### G. Rendimiento y H. Resumen
`SegmentedTabs` con teclado completo y `tabpanel`. Resumen: estado por jornada coherente, la vista sigue a la URL
(antes era una copia en `useState`), diferencia semanal sin rojo si vale 0 en una semana abierta.

### J. Carga y accesibilidad
Rutas perezosas (paquete principal 1125 → 429 kB), avatar 582 → 53 kB. Auditoría con axe-core en 10 rutas × 2 temas:
0 violaciones finales (contraste y landmark de la barra superior).

## Tests añadidos (265 → 364 con tus tests nuevos)
Normalizadores (`balanceUseNormalization`, `balanceLotNormalization`), FIFO idempotente, parser de Congelamiento,
comparativo con exceso de vinculación, saldo de Envasado en exceso, `journeyStatus`, `dashboardAttention`,
`Modal`, `SegmentedTabs`, `MetricCard`, cuarentena de datos y flujo real de cierre de jornada.

## Ronda posterior

- KPI "Cuadradas" de Jornadas unificado con el Dashboard: cuenta solo las cerradas, cuadradas y sin observaciones;
  las observadas se cuentan aparte.
- Colores hex fijos de `AdminLayout`, `WeekSelector`, `UserIdentity`, `DataBackupsPage` y `ProductionDayPage`
  pasados a tokens `--color-ui-*` en `index.css` (mismos valores; `#6f8796` se fusionó con `#6f8798`).
- `docs/architecture.md` documenta presentación compartida, cuarentena de datos y carga bajo demanda.
- `.editorconfig` (2 espacios, UTF-8). No se instaló Prettier ni se reformateó nada: tocaría casi todos los archivos.

## Pendiente

- **Fase I: `ProductionEntryPage.tsx` (6216 líneas)**: no se ejecutó (ver el mensaje de cierre). Plan gradual, sin cambiar reglas:
  mover `buildFreezingExcelPreview` y helpers puros a `capture/`, `QuantityInput` a `components/`, derivados de
  trazabilidad a funciones puras con tests, panel de importación Excel, panel de saldos/orígenes y migrar los 3 modales
  restantes a `components/ui/Modal`.
- ~216 colores hex en `ProductionEntryPage` y 21 en `FreezingDayDetail` (tu zona de Congelamiento), más 7 en
  `WeeklyProductionChart`.
- `FreezingSummaryView` / `FreezingDayDetail` usan `sky-*` con variantes oscuras manuales.
- `assets/profile/david-castillo.png` (582 kB) ya no se usa; puedes borrarlo (el sistema bloqueó que lo borrara yo).
