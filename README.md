# TRABUNDA Producción

Aplicación web para el **control, cuadre y trazabilidad operativa** de los procesos de **Envasado** y **Congelamiento**.

TRABUNDA Producción registra jornadas por turno, valida el cuadre matemático, conserva el origen de los saldos por producto, permite dar continuidad a producto pendiente entre jornadas y ofrece una vista semanal del estado operativo.

La fuente confiable para precarga de información es **Excel estructurado**. El proyecto **no utiliza OCR ni Tesseract**.

---

## Estado actual

El sistema contempla actualmente:

- captura manual de producción;
- importación Excel para Envasado;
- importación Excel para Congelamiento;
- reportes diferenciados por Turno Día y Turno Noche;
- conciliación de reportes físicos;
- trazabilidad Envasado → Congelamiento;
- consumo FIFO por producto y jornada origen;
- saldos pendientes entre jornadas;
- cierre con observaciones cuando corresponde;
- validaciones de integridad antes del cierre;
- catálogo de productos, aliases y normalización de nombres;
- rendimiento operativo;
- resúmenes semanales;
- exportación Excel;
- persistencia local versionada;
- respaldo y restauración de información.

---

## Stack

- **React**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **Vitest**
- **Testing Library**
- **ExcelJS**
- **Recharts**
- **React Router**
- Persistencia local mediante `localStorage`
- GitHub Actions
- GitHub Pages

---

## Desarrollo local

Desde la raíz del repositorio:

```powershell
cd frontend
npm install
npm run dev
```

La aplicación quedará disponible en la dirección mostrada por Vite.

### Validación completa

Antes de realizar un commit importante o desplegar:

```powershell
npm run check
npm test
npm run build
```

Los tres comandos deben finalizar correctamente.

---

# Procesos operativos

## Envasado

Código interno:

```text
PACKING
```

Envasado:

- recibe materia prima;
- registra Reporte Día;
- registra Reporte Noche;
- puede registrar Túnel;
- puede registrar Tratamiento;
- puede generar saldo al cierre;
- calcula producto terminado;
- aplica validaciones de rendimiento;
- genera disponibilidad trazable para Congelamiento;
- conserva las validaciones de Nuca Bikini cuando corresponden al proceso.

La referencia general de aprovechamiento es **80%**.

Un rendimiento inferior a 80% puede permitir cierre con observación cuando el cuadre principal es válido.

Valores superiores a 100% requieren revisión de integridad.

---

## Congelamiento

Código interno:

```text
FREEZING
```

Congelamiento:

- no recibe nueva materia prima anatómica;
- registra lo congelado físicamente por turno;
- consume disponibilidad generada previamente por Envasado;
- conserva la jornada de Envasado como origen;
- puede utilizar producto de jornadas anteriores;
- utiliza FIFO para priorizar los saldos más antiguos;
- mantiene pendiente cualquier disponibilidad que todavía no haya sido congelada;
- permite cierre con observación cuando existe una diferencia trazable permitida;
- no aplica la autorización de lavado de Nuca Bikini;
- no aplica la referencia general de rendimiento de 80%.

La validación principal de Congelamiento es la relación entre:

```text
Congelado físicamente
vs.
Congelado vinculado a Envasado
```

---

# Trazabilidad Envasado → Congelamiento

Cada vínculo de Congelamiento conserva como mínimo:

- jornada origen de Envasado;
- fecha origen;
- familia;
- producto;
- producto fuente cuando existe equivalencia histórica;
- kg disponibles;
- kg utilizados en Turno Día;
- kg utilizados en Turno Noche;
- total utilizado;
- saldo restante.

Un saldo **no pierde su jornada de origen** cuando cambia el día de Congelamiento.

Ejemplo:

```text
Lunes Envasado
49,680 kg disponibles

Lunes Congelamiento
46,500 kg utilizados

Saldo
3,180 kg

Martes Congelamiento
consume primero los 3,180 kg del lunes
```

---

# FIFO

FIFO consume disponibilidad en este orden:

```text
Origen más antiguo
↓
Turno Día
↓
Turno Noche
↓
Siguiente origen
```

La identidad lógica de un vínculo considera:

```text
originDayId
familyId
productId
sourceProductId
```

La lógica FIFO debe ser **idempotente**.

Ejecutar varias veces:

```text
Vincular FIFO
```

o:

```text
Vincular todos FIFO
```

no debe generar vínculos equivalentes duplicados.

Los duplicados históricos se normalizan sin sumar kilos accidentalmente. Cuando una versión anterior dejó el mismo vínculo repetido, el sistema conserva una representación única válida.

---

# Saldos entre jornadas

El producto pendiente puede continuar en jornadas posteriores.

Ejemplo:

```text
Lunes pendiente
3,180 kg

Martes
consume primero esos 3,180 kg

Martes genera nuevo saldo
11,560 kg

Miércoles
puede continuar consumiendo esos 11,560 kg
```

Un saldo se cuenta **una sola vez**, en la jornada que lo dejó. La jornada
que lo termina de envasar muestra su reporte físico como dato informativo,
pero esa parte no suma a su disponibilidad para Congelamiento:

```text
Disponible para congelar =
  Envasado propio Día + Envasado propio Noche + Saldo al cierre

Envasado propio del turno =
  reporte físico − saldo de jornadas anteriores procesado en el turno
```

El panel "Cuadre Envasado → Congelamiento por jornada" (Saldos → Congelamiento)
muestra cada operando. Ver [Reglas de negocio](docs/reglas-de-negocio.md).

El objetivo es conservar trazabilidad desde el origen hasta que el saldo llegue a:

```text
0 kg
```

---

# Diferencia de trazabilidad

Congelamiento distingue tres situaciones:

```text
difference > 0
```

Existen kg congelados físicamente sin origen suficiente.

```text
difference = 0
```

La trazabilidad está completa.

```text
difference < 0
```

Existen kg vinculados por encima del congelado físico.

Estas situaciones no deben mostrarse como el mismo estado.

---

# Importación Excel

## Envasado

El importador de Envasado lee la hoja:

```text
Reporte
```

y utiliza principalmente:

- `Producto (Descripción)`
- `Horario`
- `Total KG`

La fecha calendario de un reporte nocturno posterior a medianoche puede continuar perteneciendo a la jornada operacional seleccionada.

Antes de aplicar la importación se muestra una vista previa.

El usuario puede:

- confirmar coincidencias;
- asociar un producto a uno existente;
- resolver aliases;
- agregar productos nuevos cuando corresponda.

La importación no se confirma mientras existan filas pendientes de revisión.

---

## Congelamiento

El importador de Congelamiento utiliza:

- `Producto (Descripción)`
- `Cantidad (suma)`

`Cantidad` representa **aros**.

La regla operacional confirmada es:

```text
1 aro = 10 kg
```

Ejemplo:

```text
22,774 aros
=
227,740 kg
```

Textos como:

```text
SACO 2 x 10 kg
SACO 3 x 9 kg
SACO 3 x 10 kg
```

corresponden únicamente a presentación logística.

No forman parte de la identidad del producto y no intervienen en el cálculo del peso.

---

# Matching y catálogo de productos

La resolución de productos admite:

1. coincidencia exacta;
2. coincidencia normalizada;
3. alias conocido;
4. asociación manual;
5. creación de producto nuevo.

Antes de crear un producto nuevo, el sistema intenta reutilizar productos ya conocidos para evitar duplicados.

La normalización, aliases, equivalencias históricas e identidad de producto viven fuera de los componentes visuales.

Producto confirmado:

```text
MEMBRANAS COCIDAS CONGELADAS BLOCK S/TTO 100% P.N.
```

---

# Jornadas

Cada jornada pertenece a un proceso:

```text
PACKING
FREEZING
```

y puede encontrarse en diferentes estados operativos.

Entre los estados visibles se incluyen:

```text
CUADRADO              cerrada, cuadrada y sin observaciones
CUADRADO · OBSERVADO  cerrada, cuadrada y con observaciones
POR REVISAR           borrador o cuadre abierto, sin bloqueo de integridad
NO CUADRADO           cerrada sin cuadrar o con validación de integridad bloqueante
```

La definición vive en `presentation/journeyStatus.ts`.

El estado visual no reemplaza las validaciones internas.

Errores de integridad como:

- sobreconsumo;
- vínculos duplicados;
- distribución inválida;
- datos estructuralmente inconsistentes;

no deben convertirse automáticamente en simples observaciones.

---

# Cierre de jornada

Una jornada puede cerrar normalmente cuando las validaciones obligatorias están satisfechas.

Cuando existen advertencias permitidas, puede cerrarse con observación.

Las observaciones quedan registradas junto con:

- código;
- mensaje;
- fecha de cierre;
- familia o producto cuando corresponda.

Una jornada cerrada queda en modo de solo lectura.

---

# Semanas operativas

La aplicación trabaja con semanas operativas.

Una semana muestra:

- jornadas registradas;
- jornadas cuadradas;
- jornadas observadas;
- días sin registro;
- estado de cierre.

Los días sin operación no se inventan como jornadas de `0 kg`.

Una semana cerrada permanece disponible para consulta.

---

# Rendimiento

El rendimiento se mantiene separado del cuadre productivo.

Envasado puede evaluar:

- aprovechamiento general;
- rendimiento por familia;
- objetivos técnicos;
- diferencias respecto a referencias operativas.

Congelamiento no utiliza la referencia general de 80%.

Su validación principal es la trazabilidad del producto congelado.

---

# Persistencia

Actualmente la aplicación trabaja con persistencia local mediante claves versionadas.

Entre las claves utilizadas se encuentran:

```text
trabunda-production-days-v2
trabunda-performance-records-v1
trabunda-product-catalog-v2
trabunda-week-process-closures-v2
```

No se debe utilizar:

```text
localStorage.clear()
```

como mecanismo de migración de producción.

Los cambios futuros de estructura deberán conservar compatibilidad hacia atrás cuando existan datos reales.

---

# Respaldos

La aplicación permite trabajar con respaldos locales.

El formato utilizado es:

```text
TRABUNDA_BACKUP
```

La importación mantiene compatibilidad con datos legacy cuando corresponde.

---

# Arquitectura

```text
frontend/src
├── app/
│   └── Router y composición principal
│
├── components/
│   └── ui/
│       └── Componentes visuales reutilizables
│
├── features/
│   ├── performance/
│   │   └── Rendimiento operativo
│   │
│   ├── production/
│   │   ├── capture/
│   │   │   ├── Captura
│   │   │   ├── Importación Excel
│   │   │   ├── FIFO
│   │   │   ├── Catálogo
│   │   │   └── Normalización
│   │   │
│   │   ├── components/
│   │   │   └── Paneles reutilizables de producción
│   │   │
│   │   ├── data/
│   │   │   └── Datos históricos estructurados
│   │   │
│   │   ├── export/
│   │   │   └── Exportación XLSX
│   │   │
│   │   ├── model/
│   │   │   ├── Dominio
│   │   │   ├── Cálculos
│   │   │   ├── Reglas
│   │   │   ├── Validaciones
│   │   │   └── Tipos
│   │   │
│   │   ├── pages/
│   │   │   └── Vistas principales
│   │   │
│   │   └── presentation/
│   │       └── Estado visual derivado del dominio
│   │
│   └── settings/
│       └── Respaldos y configuración local
│
├── hooks/
├── layouts/
├── storage/
└── utils/
```

## Principio arquitectónico

Las reglas de negocio importantes deben vivir principalmente en:

```text
model/
capture/
services/
selectores o funciones puras
```

Las páginas deben encargarse principalmente de:

```text
coordinar
capturar
mostrar
navegar
```

y no redefinir reglas operativas dentro del JSX.

---

# Rutas principales

| Ruta                     | Contenido                     |
| ------------------------ | ----------------------------- |
| `/`                      | Dashboard operativo           |
| `/jornadas`              | Jornadas por proceso          |
| `/jornadas/nueva`        | Nueva jornada                 |
| `/jornadas/:date/editar` | Editar o continuar borrador   |
| `/jornadas/:date`        | Detalle de jornada            |
| `/saldos`                | Saldos y trazabilidad         |
| `/rendimiento`           | Rendimiento operativo         |
| `/resumen`               | Resumen semanal y comparativo |

---

# Interfaz

La aplicación soporta:

- desktop;
- laptop;
- tablet;
- responsive mobile;
- light mode;
- dark mode.

Los componentes principales deben mantener coherencia en:

- botones;
- estados;
- badges;
- tablas;
- inputs;
- modales;
- focus;
- disabled;
- hover;
- accesibilidad.

---

# Testing

La aplicación utiliza:

```text
Vitest
Testing Library
```

Las pruebas cubren progresivamente:

- jornadas;
- cuadre;
- rendimiento;
- saldos;
- FIFO;
- trazabilidad;
- importación;
- catálogo;
- cierre;
- persistencia;
- UI crítica.

Antes de integrar cambios:

```powershell
npm run check
npm test
npm run build
```

---

# CI y deploy

El workflow de GitHub Pages realiza:

1. instalación de dependencias;
2. `npm run check`;
3. `npm test`;
4. `npm run build`;
5. publicación del artefacto.

URL publicada:

https://daviddevxpe.github.io/Produccion-Control-y-Cuadre/

---

# Documentación relacionada

- [Reglas de negocio](docs/reglas-de-negocio.md)
- [Preparación de nuevas jornadas](docs/preparacion-nuevas-jornadas.md)

---

# Limitaciones actuales

Actualmente:

- la aplicación es local/single-user;
- no existe backend productivo para este módulo;
- no existe sincronización multiusuario;
- no existe todavía auditoría centralizada;
- algunos datos legacy siguen disponibles por compatibilidad;
- `ProductionEntryPage.tsx` concentra todavía demasiadas responsabilidades;
- parte de la persistencia continúa acoplada a `localStorage`.

Estas limitaciones deben resolverse progresivamente y no mediante una reescritura completa.

---

# Roadmap técnico

## Corto plazo

- modernizar Dashboard;
- mejorar Jornadas;
- mejorar Saldos;
- mejorar Rendimiento;
- mejorar Resumen;
- unificar navegación y jerarquía visual;
- continuar mejorando light/dark mode;
- fortalecer tests de trazabilidad.

## Arquitectura

- extraer gradualmente responsabilidades de `ProductionEntryPage.tsx`;
- separar paneles grandes en componentes reutilizables;
- mantener reglas operativas fuera del JSX;
- fortalecer tipos de dominio;
- reducir duplicación visual y funcional.

## Trazabilidad

Formalizar en una siguiente etapa un concepto como:

```text
trackingActivationDate
```

o:

```text
legacyDataCutoffDate
```

para separar de forma explícita:

- datos históricos;
- datos modernos que participan automáticamente en FIFO.

Esto permitirá que saldos reales puedan cruzar semanas sin depender de una ventana semanal artificial.

## Escalabilidad futura

Preparar el proyecto para incorporar:

- backend real;
- base de datos;
- usuarios;
- roles;
- permisos;
- auditoría;
- sincronización;
- multi-sede;
- reportes históricos;
- trazabilidad por usuario.

---

# Principios del proyecto

Prioridad técnica:

```text
Corrección
>
Integridad de datos
>
Reglas del negocio
>
Testabilidad
>
Mantenibilidad
>
UX
>
Optimización menor
```

TRABUNDA Producción debe crecer sin perder la trazabilidad de los datos ni las reglas operativas confirmadas.
