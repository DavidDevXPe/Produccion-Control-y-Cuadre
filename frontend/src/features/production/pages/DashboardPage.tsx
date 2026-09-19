import {
  ArrowRight,
  AlertTriangle,
  BarChart3,
  Boxes,
  CalendarCheck2,
  CheckCircle2,
  Cog,
  FilePlus2,
  Gauge,
  Moon,
  PackageCheck,
  Scale,
  Sun,
  Waves,
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
import { DashboardProcessComparison } from '../components/DashboardProcessComparison'
import {
  formatCentiKg,
  formatCentiKgValue,
  formatIsoDate,
  formatIsoDateCompact,
  formatIsoWeekday,
  formatRatioAsPercent,
} from '../../../utils/formatters'
import {
  calculateProductionDay,
  calculateWeeklySummary,
} from '../model/calculations'
import { calculateFreezingComparison } from '../model/freezing'
import { isBalanceOnlyProductionDay } from '../model/productionDayMode'
import { getProductionDayOperationalState } from '../model/productionLifecycle'
import { getYieldStatus, yieldVisualStyles } from '../presentation/yieldStatus'
import { useProductionData } from '../state/ProductionDataContext'

const WeeklyProductionChart = lazy(
  () => import('../components/WeeklyProductionChart'),
)

export function DashboardPage() {
  usePageTitle('Dashboard')
  const { activeWeekNumber, allProductionDays, getWeekView } = useProductionData()
  const activeWeek = getWeekView(activeWeekNumber, 'PACKING')
  const productionDays = activeWeek.productionDays
  const activeWeekState = activeWeek
  const processComparison = calculateFreezingComparison(
    allProductionDays,
    activeWeek.period,
  )
  const hasFreezingData =
    processComparison.frozenKg100 > 0 ||
    processComparison.unexplainedDifferenceKg100 !== 0

  if (productionDays.length === 0) {
    return (
      <div className="space-y-5">
        <div className="border-l-[3px] border-brand-500 pl-4 xl:min-h-[6.5rem] xl:[&_h1]:text-[1.9rem] xl:[&_h1]:leading-9">
          <PageHeader
            eyebrow="Vista operativa"
            title="Control de producción"
            description={
              activeWeekState.isClosed
                ? `Semana ${activeWeek.number} · Cerrada · Solo lectura.`
                : activeWeekState.isCurrent
                  ? `Semana ${activeWeek.number} · Actual · Sin registros.`
                  : `Semana ${activeWeek.number} · Abierta · Reportes pendientes.`
            }
            actions={
              activeWeekState.canCreate ? (
                <ActionLink to="/jornadas/nueva?process=PACKING" variant="primary" size="sm">
                  Nueva jornada
                  <FilePlus2 className="size-4" aria-hidden="true" />
                </ActionLink>
              ) : null
            }
          />
        </div>
        <SectionCard
          title={
            activeWeekState.canCreate
              ? `Semana ${activeWeek.number} lista para captura`
              : `Semana ${activeWeek.number} sin jornadas registradas`
          }
          description={
            activeWeekState.canCreate
              ? 'Todavía no hay jornadas registradas. Puedes ingresar los datos manualmente o precargarlos desde Excel y revisarlos antes de guardar.'
              : 'Esta semana cerrada permanece disponible como histórico de solo lectura.'
          }
          contentClassName="p-6"
        >
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              {activeWeekState.canCreate
              ? activeWeekState.isPast
                ? 'Esta semana pasada continúa abierta para completar sus reportes pendientes.'
                : 'La semana actual está lista para recibir su primera jornada.'
              : 'Puedes consultar la semana desde Dashboard, Jornadas, Saldos y Resumen.'}
            </p>
            {activeWeekState.canCreate ? (
              <ActionLink to="/jornadas/nueva?process=PACKING">
                <FilePlus2 className="size-4" aria-hidden="true" />
                Nueva jornada
              </ActionLink>
            ) : null}
          </div>
        </SectionCard>
        <DashboardProcessComparison
          comparison={processComparison}
          hasFreezingData={hasFreezingData}
        />
      </div>
    )
  }

  const calculatedDays = productionDays.map((day) => {
    const operationalState = getProductionDayOperationalState(day)

    return {
      day,
      operationalState,
      calculation: operationalState.calculation,
    }
  })
  const latestDay = productionDays.at(-1)!
  const latestCalculation = calculateProductionDay(latestDay)
  const weekSummary = calculateWeeklySummary(productionDays, activeWeek.period)
  const weeklyProductionData = calculatedDays.map(({ day, calculation }) => ({
    id: day.id,
    label: day.displayName.split(' ')[0] ?? formatIsoWeekday(day.date),
    dateLabel: formatIsoDateCompact(day.date),
    dayKg100: calculation.productiveDayKg100,
    nightKg100: calculation.productiveNightKg100,
    treatmentKg100: calculation.treatmentKg100,
    balanceKg100: calculation.newClosingBalanceKg100,
  }))
  const isBalanced = latestCalculation.status === 'BALANCED'
  const latestIsBalanceOnly = isBalanceOnlyProductionDay(latestDay)
  const isWeekValid =
    weekSummary.status === 'VALID' &&
    productionDays.every((day) => day.status === 'CLOSED')
  const latestYieldStatus = getYieldStatus(latestCalculation.performance.percent)
  const latestYieldStyles = yieldVisualStyles[latestYieldStatus.colorVariant]
  const performancePercent = Math.max(
    0,
    Math.min((latestCalculation.performance.ratio ?? 0) * 100, 100),
  )
  const attentionItems = calculatedDays.flatMap(({ day, calculation, operationalState }) => {
    const observations = day.closureObservations?.length
      ? day.closureObservations
      : operationalState.validation.warnings
    const items: {
      key: string
      tone: 'danger' | 'warning' | 'info'
      title: string
      description: string
      date: string
    }[] = []

    if (calculation.differenceKg100 !== 0) {
      items.push({
        key: `${day.id}-difference`,
        tone: 'danger',
        title: 'Diferencia de cuadre',
        description: `${formatIsoWeekday(day.date)} presenta ${formatCentiKg(calculation.differenceKg100)} por revisar.`,
        date: day.date,
      })
    }
    if (
      calculation.day.detailDifferenceKg100 !== 0 ||
      calculation.night.detailDifferenceKg100 !== 0
    ) {
      items.push({
        key: `${day.id}-shift-report`,
        tone: 'danger',
        title: 'Reporte por turno no conciliado',
        description: `${formatIsoWeekday(day.date)} requiere revisar Día/Noche contra el detalle por producto.`,
        date: day.date,
      })
    }
    if (calculation.integrityIssues.length > 0) {
      items.push({
        key: `${day.id}-integrity`,
        tone: 'danger',
        title: 'Validación bloqueante',
        description: calculation.integrityIssues[0]?.message ?? 'La jornada tiene una validación de integridad pendiente.',
        date: day.date,
      })
    }
    if (observations.length > 0) {
      items.push({
        key: `${day.id}-observed`,
        tone: 'warning',
        title: day.status === 'CLOSED' ? 'Cerrada con observaciones' : 'Lista con observaciones',
        description: observations[0]?.message ?? 'La jornada tiene observaciones asociadas al cierre.',
        date: day.date,
      })
    }

    return items
  })

  return (
    <div className="space-y-4">
      <section className="relative isolate" aria-label="Resumen operativo">
        <div className="space-y-4">
          <div className="border-l-[3px] border-brand-500 pl-4 xl:[&_h1]:text-[1.9rem] xl:[&_h1]:leading-9">
            <PageHeader
              eyebrow="Vista operativa"
              title="Control de producción"
              description={
                activeWeekState.isClosed
                  ? `Semana ${activeWeek.number} · Cerrada · Solo lectura`
                  : activeWeekState.isPast
                    ? `Semana ${activeWeek.number} · Abierta · Reportes pendientes`
                    : `Último registro disponible y consistencia de la semana ${activeWeek.number}.`
              }
              actions={
                <>
                  <StatusBadge
                    tone={isBalanced ? 'success' : 'danger'}
                    className="min-h-[1.875rem] px-3.5"
                  >
                    {isBalanced ? 'CUADRADO' : 'NO CUADRADO'}
                  </StatusBadge>
                  <ActionLink
                    to={`/jornadas/${latestDay.date}?process=PACKING`}
                    variant="primary"
                    size="sm"
                  >
                    Ver jornada
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </ActionLink>
                </>
              }
              actionsClassName="sm:self-center"
            />
          </div>

          <section
            aria-label="Indicadores principales"
            className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <MetricCard
              label="Producto terminado"
              value={formatCentiKgValue(latestCalculation.declaredFinishedKg100)}
              unit="kg"
              icon={<PackageCheck className="size-5" />}
              tone="brand"
              description={formatIsoDate(latestDay.date)}
            />
            <MetricCard
              label="Saldo final"
              value={formatCentiKgValue(latestCalculation.newClosingBalanceKg100)}
              unit="kg"
              icon={<Boxes className="size-5" />}
              description={
                latestCalculation.newClosingBalanceKg100 > 0
                  ? 'Pendiente para la siguiente jornada'
                  : 'Sin saldo pendiente'
              }
            />
            <MetricCard
              label="Diferencia de cuadre"
              value={formatCentiKgValue(latestCalculation.differenceKg100)}
              unit="kg"
              icon={<Scale className="size-5" />}
              tone={isBalanced ? 'success' : 'danger'}
              description={
                isBalanced
                  ? 'CUADRADO · Detalle y total coinciden'
                  : 'NO CUADRADO · Requiere revisión'
              }
            />
            <MetricCard
              label="Aprovechamiento"
              value={
                latestIsBalanceOnly
                  ? 'NO APLICA'
                  : formatRatioAsPercent(latestCalculation.performance.ratio)
              }
              icon={<Gauge className="size-5" />}
              tone={latestIsBalanceOnly ? 'neutral' : latestYieldStyles.metricTone}
              valueClassName={latestIsBalanceOnly ? 'text-slate-700' : latestYieldStyles.textClass}
              description={
                latestIsBalanceOnly ? (
                  <p>Jornada de saldos sin nueva materia prima.</p>
                ) : (
                <div className="space-y-1.5">
                  <StatusBadge tone={latestYieldStyles.badgeTone} className="min-h-5 px-2 py-0.5">
                    {latestYieldStatus.label}
                  </StatusBadge>
                  <p>Referencia operativa: 80%</p>
                  <div
                    className="relative h-1.5 overflow-visible rounded-full bg-slate-100"
                    aria-label={`Aprovechamiento ${formatRatioAsPercent(latestCalculation.performance.ratio)}; referencia 80%`}
                    role="img"
                  >
                    <span
                      className={`block h-full rounded-full ${latestYieldStyles.barClass}`}
                      style={{ width: `${performancePercent}%` }}
                    />
                    <span className="absolute -top-1 bottom-[-0.25rem] left-[80%] w-px bg-slate-400" />
                  </div>
                </div>
                )
              }
            />
          </section>

          <SectionCard
            title="Requiere atención"
            description="Excepciones reales detectadas en las jornadas de la semana seleccionada."
            action={
              <StatusBadge tone={attentionItems.length > 0 ? 'warning' : 'success'}>
                {attentionItems.length > 0
                  ? `${attentionItems.length} ALERTA${attentionItems.length === 1 ? '' : 'S'}`
                  : 'SIN ALERTAS'}
              </StatusBadge>
            }
            contentClassName="p-0"
          >
            {attentionItems.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-[#203E50]">
                {attentionItems.slice(0, 4).map((item) => (
                  <div
                    key={item.key}
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${
                          item.tone === 'danger'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                        }`}
                        aria-hidden="true"
                      >
                        <AlertTriangle className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-slate-950 dark:text-[#F3F8FB]">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-[#A5BED0]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <ActionLink
                      to={`/jornadas/${item.date}?process=PACKING`}
                      variant="ghost"
                      size="sm"
                      className="self-start sm:self-center"
                    >
                      Revisar
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </ActionLink>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 text-xs leading-5 text-slate-500 dark:text-[#A5BED0]">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
                No hay diferencias, observaciones ni validaciones bloqueantes en las jornadas registradas.
              </div>
            )}
          </SectionCard>
        </div>
      </section>

      <div className="grid items-stretch gap-4 xl:grid-cols-[1.65fr_1fr]">
        <SectionCard
          title="Última jornada registrada"
          description={formatIsoDate(latestDay.date)}
          action={
            <StatusBadge tone={isBalanced ? 'success' : 'danger'}>
              {isBalanced ? 'CUADRADO' : 'NO CUADRADO'}
            </StatusBadge>
          }
          contentClassName="p-4"
        >
          <dl className="grid gap-px overflow-hidden rounded-lg bg-slate-200 ring-1 ring-slate-200 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'Día',
                value: latestCalculation.productiveDayKg100,
                icon: Sun,
                iconClassName: 'bg-amber-50 text-amber-800',
              },
              {
                label: 'Noche',
                value: latestCalculation.productiveNightKg100,
                icon: Moon,
                iconClassName: 'bg-brand-50 text-brand-800',
              },
              {
                label: 'Tratamiento',
                value: latestCalculation.treatmentKg100,
                icon: Cog,
                iconClassName: 'bg-slate-100 text-slate-600',
              },
              {
                label: 'Saldo',
                value: latestCalculation.newClosingBalanceKg100,
                icon: Boxes,
                iconClassName: 'bg-amber-50 text-amber-800',
              },
            ].map(({ label, value, icon: Icon, iconClassName }) => (
              <div key={label} className="flex h-full min-w-0 items-center gap-3.5 bg-slate-50 px-4 py-3.5">
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-lg ${iconClassName}`}
                  aria-hidden="true"
                >
                  <Icon className="size-[1.125rem]" />
                </span>
                <div className="flex min-w-0 flex-col justify-center">
                  <dt className="text-[0.625rem] font-bold uppercase tracking-[0.1em] text-slate-500">
                    {label}
                  </dt>
                  <dd className="number-tabular mt-1 whitespace-nowrap text-base font-bold text-slate-950">
                    {formatCentiKg(value)}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
          <div className="mt-2 flex flex-col gap-1.5 border-t border-slate-100 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.6875rem] leading-5 text-slate-500">
              Producto terminado = Día + Noche + Tratamiento + Saldo
              <strong className="number-tabular ml-1 whitespace-nowrap text-slate-800">
                {formatCentiKg(latestCalculation.declaredFinishedKg100)}
              </strong>
            </p>
            <ActionLink
              to={`/jornadas/${latestDay.date}?process=PACKING`}
              variant="ghost"
              size="sm"
            >
              Ver detalle
              <ArrowRight className="size-4" aria-hidden="true" />
            </ActionLink>
          </div>
        </SectionCard>

        <SectionCard
          title="Validación semanal"
          description="Comparación por dos caminos independientes."
          contentClassName="p-4"
        >
          <div className="flex items-start gap-4">
            <span
              className={`grid size-11 shrink-0 place-items-center rounded-lg ${
                isWeekValid
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-rose-50 text-rose-800'
              }`}
              aria-hidden="true"
            >
              <CheckCircle2 className="size-[1.375rem]" />
            </span>
            <div className="min-w-0">
              <StatusBadge tone={isWeekValid ? 'success' : 'danger'}>
                {isWeekValid ? 'INFORMACIÓN CONSISTENTE' : 'REVISAR INFORMACIÓN'}
              </StatusBadge>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                Diferencia semanal
              </p>
              <p className="number-tabular mt-0.5 text-xl font-bold text-slate-950">
                {formatCentiKg(weekSummary.differenceKg100)}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {isWeekValid
                  ? 'Los totales por jornada y por producto coinciden.'
                  : 'La comparación independiente detectó diferencias pendientes.'}
              </p>
            </div>
          </div>
          <ActionLink to="/resumen" variant="ghost" size="sm" className="mt-2 -ml-3">
            Revisar resumen de la semana
            <ArrowRight className="size-4" aria-hidden="true" />
          </ActionLink>
        </SectionCard>
      </div>

      <DashboardProcessComparison
        comparison={processComparison}
        hasFreezingData={hasFreezingData}
      />

      <div className="grid items-stretch gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          title="Estado de las jornadas"
          description="Jornadas reales registradas en la semana."
          className="xl:order-2"
        >
          <DataTableScroll label={`Estado de las jornadas reales de la semana ${activeWeek.number}`}>
            <table className="erp-table w-full min-w-[48rem] table-fixed border-collapse text-center">
              <caption className="sr-only">
                Estado operativo de las jornadas registradas
              </caption>
              <colgroup>
                <col className="w-[9%]" />
                <col className="w-[12%]" />
                <col className="w-[19%]" />
                <col className="w-[20%]" />
                <col className="w-[14%]" />
                <col className="w-[17%]" />
                <col className="w-[9%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[0.625rem] font-bold uppercase tracking-[0.07em] text-slate-500">
                  <th scope="col" className="px-2 py-2 text-center align-middle">Día</th>
                  <th scope="col" className="px-2 py-2 text-center align-middle">Fecha</th>
                  <th scope="col" className="px-2 py-2 text-center align-middle">Estado</th>
                  <th scope="col" className="px-2 py-2 text-center align-middle">Producto terminado</th>
                  <th scope="col" className="px-2 py-2 text-center align-middle">Saldo</th>
                  <th scope="col" className="px-2 py-2 text-center align-middle">Aprov.</th>
                  <th scope="col" className="px-2 py-2 text-center align-middle">Acción</th>
                </tr>
              </thead>
              <tbody>
                {calculatedDays.map(({ day, calculation }) => {
                  const dayIsBalanced = calculation.status === 'BALANCED'
                  const dayHasObservations =
                    (day.closureObservations?.length ?? 0) > 0
                  const dayYieldStatus = getYieldStatus(calculation.performance.percent)
                  const dayYieldStyles = yieldVisualStyles[dayYieldStatus.colorVariant]
                  const isLatest = day.date === latestDay.date

                  return (
                    <tr
                      key={day.id}
                      className={`border-b border-slate-100 last:border-0 hover:bg-slate-50/80 dark:hover:bg-[#152b3b] ${
                        isLatest ? 'bg-brand-50/50 dark:bg-[#102437]' : 'bg-white'
                      }`}
                    >
                      <th scope="row" className="px-2 py-3 text-center align-middle text-xs font-semibold text-slate-900">
                        <span className="inline-flex w-full items-center justify-center">
                          {formatIsoWeekday(day.date)}
                        </span>
                      </th>
                      <td className="number-tabular whitespace-nowrap px-2 py-3 text-center align-middle text-xs text-slate-500">
                        <span className="inline-flex w-full items-center justify-center">
                          {formatIsoDateCompact(day.date)}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center align-middle">
                        <div className="flex w-full items-center justify-center">
                          <StatusBadge
                            tone={
                              dayHasObservations
                                ? 'warning'
                                : dayIsBalanced
                                  ? 'success'
                                  : 'danger'
                            }
                          >
                            {dayHasObservations
                              ? 'CUADRADO Â· OBS.'
                              : dayIsBalanced
                                ? 'CUADRADO'
                                : 'NO CUADRADO'}
                          </StatusBadge>
                        </div>
                      </td>
                      <td className="number-tabular whitespace-nowrap px-2 py-3 text-center align-middle text-xs font-bold text-slate-950">
                        <span className="inline-flex w-full items-center justify-center">
                          {formatCentiKg(calculation.declaredFinishedKg100)}
                        </span>
                      </td>
                      <td className="number-tabular whitespace-nowrap px-2 py-3 text-center align-middle text-xs text-slate-700">
                        <span className="inline-flex w-full items-center justify-center">
                          {formatCentiKg(calculation.newClosingBalanceKg100)}
                        </span>
                      </td>
                      <td
                        className="px-2 py-3 text-center align-middle"
                        title={`${formatRatioAsPercent(calculation.performance.ratio)} · ${dayYieldStatus.label}: ${dayYieldStatus.interpretation}`}
                        aria-label={`Aprovechamiento ${formatRatioAsPercent(calculation.performance.ratio)}. Estado ${dayYieldStatus.label}. ${dayYieldStatus.interpretation}`}
                      >
                        <div className="flex w-full flex-col items-center justify-center text-center">
                          <span className={`number-tabular block whitespace-nowrap text-xs font-bold ${dayYieldStyles.textClass}`}>
                            {formatRatioAsPercent(calculation.performance.ratio)}
                          </span>
                          <span className={`mt-0.5 block whitespace-nowrap text-[0.625rem] font-bold ${dayYieldStyles.textClass}`}>
                            {dayYieldStatus.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center align-middle">
                        <div className="flex w-full items-center justify-center">
                          <ActionLink
                            to={`/jornadas/${day.date}`}
                            variant="ghost"
                            size="sm"
                          >
                            Ver
                            <ArrowRight className="size-3.5" aria-hidden="true" />
                          </ActionLink>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </DataTableScroll>
        </SectionCard>

        <SectionCard
          title="Producción de la semana (kg)"
          description="Día, Noche, Tratamiento y Saldo por jornada registrada."
          className="xl:order-1"
          contentClassName="p-4 pb-3"
        >
          <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-[0.6875rem] text-slate-500">
            {[
              ['Día', 'bg-[var(--color-production-day)]'],
              ['Noche', 'bg-[var(--color-production-night)]'],
              ['Tratamiento', 'bg-[var(--color-production-treatment)]'],
              ['Saldo', 'bg-[var(--color-production-balance)]'],
            ].map(([label, color]) => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${color}`} aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>

          <Suspense
            fallback={
              <div
                className="grid h-[13.5rem] place-items-center text-xs text-slate-500 sm:h-[14.5rem]"
                role="status"
              >
                Preparando gráfico semanal…
              </div>
            }
          >
            <WeeklyProductionChart data={weeklyProductionData} />
          </Suspense>
          <p className="mt-2 border-t border-slate-100 pt-2.5 text-[0.6875rem] leading-5 text-slate-500">
            Se muestran solamente los {productionDays.length} cierres reales registrados.
          </p>
        </SectionCard>
      </div>

      <section
        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-panel sm:flex sm:items-center sm:gap-4"
        aria-labelledby="quick-access-title"
      >
        <div className="flex shrink-0 items-center gap-2 sm:w-40">
          <BarChart3 className="size-4 text-brand-700" aria-hidden="true" />
          <h2
            id="quick-access-title"
            className="text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-slate-500"
          >
            Accesos rápidos
          </h2>
        </div>
        <nav
          className="mt-2 grid min-w-0 flex-1 sm:mt-0 sm:grid-cols-3"
          aria-label="Accesos operativos"
        >
          {[
            {
              to: '/jornadas',
              icon: CalendarCheck2,
              title: 'Jornadas',
              description: activeWeekState.isReadOnly
                ? 'Consultar jornadas registradas'
                : 'Registrar y validar jornadas',
            },
            {
              to: '/saldos',
              icon: Waves,
              title: 'Saldos',
              description: 'Revisar saldos por producto',
            },
            {
              to: '/resumen',
              icon: CheckCircle2,
              title: 'Resumen semanal',
              description: 'Ver consolidado de la semana',
            },
          ].map((item, index) => {
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex min-h-12 min-w-0 items-center gap-2.5 px-3 py-1.5 text-slate-700 hover:bg-brand-50 hover:text-brand-800 ${
                  index > 0
                    ? 'border-t border-slate-100 sm:border-l sm:border-t-0'
                    : ''
                }`}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-brand-100 text-brand-700 ring-1 ring-brand-200/50">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold">{item.title}</span>
                  <span className="mt-0.5 block truncate text-[0.6875rem] text-slate-500">
                    {item.description}
                  </span>
                </span>
                <ArrowRight className="size-3.5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-700" aria-hidden="true" />
              </Link>
            )
          })}
        </nav>
      </section>
    </div>
  )
}

export default DashboardPage
