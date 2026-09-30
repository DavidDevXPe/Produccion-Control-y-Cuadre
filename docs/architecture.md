# Arquitectura TRABUNDA Producción

## Objetivo

Separar reglas operativas de presentación para que Envasado, Congelamiento,
FIFO, catálogo e importación Excel puedan crecer sin depender de una vista
específica.

## Capas principales

- `features/production/model`: tipos de dominio, cálculos, validaciones,
  equivalencias históricas y normalización de lotes persistidos.
- `features/production/capture`: borradores de captura, importadores Excel,
  catálogo operativo, FIFO y normalización de vínculos de captura.
- `features/production/components`: paneles reutilizables para resumen,
  detalle, saldos, rendimiento y comparación.
- `features/production/pages`: composición de vistas y coordinación de estado.
- `features/settings/backup`: exportación/importación de respaldos locales.

## Flujo Envasado

1. El usuario registra manualmente o importa Excel.
2. El borrador guarda strings de input y productos de catálogo.
3. `buildProductionDayFromCapture` convierte a `Kg100` y genera
   `ProductionDay`.
4. `calculateProductionDay` valida cuadre, saldos, túnel, tratamiento y
   producto terminado.
5. Al cerrar, la jornada genera disponibilidad para Congelamiento por producto.

## Flujo Congelamiento

1. Congelamiento no recibe materia prima nueva.
2. Los reportes físicos Día/Noche se registran por producto.
3. FIFO vincula kg congelados con disponibilidades de Envasado.
4. Cada vínculo conserva jornada origen, producto fuente cuando aplica y turno
   de consumo.
5. Las diferencias se separan en:
   - kg sin origen suficiente;
   - trazabilidad completa;
   - kg vinculados en exceso.

## FIFO y normalización

Hay dos niveles de normalización:

- `normalizeCaptureBalanceUses`: limpia vínculos dentro del borrador antes,
  durante y después de FIFO. No suma duplicados; conserva el mayor valor por
  turno.
- `normalizeBalanceLots`: limpia lotes ya persistidos por identidad lógica de
  origen/producto. También conserva el mayor uso por turno.

La identidad lógica mínima es:

```text
originDayId + familyId + productId + sourceProductId
```

Esto protege datos históricos donde un click repetido o una versión anterior
pudo duplicar el mismo origen.

## Catálogo

El catálogo operativo combina seeds, productos activos persistidos y aliases.
Las equivalencias históricas viven en `productIdentity.ts` y permiten descontar
saldos aunque el producto haya cambiado de ID.

## Persistencia

La persistencia actual es local y versionada. Cualquier cambio estructural debe
preservar compatibilidad con las claves existentes y, si cambia la forma del
dato, agregar migración explícita.

## Importación Excel

- Envasado usa `Producto`, `Horario` y `Total KG`.
- Congelamiento usa `Producto` y `Cantidad (suma)`.
- En Congelamiento, `1 aro = 10 kg`; las presentaciones `SACO ...` solo son
  texto logístico.
- OCR no forma parte de la arquitectura actual.

## Presentación compartida

Las decisiones de presentación que antes tomaba cada pantalla por su cuenta
viven en módulos únicos:

- `presentation/journeyStatus.ts`: estado de una jornada (`CUADRADO`,
  `CUADRADO · OBSERVADO`, `POR REVISAR`, `NO CUADRADO`) y su tono. Lo usan
  Dashboard, Jornadas, Detalle y Resumen; ninguna pantalla lo recalcula.
- `presentation/dashboardAttention.ts`: excepciones del Dashboard ordenadas por
  severidad.
- `presentation/freezingComparisonReasons.ts`: textos de los motivos por los que
  el comparativo Envasado vs Congelamiento pasa a `REVISAR`
  (`calculateFreezingComparison` los expone en `reviewReasons`).
- `model/closureObservations.ts`: observaciones que se guardan al cerrar.
- `components/ui/Modal.tsx`: diálogo base (Escape, foco atrapado y restaurado).
  `components/CloseDayDialog.tsx` es el único diálogo de cierre de jornada.
- `components/ui/SegmentedTabs.tsx`: pestañas accesibles con teclado.

Colores por significado: verde = correcto, amarillo = observación o pendiente,
rojo = problema real, azul = información.

## Seguridad de datos locales

`storage/storageQuarantine.ts` guarda una copia intacta (clave
`trabunda-storage-quarantine-v1`) de todo lo que la carga no puede aceptar:
JSON dañado, registros con estructura inválida y jornadas locales que coinciden
con el historial permanente. Así el siguiente guardado no borra silenciosamente
esos datos. La cuarentena entra en los respaldos, no se borra al restaurar uno y
se muestra, en solo lectura y con exportación, en `Datos y respaldos`.

## Carga de pantallas

El Dashboard va en el paquete principal; el resto de rutas se cargan bajo demanda
(`app/router.tsx`).

## Próximas extracciones recomendadas

`ProductionEntryPage.tsx` sigue concentrando demasiada coordinación. Conviene
extraer, en iteraciones pequeñas:

- `ExcelImportPanel`
- `FreezingExcelImportPanel`
- `ProductionRowsTable`
- `BalanceOriginsPanel`
- `CloseDayModal`

No se recomienda una reescritura completa; las reglas críticas ya están en
módulos puros y testeables.

## Futuras migraciones

Cuando se incorpore backend:

- mover `localStorage` a repositorios con API;
- registrar auditoría por usuario;
- mantener las mismas unidades `Kg100`;
- versionar migraciones de catálogo y equivalencias;
- definir `trackingActivationDate` o `legacyDataCutoffDate` si la operación
  confirma un corte formal para datos históricos.
