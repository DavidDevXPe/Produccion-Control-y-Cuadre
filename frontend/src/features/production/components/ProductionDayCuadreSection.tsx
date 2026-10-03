import { SectionCard } from '../../../components/ui/SectionCard'
import { PerformancePanel } from './PerformancePanel'
import { ReconciliationPanel } from './ReconciliationPanel'
import type {
  NucaWashAuthorization,
  ProductionDayCalculation,
} from '../model/types'

interface ProductionDayCuadreSectionProps {
  calculation: ProductionDayCalculation
  isBalanceOnly: boolean
  washAuthorization: NucaWashAuthorization | null
}

export function ProductionDayCuadreSection({
  calculation,
  isBalanceOnly,
  washAuthorization,
}: ProductionDayCuadreSectionProps) {
  return (
    <section
      id="cuadre"
      className="grid scroll-mt-28 gap-5 xl:grid-cols-[1.35fr_0.85fr]"
    >
      <ReconciliationPanel calculation={calculation} />
      {isBalanceOnly ? (
        <SectionCard
          title="Aprovechamiento"
          description="La referencia del 80% no aplica porque no existe nueva materia prima."
          contentClassName="flex min-h-36 flex-col items-center justify-center p-5 text-center"
        >
          <p className="text-xl font-extrabold text-slate-950">NO APLICA</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Jornada de saldos
          </p>
        </SectionCard>
      ) : (
        <PerformancePanel
          calculation={calculation}
          washAuthorization={washAuthorization}
        />
      )}
    </section>
  )
}

