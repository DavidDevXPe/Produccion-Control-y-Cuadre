import {
  ClipboardCheck,
  Droplets,
  FilePlus2,
  Gauge,
  PackageCheck,
  Scale,
  Waves,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { ActionLink } from '../../../components/ui/ActionLink'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { usePageTitle } from '../../../hooks/usePageTitle'
import {
  formatCentiKg,
  formatRatioAsPercent,
} from '../../../utils/formatters'
import { WeeklyConsistencyPanel } from '../components/WeeklyConsistencyPanel'
import { WeeklyDaysTable } from '../components/WeeklyDaysTable'
import { FreezingSummaryView } from '../components/FreezingSummaryView'
import { ProcessSelector, type ProductionView } from '../components/ProcessSelector'
import { ProductionComparisonView } from '../components/ProductionComparisonView'
import { isProductionProcess } from '../model/productionProcess'
import {
  WeeklyProductSummary,
  type WeeklyProductGroupRow,
} from '../components/WeeklyProductSummary'
import { calculateWeeklySummary, kg100, sumKg100 } from '../model/calculations'
import { getProductionDayOperationalState } from '../model/productionLifecycle'
import { getTubeMpBalance } from '../model/tubeMpBalance'
import type { Kg100, ProductionDay, SummaryGroupId, WeeklyProductTotal, WeeklySummary } from '../model/types'
import { getJourneyStatus } from '../presentation/journeyStatus'
import { getYieldStatus, yieldVisualStyles } from '../presentation/yieldStatus'
import { useProductionData } from '../state/ProductionDataContext'

const groupOrder: readonly SummaryGroupId[] = [
  'ALETA',
  'MANTO',
  'ANILLAS',
  'BOTON',
  'RECORTE_CRUDO',
  'RECORTE_COCIDO',
  'REJOS_SPECIAL',
  'REJOS',
  'REPRODUCTOR',
  'PICO',
  'NUCA_SEMILIMPIA',
  'NUCA_BIKINI',
]

const groupLabels: Record<SummaryGroupId, string> = {
  ALETA: 'Aleta cruda',
  MANTO: 'Manto crudo',
  ANILLAS: 'Anillas',
  BOTON: 'Botón / tratamiento',
  RECORTE_CRUDO: 'Recorte crudo',
  RECORTE_COCIDO: 'Recorte cocido y membrana',
  REJOS_SPECIAL: 'Rejos bailarín semilimpio',
  REJOS: 'Rejos crudo',
  REPRODUCTOR: 'Reproductor crudo',
  PICO: 'Pico',
  NUCA_SEMILIMPIA: 'Nuca semilimpia',
  NUCA_BIKINI: 'Nuca Bikini',
}

function getGroupTotal(summary: WeeklySummary, groupId: SummaryGroupId): Kg100 {
  return summary.groupTotals.find((group) => group.summaryGroupId === groupId)?.totalKg100 ?? kg100(0)
}

function getWeeklyReproductorAllocation(days: readonly ProductionDay[]): Kg100 {
  return sumKg100(
    days.map(
      (day) =>
        day.rawMaterialAllocationOverridesKg100.REPRODUCTOR ?? kg100(0),
    ),
  )
}

function getGroupAllocation(
  summary: WeeklySummary,
  reproductor: Kg100,
  tubeAllocation: Readonly<{
    mantoKg100: Kg100
    anillasKg100: Kg100
  }>,
  groupId: SummaryGroupId,
): Kg100 | null {
  const allocations: Partial<Record<SummaryGroupId, Kg100 | null>> = {
    ALETA: summary.distribution.aletaKg100,
    MANTO: tubeAllocation.mantoKg100,
    ANILLAS: tubeAllocation.anillasKg100,
    BOTON: null,
    RECORTE_CRUDO: null,
    RECORTE_COCIDO: null,
    REJOS_SPECIAL: null,
    REJOS: kg100(summary.distribution.rejosKg100 - reproductor),
    REPRODUCTOR: reproductor,
    PICO: kg100(0),
    NUCA_SEMILIMPIA: summary.distribution.nucasKg100,
    NUCA_BIKINI: summary.nucaBikini.applicable
      ? summary.nucaBikini.referenceKg100
      : null,
  }

  return allocations[groupId] ?? null
}

function percentage(numerator: Kg100, denominator: Kg100 | null): string {
  if (denominator === null || denominator === 0) return '—'
  return `${((numerator / denominator) * 100).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`
}

function productsForGroup(
  summary: WeeklySummary,
  groupId: SummaryGroupId,
): readonly WeeklyProductTotal[] {
  return summary.productTotals.filter((product) => product.summaryGroupId === groupId)
}

export function WeeklySummaryPage() {
  usePageTitle('Resumen semanal')
  const {
    activeProcess,
    activeWeekNumber,
    allProductionDays,
    getWeekView,
    setActiveProcess,
  } = useProductionData()
  const [searchParams, setSearchParams] = useSearchParams()
  const viewParam = searchParams.get('view')
  // The URL is the source of truth, so links, back/forward and reloads agree.
  const view: ProductionView =
    viewParam === 'COMPARISON' || isProductionProcess(viewParam)
      ? viewParam
      : activeProcess
  const activeWeek = getWeekView(
    activeWeekNumber,
    view === 'COMPARISON' ? 'PACKING' : view,
  )
  const productionDays = activeWeek.productionDays
  const activeWeekState = activeWeek
  const selector = (
    <ProcessSelector
      value={view}
      includeComparison
      onChange={(nextView) => {
        setSearchParams({ view: nextView }, { replace: true })
        if (nextView !== 'COMPARISON') setActiveProcess(nextView)
      }}
    />
  )

  if (view === 'FREEZING') {
    return (
      <FreezingSummaryView
        week={activeWeek}
        allProductionDays={allProductionDays}
        selector={selector}
      />
    )
  }

  if (view === 'COMPARISON') {
    return (
      <ProductionComparisonView
        weekNumber={activeWeek.number}
        period={activeWeek.period}
        productionDays={allProductionDays}
        packingClosed={getWeekView(activeWeek.number, 'PACKING').isClosed}
        freezingClosed={getWeekView(activeWeek.number, 'FREEZING').isClosed}
        selector={selector}
      />
    )
  }

  if (productionDays.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Reportes"
          title="Resumen semanal"
          description={`Semana ${activeWeek.number} · ${
            activeWeekState.isClosed
              ? 'Cerrada · Solo lectura'
              : activeWeekState.isCurrent
                ? 'Actual · Sin registros'
                : 'Abierta · Sin registros'
          }.`}
          actions={
            activeWeekState.canCreate ? (
              <ActionLink to="/jornadas/nueva?process=PACKING" size="sm">
                <FilePlus2 className="size-4" aria-hidden="true" />
                Nueva jornada
              </ActionLink>
            ) : null
          }
        />
        {selector}
        <SectionCard
          title="No hay información para consolidar"
          description="El resumen aparecerá a medida que guardes jornadas de esta semana."
          contentClassName="p-6"
        >
          <p className="text-sm leading-6 text-slate-600">
            {activeWeekState.isClosed
              ? 'Esta semana permanece disponible como histórico de solo lectura.'
              : activeWeekState.isPast
                ? 'Esta semana pasada continúa abierta para completar reportes pendientes.'
                : 'La semana actual está lista para recibir jornadas.'}
          </p>
        </SectionCard>
      </div>
    )
  }

  const summary = calculateWeeklySummary(productionDays, activeWeek.period)
  const operationalStatesByDate = new Map(
    productionDays.map(
      (day) => [day.date, getProductionDayOperationalState(day)] as const,
    ),
  )
  const calculationsByDate = new Map(
    [...operationalStatesByDate].map(
      ([date, state]) => [date, state.calculation] as const,
    ),
  )
  const weekDays = activeWeek.calendarDays.map((day) => {
    const productionDay = productionDays.find(
      (candidate) => candidate.date === day.isoDate,
    )
    const operationalState = operationalStatesByDate.get(day.isoDate)
    return {
      ...day,
      calculation: calculationsByDate.get(day.isoDate) ?? null,
      ...(productionDay ? { status: productionDay.status } : {}),
      ...(productionDay && operationalState
        ? { journey: getJourneyStatus(productionDay, operationalState) }
        : {}),
    }
  })
  const reproductorAllocation = getWeeklyReproductorAllocation(productionDays)
  const weeklyTubeAllocation = productionDays.reduce(
    (totals, day) => {
      const calculation = calculationsByDate.get(day.date)!
      const balance = getTubeMpBalance(day, calculation)
      return {
        mantoKg100: kg100(
          totals.mantoKg100 + balance.mpMantoEstimatedKg100,
        ),
        anillasKg100: kg100(
          totals.anillasKg100 + balance.mpAnillaProcessKg100,
        ),
      }
    },
    { mantoKg100: kg100(0), anillasKg100: kg100(0) },
  )
  const weeklyProductGroups: readonly WeeklyProductGroupRow[] = groupOrder.map(
    (groupId) => {
      const totalKg100 = getGroupTotal(summary, groupId)
      const allocationKg100 = getGroupAllocation(
        summary,
        reproductorAllocation,
        weeklyTubeAllocation,
        groupId,
      )

      return {
        id: groupId,
        label: groupLabels[groupId],
        totalKg100,
        allocationLabel:
          allocationKg100 === null ? '—' : formatCentiKg(allocationKg100),
        performanceLabel: percentage(totalKg100, allocationKg100),
        rawMaterialShareLabel: percentage(
          totalKg100,
          summary.rawMaterialKg100,
        ),
        products: productsForGroup(summary, groupId),
      }
    },
  )
  const isValid =
    summary.status === 'VALID' &&
    productionDays.every((day) => day.status === 'CLOSED')
  const weeklyYieldStatus = getYieldStatus(summary.performance.percent)
  const weeklyYieldStyles = yieldVisualStyles[weeklyYieldStatus.colorVariant]
  const isNucaSemilimpiaReferenceApplicable =
    summary.nucaSemilimpia.applicable
  const isNucaBikiniReferenceApplicable = summary.nucaBikini.applicable

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Reportes"
        title="Resumen semanal"
        description={`Semana ${activeWeek.number} · Validación acumulada con ${productionDays.length} jornadas registradas.`}
        actions={
          <StatusBadge tone="info">
            {activeWeekState.isClosed
              ? `SEMANA CERRADA · ${productionDays.length} ${productionDays.length === 1 ? 'JORNADA' : 'JORNADAS'}`
              : `SEMANA PARCIAL · ${productionDays.length} DE 7`}
          </StatusBadge>
        }
      />
      {selector}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores semanales">
        <MetricCard
          label="Materia prima semanal"
          value={formatCentiKg(summary.rawMaterialKg100)}
          icon={<Waves className="size-5" />}
        />
        <MetricCard
          label="Producto terminado"
          value={formatCentiKg(summary.detailFinishedKg100)}
          icon={<PackageCheck className="size-5" />}
          tone="brand"
        />
        <MetricCard
          label="Diferencia semanal"
          value={formatCentiKg(summary.differenceKg100)}
          icon={<Scale className="size-5" />}
          tone={
            summary.differenceKg100 !== 0
              ? 'danger'
              : isValid
                ? 'success'
                : 'neutral'
          }
        />
        <MetricCard
          label="Aprovechamiento acumulado"
          value={formatRatioAsPercent(summary.performance.ratio)}
          icon={<Gauge className="size-5" />}
          tone={weeklyYieldStyles.metricTone}
          valueClassName={weeklyYieldStyles.textClass}
          description={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>Referencia operativa: 80%</span>
              <StatusBadge tone={weeklyYieldStyles.badgeTone}>
                {weeklyYieldStatus.label}
              </StatusBadge>
            </div>
          }
        />
      </section>

      <WeeklyConsistencyPanel summary={summary} />

      <WeeklyDaysTable
        days={weekDays}
        totalKg100={summary.declaredFinishedKg100}
        weekNumber={activeWeek.number}
        isWeekClosed={activeWeekState.isClosed}
      />

      <div className="grid gap-3 xl:grid-cols-[1fr_0.7fr]">
        <SectionCard
          title="Distribución de materia prima"
          description="Porcentajes de referencia conservados del resumen."
          contentClassName="grid gap-3 p-4 sm:grid-cols-2 sm:p-5"
        >
          {[
            ['Tubo', '50%', summary.distribution.tubeKg100],
            ['Aleta', '20%', summary.distribution.aletaKg100],
            ['Rejos', '15%', summary.distribution.rejosKg100],
            ['Nuca semilimpia', '15%', summary.distribution.nucasKg100],
          ].map(([label, rate, value]) => (
            <div key={String(label)} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-slate-800">{String(label)}</span>
                <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-bold text-brand-800">{String(rate)}</span>
              </div>
              <p className="number-tabular mt-2 whitespace-nowrap text-base font-bold text-slate-950">{formatCentiKg(value as Kg100)}</p>
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
                <StatusBadge
                  tone={
                    !isNucaSemilimpiaReferenceApplicable
                      ? 'neutral'
                      : summary.nucaSemilimpia.status === 'AT_OR_ABOVE_REFERENCE'
                        ? 'success'
                        : 'warning'
                  }
                >
                  {!isNucaSemilimpiaReferenceApplicable
                    ? 'NO APLICA'
                    : summary.nucaSemilimpia.status === 'AT_OR_ABOVE_REFERENCE'
                      ? 'EN REFERENCIA'
                      : 'BAJO REFERENCIA'}
                </StatusBadge>
              </div>
              {isNucaSemilimpiaReferenceApplicable ? (
                <dl className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Referencia 15%</dt>
                    <dd className="number-tabular mt-1 font-bold text-slate-950">{formatCentiKg(summary.nucaSemilimpia.referenceKg100)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Resultado real</dt>
                    <dd className="number-tabular mt-1 font-bold text-slate-950">{formatCentiKg(summary.nucaSemilimpia.actualKg100)}</dd>
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
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Referencia 7%</dt>
                    <dd className="number-tabular mt-1 font-bold text-slate-950">{formatCentiKg(summary.nucaBikini.referenceKg100)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Resultado real</dt>
                    <dd className="number-tabular mt-1 font-bold text-slate-950">{formatCentiKg(summary.nucaBikini.actualKg100)}</dd>
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

      <WeeklyProductSummary
        groups={weeklyProductGroups}
        totalFinishedKg100={summary.detailFinishedKg100}
        performanceRatio={summary.performance.ratio}
      />

      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-600 shadow-panel">
        <ClipboardCheck className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
        <p>
          La semana puede validar en cero y permanecer bajo la referencia del 80%.
          El aprovechamiento acumulado se calcula con los totales de MP y producto, no
          promediando porcentajes diarios.
        </p>
      </div>
    </div>
  )
}
