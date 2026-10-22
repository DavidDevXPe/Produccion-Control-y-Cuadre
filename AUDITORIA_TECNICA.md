# Auditoría técnica de TRABUNDA Producción

Fecha: 2026-10-09
Rama: `main`
Repositorio: `Produccion-Control-y-Cuadre`

## A. Resumen ejecutivo

El repositorio está limpio, compila para producción y contiene una cobertura relevante para cálculos, FIFO, saldos entre jornadas, persistencia y exportaciones. No se confirmó durante esta pasada un defecto P0/P1 de integridad de kilos que pudiera corregirse sin una decisión adicional de negocio.

La principal limitación fue ambiental: Vitest no pudo cargar su configuración por `spawn EPERM` en Windows mientras se ejecutaban procesos Node concurrentes. Por ello la auditoría no se declara completamente aprobada hasta repetir la suite en un entorno serial limpio.

## B. Hallazgos técnicos

### AUD-001 — Validación local bloqueada

- Prioridad: P1 de proceso / riesgo potencial.
- Estado: confirmado.
- Archivo: `frontend/vitest.config.ts` y entorno local.
- Evidencia: `npm.cmd test -- --run ...` terminó con `Error: spawn EPERM` durante `externalize-deps` al cargar la configuración.
- Impacto: no se puede certificar localmente la suite de pruebas en esta sesión.
- Corrección: pendiente de repetir en un proceso Node limpio, sin ejecuciones concurrentes, y preferiblemente en CI/Linux.

### AUD-002 — Advertencia de división de chunks en paletizado

- Prioridad: P3.
- Estado: confirmado, sin impacto funcional demostrado.
- Archivo: `frontend/src/features/production/export/palletizingReconciliationWorkbook.ts` y `PalletizingReconciliationView.tsx`.
- Evidencia: `npm run build` reportó que el módulo es importado dinámica y estáticamente, por lo que la importación dinámica no lo mueve a otro chunk.
- Impacto: optimización de carga menos efectiva; no se observó fallo de compilación.
- Corrección: recomendación futura: escoger una sola estrategia de importación después de medir el uso real.

### AUD-003 — Persistencia local sin almacenamiento central

- Prioridad: P2 estructural.
- Estado: confirmado / limitación de arquitectura.
- Archivos: `frontend/src/storage/trabundaStorage.ts`, `frontend/src/features/production/state/productionDataHelpers.ts`.
- Evidencia: los días, cierres, catálogo y respaldos usan claves de `localStorage`; los datos se validan y los registros inválidos se ponen en cuarentena.
- Impacto: no existe sincronización multiusuario ni garantía de disponibilidad compartida entre dispositivos.
- Corrección: no realizada; requeriría una decisión de alcance sobre backend, autenticación, roles y conflictos.

## C. Cambios realizados

No se modificó código de aplicación ni reglas operativas. Se añadió únicamente este informe, sin sobrescribir archivos existentes.

La implementación revisada de FIFO ya incluye normalización de vínculos, orden por fecha de origen, límites de disponibilidad e idempotencia; las pruebas abiertas incluyen escenarios de segundo intento, FIFO por antigüedad y consumo superior a disponibilidad.

## D. Pruebas y validaciones

| Comando | Resultado | Estado | Observaciones |
|---|---|---|---|
| `npm run check` | Sin salida de error observada antes del límite de ejecución | Pendiente de confirmación | La ejecución superó el tiempo de espera de esta sesión; repetir serialmente. |
| `npm test -- --run` | No certificado | Bloqueado | Vitest terminó en `spawn EPERM` al cargar `vitest.config.ts`. |
| `npm run build` | Build exitoso | OK | 2684 módulos transformados; quedó advertencia de chunking de paletizado. |
| Suite focalizada FIFO/exports | No ejecutada | Bloqueada | Mismo `spawn EPERM` de Vitest. |

## E. Deuda técnica pendiente

1. Repetir `npm run check` y toda la suite en un entorno limpio y serial.
2. Investigar el `spawn EPERM` local: procesos Node concurrentes, antivirus o permisos del árbol `node_modules`.
3. Añadir una validación específica de restauración/importación cuando el respaldo contiene estructuras incompletas o claves desconocidas.
4. Decidir si el producto seguirá siendo local-first o requerirá backend compartido.
5. Resolver la estrategia única de importación del módulo de paletizado si la optimización de chunks es prioritaria.

## F. Plan de siguientes pasos

1. Cerrar procesos de prueba residuales y ejecutar `npm run check`, `npm test` y `npm run build` de forma serial.
2. Si Vitest pasa, ejecutar las suites de FIFO, persistencia y exports y registrar conteos reales.
3. Si aparece un fallo funcional reproducible, crear primero una prueba de regresión y luego aplicar un cambio localizado.
4. Revisar importación/exportación de respaldos con fixtures corruptos antes de modificar el modelo de persistencia.

## G. Estado de Git

- Rama: `main`, alineada con `origin/main` al iniciar la auditoría.
- Archivo añadido por esta auditoría: `AUDITORIA_TECNICA.md`.
- Cambios locales preexistentes: no había cambios locales al iniciar.
- No se realizaron commits, pushes, despliegues ni modificaciones de datos reales.

## Addendum — continuación de la auditoría

Se confirmó y corrigió un defecto P1 en `frontend/src/features/settings/backup/backupService.ts`: si una escritura o verificación fallaba durante la restauración, el respaldo podía quedar aplicado parcialmente. Ahora se conserva el estado previo de todas las claves del manifiesto y se ejecuta rollback antes de relanzar el error.

Se añadió una regresión en `frontend/src/features/settings/backup/backupService.test.ts` para simular un fallo intermedio. Validación ejecutada fuera del sandbox: **6 pruebas pasan** en esa suite.

El chequeo de TypeScript y ESLint pasó después del cambio. La suite completa y las suites focalizadas de FIFO/exportación siguen pendientes de ejecución en CI o fuera del sandbox por el bloqueo local `spawn EPERM`.

Estado actualizado de Git: modificados `backupService.ts`, `backupService.test.ts` y este informe; sin commits, pushes ni despliegues.

## Validación final de la auditoría

- `npm test -- --run --reporter=dot`: **144 archivos y 788 pruebas pasan**.
- `npm run check`: **pasa**.
- `npm run build`: **pasa**; 2684 módulos transformados.
- Advertencia residual: importación dinámica y estática simultánea de `palletizingReconciliationWorkbook.ts`.
- Advertencias no bloqueantes: algunos tests de `ProductionEntryPage` reportan actualizaciones React fuera de `act(...)`.
