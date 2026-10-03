import { Droplets } from 'lucide-react'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../utils/formatters'
import type { Kg100, WeeklySummary } from '../model/types'

interface WeeklySummaryDistributionSectionProps {
  summary: WeeklySummary
  isNucaSemilimpiaReferenceApplicable: boolean
  isNucaBikiniReferenceApplicable: boolean
}

export function WeeklySummaryDistributionSection({
  summary,
  isNucaSemilimpiaReferenceApplicable,
  isNucaBikiniReferenceApplicable,
}: WeeklySummaryDistributionSectionProps) {
  const distributionItems: readonly [string, string, Kg100][] = [
    ['Tubo', '50%', summary.distribution.tubeKg100],
    ['Aleta', '20%', summary.distribution.aletaKg100],
    ['Rejos', '15%', summary.distribution.rejosKg100],
    ['Nuca semilimpia', '15%', summary.distribution.nucasKg100],
  ]

  const nucaSemilimpiaBadgeTone = !isNucaSemilimpiaReferenceApplicable
    ? ('neutral' as const)
    : summary.nucaSemilimpia.status === 'AT_OR_ABOVE_REFERENCE'
      ? ('success' as const)
      : ('warning' as const)

  const nucaSemilimpiaBadgeLabel = !isNucaSemilimpiaReferenceApplicable
    ? 'NO APLICA'
    : summary.nucaSemilimpia.status === 'AT_OR_ABOVE_REFERENCE'
      ? 'EN REFERENCIA'
      : 'BAJO REFERENCIA'

  return (
    <div className="grid gap-3 xl:grid-cols-[1fr_0.7fr]">
      <SectionCard
        title="Distribución de materia prima"
        description="Porcentajes de referencia conservados del resumen."
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
        title="Referencias de Nuca"
        description="La Nuca semilimpia usa 15% y la Nuca Bikini 7%; ninguna referencia altera el cuadre."
        contentClassName="p-4 sm:p-5"
      >
        <div className="grid gap-3">
          <article className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900">Nuca semilimpia</h3>
              <StatusBadge tone={nucaSemilimpiaBadgeTone}>
                {nucaSemilimpiaBadgeLabel}
              </StatusBadge>
            </div>
            {isNucaSemilimpiaReferenceApplicable ? (
              <dl className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Referencia 15%
                  </dt>
                  <dd className="number-tabular mt-1 font-bold text-slate-950">
                    {formatCentiKg(summary.nucaSemilimpia.referenceKg100)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Resultado real
                  </dt>
                  <dd className="number-tabular mt-1 font-bold text-slate-950">
                    {formatCentiKg(summary.nucaSemilimpia.actualKg100)}
                  </dd>
                </div>
              </dl>
            ) : null}
          </article>

          <article className="rounded-xl border border-brand-100 bg-brand-50/60 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Droplets className="size-4 text-brand-700" aria-hidden="true" />
                <h3 className="text-sm font-bold text-brand-950">Nuca Bikini</h3>
              </div>
              <StatusBadge tone={isNucaBikiniReferenceApplicable ? 'info' : 'neutral'}>
                {isNucaBikiniReferenceApplicable ? 'LAVADO ACTIVO' : 'NO APLICA'}
              </StatusBadge>
            </div>
            {isNucaBikiniReferenceApplicable ? (
              <dl className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Referencia 7%
                  </dt>
                  <dd className="number-tabular mt-1 font-bold text-slate-950">
                    {formatCentiKg(summary.nucaBikini.referenceKg100)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Resultado real
                  </dt>
                  <dd className="number-tabular mt-1 font-bold text-slate-950">
                    {formatCentiKg(summary.nucaBikini.actualKg100)}
                  </dd>
                </div>
              </dl>
            ) : null}
          </article>

          <p className="rounded-lg bg-brand-50 p-3 text-xs leading-5 text-brand-900 ring-1 ring-brand-200">
            Los porcentajes son referencias productivas. Estar por encima o por debajo no cambia el estado CUADRADO / NO CUADRADO.
          </p>
        </div>
      </SectionCard>
    </div>
  )
}
