export function formatMetric(value: number | null, suffix = ""): string {
  return value === null || !Number.isFinite(value)
    ? "—"
    : `${value.toLocaleString("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}${suffix}`;
}

export function parseNonNegative(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export const benchmarkStatusLabels = {
  NOT_CONFIGURED: "NO CONFIGURADO",
  BELOW_TARGET: "BAJO OBJETIVO",
  NEAR_TARGET: "CERCA DEL OBJETIVO",
  AT_OR_ABOVE_TARGET: "OBJETIVO / SOBRE OBJETIVO",
} as const;
