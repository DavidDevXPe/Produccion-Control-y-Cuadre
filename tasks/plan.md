# Plan de Integración: Estructura de Jornadas Operacionales

## Visión General
Extraer e incorporar la estructura funcional y visual del diseño de referencia (`media_1791034644103.png`) en la vista de Jornadas (`ProductionDaysPage.tsx`), respetando el sistema de diseño actual, tokens de tema (claro/oscuro), accesibilidad y el 100% de las pruebas unitarias existentes sin rediseñar desde cero.

## Componentes y Estructura a Extraer de la Referencia

### 1. Cabecera y Acciones Operativas
- **Eyebrow**: `● CONTROL OPERATIVO DE PLANTA`
- **Título**: `Jornadas de producción` (preservando el título semántico para tests)
- **Subtítulo descriptivo**: Detalle de semana, balance de materia prima, cuadre y trazabilidad.
- **Acciones principales**:
  - `Importar Excel` (acceso directo persistente)
  - `+ Nueva jornada`
  - `Cerrar semana` (cuando aplique)

### 2. Banner de Auditoría y Balance Semanal
- **Tarjeta destacada**:
  - Icono de escudo de seguridad/auditoría.
  - Título: `BALANCE Y AUDITORÍA DE SEMANA`.
  - Badge de estado dinámico (`100% Cuadrado`, `Observaciones pendientes` o `En revisión`).
  - Descripción operativa contextual.
  - Botón/enlace de acción: `Descargar informe de cuadre` / `Ver auditoría semanal`.

### 3. Grid de 5 Tarjetas Métricas KPI
1. **Materia Prima Ingresada**: Total acumulado de MP en kg, subtexto: `X de 7 días de la semana`.
2. **Producto Terminado**: Total acumulado de PT en kg, subtexto: `Cajas palletizadas / Total declarado`.
3. **Rendimiento Global**: Porcentaje de aprovechamiento ponderado, referencia de zafra y contador `Bajo referencia (<80%)`.
4. **Diferencia de Cuadre**: Diferencia neta de kg de la semana (`0.00 kg` con mensaje `✔ Sin merma no justificada`).
5. **Saldo en Cámara**: Saldo pendiente trazable de congelamiento / saldo en proceso en antecámara.

### 4. Barra Unificada de Procesos y Herramientas
- Pestañas con contadores de jornadas:
  - `Envasado (Packing) [X]`
  - `Congelamiento (Freezing) [Y]`
- Buscador reactivo integrado (lote, supervisor, fecha, día).
- Filtro por fecha con limpieza rápida.
- Botón de exportación rápida a CSV de las jornadas de la semana.

### 5. Tabla de Jornadas Optimizada con Fila de Totales
- 8 columnas alineadas y compatibles con los tests existentes:
  1. `Jornada`: Fecha en negrita, día de semana y referencia de lote/supervisor.
  2. `Materia prima`: Valor numérico con formato.
  3. `Producto terminado`: Valor numérico con formato.
  4. `Saldo final`: Saldo de cierre del día.
  5. `Diferencia`: Badge limpio `✔ 0.00 kg` cuando cuadra exactamente.
  6. `Cuadre`: Estado del balance (`CUADRADO`, `CUADRADO · OBSERVADO`, `POR REVISAR`).
  7. `Aprovechamiento`: Porcentaje y nivel (`Excelente`, `Óptimo`, `Aceptable`, etc.).
  8. `Acción`: `Ver detalle` o `Seguir cuadrando`.
- **Fila de Totales (`<tfoot>`)**:
  - `TOTAL ACUMULADO SEMANA X` con totales numéricos de la semana y resumen de auditoría.

---

## Fases de Implementación

### Fase 1: Cálculo y Extracción de Métricas Semanales
- Importar y calcular `calculateWeeklySummary` para obtener totales reales de MP, PT, diferencia y rendimiento.
- Calcular saldo de cámara (`freezingPendingKg100` y `freezingDifferenceKg100`).

### Fase 2: Banner de Auditoría y Tarjetas KPI
- Implementar el banner `BALANCE Y AUDITORÍA DE SEMANA` con soporte responsive y tema oscuro/claro.
- Implementar el grid de 5 tarjetas de KPI conservando los textos requeridos por los tests (`4 de 7 días de la semana`, `Bajo referencia (<80%)`).

### Fase 3: Toolbar Unificada (Procesos + Búsqueda + Exportación)
- Integrar las pestañas con badges numéricos de jornadas para Envasado y Congelamiento.
- Unificar la barra de búsqueda y filtros con botón de exportación CSV.

### Fase 4: Enriquecimiento de la Tabla y Fila de Totales
- Enriquecer la columna de fecha con badge de lote/día.
- Añadir el `<tfoot>` con los totales acumulados de la semana.

### Fase 5: Verificación y Tests
- Ejecutar suite de pruebas con `vitest`.
- Verificar compatibilidad visual en temas oscuro y claro.
