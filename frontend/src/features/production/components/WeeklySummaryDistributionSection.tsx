import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../utils/formatters'
import type { Kg100, WeeklySummary } from '../model/types'

interface WeeklySummaryDistributionSectionProps {
  summary: WeeklySummary
}

const percent = (value: number | null) =>
  value === null
    ? 'No aplica'
    : `${value.toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}%`

export function WeeklySummaryDistributionSection({
  summary,
}: WeeklySummaryDistributionSectionProps) {
  const distributionItems: readonly [string, string, Kg100][] = [
    ['Tubo', '50%', summary.distribution.tubeKg100],
    ['Aleta', '20%', summary.distribution.aletaKg100],
    ['Rejos', '15%', summary.distribution.rejosKg100],
    ['Nuca', '15%', summary.distribution.nucasKg100],
  ]
  const nucas = summary.nucas
  const isApplicable = nucas.applicable
  const isCompliant = nucas.status === 'AT_OR_ABOVE_REFERENCE'

  return (
    <div className="grid gap-3 xl:grid-cols-[1fr_0.7fr]">
      <SectionCard
        title="Distribución de materia prima"
        description="Porcentajes teóricos conservados del resumen; no representan un saldo físico."
        contentClassName="grid gap-3 p-4 sm:grid-cols-2 sm:p-5"
      >
        {distributionItems.map(([label, rate, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-slate-800">{label}</span>
              <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-bold text-brand-800">
                {rate}
              </span>
            </div>
            <p className="number-tabular mt-2 whitespace-nowrap text-base font-bold text-slate-950">
              {formatCentiKg(value)}
            </p>
          </div>
        ))}
      </SectionCard>

      <SectionCard
        title="Rendimiento de Nucas"
        description="Una referencia común para Bikini y Nuca semi-limpia, sin crear saldos físicos."
        contentClassName="p-4 sm:p-5"
      >
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Estado
            </span>
            <StatusBadge tone={!isApplicable ? 'neutral' : isCompliant ? 'success' : 'warning'}>
              {!isApplicable ? 'NO APLICA' : isCompliant ? 'CUMPLE' : 'BAJO REFERENCIA'}
            </StatusBadge>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                MP de referencia (15%)
              </dt>
              <dd className="number-tabular mt-1 font-bold text-slate-950">
                {isApplicable ? formatCentiKg(nucas.referenceKg100) : 'No aplica'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Cumplimiento
              </dt>
              <dd className="number-tabular mt-1 font-bold text-slate-950">
                {percent(nucas.referenceCompliancePercent)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Producción equivalente
              </dt>
              <dd className="number-tabular mt-1 font-bold text-slate-950">
                {isApplicable ? formatCentiKg(nucas.equivalentKg100) : 'No aplica'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Para alcanzar 45%
              </dt>
              <dd className="number-tabular mt-1 font-bold text-slate-950">
                {isApplicable ? formatCentiKg(nucas.kgToReferenceKg100) : 'No aplica'}
              </dd>
            </div>
          </dl>

          <div className="rounded-lg border border-brand-100 bg-brand-50/60 p-3 text-xs leading-5 text-brand-900">
            <p>
              Bikini: {formatCentiKg(nucas.bikiniKg100)} · participación{' '}
              {percent(nucas.bikiniWeightPercent)}
            </p>
            <p>
              Nuca semi-limpia: {formatCentiKg(nucas.semilimpiaKg100)} · participación{' '}
              {percent(nucas.semilimpiaWeightPercent)}
            </p>
            <p className="mt-1">
              Factor experimental: {(nucas.conversionFactor * 100).toLocaleString('es-PE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}% · la diferencia teórica no crea saldo ni bloquea el cuadre.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
