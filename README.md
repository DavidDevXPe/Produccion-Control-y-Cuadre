# TRABUNDA Producción

**Control y Cuadre Operativo**

Aplicación web para controlar el ciclo productivo de Envasado y Congelamiento, dar trazabilidad a los saldos por producto y validar la información acumulada de la semana. El archivo Excel es una fuente de reglas de negocio y estructura operativa; la interfaz no intenta copiar su diseño.

La identidad visual utiliza el logo corporativo ubicado en `frontend/public/brand/trabunda-logo-white.png`.

## Alcance del MVP

El MVP es un frontend en React, TypeScript, Vite y Tailwind CSS que incluye:

- dashboard operativo;
- sección semanal de excepciones **Requiere atención** para diferencias, observaciones y validaciones bloqueantes;
- listado y detalle de jornadas;
- cuadre de las jornadas registradas de miércoles a sábado por turno, producto y familia;
- consulta de saldos y su trazabilidad;
- captura independiente de jornadas de Envasado y Congelamiento para una misma fecha;
- carga de capturas de producción por turno con lectura OCR local y revisión editable;
- catálogo activo acumulativo de productos detectados y confirmados desde capturas;
- disponibilidad de Congelamiento derivada del producto previamente envasado;
- comparativo semanal Envasado vs Congelamiento por familia y producto;
- rendimiento operativo por proceso, jornada y turno, alimentado por los reportes físicos;
- separación explícita entre cuadre matemático y rendimiento;
- resumen y validación semanal con las fórmulas confirmadas del Excel;
- pruebas unitarias y de componentes para los cálculos principales.

Los datos históricos existentes pertenecen a Envasado. Los registros que no contienen el campo `process` se interpretan automáticamente como `PACKING`, por lo que no requieren migración manual ni pierden compatibilidad.

La aplicación identifica el periodo 31 AGO–06 SEP como semana operacional 41, aunque corresponda a la semana ISO 36. Desde el 7 de septiembre el contexto del encabezado avanza a la semana operacional 42 (07–13 SEP). La semana histórica se presenta como parcial y no completa jornadas ni cantidades inexistentes. Los saldos pendientes se conservan por jornada de origen hasta que exista un uso posterior explícito. El procesamiento confirmado de los 44,660.00 kg de saldo del sábado durante el domingo se registra como movimiento de saldo y no como nueva producción dominical.

Cada jornada cerrada y cuadrada puede descargarse desde su detalle como un archivo `.xlsx` auditable, con resumen, rendimiento, cuadre por producto y observaciones de cierre aceptadas. La descarga permanece bloqueada si existe una diferencia u observación de integridad.

## Procesos operativos

- `PACKING` / **Envasado** conserva todas las reglas existentes: materia prima, reportes Día/Noche, Túnel, Tratamiento, saldos, rendimiento y controles técnicos por familia.
- `FREEZING` / **Congelamiento** reutiliza el catálogo y la captura por turnos, pero no crea una nueva materia prima ni aplica las referencias anatómicas o el mínimo de aprovechamiento del 80%.
- Envasado genera disponibilidad por producto y jornada de origen. Congelamiento consume únicamente esa disponibilidad mediante lotes trazables.
- Un pendiente puede pasar al turno Noche, a otro día o a otra semana sin cambiar su origen productivo.
- El balance global es `Envasado = Congelado atribuible + Pendiente trazable + Diferencia no explicada`. El objetivo es que la diferencia no explicada sea `0.00 kg`.
- Las semanas se cierran por proceso: Envasado puede estar cerrado mientras Congelamiento continúa abierto. El ciclo completo queda cerrado cuando ambos procesos están cerrados y el comparativo está conciliado.

El alcance actual es de uso local por una sola persona, por lo que no requiere autenticación ni administración de usuarios. Las nuevas jornadas pueden registrarse manualmente, precargarse desde el Excel operativo o cargarse desde capturas PNG, JPG o WEBP. Las imágenes se procesan localmente en el navegador, se revisan en una vista editable y convierten cada aro usando la equivalencia fija de 10 kg. Los productos nuevos detectados se agregan al catálogo local. En todos los casos los datos se guardan en el navegador y solo pueden cerrarse cuando el cuadre sea exacto. El Excel y las imágenes importadas no se envían a un servidor.

El catálogo de nuevas capturas usa productos seed provenientes de los reportes reales y productos dinámicos confirmados por el operador. La resolución de productos históricos se conserva únicamente como capa legacy para que las jornadas antiguas y sus saldos continúen renderizando. Los candidatos nuevos no se persisten hasta que se confirman en la revisión de captura.

## Despliegue

La aplicación se publica automáticamente en GitHub Pages al enviar cambios a `main`:

https://daviddevxpe.github.io/Produccion-Control-y-Cuadre/

El flujo `.github/workflows/deploy-pages.yml` instala dependencias, valida TypeScript y ESLint, ejecuta las pruebas, genera el sitio y publica el artefacto. El Excel de referencia permanece únicamente en el entorno local y está excluido del repositorio.

## Ejecución local

Requiere Node.js y npm.

```powershell
cd frontend
npm install
npm run dev
```

Comandos disponibles desde `frontend`:

```powershell
npm run test
npm run check
npm run build
```

- `test`: ejecuta las pruebas con Vitest.
- `check`: valida TypeScript y ESLint.
- `build`: genera la versión de producción.

## Rutas

| Ruta | Contenido |
| --- | --- |
| `/` | Dashboard |
| `/jornadas` | Listado de jornadas con selector Envasado/Congelamiento |
| `/jornadas/nueva` | Captura manual por proceso; Envasado también admite importación desde Excel |
| `/jornadas/:date/editar` | Continuación de un borrador local |
| `/jornadas/:date` | Detalle de una jornada registrada; actualmente del `2026-09-02` al `2026-09-05` |
| `/saldos` | Saldos separados por proceso y trazabilidad de origen |
| `/rendimiento` | Eficiencia operativa por Envasado/Congelamiento, turno y semana |
| `/resumen` | Resumen de Envasado, Congelamiento y comparativo entre procesos |
| Cualquier otra | Página no encontrada |

## Estructura

```text
.
├── docs/
│   └── reglas-de-negocio.md
├── frontend/
│   ├── src/
│   │   ├── app/                  # Router
│   │   ├── components/ui/        # Componentes reutilizables
│   │   ├── features/production/
│   │   │   ├── components/       # Paneles de producción
│   │   │   ├── data/             # Jornadas y periodo semanal estructurados
│   │   │   ├── model/            # Tipos y cálculos de dominio
│   │   │   └── pages/            # Vistas del módulo
│   │   ├── features/performance/      # Rendimiento, cálculos y repositorio local
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── test/
│   │   └── utils/
│   └── package.json
```

Las reglas confirmadas y los límites de interpretación están documentados en [docs/reglas-de-negocio.md](docs/reglas-de-negocio.md).
