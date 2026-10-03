import { Boxes, PackageCheck, Scale, Waves } from 'lucide-react'
import { MetricCard } from '../../../components/ui/MetricCard'
import { formatCentiKg } from '../../../utils/formatters'
import type { ProductionDayCalculation } from '../model/types'

interface ProductionDayMetricsGridProps {
  declaredRawMaterialKg100: number
  calculation: ProductionDayCalculation
  isBalanceOnly: boolean
  isBalanced: boolean
}

export function ProductionDayMetricsGrid({
  declaredRawMaterialKg100,
  calculation,
  isBalanceOnly,
  isBalanced,
}: ProductionDayMetricsGridProps) {
  const finishedOrPhysicalKg100 = isBalanceOnly
    ? calculation.day.declaredReportedKg100 +
      calculation.night.declaredReportedKg100
    : calculation.declaredFinishedKg100

  return (
    <section
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"
      aria-label="Indicadores de la jornada"
    >
      <MetricCard
        label="Materia prima"
        value={formatCentiKg(declaredRawMaterialKg100)}
        icon={<Waves className="size-5" />}
        className="xl:col-span-2"
      />
      <MetricCard
        label={isBalanceOnly ? 'Procesado físicamente' : 'Producto terminado'}
        value={formatCentiKg(finishedOrPhysicalKg100)}
        icon={<PackageCheck className="size-5" />}
        tone="brand"
        className="xl:col-span-2"
      />
      <MetricCard
        label="Saldo al cierre"
        value={formatCentiKg(calculation.newClosingBalanceKg100)}
        icon={<Boxes className="size-5" />}
      />
      <MetricCard
        label="Diferencia"
        value={formatCentiKg(calculation.differenceKg100)}
        icon={<Scale className="size-5" />}
        tone={isBalanced ? 'success' : 'danger'}
      />
    </section>
  )
}

