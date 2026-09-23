import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  FilePlus2,
  Gauge,
  PackageCheck,
  Snowflake,
  Waves,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { ActionLink } from '../../../components/ui/ActionLink'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { usePageTitle } from '../../../hooks/usePageTitle'
import {
  formatCentiKg,
  formatCentiKgValue,
  formatIsoDateCompact,
  formatIsoWeekday,
  formatRatioAsPercent,
} from '../../../utils/formatters'
import { DashboardProcessComparison } from '../components/DashboardProcessComparison'
import {
  calculateWeeklySummary,
  kg100,
  sumKg100,
} from '../model/calculations'
import {
  calculateFreezingAvailability,
  calculateFreezingComparison,
} from '../model/freezing'
import { isBalanceOnlyProductionDay } from '../model/productionDayMode'
import { getProductionDayOperationalState } from '../model/productionLifecycle'
import {
  buildDashboardAttentionItems,
  summarizeDashboardAttention,
  type AttentionProcess,
  type AttentionTone,
} from '../presentation/dashboardAttention'
import { getJourneyStatus } from '../presentation/journeyStatus'
import { getYieldStatus, yieldVisualStyles } from '../presentation/yieldStatus'
import { useProductionData } from '../state/ProductionDataContext'

const WeeklyProductionChart = lazy(
  () => import('../components/WeeklyProductionChart'),
)

const COVERAGE_DAYS = 7

function processLabel(process: AttentionProcess | null) {
  if (process === null) return 'Envasado → Congelamiento'
  return process === 'FREEZING' ? 'Congelamiento' : 'Envasado'
}

const attentionToneStyles: Record<
  AttentionTone,
  { Icon: LucideIcon; iconClass: string }
> = {
  danger: {
    Icon: XCircle,
    iconClass: 'bg-rose-50 text-rose-700',
  },
  warning: {
    Icon: AlertTriangle,
    iconClass: 'bg-amber-50 text-amber-700',
  },
  info: {
    Icon: AlertTriangle,
    iconClass: 'bg-brand-50 text-brand-700',
  },
}

interface QuickAction {
  to: string
  label: string
  Icon: LucideIcon
}

/** Compact operational navigation: it links, it does not summarize. */
function QuickActions({ actions }: { actions: readonly QuickAction[] }) {
  return (
    <nav
      aria-label="Accesos rápidos"
      className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center"
    >
      {actions.map(({ to, label, Icon }) => (
        <ActionLink
          key={to}
          to={to}
          variant="secondary"
          size="sm"
          className="justify-start sm:justify-center"
        >
          <Icon className="size-4 text-brand-700" aria-hidden="true" />
          {label}
        </ActionLink>
      ))}
    </nav>
  )
}

const quickActions: readonly QuickAction[] = [
  { to: '/jornadas', label: 'Jornadas', Icon: CalendarCheck2 },
  { to: '/jornadas?process=FREEZING', label: 'Congelamiento', Icon: Snowflake },
  { to: '/saldos', label: 'Saldos', Icon: Waves },
  { to: '/rendimiento', label: 'Rendimiento', Icon: Gauge },
  { to: '/resumen', label: 'Resumen', Icon: ClipboardList },
]

interface CoverageRowProps {
  label: string
  value: number
}

function CoverageRow({ label, value }: CoverageRowProps) {
  const percent = Math.min(100, Math.max(0, (value / COVERAGE_DAYS) * 100))

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-bold text-slate-800">{label}</span>
        <span className="number-tabular font-bold text-slate-900">
          {value} / {COVERAGE_DAYS}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`Cobertura de ${label}`}
        aria-valuemin={0}
        aria-valuemax={COVERAGE_DAYS}
        aria-valuenow={value}
        aria-valuetext={`${value} de ${COVERAGE_DAYS} jornadas`}
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className={`h-full rounded-full ${
            value === COVERAGE_DAYS ? 'bg-emerald-500' : 'bg-brand-500'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export function DashboardPage() {
  usePageTitle('Dashboard')

  const { activeWeekNumber, allProductionDays, getWeekView } =
    useProductionData()

  const packingWeek = getWeekView(activeWeekNumber, 'PACKING')
  const freezingWeek = getWeekView(activeWeekNumber, 'FREEZING')
  const activeWeekState = packingWeek

  const packingDays = packingWeek.productionDays
  const freezingDays = freezingWeek.productionDays
  const registeredJourneyCount = packingDays.length + freezingDays.length
  const hasWeekData = registeredJourneyCount > 0

  const packingCalculatedDays = packingDays.map((day) => {
    const operationalState = getProductionDayOperationalState(day)

    return {
      day,
      operationalState,
      calculation: operationalState.calculation,
      journey: getJourneyStatus(day, operationalState),
    }
  })

  const freezingCalculatedDays = freezingDays.map((day) => {
    const operationalState = getProductionDayOperationalState(day)

    return {
      day,
      operationalState,
      calculation: operationalState.calculation,
      journey: getJourneyStatus(day, operationalState),
    }
  })

  const processComparison = calculateFreezingComparison(
    allProductionDays,
    packingWeek.period,
  )

  const hasFreezingData =
    processComparison.frozenKg100 > 0 ||
    processComparison.physicalReportedKg100 > 0 ||
    processComparison.status === 'REVIEW'

  const packedWeekKg100 = sumKg100(
    packingCalculatedDays.map(
      ({ calculation }) => calculation.declaredFinishedKg100,
    ),
  )

  const frozenWeekKg100 = sumKg100(
    freezingDays.flatMap((day) => [
      day.declaredShiftTotalsKg100.DAY,
      day.declaredShiftTotalsKg100.NIGHT,
    ]),
  )

  const freezingAvailability = calculateFreezingAvailability(
    allProductionDays,
    packingWeek.period.endDate,
  )

  const pendingTraceableKg100 = sumKg100(
    freezingAvailability.map((position) => position.pendingKg100),
  )

  // The four journey states are mutually exclusive, so they always add up to
  // the registered journeys (see presentation/journeyStatus.ts).
  const journeyStatusCounts = [
    ...packingCalculatedDays,
    ...freezingCalculatedDays,
  ].reduce(
    (counts, { journey }) => ({
      ...counts,
      [journey.status]: counts[journey.status] + 1,
    }),
    {
      BALANCED: 0,
      BALANCED_OBSERVED: 0,
      PENDING_REVIEW: 0,
      NOT_BALANCED: 0,
    },
  )
  const balancedJourneyCount = journeyStatusCounts.BALANCED
  const observedJourneyCount = journeyStatusCounts.BALANCED_OBSERVED
  const notBalancedJourneyCount = journeyStatusCounts.NOT_BALANCED
  const reviewJourneyCount =
    journeyStatusCounts.PENDING_REVIEW + notBalancedJourneyCount

  const weekSummary =
    packingDays.length > 0
      ? calculateWeeklySummary(packingDays, packingWeek.period)
      : null

  const isWeekValid =
    Boolean(weekSummary) &&
    weekSummary?.status === 'VALID' &&
    packingDays.every((day) => day.status === 'CLOSED')

  const weeklyProductionData = packingCalculatedDays.map(
    ({ day, calculation }) => ({
      id: day.id,
      label: day.displayName.split(' ')[0] ?? formatIsoWeekday(day.date),
      dateLabel: formatIsoDateCompact(day.date),
      dayKg100: calculation.productiveDayKg100,
      nightKg100: calculation.productiveNightKg100,
      treatmentKg100: calculation.treatmentKg100,
      balanceKg100: calculation.newClosingBalanceKg100,
    }),
  )

  const pendingBalancesByFamilyAll = (() => {
    const families = new Map<
      string,
      {
        familyName: string
        pendingKg100: ReturnType<typeof kg100>
        productIds: Set<string>
      }
    >()

    for (const position of freezingAvailability) {
      if (position.pendingKg100 <= 0) continue

      const current = families.get(position.familyId)

      if (current) {
        current.pendingKg100 = kg100(
          current.pendingKg100 + position.pendingKg100,
        )
        current.productIds.add(position.productId)
        continue
      }

      families.set(position.familyId, {
        familyName: position.familyName,
        pendingKg100: position.pendingKg100,
        productIds: new Set([position.productId]),
      })
    }

    return [...families.values()].sort(
      (first, second) => second.pendingKg100 - first.pendingKg100,
    )
  })()

  const pendingBalancesByFamily = pendingBalancesByFamilyAll.slice(0, 5)
  const hiddenPendingFamilyCount = Math.max(
    pendingBalancesByFamilyAll.length - pendingBalancesByFamily.length,
    0,
  )

  const attentionItems = buildDashboardAttentionItems({
    packingDays: packingCalculatedDays,
    freezingDays: freezingCalculatedDays,
    comparison: processComparison,
    freezingPositions: freezingAvailability,
    weekEndDate: packingWeek.period.endDate,
  })
  const attention = summarizeDashboardAttention(attentionItems)

  // Red is for real problems, amber for observations and follow-up.
  const operationStatus =
    attention.criticalCount > 0 || notBalancedJourneyCount > 0
      ? { tone: 'danger' as const, label: 'OPERACIÓN · CON INCIDENCIAS' }
      : attention.observationCount > 0 || reviewJourneyCount > 0
        ? { tone: 'warning' as const, label: 'OPERACIÓN · CON OBSERVACIONES' }
        : { tone: 'success' as const, label: 'OPERACIÓN · ESTABLE' }

  const weekBadge = !weekSummary
    ? { tone: 'neutral' as const, label: 'SIN ENVASADO' }
    : isWeekValid
      ? { tone: 'success' as const, label: 'SEMANA CONSISTENTE' }
      : weekSummary.status === 'VALID'
        ? { tone: 'info' as const, label: 'SEMANA EN SEGUIMIENTO' }
        : { tone: 'warning' as const, label: 'SEMANA POR REVISAR' }

  const recentJourneys = [
    ...packingCalculatedDays.map(({ day, journey }) => ({
      day,
      journey,
      process: 'PACKING' as const,
    })),
    ...freezingCalculatedDays.map(({ day, journey }) => ({
      day,
      journey,
      process: 'FREEZING' as const,
    })),
  ]
    .sort((first, second) => second.day.date.localeCompare(first.day.date))
    .slice(0, 5)

  const registeredOperationalDayCount = new Set(
    [...packingDays, ...freezingDays].map((day) => day.date),
  ).size

  const weekDescription = activeWeekState.isClosed
    ? `Semana ${packingWeek.number} · Cerrada · Solo lectura`
    : activeWeekState.isPast
      ? `Semana ${packingWeek.number} · Abierta · Seguimiento operativo`
      : `Semana ${packingWeek.number} · Estado general de Envasado y Congelamiento`

  const newJourneyAction = activeWeekState.canCreate ? (
    <ActionLink
      to="/jornadas/nueva?process=PACKING"
      variant="primary"
      size="sm"
    >
      <FilePlus2 className="size-4" aria-hidden="true" />
      Nueva jornada
    </ActionLink>
  ) : null

  if (!hasWeekData) {
    return (
      <div className="space-y-4">
        <div className="border-l-[3px] border-brand-500 pl-4">
          <PageHeader
            eyebrow="Dashboard operativo"
            title="Control de producción"
            description={
              activeWeekState.isClosed
                ? `Semana ${packingWeek.number} · Cerrada · Solo lectura`
                : activeWeekState.isCurrent
                  ? `Semana ${packingWeek.number} · Actual · Sin jornadas registradas`
                  : `Semana ${packingWeek.number} · Abierta · Reportes pendientes`
            }
            actions={newJourneyAction}
          />
        </div>

        <SectionCard
          title={`Semana ${packingWeek.number} sin actividad registrada`}
          description={
            activeWeekState.canCreate
              ? 'La semana está lista para recibir Envasado y Congelamiento.'
              : 'La semana permanece disponible como histórico de solo lectura.'
          }
          contentClassName="p-5"
        >
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-bold text-slate-900">
                Aún no existen jornadas para mostrar en el Dashboard.
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {activeWeekState.canCreate
                  ? 'Registra la primera jornada manualmente o importa un Excel estructurado para comenzar el seguimiento operativo.'
                  : 'Puedes consultar otras semanas desde Jornadas, Saldos y Resumen.'}
              </p>
            </div>

            {activeWeekState.canCreate ? (
              <ActionLink to="/jornadas/nueva?process=PACKING">
                <FilePlus2 className="size-4" aria-hidden="true" />
                Registrar primera jornada
              </ActionLink>
            ) : null}
          </div>
        </SectionCard>

        <QuickActions actions={quickActions} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="border-l-[3px] border-brand-500 pl-4">
        <PageHeader
          eyebrow="Dashboard operativo"
          title="Control de producción"
          description={weekDescription}
          actions={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <StatusBadge tone={operationStatus.tone} truncateText={false}>
                {operationStatus.label}
              </StatusBadge>
              {newJourneyAction}
            </div>
          }
          actionsClassName="sm:self-center"
        />
      </div>

      <section
        aria-label="Indicadores principales de la semana"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          label="Envasado de la semana"
          value={formatCentiKgValue(packedWeekKg100)}
          unit="kg"
          icon={<PackageCheck className="size-5" />}
          tone="brand"
          description={`${packingDays.length}/${COVERAGE_DAYS} jornadas de Envasado`}
        />

        <MetricCard
          label="Congelado de la semana"
          value={formatCentiKgValue(frozenWeekKg100)}
          unit="kg"
          icon={<Snowflake className="size-5" />}
          tone={frozenWeekKg100 > 0 ? 'brand' : 'neutral'}
          description={`${freezingDays.length}/${COVERAGE_DAYS} jornadas de Congelamiento`}
        />

        <MetricCard
          label="Saldo pendiente trazable"
          value={formatCentiKgValue(pendingTraceableKg100)}
          unit="kg"
          icon={<Boxes className="size-5" />}
          tone={pendingTraceableKg100 > 0 ? 'brand' : 'success'}
          description={
            pendingTraceableKg100 > 0
              ? `${pendingBalancesByFamilyAll.length} familias con pendiente`
              : 'Sin saldo trazable pendiente'
          }
        />

        <MetricCard
          label="Jornadas con observación"
          value={observedJourneyCount}
          icon={<AlertTriangle className="size-5" />}
          tone={
            notBalancedJourneyCount > 0
              ? 'danger'
              : observedJourneyCount > 0
                ? 'warning'
                : 'success'
          }
          description={`${notBalancedJourneyCount} críticas · ${observedJourneyCount} observadas`}
        />
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[1.6fr_1fr]">
        <DashboardProcessComparison
          comparison={processComparison}
          hasFreezingData={hasFreezingData}
        />

        <SectionCard
          title="Estado de jornadas"
          description={`${registeredOperationalDayCount} de ${COVERAGE_DAYS} días con actividad registrada.`}
          action={
            <ActionLink to="/jornadas" variant="ghost" size="sm">
              Ver jornadas
              <ArrowRight className="size-4" aria-hidden="true" />
            </ActionLink>
          }
          contentClassName="space-y-3 p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-5">
            <CoverageRow label="Envasado" value={packingDays.length} />
            <CoverageRow label="Congelamiento" value={freezingDays.length} />
          </div>

          <dl className="grid grid-cols-3 gap-2 border-t border-slate-200 pt-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-center">
              <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-600">
                Cuadradas
              </dt>
              <dd className="number-tabular mt-0.5 text-lg font-extrabold text-emerald-700">
                {balancedJourneyCount}
              </dd>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-center">
              <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-600">
                Observadas
              </dt>
              <dd className="number-tabular mt-0.5 text-lg font-extrabold text-amber-700">
                {observedJourneyCount}
              </dd>
            </div>

            <div
              className={`rounded-lg border px-2 py-1.5 text-center ${
                notBalancedJourneyCount > 0
                  ? 'border-rose-200 bg-rose-50'
                  : 'border-amber-200 bg-amber-50'
              }`}
            >
              <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-600">
                Por revisar
              </dt>
              <dd
                className={`number-tabular mt-0.5 text-lg font-extrabold ${
                  notBalancedJourneyCount > 0
                    ? 'text-rose-700'
                    : 'text-amber-700'
                }`}
              >
                {reviewJourneyCount}
              </dd>
            </div>
          </dl>
        </SectionCard>
      </div>

      <QuickActions actions={quickActions} />

      <div className="grid items-start gap-4 xl:grid-cols-[1.5fr_1fr]">
        <SectionCard
          title="Evolución semanal de Envasado"
          description="Día, Noche, Tratamiento y Saldo por jornada registrada."
          action={
            <StatusBadge tone={weekBadge.tone} truncateText={false}>
              {weekBadge.label}
            </StatusBadge>
          }
          contentClassName="p-4"
        >
          <ul
            aria-label="Leyenda del gráfico"
            className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.6875rem] text-slate-600"
          >
            {[
              ['Día', 'bg-[var(--color-production-day)]'],
              ['Noche', 'bg-[var(--color-production-night)]'],
              ['Tratamiento', 'bg-[var(--color-production-treatment)]'],
              ['Saldo', 'bg-[var(--color-production-balance)]'],
            ].map(([label, color]) => (
              <li key={label} className="inline-flex items-center gap-1.5">
                <span
                  className={`size-2 rounded-full ${color}`}
                  aria-hidden="true"
                />
                {label}
              </li>
            ))}
          </ul>

          {weeklyProductionData.length > 0 ? (
            <Suspense
              fallback={
                <div
                  className="grid h-[14.5rem] place-items-center text-xs text-slate-500"
                  role="status"
                >
                  Preparando gráfico semanal…
                </div>
              }
            >
              <WeeklyProductionChart data={weeklyProductionData} />
            </Suspense>
          ) : (
            <div className="grid h-[14.5rem] place-items-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-500">
              Sin jornadas de Envasado para graficar.
            </div>
          )}

          <p className="mt-2 border-t border-slate-100 pt-2 text-[0.6875rem] leading-5 text-slate-500">
            Se muestran únicamente jornadas reales registradas en la semana.
          </p>
        </SectionCard>

        <SectionCard
          title="Saldos pendientes por familia"
          description="Disponibilidad trazable que todavía puede pasar a Congelamiento."
          action={
            <ActionLink to="/saldos" variant="ghost" size="sm">
              Ver saldos
              <ArrowRight className="size-4" aria-hidden="true" />
            </ActionLink>
          }
        >
          {pendingBalancesByFamily.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {pendingBalancesByFamily.map((family, index) => (
                <li
                  key={family.familyName}
                  className="flex items-center gap-3 px-4 py-2.5"
                >
                  <span
                    className="grid size-7 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-bold text-slate-600"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-xs font-bold text-slate-900">
                        {family.familyName}
                      </p>
                      <span className="number-tabular shrink-0 text-xs font-bold text-slate-900">
                        {formatCentiKg(family.pendingKg100)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div
                        className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"
                        aria-hidden="true"
                      >
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{
                            width: `${
                              pendingBalancesByFamily[0]?.pendingKg100
                                ? Math.max(
                                    4,
                                    (family.pendingKg100 /
                                      pendingBalancesByFamily[0]
                                        .pendingKg100) *
                                      100,
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="shrink-0 text-[0.625rem] text-slate-500">
                        {family.productIds.size}{' '}
                        {family.productIds.size === 1
                          ? 'producto pendiente'
                          : 'productos pendientes'}
                      </span>
                    </div>
                  </div>
                </li>
              ))}

              <li className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-2">
                <span className="text-xs font-bold text-slate-700">
                  {hiddenPendingFamilyCount > 0
                    ? `${hiddenPendingFamilyCount} familias adicionales`
                    : 'Pendiente trazable total'}
                </span>
                {hiddenPendingFamilyCount > 0 ? (
                  <ActionLink to="/saldos" variant="ghost" size="sm">
                    Ver todos los saldos
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </ActionLink>
                ) : (
                  <span className="number-tabular text-xs font-bold text-slate-900">
                    {formatCentiKg(pendingTraceableKg100)}
                  </span>
                )}
              </li>
            </ul>
          ) : (
            <div className="flex items-center gap-3 px-5 py-6 text-sm text-slate-500">
              <CheckCircle2
                className="size-5 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              No existe saldo trazable pendiente de congelar.
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[1.4fr_1fr]">
        <SectionCard
          title="Actividad y excepciones"
          description="Primero lo crítico, luego las observaciones de las jornadas de la semana."
          action={
            <StatusBadge
              tone={
                attention.criticalCount > 0
                  ? 'danger'
                  : attentionItems.length > 0
                    ? 'warning'
                    : 'success'
              }
              truncateText={false}
            >
              {attention.criticalCount > 0
                ? `${attention.criticalCount} CRÍTICA${
                    attention.criticalCount === 1 ? '' : 'S'
                  }`
                : attentionItems.length > 0
                  ? attentionItems.length === 1
                    ? '1 OBSERVACIÓN'
                    : `${attentionItems.length} OBSERVACIONES`
                  : 'SIN ALERTAS'}
            </StatusBadge>
          }
        >
          {attentionItems.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {attention.visible.map((item) => {
                const { Icon, iconClass } = attentionToneStyles[item.tone]

                return (
                  <li
                    key={item.key}
                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-lg ${iconClass}`}
                        aria-hidden="true"
                      >
                        <Icon className="size-4" />
                      </span>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-950">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.05em] text-slate-500">
                          {processLabel(item.process)} ·{' '}
                          {formatIsoDateCompact(item.date)}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-600">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <ActionLink
                      to={
                        item.to ??
                        `/jornadas/${item.date}?process=${item.process}`
                      }
                      variant="ghost"
                      size="sm"
                      aria-label={`Revisar: ${item.title}`}
                      className="self-start sm:shrink-0"
                    >
                      Revisar
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </ActionLink>
                  </li>
                )
              })}

              {attention.hiddenCount > 0 ? (
                <li className="flex flex-col gap-1 bg-slate-50 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold text-slate-600">
                    Hay {attention.hiddenCount}{' '}
                    {attention.hiddenCount === 1
                      ? 'evento adicional'
                      : 'eventos adicionales'}{' '}
                    de la semana.
                  </p>
                  <ActionLink to="/jornadas" variant="ghost" size="sm">
                    Ver todas las excepciones
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </ActionLink>
                </li>
              ) : null}
            </ul>
          ) : (
            <div className="flex items-center gap-3 px-5 py-6 text-sm text-slate-500">
              <CheckCircle2
                className="size-5 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              No hay observaciones ni validaciones bloqueantes detectadas.
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Últimas jornadas"
          description="Actividad operativa reciente de ambos procesos."
        >
          <ul className="divide-y divide-slate-100">
            {recentJourneys.map(({ day, journey, process }) => (
              <li key={`${process}-${day.id}`}>
                <Link
                  to={`/jornadas/${day.date}?process=${process}`}
                  className="group flex flex-col gap-1.5 px-4 py-2.5 transition hover:bg-brand-50/50 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">
                      {formatIsoWeekday(day.date)} ·{' '}
                      {formatIsoDateCompact(day.date)}
                    </p>
                    <p className="mt-0.5 text-[0.6875rem] text-slate-500">
                      {processLabel(process)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge tone={journey.tone} truncateText={false}>
                      {journey.label}
                    </StatusBadge>

                    <ArrowRight
                      className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-700"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {packingDays.length > 0 ? (
        <SectionCard
          title="Detalle semanal de Envasado"
          description="Vista rápida de las jornadas registradas y su estado operativo."
          action={
            <ActionLink to="/jornadas?process=PACKING" variant="ghost" size="sm">
              Ver todas
              <ArrowRight className="size-4" aria-hidden="true" />
            </ActionLink>
          }
        >
          <DataTableScroll
            label={`Estado de las jornadas de Envasado de la semana ${packingWeek.number}`}
          >
            <table className="erp-table w-full min-w-[54rem] table-fixed border-collapse text-center">
              <caption className="sr-only">
                Estado operativo de las jornadas de Envasado
              </caption>

              <colgroup>
                <col className="w-[15%]" />
                <col className="w-[14%]" />
                <col className="w-[22%]" />
                <col className="w-[21%]" />
                <col className="w-[18%]" />
                <col className="w-[10%]" />
              </colgroup>

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[0.625rem] font-bold uppercase tracking-[0.07em] text-slate-500">
                  <th scope="col" className="px-3 py-2.5">Jornada</th>
                  <th scope="col" className="px-3 py-2.5">Fecha</th>
                  <th scope="col" className="px-3 py-2.5">Estado</th>
                  <th scope="col" className="px-3 py-2.5">Producto terminado</th>
                  <th scope="col" className="px-3 py-2.5">Aprovechamiento</th>
                  <th scope="col" className="px-3 py-2.5">Acción</th>
                </tr>
              </thead>

              <tbody>
                {packingCalculatedDays.map(({ day, calculation, journey }) => {
                  const dayYieldStatus = getYieldStatus(
                    calculation.performance.percent,
                  )
                  const dayYieldStyles =
                    yieldVisualStyles[dayYieldStatus.colorVariant]
                  const isBalanceOnly = isBalanceOnlyProductionDay(day)

                  return (
                    <tr
                      key={day.id}
                      className="border-b border-slate-100 bg-white last:border-0 hover:bg-brand-50/35"
                    >
                      <th
                        scope="row"
                        className="px-3 py-3 text-center text-xs font-bold text-slate-900"
                      >
                        {formatIsoWeekday(day.date)}
                      </th>

                      <td className="number-tabular px-3 py-3 text-center text-xs text-slate-500">
                        {formatIsoDateCompact(day.date)}
                      </td>

                      <td className="px-3 py-3 text-center">
                        <StatusBadge tone={journey.tone} truncateText={false}>
                          {journey.label}
                        </StatusBadge>
                      </td>

                      <td className="number-tabular px-3 py-3 text-center text-xs font-bold text-slate-900">
                        {formatCentiKg(calculation.declaredFinishedKg100)}
                      </td>

                      <td
                        className="px-3 py-3 text-center"
                        title={
                          isBalanceOnly
                            ? 'Jornada de saldos sin nueva materia prima.'
                            : `${formatRatioAsPercent(
                                calculation.performance.ratio,
                              )} · ${dayYieldStatus.label}: ${
                                dayYieldStatus.interpretation
                              }`
                        }
                      >
                        {isBalanceOnly ? (
                          <span className="text-xs font-bold text-slate-500">
                            NO APLICA
                          </span>
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <span
                              className={`number-tabular text-xs font-bold ${dayYieldStyles.textClass}`}
                            >
                              {formatRatioAsPercent(
                                calculation.performance.ratio,
                              )}
                            </span>
                            <span
                              className={`mt-0.5 text-[0.625rem] font-bold ${dayYieldStyles.textClass}`}
                            >
                              {dayYieldStatus.label}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-3 text-center">
                        <ActionLink
                          to={`/jornadas/${day.date}?process=PACKING`}
                          variant="ghost"
                          size="sm"
                          aria-label={`Ver jornada de ${formatIsoWeekday(day.date)} ${formatIsoDateCompact(day.date)}`}
                        >
                          Ver
                          <ArrowRight
                            className="size-3.5"
                            aria-hidden="true"
                          />
                        </ActionLink>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </DataTableScroll>
        </SectionCard>
      ) : null}

      {weekSummary ? (
        <section
          className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-panel sm:flex-row sm:items-center sm:justify-between"
          aria-label="Validación semanal"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-lg ${
                isWeekValid
                  ? 'bg-emerald-50 text-emerald-700'
                  : weekSummary.status === 'VALID'
                    ? 'bg-brand-50 text-brand-700'
                    : 'bg-amber-50 text-amber-700'
              }`}
              aria-hidden="true"
            >
              <CheckCircle2 className="size-4" />
            </span>

            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900">
                Validación semanal de Envasado
              </p>
              <p className="mt-0.5 text-[0.6875rem] text-slate-500">
                Diferencia acumulada:{' '}
                <strong className="number-tabular text-slate-800">
                  {formatCentiKg(weekSummary.differenceKg100)}
                </strong>
              </p>
            </div>
          </div>

          <ActionLink to="/resumen" variant="ghost" size="sm">
            Revisar resumen
            <ArrowRight className="size-4" aria-hidden="true" />
          </ActionLink>
        </section>
      ) : null}
    </div>
  )
}

export default DashboardPage
