import { ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'
import type { ProductionBusinessSummary } from '../model/businessRules'
import { ClosingBalanceRowControl } from './closingYield/ClosingBalanceRowControl'
import { ClosingYieldOverallMetric } from './closingYield/ClosingYieldOverallMetric'
import { ClosingYieldSummaryMetric } from './closingYield/ClosingYieldSummaryMetric'

export { ClosingBalanceRowControl }

export interface ClosingBalanceYieldControlProps {
  readonly summary: ProductionBusinessSummary
}

export function ClosingBalanceYieldControl({
  summary,
}: ClosingBalanceYieldControlProps) {
  const [expanded, setExpanded] = useState(false)
  const contentId = useId()
  const keyFamilies = summary.families.filter((metric) =>
    ['ALETA', 'REJO_REPRODUCTOR', 'NUCA'].includes(metric.key),
  )

  return (
    <aside className="order-first border-b border-slate-200 bg-slate-50/70 lg:order-none lg:sticky lg:top-20 lg:rounded-xl lg:border">
      <button
        type="button"
        className="flex min-h-11 w-full items-center justify-between gap-3 px-4 text-left lg:hidden"
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={() => setExpanded((current) => !current)}
      >
        <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-900">
          Control de rendimientos
        </span>
        <ChevronDown
          className={`size-4 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <div id={contentId} className={`${expanded ? 'block' : 'hidden'} px-4 pb-3 lg:block lg:p-4`}>
        <div className="hidden lg:block">
          <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-900">
            Control de rendimientos
          </p>
          <p className="mt-1 text-[0.6875rem] leading-4 text-slate-500">
            Proyección en tiempo real con el saldo ingresado.
          </p>
        </div>

        <div className="lg:mt-2">
          {keyFamilies.map((metric) => (
            <ClosingYieldSummaryMetric key={metric.key} metric={metric} />
          ))}

          <ClosingYieldOverallMetric summary={summary} />
        </div>

        <p className="border-t border-slate-200 pt-3 text-[0.6875rem] leading-4 text-slate-600">
          Registra únicamente saldo real. Los kg faltantes son una referencia.
        </p>
      </div>
    </aside>
  )
}

