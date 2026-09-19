# Reglas de negocio confirmadas

## Fuentes autorizadas

- `MIÉRCOLES`, `JUEVES`, `VIERNES` y `SÁBADO` aportan los cierres registrados de la semana, incluyendo materia prima, producción, tratamiento, producto terminado y saldo final.
- `RESUMEN` aporta las fórmulas y la validación acumulada independiente de la semana.
- `DOMINGO` no se incorpora mientras conserve una fecha histórica, carezca de producción válida y contenga errores de fórmula.
- Una hoja solo se incorpora cuando su fecha, totales y fórmulas corresponden al periodo operativo solicitado.

El Excel se interpreta como fuente operativa, no como plantilla visual.

La numeración de semanas es la numeración operacional utilizada por Trabunda, no la numeración ISO. El periodo 31 AGO–06 SEP 2026 corresponde a la semana operacional 41 y el periodo 07–13 SEP 2026 a la semana operacional 42.

La exportación diaria solo se habilita cuando la jornada está cerrada, el cuadre es válido y no existen observaciones de integridad. El rendimiento se exporta como indicador independiente y nunca determina por sí mismo si una jornada está cuadrada.

## Procesos operativos

Las observaciones aceptadas durante el cierre se conservan como historial auditable de la jornada. La exportacion diaria incluye ese historial cuando existe, sin mezclarlo con observaciones de integridad que bloquean la descarga.

El modelo distingue dos procesos sin duplicar rutas, catálogos ni pantallas completas:

- `PACKING` representa **Envasado** y conserva todas las reglas históricas del sistema.
- `FREEZING` representa **Congelamiento** y consume producto disponible desde Envasado.

Una jornada se identifica de forma única por `fecha + proceso`; por tanto, Envasado y Congelamiento pueden registrar la misma fecha. Todo registro histórico sin `process` se interpreta como Envasado. Los lotes sin proceso explícito también pertenecen al libro de saldos de Envasado.

El cierre semanal se mantiene por proceso. Una semana cerrada para Envasado no bloquea las capturas ni consultas de Congelamiento. El ciclo semanal completo solo se considera cerrado cuando ambos procesos están cerrados y la diferencia no explicada entre ellos es cero.

## Balance Envasado → Congelamiento

Cada producto de una jornada de Envasado cerrada y cuadrada
genera una posición trazable para Congelamiento.

La disponibilidad congelable de cada producto se determina por
la producción física realmente envasada durante la jornada:

```text
Producto congelable de la jornada =
  Envasado Turno Día
  + Envasado Turno Noche
  + saldo final dejado al cierre de la jornada

Diferencia no explicada =
  Envasado
  − Congelado atribuible
  − Pendiente trazable
```

Congelamiento registra reportes físicos Día/Noche propios. El detalle de productos debe coincidir con cada reporte y cada kilo congelado debe estar vinculado a disponibilidad real. No se permite cerrar cuando el consumo supera lo disponible o cuando existe producto sin origen trazable; sí se permite conservar un borrador para investigar la incidencia.

Congelamiento no registra nueva materia prima, Túnel, Tratamiento ni saldo productivo de Envasado. Tampoco aplica el aprovechamiento anatómico del 80%. Su referencia es el producto disponible desde Envasado.

El rendimiento operativo se persiste en un repositorio versionado independiente. Supervisor, personal, inicio, fin y horas muertas no participan en el cuadre productivo y se reutilizan para ambos procesos.

Un uso posterior reduce el pendiente del origen, incluso cuando ocurre otro día o en otra semana. El domingo puede dedicarse completamente a terminar pendientes, con materia prima nueva igual a cero y sin volver a atribuir esos kilos como producción nueva.

## Persistencia, respaldos e identidad histórica

La información local se guarda en claves versionadas de `localStorage` centralizadas en un manifiesto. La exportación de respaldo usa el formato `TRABUNDA_BACKUP` versión 1 e incluye datos operativos, rendimiento, semana/proceso activos, tema visual, cierres semanales y catálogo dinámico cuando exista.

La importación acepta el formato versionado y respaldos antiguos con la forma cruda de `localStorage`. Antes de reemplazar datos locales, el sistema muestra un resumen, genera una copia previa automática y conserva orígenes externos o históricos sin inventar jornadas faltantes.

Los IDs históricos de producto no se reescriben dentro de jornadas antiguas. Se resuelven mediante equivalencias canónicas durante cálculos, saldos, FIFO y trazabilidad, conservando el `sourceProductId` cuando un saldo se reclasifica a una presentación actual.

## Producción por turno y saldos anteriores

Un saldo conserva su jornada de origen aunque se termine de procesar en una jornada posterior. Debe trazarse por familia, producto, cantidad, jornada de origen y turno que lo procesa.

Para cada producto y turno:

```text
Producción propia del turno =
  producción reportada por el turno
  + ajustes explícitos aplicables
  − saldo anterior realmente procesado en ese turno
```

La operación normal prioriza que el saldo pendiente al cierre de una jornada sea
terminado por el turno Día de la jornada siguiente. Por tanto, el saldo realmente
procesado se descuenta primero del reporte físico de ese turno para obtener su
producción propia.

Cuando el volumen de producción es excepcionalmente alto, el turno Día puede no
terminar todo el saldo recibido. En ese caso, la cantidad restante puede ser
terminada por el turno Noche de la misma jornada. Ese consumo nocturno debe quedar
registrado explícitamente; nunca se infiere ni se aplica de forma automática.

No se descuenta automáticamente todo el saldo anterior: cada uso se registra en el
turno que realmente lo procesa y la parte no procesada conserva su jornada de
origen. La asignación a Noche es una excepción operativa, no el flujo normal.

La interfaz debe mostrar cada operando. No se permiten descuentos, constantes ni ajustes ocultos dentro de fórmulas.

## Cuadre diario

La igualdad operativa es:

```text
Producto terminado esperado =
  producción propia del turno Día
  + producción propia del turno Noche
  + tratamiento
  + nuevo saldo final de la jornada
```

De forma equivalente:

```text
Saldo final calculado =
  producto terminado declarado
  − producción propia de ambos turnos
  − tratamiento
```

La diferencia compara el producto terminado esperado con el declarado. Una jornada está `CUADRADA` cuando la diferencia es cero y el detalle por productos y turnos también es consistente; de lo contrario está `NO CUADRADA`.

El saldo recibido de una jornada anterior y el nuevo saldo generado por la jornada actual son conceptos distintos y no deben mezclarse.

## Rendimiento

```text
Rendimiento de la jornada =
  producto terminado ÷ materia prima × 100
```

El 80% es una referencia operativa, no una validación rígida ni una cantidad que deba forzarse. Un rendimiento inferior puede deberse a saldos pendientes, tratamiento, procesos inconclusos, mermas u otros factores productivos.

Por ello, cuadre y rendimiento se presentan por separado:

- puede existir una jornada cuadrada con rendimiento menor al 80%;
- puede existir rendimiento igual o mayor al 80% con un descuadre matemático.

El rendimiento semanal usa los acumulados, no el promedio simple de porcentajes diarios:

```text
Rendimiento semanal =
  producto terminado total de la semana
  ÷ materia prima total de la semana
  × 100
```

### Rendimiento operativo

El módulo de Rendimiento Operativo mide eficiencia física y no modifica `CUADRADO`, saldos ni propiedad productiva. Los kilos son siempre de solo lectura y proceden de `Reporte Día` o `Reporte Noche` de la jornada y proceso seleccionados. Por ello, un domingo que procesa saldo usa su reporte físico para eficiencia sin cambiar `originDayId`.

```text
Horas programadas = diferencia entre hora final e inicial
Horas efectivas = horas programadas − horas muertas
Persona-h = personal × horas efectivas
Kg/h = reporte físico ÷ horas efectivas
Kg/persona-h = reporte físico ÷ persona-h
```

El turno Noche admite cruce de medianoche. Divisiones con personal u horas efectivas iguales a cero se muestran como no calculables; nunca como `NaN` o infinito.

Los benchmarks se configuran por proceso y opcionalmente por turno. La configuración inicial está vacía para no inventar objetivos. Cuando exista un benchmark validado:

```text
Cumplimiento = kg/persona-h ÷ benchmark × 100
Potencial = persona-h × benchmark
Brecha = potencial − producción real
```

Los indicadores semanales son ponderados: `SUMA kg / SUMA horas efectivas` y `SUMA kg / SUMA persona-h`. El mejor turno se determina por `kg/persona-h` agregado, no por toneladas. La persistencia usa `trabunda-performance-records-v1` y queda encapsulada en `performanceRepository` para facilitar una futura API.

## Cuadre matemático y ciclo de vida

El estado del cuadre (`BALANCED`/`UNBALANCED`) se calcula independientemente del ciclo de vida (`DRAFT`/`CLOSED`). Una jornada puede ser `DRAFT + BALANCED`: la interfaz la identifica como **LISTA PARA CERRAR**, pero no cambia a `CLOSED` hasta que el usuario confirma el cierre.

`canClose` exige datos completos, cuadre matemático, integridad, conciliación de turnos, saldo declarado consistente, consumos dentro de disponibilidad y aprovechamiento general mínimo de 80% para Envasado. Los objetivos familiares por debajo de referencia son advertencias y permiten **Cerrar de todas formas** cuando no existen bloqueos críticos.

Al confirmar un cierre con advertencias, la jornada guarda `closureObservations` con fecha/hora de cierre, código, mensaje, familia/producto cuando aplique y usuario local. Ese registro histórico se muestra primero; las advertencias recalculadas solo actúan como respaldo para jornadas antiguas.

Los saldos anteriores se asignan explícitamente por producto y turno; no se cargan automáticamente al Día. Si una asignación supera el reporte físico del mismo producto/turno, se muestra el máximo consumible y el exceso exacto. Un saldo legacy sin producto exacto queda como **REQUIERE DISTRIBUCIÓN** hasta que el operador seleccione una presentación del catálogo.

## Referencias de Nuca

La Nuca semilimpia y la Nuca Bikini son productos distintos y deben mantenerse en grupos separados:

```text
Referencia de Nuca semilimpia = materia prima total aplicable × 15%
Referencia de Nuca Bikini = materia prima total aplicable × 7%
```

Ambos porcentajes son referencias productivas. Estar por encima o por debajo de ellos no genera una diferencia, no corrige cantidades y no determina si la jornada está cuadrada.

### Nuca Bikini

La Nuca Bikini es el producto obtenido al lavar y limpiar la Nuca. Este proceso se realiza únicamente cuando existe un pedido.

Cuando aplica:

```text
Referencia de Nuca Bikini = materia prima total aplicable × 7%
```

Si no existe un pedido confirmado, el indicador de 7% debe mostrarse como `NO APLICA`; la ausencia de Nuca Bikini no constituye un error.

## Resumen semanal

`RESUMEN` consolida por identificadores estables de jornada, familia y producto, sin depender de posiciones de filas.

```text
Materia prima semanal = suma de materia prima de las jornadas

Producto semanal por producto = suma del producto en las jornadas

Producto terminado semanal por jornadas =
  suma del total declarado de cada jornada

Producto terminado semanal por detalle =
  suma del consolidado de productos

Diferencia semanal =
  producto terminado por jornadas
  − producto terminado por detalle
```

La información semanal es consistente cuando ambos caminos coinciden, las jornadas incluidas están cuadradas y no existen problemas de integridad.

La distribución referencial de materia prima del resumen es:

- Tubo: 50%.
- Aleta: 20%.
- Rejos: 15%.
- Nucas: 15%.

```text
Rendimiento del grupo = subtotal del grupo ÷ materia prima asignada

Aprovechamiento del grupo = subtotal del grupo ÷ materia prima semanal
```

Una semana parcial debe identificarse como tal; no se completan jornadas ni cantidades inexistentes.

Los saldos abiertos se consolidan entre todas las jornadas registradas. Una cantidad generada al cierre permanece pendiente hasta que un uso posterior explícito, vinculado al mismo producto y jornada de origen, la descuente. El último saldo diario y el saldo total pendiente acumulado son indicadores diferentes.

Un procesamiento posterior compuesto totalmente por saldo no vuelve a sumarse como producto terminado del nuevo día: únicamente liquida la posición abierta de su jornada de origen. Para el periodo actual, los 44,660.00 kg generados el sábado fueron envasados el domingo como saldo y se registran como consumo durante el turno Día, conforme al flujo operativo normal confirmado.

## Fuera del MVP

El backend, la base de datos, la edición persistente, los catálogos administrables y la auditoría completa se implementarán en etapas posteriores.
