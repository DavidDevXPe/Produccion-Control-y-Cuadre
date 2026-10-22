import { useState } from 'react'
import { FilePlus2 } from 'lucide-react'
import { ActionLink } from '../../../components/ui/ActionLink'
import { PageHeader } from '../../../components/ui/PageHeader'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { DashboardProcessComparison } from '../components/DashboardProcessComparison'
import { DashboardEmptyState } from '../components/DashboardEmptyState'
import { DashboardKpiGrid } from '../components/DashboardKpiGrid'
import { DashboardEvolutionCard } from '../components/DashboardEvolutionCard'
import { DashboardRecentJourneysTable } from '../components/DashboardRecentJourneysTable'
import { DashboardJourneyStatusCard } from '../components/DashboardJourneyStatusCard'
import { DashboardPackingFamilyCard } from '../components/DashboardPackingFamilyCard'
import { DashboardPendingBalancesCard } from '../components/DashboardPendingBalancesCard'
import { DashboardQuickActionsCard } from '../components/DashboardQuickActionsCard'
import { DashboardAttentionCard } from '../components/DashboardAttentionCard'
import { DashboardWeeklyValidationBanner } from '../components/DashboardWeeklyValidationBanner'
import type { WeeklyProductionSeries } from '../components/WeeklyProductionChart'
import { useDashboardData } from '../hooks/useDashboardData'

export function DashboardPage() {
  usePageTitle('Dashboard')

  const [chartSeries, setChartSeries] = useState<WeeklyProductionSeries>('ALL')
  const data = useDashboardData()

  const newJourneyAction = data.activeWeekState.canCreate ? (
    <ActionLink
      to="/jornadas/nueva?process=PACKING"
      variant="primary"
      size="sm"
    >
      <FilePlus2 className="size-4" aria-hidden="true" />
      Nueva jornada
    </ActionLink>
  ) : null

  if (!data.hasWeekData) {
    return (
      <DashboardEmptyState
        packingWeekNumber={data.packingWeek.number}
        activeWeekState={data.activeWeekState}
        newJourneyAction={newJourneyAction}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="dashboard-eyebrow pl-4">
        <PageHeader
          eyebrow="Dashboard operativo · Cuadre semanal"
          title="En resumen"
          description={data.weekDescription}
          actions={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <StatusBadge tone={data.operationStatus.tone} truncateText={false}>
                {data.operationStatus.label}
              </StatusBadge>
              {newJourneyAction}
            </div>
          }
          actionsClassName="sm:self-center"
        />
      </div>

      <DashboardKpiGrid
        packedWeekKg100={data.packedWeekKg100}
        frozenWeekKg100={data.frozenWeekKg100}
        pendingTraceableKg100={data.pendingTraceableKg100}
        totalAvailableKg100={data.totalAvailableKg100}
        packingDaysCount={data.packingDays.length}
        freezingDaysCount={data.freezingDays.length}
        pendingBalancesByFamilyCount={data.pendingBalancesByFamilyAll.length}
        observedJourneyCount={data.observedJourneyCount}
        notBalancedJourneyCount={data.notBalancedJourneyCount}
        reviewJourneyCount={data.reviewJourneyCount}
        registeredJourneyCount={data.registeredJourneyCount}
        weeklyYieldPercent={data.weeklyYieldPercent}
        weeklyYieldDelta={data.weeklyYieldDelta}
      />

      {data.attentionItems.length > 0 ? (
        <DashboardAttentionCard
          attentionItems={data.attentionItems}
          attention={data.attention}
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] xl:items-stretch">
        <div className="flex min-w-0 flex-col gap-4">
          <DashboardRecentJourneysTable
            journeyRows={data.journeyRows}
            packingWeekNumber={data.packingWeek.number}
          />

          <DashboardEvolutionCard
            weeklyProductionData={data.weeklyProductionData}
            chartSeries={chartSeries}
            onChangeChartSeries={setChartSeries}
            weekBadge={data.weekBadge}
          />

          <div className="grid gap-4 md:grid-cols-2 xl:flex-1 xl:items-stretch">
            <DashboardPackingFamilyCard
              packedFamilies={data.packedFamilies}
              totalFamiliesCount={data.packedFamiliesAll.length}
              packingWeekNumber={data.packingWeek.number}
              weeklyYieldPercent={data.weeklyYieldPercent}
            />

            <DashboardJourneyStatusCard
              packingDaysCount={data.packingDays.length}
              freezingDaysCount={data.freezingDays.length}
              balancedJourneyCount={data.balancedJourneyCount}
              observedJourneyCount={data.observedJourneyCount}
              reviewJourneyCount={data.reviewJourneyCount}
              notBalancedJourneyCount={data.notBalancedJourneyCount}
              registeredJourneyCount={data.registeredJourneyCount}
              registeredOperationalDayCount={data.registeredOperationalDayCount}
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <DashboardProcessComparison
            comparison={data.processComparison}
            hasFreezingData={data.hasFreezingData}
          />

          <DashboardPendingBalancesCard
            pendingBalancesByFamily={data.pendingBalancesByFamily}
            hiddenPendingFamilyCount={data.hiddenPendingFamilyCount}
            pendingTraceableKg100={data.pendingTraceableKg100}
            packingWeekNumber={data.packingWeek.number}
          />

          <DashboardQuickActionsCard
            canCreateJourney={data.activeWeekState.canCreate}
            weekDistinctProductCount={data.weekDistinctProductCount}
            weeklyYieldPercent={data.weeklyYieldPercent}
          />
        </div>
      </div>

      <DashboardWeeklyValidationBanner
        weekSummary={data.weekSummary}
        isWeekValid={data.isWeekValid}
      />
    </div>
  )
}

export default DashboardPage