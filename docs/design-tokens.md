# Tokens de Diseño — TRABUNDA Producción

Este documento especifica los tokens de diseño semánticos del sistema en modo claro y modo oscuro para la interfaz de planta.

---

## 1. Superficies y Contenedores (Surfaces)

| Nombre Token | Clase Tailwind | Valor Modo Claro | Valor Modo Oscuro | Propósito / Uso |
| :--- | :--- | :--- | :--- | :--- |
| `ui-surface-dark-canvas` | `bg-ui-surface-dark-canvas` | `#edf2f3` | `#051120` | Fondo canvas de nivel inferior |
| `ui-surface-dark-recessed` | `bg-ui-surface-dark-recessed` | `#f8fbfc` | `#07141f` | Fondos incrustados o tablas secundarias |
| `ui-surface-dark-deep` | `bg-ui-surface-dark-deep` | `#ffffff` | `#0a1a27` | Paneles y tarjetas primarias |
| `ui-surface-dark` | `bg-ui-surface-dark` | `#ffffff` | `#0d2534` | Tarjetas secundarias y filas de tabla |
| `ui-surface-dark-hover-strong` | `bg-ui-surface-dark-hover-strong` | `#edf5f8` | `#123247` | Estados hover y selecciones destacadas |
| `ui-surface-dark-compact` | `bg-ui-surface-dark-compact` | `#f1f5f9` | `#102b3b` | Inputs compactos y tarjetas pequeñas |

---

## 2. Bordes y Separadores (Borders)

| Nombre Token | Clase Tailwind | Valor Modo Claro | Valor Modo Oscuro | Propósito / Uso |
| :--- | :--- | :--- | :--- | :--- |
| `ui-line-dark-grid` | `border-ui-line-dark-grid` / `divide-ui-line-dark-grid` | `#e2e8f0` | `#203e50` | Rejillas de tablas y divisores internos |
| `ui-line-dark-soft` | `border-ui-line-dark-soft` | `#cbd5e1` | `#244052` | Bordes suaves de elementos secundarios |
| `ui-line-dark` | `border-ui-line-dark` | `#94a3b8` | `#2b5268` | Bordes principales de tarjetas e inputs |

---

## 3. Tipografía y Textos (Typography)

| Nombre Token | Clase Tailwind | Valor Modo Claro | Valor Modo Oscuro | Propósito / Uso |
| :--- | :--- | :--- | :--- | :--- |
| `ui-text-dark-strong` | `text-ui-text-dark-strong` | `#0f172a` | `#f3f8fb` | Títulos principales e importes cuantitativos |
| `ui-text-dark` | `text-ui-text-dark` | `#1e293b` | `#eef4f8` | Texto principal de lectura |
| `ui-text-dark-subtle` | `text-ui-text-dark-subtle` | `#334155` | `#e3edf3` | Mensajes secundarios legibles |
| `ui-text-dark-pale` | `text-ui-text-dark-pale` | `#475569` | `#c3d2dc` | Etiquetas y valores secundarios |
| `ui-text-dark-soft` | `text-ui-text-dark-soft` | `#64748b` | `#a5bed0` | Subtítulos y descripciones |
| `ui-text-soft` | `text-ui-text-soft` | `#64748b` | `#7f9bad` | Encabezados de tabla e indicaciones pequeñas |
| `ui-accent-cyan` | `text-ui-accent-cyan` | `#0b7da3` | `#58c8ea` | Totales destacados y métricas secundarias |

---

## 4. Insignias y Estados (Status Badges)

| Nombre Token | Clase Tailwind | Valor Modo Claro | Valor Modo Oscuro | Propósito / Uso |
| :--- | :--- | :--- | :--- | :--- |
| `ui-emerald-surface-dark` | `bg-ui-emerald-surface-dark` | `#ecfdf5` | `#06351f` | Fondo estado Exitoso / Conciliado |
| `ui-emerald-border-dark` | `border-ui-emerald-border-dark` | `#a7f3d0` | `#1b7b4f` | Borde estado Exitoso / Conciliado |
| `ui-emerald-text-dark` | `text-ui-emerald-text-dark` | `#047857` | `#32d094` | Texto estado Exitoso / Conciliado |
| `ui-amber-surface-dark` | `bg-ui-amber-surface-dark` | `#fffbebe` | `#2a2414` | Fondo estado Pendiente / Advertencia |
| `ui-amber-surface-dark-deep` | `bg-ui-amber-surface-dark-deep` | `#fef3c7` | `#211d12` | Fondo contenedor advertencia profundo |
| `ui-amber-border-dark` | `border-ui-amber-border-dark` | `#fde68a` | `#805f22` | Borde estado Pendiente / Advertencia |
| `ui-amber-text-dark` | `text-ui-amber-text-dark` | `#b45309` | `#ffd166` | Texto resaltado de advertencias |
| `ui-amber-text-dark-soft` | `text-ui-amber-text-dark-soft` | `#d97706` | `#f2c866` | Texto secundario de advertencias |
| `ui-rose-text-dark` | `text-ui-rose-text-dark` | `#be123c` | `#ff6b6b` | Texto de errores y excesos de saldo |
