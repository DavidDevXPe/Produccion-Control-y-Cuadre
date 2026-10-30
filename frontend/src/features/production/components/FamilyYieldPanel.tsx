import { Calculator, Info } from 'lucide-react'
import { SectionCard } from '../../../components/ui/SectionCard'
import type { ProductionBusinessSummary } from '../model/businessRules'
import { getTubeMethodology } from '../model/tubeMethodology'
import { FamilyYieldCard } from './familyYield/FamilyYieldCard'
import { GroupUtilizationFooter } from './familyYield/GroupUtilizationFooter'

export interface FamilyYieldPanelProps {
  readonly summary: ProductionBusinessSummary
  readonly showTunnel?: boolean
}

export function FamilyYieldPanel({
  summary,
  showTunnel = false,
}: FamilyYieldPanelProps) {
  const methodology = getTubeMethodology(summary.tubeMpBalance)

  return (
    <SectionCard
      title="Rendimiento técnico y aprovechamiento MP"
      description={`Evolución por Reportes${showTunnel ? ', Túnel' : ''}, Tratamiento y saldo; el aprovechamiento siempre usa la MP total.`}
      action={<Calculator className="size-5 text-brand-700" aria-hidden="true" />}
    >
      <div
        data-methodology={methodology.key}
        data-testid="tube-methodology-indicator"
        role="status"
        aria-live="polite"
        aria-label={`Metodología activa: ${methodology.label}`}
        className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-ui-line-dark dark:bg-ui-surface-dark-compact"
      >
        <div className="flex min-w-0 items-start gap-2.5">
          <Info
            className="mt-0.5 size-4 shrink-0 text-brand-700 dark:text-sky-300"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.06em] text-slate-700 dark:text-ui-text-dark-strong">
              Metodología activa
            </p>
            <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-ui-text-dark-soft">
              {methodology.explanation}
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-brand-500/25 bg-brand-500/5 px-2.5 py-1 text-[0.6875rem] font-bold text-brand-700 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300">
          {methodology.label}
        </span>
      </div>
      <div className="grid gap-3 p-4 sm:p-5 xl:grid-cols-2">
        {summary.families.map((metric) => (
          <FamilyYieldCard
            key={metric.key}
            metric={metric}
            summary={summary}
            showTunnel={showTunnel}
          />
        ))}
      </div>
      <GroupUtilizationFooter summary={summary} />
    </SectionCard>
  )
}

export default FamilyYieldPanel
