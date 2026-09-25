import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  Moon,
  Pencil,
  Scale,
  Snowflake,
  Sun,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ActionLink } from '../../../components/ui/ActionLink'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { buttonStyles } from '../../../components/ui/buttonStyles'
import { formatCentiKg, formatIsoDate } from '../../../utils/formatters'
import { kg100, sumKg100 } from '../model/calculations'
import { calculateFrozenPhysicalKg100 } from '../model/freezing'
import { getProductionDayOperationalState } from '../model/productionLifecycle'
import type { ProductionDay } from '../model/types'

interface FreezingDayDetailProps {
  productionDay: ProductionDay
  allProductionDays: readonly ProductionDay[]
  canEdit: boolean
  canClose: boolean
  onClose: () => void
}

export function FreezingDayDetail({
  productionDay,
  allProductionDays,
  canEdit,
  canClose,
  onClose,
}: FreezingDayDetailProps) {
  const operationalState = getProductionDayOperationalState(productionDay)
  const calculation = operationalState.calculation
  const physicalKg100 = calculateFrozenPhysicalKg100(productionDay)
  const linkedKg100 = calculation.processedPreviousBalanceKg100
  const differenceKg100 = kg100(physicalKg100 - linkedKg100)
  const isBalanced = operationalState.isBalanced && differenceKg100 === 0
  const isClosed = operationalState.lifecycle === 'CLOSED'
  const isReadyToClose = operationalState.state === 'READY_TO_CLOSE'
  const hasClosureWarnings = operationalState.validation.warnings.length > 0
  const reconciliationObserved = differenceKg100 !== 0 && hasClosureWarnings
  const freezingOriginRows = productionDay.receivedBalanceLots.map((lot) => {
    const line = productionDay.lines.find(
      (candidate) => candidate.productId === lot.productId,
    )

    const originDay = allProductionDays.find(
      (candidate) => candidate.id === lot.originDayId,
    )

    const usedKg100 = sumKg100(lot.uses.map((use) => use.kg100))
    const pendingKg100 = kg100(Math.max(lot.originalKg100 - usedKg100, 0))
    const originDate = originDay?.date

    const originKind =
      originDate && originDate < productionDay.date
        ? 'PREVIOUS'
        : originDate === productionDay.date
          ? 'CURRENT'
          : 'UNKNOWN'

    return {
      lot,
      line,
      originDay,
      usedKg100,
      pendingKg100,
      originKind,
    }
  })

  const previousOriginUsedKg100 = sumKg100(
    freezingOriginRows
      .filter((row) => row.originKind === 'PREVIOUS')
      .map((row) => row.usedKg100),
  )

  const currentOriginUsedKg100 = sumKg100(
    freezingOriginRows
      .filter((row) => row.originKind === 'CURRENT')
      .map((row) => row.usedKg100),
  )

  const unsupportedFrozenKg100 = kg100(Math.max(differenceKg100, 0))
  const excessLinkedKg100 = kg100(Math.max(-differenceKg100, 0))
  const hasTraceabilityDifference = differenceKg100 !== 0
  const traceabilityDifferenceLabel =
    excessLinkedKg100 > 0
      ? 'Vinculado en exceso'
      : unsupportedFrozenKg100 > 0
        ? 'Sin origen suficiente'
        : 'Diferencia de trazabilidad'

  const statusBadge = isClosed
    ? hasClosureWarnings
      ? { tone: 'warning' as const, label: 'CERRADA · CON OBSERVACIONES' }
      : isBalanced
        ? { tone: 'success' as const, label: 'CERRADA · SOLO LECTURA' }
        : { tone: 'danger' as const, label: 'CERRADA · REVISAR' }
    : isReadyToClose
      ? hasClosureWarnings
        ? { tone: 'warning' as const, label: 'LISTA · CON OBSERVACIONES' }
        : { tone: 'success' as const, label: 'LISTA PARA CERRAR' }
      : { tone: 'warning' as const, label: 'BORRADOR · REVISAR' }

  return (
    <div className="space-y-5">
      <Link
        to="/jornadas?process=FREEZING"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-brand-800"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Todas las jornadas
      </Link>

      <PageHeader
        eyebrow="Detalle de jornada · Congelamiento"
        title={formatIsoDate(productionDay.date)}
        description="Producto congelado por turno y vinculado a su jornada de origen en Envasado."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <StatusBadge tone={statusBadge.tone} truncateText={false}>
              {statusBadge.label}
            </StatusBadge>
            {canEdit ? (
              <>
                <ActionLink
                  to={`/jornadas/${productionDay.date}/editar?process=FREEZING`}
                  variant="secondary"
                  size="sm"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Seguir editando
                </ActionLink>
                <button
                  type="button"
                  disabled={!canClose}
                  onClick={onClose}
                  className={buttonStyles('primary', 'sm')}
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  Cerrar jornada
                </button>
              </>
            ) : null}
          </div>
        }
      />

      {hasClosureWarnings ? (
        <SectionCard
          title={
            isClosed ? 'Observaciones de cierre' : 'Observaciones detectadas'
          }
          description="No modifican el reporte físico; quedan para revisión y auditoría."
          className="border-amber-300/80 ring-1 ring-amber-200/50 dark:border-amber-500/40 dark:ring-amber-500/15"
          action={
            <StatusBadge tone="warning" truncateText={false}>
              {operationalState.validation.warnings.length}{' '}
              {operationalState.validation.warnings.length === 1
                ? 'OBSERVACIÓN'
                : 'OBSERVACIONES'}
            </StatusBadge>
          }
        >
          <ul className="divide-y divide-amber-100 dark:divide-amber-500/10">
            {operationalState.validation.warnings.map((warning) => (
              <li
                key={`${warning.code}-${
                  warning.familyKey ?? warning.productId ?? 'GENERAL'
                }`}
                className="flex items-start gap-3 bg-amber-50/50 px-4 py-3 dark:bg-amber-500/5 sm:px-5"
              >
                <span
                  className="grid size-7 shrink-0 place-items-center rounded-md bg-amber-500 text-slate-950"
                  aria-hidden="true"
                >
                  <AlertTriangle className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.6875rem] font-extrabold uppercase tracking-[0.06em] text-amber-800 dark:text-amber-300">
                    {warning.code === 'FREEZING_TRACEABILITY_DIFFERENCE'
                      ? 'Diferencia de trazabilidad'
                      : warning.code ===
                          'FREEZING_PRODUCT_TRACEABILITY_DIFFERENCE'
                        ? 'Producto con origen insuficiente'
                        : 'Observación'}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-700 dark:text-[#C3D2DC]">
                    {warning.message}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      <section
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Indicadores de Congelamiento"
      >
        <MetricCard
          label="Reporte Día"
          value={formatCentiKg(productionDay.declaredShiftTotalsKg100.DAY)}
          icon={<Sun className="size-5" />}
        />
        <MetricCard
          label="Reporte Noche"
          value={formatCentiKg(productionDay.declaredShiftTotalsKg100.NIGHT)}
          icon={<Moon className="size-5" />}
        />
        <MetricCard
          label="Congelado físicamente"
          value={formatCentiKg(physicalKg100)}
          icon={<Snowflake className="size-5" />}
          tone="brand"
        />
        <MetricCard
          label="Diferencia"
          value={formatCentiKg(differenceKg100)}
          icon={<Scale className="size-5" />}
          tone={differenceKg100 === 0 ? 'success' : 'danger'}
        />
      </section>

      <SectionCard
        title="Cuadre de reportes"
        description="Cada turno debe coincidir con su detalle y todo producto congelado debe tener disponibilidad trazable."
        action={
          <StatusBadge
            tone={
              isBalanced
                ? 'success'
                : reconciliationObserved
                  ? 'warning'
                  : 'danger'
            }
            truncateText={false}
          >
            {isBalanced
              ? 'CUADRADO'
              : reconciliationObserved
                ? 'CUADRADO · OBSERVADO'
                : 'REVISAR'}
          </StatusBadge>
        }
        contentClassName="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4"
      >
        {(
          [
            ['Detalle Día', calculation.day.reportedKg100],
            ['Detalle Noche', calculation.night.reportedKg100],
            ['Congelado atribuible', linkedKg100],
            [
              'Pendiente en orígenes vinculados',
              calculation.pendingPreviousBalanceKg100,
            ],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:bg-slate-50/5"
          >
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
              {label}
            </p>
            <p className="number-tabular mt-1 whitespace-nowrap text-base font-extrabold text-slate-950">
              {formatCentiKg(value)}
            </p>
          </div>
        ))}
      </SectionCard>

      <SectionCard
        title="Origen del congelamiento"
        description="Cómo se compone el congelamiento entre saldos anteriores y disponibilidad de Envasado de esta jornada."
        action={
          <StatusBadge
            tone={hasTraceabilityDifference ? 'warning' : 'success'}
            truncateText={false}
          >
            {hasTraceabilityDifference ? 'CON OBSERVACIÓN' : 'ORIGEN COMPLETO'}
          </StatusBadge>
        }
      >
        <div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-4 dark:bg-[#203E50]">
          <div className="bg-white px-4 py-4 text-center dark:bg-[#0D2534]">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.07em] text-slate-500 dark:text-[#7F9BAD]">
              Saldo anterior utilizado
            </p>
            <p className="number-tabular mt-2 whitespace-nowrap text-lg font-extrabold text-amber-700 dark:text-amber-300">
              {formatCentiKg(previousOriginUsedKg100)}
            </p>
            <p className="mt-1 text-[0.625rem] text-slate-400 dark:text-[#7F9BAD]">
              Proveniente de jornadas anteriores
            </p>
          </div>

          <div className="bg-white px-4 py-4 text-center dark:bg-[#0D2534]">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.07em] text-slate-500 dark:text-[#7F9BAD]">
              Envasado del día utilizado
            </p>
            <p className="number-tabular mt-2 whitespace-nowrap text-lg font-extrabold text-sky-700 dark:text-sky-300">
              {formatCentiKg(currentOriginUsedKg100)}
            </p>
            <p className="mt-1 text-[0.625rem] text-slate-400 dark:text-[#7F9BAD]">
              Disponible generado en esta jornada
            </p>
          </div>

          <div className="bg-white px-4 py-4 text-center dark:bg-[#0D2534]">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.07em] text-slate-500 dark:text-[#7F9BAD]">
              Total vinculado
            </p>
            <p className="number-tabular mt-2 whitespace-nowrap text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
              {formatCentiKg(linkedKg100)}
            </p>
            <p className="mt-1 text-[0.625rem] text-slate-400 dark:text-[#7F9BAD]">
              Congelado con origen identificado
            </p>
          </div>

          <div className="bg-white px-4 py-4 text-center dark:bg-[#0D2534]">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.07em] text-slate-500 dark:text-[#7F9BAD]">
              {traceabilityDifferenceLabel}
            </p>
            <p
              className={`number-tabular mt-2 whitespace-nowrap text-lg font-extrabold ${
                differenceKg100 === 0
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-amber-700 dark:text-amber-300'
              }`}
            >
              {formatCentiKg(
                excessLinkedKg100 > 0
                  ? excessLinkedKg100
                  : unsupportedFrozenKg100,
              )}
            </p>
            <p className="mt-1 text-[0.625rem] text-slate-400 dark:text-[#7F9BAD]">
              Diferencia de trazabilidad
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 px-4 py-4 dark:border-[#203E50] sm:px-5">
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 dark:border-sky-500/20 dark:bg-sky-500/[0.06]">
            <p className="text-xs font-bold text-sky-900 dark:text-sky-200">
              Cómo se compone el congelamiento de esta jornada
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-[#C3D2DC]">
              Se utilizaron{' '}
              <strong>{formatCentiKg(previousOriginUsedKg100)}</strong>{' '}
              de saldos anteriores y{' '}
              <strong>{formatCentiKg(currentOriginUsedKg100)}</strong> del
              Envasado de esta jornada. Total vinculado:{' '}
              <strong>{formatCentiKg(linkedKg100)}</strong>.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Productos congelados"
        description="Detalle físico por producto y turno."
      >
        <DataTableScroll label="Productos congelados de la jornada">
          <table className="erp-table w-full min-w-[54rem] table-fixed border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-slate-500">
                <th className="w-[46%] px-4 py-2.5 text-left">
                  Familia / producto
                </th>
                <th className="px-3 py-2.5 text-center">Día</th>
                <th className="px-3 py-2.5 text-center">Noche</th>
                <th className="px-3 py-2.5 text-center">Congelado</th>
                <th className="px-3 py-2.5 text-center">Vinculado</th>
              </tr>
            </thead>
            <tbody>
              {productionDay.lines.map((line) => {
                const linkedForProduct = sumKg100(
                  productionDay.receivedBalanceLots
                    .filter((lot) => lot.productId === line.productId)
                    .flatMap((lot) => lot.uses.map((use) => use.kg100)),
                )
                const frozenKg100 = sumKg100([
                  line.shifts.DAY.reportedKg100,
                  line.shifts.NIGHT.reportedKg100,
                ])
                return (
                  <tr
                    key={line.productId}
                    className="border-b border-slate-100"
                  >
                    <th className="px-4 py-3 text-left">
                      <span className="block text-[0.625rem] font-bold uppercase tracking-wide text-sky-700">
                        {line.familyName}
                      </span>
                      <span className="mt-0.5 block text-xs font-semibold text-slate-800">
                        {line.productName}
                      </span>
                    </th>
                    <td className="number-tabular px-3 py-3 text-center text-xs">
                      {formatCentiKg(line.shifts.DAY.reportedKg100)}
                    </td>
                    <td className="number-tabular px-3 py-3 text-center text-xs">
                      {formatCentiKg(line.shifts.NIGHT.reportedKg100)}
                    </td>
                    <td className="number-tabular px-3 py-3 text-center text-xs font-bold">
                      {formatCentiKg(frozenKg100)}
                    </td>
                    <td
                      className={`number-tabular px-3 py-3 text-center text-xs font-bold ${
                        linkedForProduct === frozenKg100
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {formatCentiKg(linkedForProduct)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </DataTableScroll>
      </SectionCard>

      <SectionCard
        title="Detalle FIFO por origen"
        description="Trazabilidad de la disponibilidad de Envasado utilizada por producto y jornada origen."
      >
        <DataTableScroll label="Origen del producto congelado">
          <table className="erp-table w-full min-w-[72rem] table-fixed border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-slate-500 dark:border-[#203E50] dark:bg-[#102B3B] dark:text-[#A5BED0]">
                <th className="w-[32%] px-4 py-2.5 text-left">Producto</th>
                <th className="px-3 py-2.5 text-center">Origen Envasado</th>
                <th className="px-3 py-2.5 text-center">Tipo de origen</th>
                <th className="px-3 py-2.5 text-center">Disponible al iniciar</th>
                <th className="px-3 py-2.5 text-center">Congelado en jornada</th>
                <th className="px-3 py-2.5 text-center">Saldo posterior</th>
              </tr>
            </thead>
            <tbody>
              {freezingOriginRows.map((row) => (
                <tr
                  key={row.lot.id}
                  className="border-b border-slate-100 dark:border-[#203E50]"
                >
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-800 dark:text-[#F3F8FB]">
                    {row.line?.productName ?? row.lot.productId}
                  </th>
                  <td className="px-3 py-3 text-center text-xs text-slate-600 dark:text-[#A5BED0]">
                    {row.originDay
                      ? formatIsoDate(row.originDay.date)
                      : row.lot.originDayId}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <StatusBadge
                      tone={
                        row.originKind === 'PREVIOUS'
                          ? 'warning'
                          : row.originKind === 'CURRENT'
                            ? 'info'
                            : 'neutral'
                      }
                      showIcon={false}
                      truncateText={false}
                    >
                      {row.originKind === 'PREVIOUS'
                        ? 'SALDO ANTERIOR'
                        : row.originKind === 'CURRENT'
                          ? 'ENVASADO DEL DÍA'
                          : 'ORIGEN HISTÓRICO'}
                    </StatusBadge>
                  </td>
                  <td className="number-tabular px-3 py-3 text-center text-xs font-semibold text-slate-700 dark:text-[#C3D2DC]">
                    {formatCentiKg(row.lot.originalKg100)}
                  </td>
                  <td className="number-tabular px-3 py-3 text-center text-xs font-bold text-sky-700 dark:text-sky-300">
                    {formatCentiKg(row.usedKg100)}
                  </td>
                  <td
                    className={`number-tabular px-3 py-3 text-center text-xs font-bold ${
                      row.pendingKg100 === 0
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {formatCentiKg(row.pendingKg100)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableScroll>
        {productionDay.receivedBalanceLots.length === 0 ? (
          <div className="flex items-center gap-3 p-5 text-sm text-slate-500">
            <Boxes className="size-5 text-slate-400" aria-hidden="true" />
            No existe disponibilidad de Envasado vinculada a esta jornada.
          </div>
        ) : null}
      </SectionCard>
    </div>
  )
}