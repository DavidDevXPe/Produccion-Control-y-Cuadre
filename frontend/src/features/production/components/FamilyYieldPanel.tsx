import { Calculator } from 'lucide-react'
import { SectionCard } from '../../../components/ui/SectionCard'
import type { ProductionBusinessSummary } from '../model/businessRules'
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
  return (
    <SectionCard
      title="Rendimiento técnico y aprovechamiento MP"
      description={`Evolución por Reportes${showTunnel ? ', Túnel' : ''}, Tratamiento y saldo; el aprovechamiento siempre usa la MP total.`}
      action={<Calculator className="size-5 text-brand-700" aria-hidden="true" />}
    >
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
