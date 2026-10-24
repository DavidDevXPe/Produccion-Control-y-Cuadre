import { MetricCard } from '../../../components/ui/MetricCard'
import { SectionCard } from '../../../components/ui/SectionCard'
import { formatCentiKg } from '../../../utils/formatters'
import type { ProductionBusinessSummary } from '../model/businessRules'
import type { Kg100, ProductionDayCalculation, ProductionProcess } from '../model/types'
import { productionProcessLabels } from '../model/productionProcess'

export interface ProductionFinishedProductSectionProps {
  readonly isFreezing: boolean
  readonly isBalanceOnly: boolean
  readonly usesExternalAvailability: boolean
  readonly hasTunnelProduction: boolean
  readonly totalReportedKg100: Kg100
  readonly calculation: ProductionDayCalculation
  readonly businessSummary: ProductionBusinessSummary
  readonly process?: ProductionProcess
}

interface ProcessPresentation {
  readonly currentProcessName: string | null
  readonly previousProcessName: string
  readonly physicalReportLabel: string
  readonly isDownstream: boolean
}

function getProcessPresentation(
  process: ProductionProcess | undefined,
  isFreezing: boolean,
): ProcessPresentation {
  const currentProcessName = process
    ? productionProcessLabels[process]
    : isFreezing
      ? 'Congelamiento'
      : null
  const previousProcessName =
    process === 'FREEZING'
      ? 'Envasado'
      : process === 'VIDEOJET'
        ? 'Congelamiento'
        : process === 'PALLETIZING'
          ? 'Videojet'
          : 'Envasado'
  const physicalReportLabel =
    process === 'FREEZING'
      ? 'Congelado físicamente'
      : process === 'VIDEOJET'
        ? 'Rotulado físicamente'
        : process === 'PALLETIZING'
          ? 'Paletizado físicamente'
          : isFreezing
            ? 'Congelado físicamente'
            : 'Procesado físicamente'

  return {
    currentProcessName,
    previousProcessName,
    physicalReportLabel,
    isDownstream: isFreezing || (process !== undefined && process !== 'PACKING'),
  }
}

function getSectionDescription(
  currentProcessName: string | null,
  previousProcessName: string,
  isBalanceOnly: boolean,
) {
  if (currentProcessName && currentProcessName !== 'Envasado') {
    return `Distingue la ejecución física de ${currentProcessName} de la disponibilidad atribuida a su jornada de ${previousProcessName}.`
  }
  if (isBalanceOnly) {
    return 'Distingue el procesamiento físico del domingo de la producción propia atribuible a nueva materia prima.'
  }
  return 'Desglose operativo derivado del estado actual; ningún valor es editable.'
}

interface ExternalAvailabilityMetricsProps {
  readonly physicalReportLabel: string
  readonly totalReportedKg100: Kg100
  readonly calculation: ProductionDayCalculation
  readonly isDownstream: boolean
}

function ExternalAvailabilityMetrics({
  physicalReportLabel,
  totalReportedKg100,
  calculation,
  isDownstream,
}: ExternalAvailabilityMetricsProps) {
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
      <MetricCard
        label={physicalReportLabel}
        value={formatCentiKg(totalReportedKg100)}
        tone="brand"
      />
      {isDownstream ? (
        <MetricCard
          label="Sin origen vinculado"
          value={formatCentiKg(calculation.ownTurnProductionKg100)}
          tone={calculation.ownTurnProductionKg100 === 0 ? 'success' : 'warning'}
        />
      ) : (
        <MetricCard
          label="Producción productiva atribuida"
          value={formatCentiKg(calculation.ownTurnProductionKg100)}
        />
      )}
      <MetricCard
        label={isDownstream ? 'Disponible no utilizado' : 'Saldo anterior pendiente'}
        value={formatCentiKg(calculation.pendingPreviousBalanceKg100)}
      />
    </div>
  )
}

interface OwnProductionMetricsProps {
  readonly calculation: ProductionDayCalculation
  readonly businessSummary: ProductionBusinessSummary
  readonly hasTunnelProduction: boolean
}

function OwnProductionMetrics({
  calculation,
  businessSummary,
  hasTunnelProduction,
}: OwnProductionMetricsProps) {
  return (
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
  )
}

function UtilizationMetric({
  isFreezing,
  usesExternalAvailability,
  percent,
}: {
  readonly isFreezing: boolean
  readonly usesExternalAvailability: boolean
  readonly percent: number | null
}) {
  if (usesExternalAvailability) {
    return (
      <MetricCard
        label={isFreezing ? 'Referencia operativa' : 'Aprovechamiento general'}
        value="NO APLICA"
        tone="neutral"
        description={
          isFreezing
            ? 'No aplica el 80%; Congelamiento se valida contra disponibilidad de Envasado.'
            : 'Jornada de saldos sin nueva materia prima.'
        }
      />
    )
  }

  const value =
    percent === null
      ? 'No disponible'
      : `${percent.toLocaleString('es-PE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}%`
  const tone =
    percent === null
      ? 'neutral'
      : percent > 100
        ? 'danger'
        : percent < 80
          ? 'warning'
          : 'success'

  return (
    <MetricCard
      label={isFreezing ? 'Referencia operativa' : 'Aprovechamiento general'}
      value={value}
      tone={tone}
      description="La referencia operativa es 80%. Un valor inferior permite cierre con observación; un valor superior a 100% requiere revisión."
    />
  )
}

export function ProductionFinishedProductSection({
  isFreezing,
  isBalanceOnly,
  usesExternalAvailability,
  hasTunnelProduction,
  totalReportedKg100,
  calculation,
  businessSummary,
  process,
}: ProductionFinishedProductSectionProps) {
  const {
    currentProcessName,
    previousProcessName,
    physicalReportLabel,
    isDownstream,
  } = getProcessPresentation(process, isFreezing)
  const sectionDescription = getSectionDescription(
    currentProcessName,
    previousProcessName,
    isBalanceOnly,
  )

  return (
    <>
      <SectionCard
        title="Producto terminado calculado"
        description={sectionDescription}
      >
        {usesExternalAvailability ? (
          <ExternalAvailabilityMetrics
            physicalReportLabel={physicalReportLabel}
            totalReportedKg100={totalReportedKg100}
            calculation={calculation}
            isDownstream={isDownstream}
          />
        ) : (
          <OwnProductionMetrics
            calculation={calculation}
            businessSummary={businessSummary}
            hasTunnelProduction={hasTunnelProduction}
          />
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
        <UtilizationMetric
          isFreezing={isFreezing}
          usesExternalAvailability={usesExternalAvailability}
          percent={businessSummary.overallUtilization.percent}
        />
      </section>
    </>
  )
}

