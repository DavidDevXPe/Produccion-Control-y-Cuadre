export type YieldStatusCode =
  | "critical"
  | "low"
  | "acceptable"
  | "good"
  | "very_good"
  | "review"
  | "not_applicable";

export type YieldColorVariant =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "neutral";

export interface YieldStatus {
  status: YieldStatusCode;
  label: string;
  interpretation: string;
  colorVariant: YieldColorVariant;
}

const yieldStatuses = {
  critical: {
    status: "critical",
    label: "CRÍTICO",
    interpretation: "Aprovechamiento demasiado bajo",
    colorVariant: "red",
  },
  low: {
    status: "low",
    label: "BAJO",
    interpretation: "Revisar merma, saldos y distribución",
    colorVariant: "orange",
  },
  acceptable: {
    status: "acceptable",
    label: "ACEPTABLE",
    interpretation: "Operación razonable, pero debajo del objetivo",
    colorVariant: "yellow",
  },
  good: {
    status: "good",
    label: "BUENO / OBJETIVO",
    interpretation: "Rango objetivo de operación",
    colorVariant: "green",
  },
  veryGood: {
    status: "very_good",
    label: "MUY BUENO",
    interpretation: "Revisar que los saldos estén correctamente imputados",
    colorVariant: "green",
  },
  review: {
    status: "review",
    label: "REVISAR",
    interpretation:
      "No necesariamente es malo, pero puede indicar arrastre de saldos o MP asignada de otro día",
    colorVariant: "blue",
  },
  notApplicable: {
    status: "not_applicable",
    label: "NO APLICA",
    interpretation: "No existe materia prima para calcular el aprovechamiento",
    colorVariant: "neutral",
  },
} as const satisfies Record<string, YieldStatus>;

export function getYieldStatus(
  performancePercent: number | null | undefined,
): YieldStatus {
  if (
    performancePercent === null ||
    performancePercent === undefined ||
    !Number.isFinite(performancePercent)
  ) {
    return yieldStatuses.notApplicable;
  }
  if (performancePercent < 70) return yieldStatuses.critical;
  if (performancePercent < 75) return yieldStatuses.low;
  if (performancePercent < 80) return yieldStatuses.acceptable;
  if (performancePercent <= 85) return yieldStatuses.good;
  if (performancePercent <= 90) return yieldStatuses.veryGood;
  return yieldStatuses.review;
}

export const yieldVisualStyles = {
  red: {
    metricTone: "danger",
    badgeTone: "danger",
    textClass: "text-rose-700 dark:text-rose-300",
    barClass: "bg-rose-500",
    panelClass:
      "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-100",
  },
  orange: {
    metricTone: "orange",
    badgeTone: "orange",
    textClass: "text-orange-700 dark:text-orange-300",
    barClass: "bg-orange-500",
    panelClass:
      "border-orange-200 bg-orange-50 text-orange-950 dark:border-orange-500/40 dark:bg-orange-500/15 dark:text-orange-100",
  },
  yellow: {
    metricTone: "yellow",
    badgeTone: "yellow",
    textClass: "text-amber-700 dark:text-amber-300",
    barClass: "bg-amber-500",
    panelClass:
      "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100",
  },
  green: {
    metricTone: "success",
    badgeTone: "success",
    textClass: "text-emerald-700 dark:text-emerald-300",
    barClass: "bg-emerald-500",
    panelClass:
      "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-100",
  },
  blue: {
    metricTone: "brand",
    badgeTone: "info",
    textClass: "text-brand-700 dark:text-sky-300",
    barClass: "bg-brand-500",
    panelClass:
      "border-brand-200 bg-brand-50 text-brand-950 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-100",
  },
  neutral: {
    metricTone: "neutral",
    badgeTone: "neutral",
    textClass: "text-slate-600 dark:text-slate-300",
    barClass: "bg-slate-400",
    panelClass:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/40 dark:bg-slate-500/15 dark:text-slate-100",
  },
} as const;
