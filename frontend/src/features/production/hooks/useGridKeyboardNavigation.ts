import type { KeyboardEvent, RefObject } from "react";

export interface UseGridKeyboardNavigationOptions {
  /** Referencia opcional al contenedor para limitar las búsquedas en el DOM */
  containerRef?: RefObject<HTMLElement | null>;
  /** Total de filas navegables en la cuadrícula */
  totalRows: number;
  /** Total de columnas navegables (por defecto 2: 0 = Día, 1 = Noche) */
  columns?: number;
  /** Margen superior en px para que el elemento no quede tapado por la barra sticky (por defecto 150) */
  topOffset?: number;
  /** Margen inferior en px para que el elemento no quede tapado por la barra de acciones (por defecto 100) */
  bottomOffset?: number;
  /** Identificador de la cuadrícula para aislar data attributes */
  gridId?: string;
}

export function useGridKeyboardNavigation({
  containerRef,
  totalRows,
  columns = 2,
  topOffset = 150,
  bottomOffset = 100,
  gridId = "capture-grid",
}: UseGridKeyboardNavigationOptions) {
  const focusCell = (targetRow: number, targetCol: number) => {
    if (targetRow < 0 || targetRow >= totalRows) return;
    if (targetCol < 0 || targetCol >= columns) return;

    const root = containerRef?.current ?? document;
    const selector = `input[data-grid-id="${gridId}"][data-grid-row="${targetRow}"][data-grid-col="${targetCol}"]`;
    const targetInput = root.querySelector<HTMLInputElement>(selector);

    if (targetInput && !targetInput.disabled) {
      targetInput.focus();
      targetInput.select();

      // ScrollIntoView respetando márgenes de elementos sticky
      if (typeof window !== "undefined" && targetInput.getBoundingClientRect) {
        const rect = targetInput.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const minTop = topOffset;
        const maxBottom = viewportHeight - bottomOffset;

        if (
          typeof window !== "undefined" &&
          typeof window.scrollBy === "function" &&
          process.env.NODE_ENV !== "test"
        ) {
          if (rect.top < minTop) {
            window.scrollBy({ top: rect.top - minTop, behavior: "smooth" });
          } else if (rect.bottom > maxBottom) {
            window.scrollBy({
              top: rect.bottom - maxBottom,
              behavior: "smooth",
            });
          }
        }
      }
    }
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number,
  ) => {
    const input = e.currentTarget;

    if (e.key === "ArrowRight") {
      const isAllSelected =
        input.selectionStart === 0 && input.selectionEnd === input.value.length;
      const atEnd = input.selectionEnd === input.value.length;

      // Solo salta de columna si todo el texto está seleccionado o el cursor está al final
      if (isAllSelected || atEnd) {
        if (colIndex < columns - 1) {
          e.preventDefault();
          focusCell(rowIndex, colIndex + 1);
        }
      }
    } else if (e.key === "ArrowLeft") {
      const isAllSelected =
        input.selectionStart === 0 && input.selectionEnd === input.value.length;
      const atStart = input.selectionStart === 0 && input.selectionEnd === 0;

      // Solo salta de columna si todo el texto está seleccionado o el cursor está al inicio
      if (isAllSelected || atStart) {
        if (colIndex > 0) {
          e.preventDefault();
          focusCell(rowIndex, colIndex - 1);
        }
      }
    } else if (e.key === "ArrowDown" || (e.key === "Enter" && !e.shiftKey)) {
      e.preventDefault();
      if (rowIndex < totalRows - 1) {
        focusCell(rowIndex + 1, colIndex);
      }
    } else if (e.key === "ArrowUp" || (e.key === "Enter" && e.shiftKey)) {
      e.preventDefault();
      if (rowIndex > 0) {
        focusCell(rowIndex - 1, colIndex);
      }
    }
  };

  const getGridCellProps = (rowIndex: number, colIndex: number) => ({
    "data-grid-id": gridId,
    "data-grid-row": rowIndex,
    "data-grid-col": colIndex,
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) =>
      handleKeyDown(e, rowIndex, colIndex),
  });

  return {
    handleKeyDown,
    focusCell,
    getGridCellProps,
  };
}
