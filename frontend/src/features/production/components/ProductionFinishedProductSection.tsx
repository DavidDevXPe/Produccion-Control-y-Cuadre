import { MetricCard } from '../../../components/ui/MetricCard'
import { SectionCard } from '../../../components/ui/SectionCard'
import { formatCentiKg } from '../../../utils/formatters'
import type { ProductionBusinessSummary } from '../model/businessRules'
import type { Kg100, ProductionDayCalculation } from '../model/types'

export interface ProductionFinishedProductSectionProps {
  readonly isFreezing: boolean
  readonly isBalanceOnly: boolean
  readonly usesExternalAvailability: boolean
  readonly hasTunnelProduction: boolean
  readonly totalReportedKg100: Kg100
  readonly calculation: ProductionDayCalculation
  readonly businessSummary: ProductionBusinessSummary
}

export function ProductionFinishedProductSection({
  isFreezing,
  isBalanceOnly,
  usesExternalAvailability,
  hasTunnelProduction,
  totalReportedKg100,
  calculation,
  businessSummary,
}: ProductionFinishedProductSectionProps) {
  return (
    <>
      <SectionCard
        title="Producto terminado calculado"
        description={
          isFreezing
            ? 'Distingue la ejecución física de Congelamiento de la producción atribuida a su jornada de Envasado.'
            : isBalanceOnly
            ? 'Distingue el procesamiento físico del domingo de la producción propia atribuible a nueva materia prima.'
            : 'Desglose operativo derivado del estado actual; ningún valor es editable.'
        }
      >
        {usesExternalAvailability ? (
          <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
            <MetricCard
              label={isFreezing ? 'Congelado físicamente' : 'Procesado físicamente'}
              value={formatCentiKg(totalReportedKg100)}
              tone="brand"
            />
            {isFreezing ? (
              <MetricCard
                label="Sin origen vinculado"
                value={formatCentiKg(calculation.ownTurnProductionKg100)}
                tone={
                  calculation.ownTurnProductionKg100 === 0
                    ? 'success'
                    : 'warning'
                }
              />
            ) : (
              <MetricCard
                label="Producción productiva atribuida"
                value={formatCentiKg(calculation.ownTurnProductionKg100)}
              />
            )}
            <MetricCard
              label={isFreezing ? 'Disponible no utilizado' : 'Saldo anterior pendiente'}
              value={formatCentiKg(calculation.pendingPreviousBalanceKg100)}
            />
          </div>
        ) : (
          <div
            className={`grid gap-3 p-4 sm:grid-cols-2 sm:p-5 ${
              hasTunnelProduction ? 'xl:grid-cols-6' : 'xl:grid-cols-5'
            }`}
          >
            <MetricCard
              label="Reporte propio Día"
              value={formatCentiKg(calculation.day.ownProductionKg100)}
            />
            <MetricCard
              label="Reporte propio Noche"
              value={formatCentiKg(calculation.night.ownProductionKg100)}
            />
            {hasTunnelProduction ? (
              <MetricCard
                label="Túnel total"
                value={formatCentiKg(calculation.tunnel.totalKg100)}
              />
            ) : null}
            <MetricCard
              label="Tratamiento"
              value={formatCentiKg(calculation.treatmentKg100)}
            />
            <MetricCard
              label="Saldo al cierre"
              value={formatCentiKg(calculation.newClosingBalanceKg100)}
            />
            <MetricCard
              label="Producto terminado"
              value={formatCentiKg(businessSummary.finishedKg100)}
              tone="brand"
            />
          </div>
        )}
      </SectionCard>

      <section
        className="grid gap-3 sm:grid-cols-2"
        aria-label="Validación en tiempo real"
      >
        <MetricCard
          label="Diferencia final"
          value={formatCentiKg(calculation.differenceKg100)}
          tone={calculation.differenceKg100 === 0 ? 'success' : 'danger'}
        />
        <MetricCard
          label={isFreezing ? 'Referencia operativa' : 'Aprovechamiento general'}
          value={
            usesExternalAvailability
              ? 'NO APLICA'
              : businessSummary.overallUtilization.percent === null
              ? 'No disponible'
              : `${businessSummary.overallUtilization.percent.toLocaleString('es-PE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}%`
          }
          tone={
            usesExternalAvailability
              ? 'neutral'
              : businessSummary.overallUtilization.percent === null
                ? 'neutral'
                : businessSummary.overallUtilization.percent > 100
                  ? 'danger'
                  : businessSummary.overallUtilization.percent < 80
                    ? 'warning'
                    : 'success'
          }
          description={
            usesExternalAvailability
              ? isFreezing
                ? 'No aplica el 80%; Congelamiento se valida contra disponibilidad de Envasado.'
                : 'Jornada de saldos sin nueva materia prima.'
              : 'La referencia operativa es 80%. Un valor inferior permite cierre con observación; un valor superior a 100% requiere revisión.'
          }
        />
      </section>
    </>
  )
}

