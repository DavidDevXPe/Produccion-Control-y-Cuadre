import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  CalendarDays,
  CheckCircle2,
  Download,
  LoaderCircle,
  Moon,
  PackageCheck,
  Pencil,
  Scale,
  Sun,
  Waves,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ActionLink } from '../../../components/ui/ActionLink'
import { buttonStyles } from '../../../components/ui/buttonStyles'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { formatCentiKg, formatIsoDate } from '../../../utils/formatters'
import { BalancePanel } from '../components/BalancePanel'
import { CloseDayDialog } from '../components/CloseDayDialog'
import { FreezingDayDetail } from '../components/FreezingDayDetail'
import { PerformancePanel } from '../components/PerformancePanel'
import { ProductionBreakdown } from '../components/ProductionBreakdown'
import { ReceivedBalancePanel } from '../components/ReceivedBalancePanel'
import { ReconciliationPanel } from '../components/ReconciliationPanel'
import {
  calculateOutstandingBalances,
  sumKg100,
} from '../model/calculations'
import { buildClosureObservations } from '../model/closureObservations'
import { isBalanceOnlyProductionDay } from '../model/productionDayMode'
import { getProductionDayOperationalState } from '../model/productionLifecycle'
import {
  getProductionProcess,
  isFreezingProductionDay,
  isProductionProcess,
} from '../model/productionProcess'
import { getJourneyStatus } from '../presentation/journeyStatus'
import { useProductionData } from '../state/ProductionDataContext'

export function ProductionDayPage() {
  const { date } = useParams()
  const [searchParams] = useSearchParams()
  const [exportState, setExportState] = useState<
    'IDLE' | 'EXPORTING' | 'SUCCESS' | 'ERROR'
  >('IDLE')
  const [isCloseConfirmationOpen, setIsCloseConfirmationOpen] = useState(false)
  const [closeError, setCloseError] = useState('')
  const {
    allProductionDays,
    subsequentBalanceLots,
    findProductionDay,
    isUserManagedDay,
    upsertProductionDay,
  } = useProductionData()
  const processParam = searchParams.get('process')
  const requestedProcess = isProductionProcess(processParam)
    ? processParam
    : undefined
  const productionDay = date
    ? findProductionDay(date, requestedProcess)
    : undefined
  usePageTitle(
    productionDay
      ? `Detalle del ${productionDay.displayName}`
      : 'Jornada no encontrada',
  )

  if (!productionDay) {
    return (
      <div className="mx-auto max-w-lg">
        <SectionCard contentClassName="p-0">
          <div className="flex flex-col items-center gap-4 px-6 py-10 text-center sm:px-8">
            <span
              className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-500"
              aria-hidden="true"
            >
              <CalendarDays className="size-6" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-slate-950">
                Jornada no encontrada
              </h1>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">
                No hay información registrada para la fecha solicitada. Vuelve al
                listado o crea una jornada nueva.
              </p>
            </div>
            <ActionLink to="/jornadas">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Volver a jornadas
            </ActionLink>
          </div>
        </SectionCard>
      </div>
    )
  }

  const operationalState = getProductionDayOperationalState(productionDay)
  const calculation = operationalState.calculation
  const process = getProductionProcess(productionDay)
  const isFreezing = isFreezingProductionDay(productionDay)
  const weeklyBalancePositions = calculateOutstandingBalances(
    allProductionDays,
    subsequentBalanceLots,
  )
  const balancePositions = weeklyBalancePositions.filter(
    (position) => position.originDayId === productionDay.id,
  )
  const journey = getJourneyStatus(productionDay, operationalState)
  const isBalanced = operationalState.isBalanced
  const isClosed = operationalState.lifecycle === 'CLOSED'
  const isReadyToClose = operationalState.state === 'READY_TO_CLOSE'
  const hasClosureWarnings = operationalState.validation.warnings.length > 0
  const historicalClosureObservations =
    productionDay.closureObservations ?? []
  const visibleClosureObservations =
    historicalClosureObservations.length > 0
      ? historicalClosureObservations
      : operationalState.validation.warnings
  const hasVisibleClosureObservations = visibleClosureObservations.length > 0
  const isBalanceOnly = isBalanceOnlyProductionDay(productionDay)
  const canExport =
    productionDay.status === 'CLOSED' &&
    isBalanced &&
    calculation.integrityIssues.length === 0
  const sourceSheet =
    productionDay.lines.at(0)?.source.sheet ?? 'la hoja operativa'

  const statusBadge = isClosed
    ? hasVisibleClosureObservations
      ? { tone: 'warning' as const, label: 'CERRADA · CON OBSERVACIONES' }
      : isBalanced
        ? { tone: 'success' as const, label: 'CERRADA · SOLO LECTURA' }
        : { tone: 'danger' as const, label: 'CERRADA · REVISAR' }
    : isReadyToClose
      ? hasClosureWarnings
        ? { tone: 'warning' as const, label: 'LISTA · CON OBSERVACIONES' }
        : { tone: 'success' as const, label: 'LISTA PARA CERRAR' }
      : { tone: journey.tone, label: journey.label }

  const handleCloseDay = () => {
    if (!isReadyToClose || isClosed) return
    setCloseError('')
    setIsCloseConfirmationOpen(true)
  }

  const cancelClose = () => {
    setIsCloseConfirmationOpen(false)
    setCloseError('')
  }

  const confirmCloseDay = () => {
    if (!isReadyToClose || isClosed) return

    try {
      upsertProductionDay(
        {
          ...productionDay,
          status: 'CLOSED',
          closureObservations: buildClosureObservations(
            operationalState.validation.warnings,
            new Date().toISOString(),
          ),
        },
        {
          allowReplace: true,
        },
      )

      setIsCloseConfirmationOpen(false)
      setCloseError('')
    } catch (error) {
      setCloseError(
        error instanceof Error
          ? error.message
          : 'No se pudo cerrar la jornada.',
      )
    }
  }

  if (isFreezing) {
    const totalFrozenKg100 = sumKg100([
      calculation.day.declaredReportedKg100,
      calculation.night.declaredReportedKg100,
    ])

    return (
      <>
        <FreezingDayDetail
          productionDay={productionDay}
          allProductionDays={allProductionDays}
          canEdit={
            isUserManagedDay(productionDay.date, process) && !isClosed
          }
          canClose={isReadyToClose && !isClosed}
          onClose={handleCloseDay}
        />

        {isCloseConfirmationOpen ? (
          <CloseDayDialog
            titleId="freezing-close-title"
            title="Cerrar jornada de Congelamiento"
            description="Después del cierre, esta jornada quedará en solo lectura."
            summary={[
              { label: 'Fecha', value: formatIsoDate(productionDay.date) },
              {
                label: 'Congelado Día',
                value: formatCentiKg(calculation.day.declaredReportedKg100),
              },
              {
                label: 'Congelado Noche',
                value: formatCentiKg(calculation.night.declaredReportedKg100),
              },
              {
                label: 'Total congelado',
                value: formatCentiKg(totalFrozenKg100),
              },
              {
                label: 'Con origen identificado',
                value: formatCentiKg(calculation.processedPreviousBalanceKg100),
              },
              {
                label: 'Sin origen suficiente',
                value: formatCentiKg(calculation.reportOwnProductionKg100),
              },
            ]}
            warnings={operationalState.validation.warnings}
            warningTitle={(warning) =>
              warning.code === 'FREEZING_TRACEABILITY_DIFFERENCE'
                ? 'Diferencia de trazabilidad'
                : warning.code === 'FREEZING_PRODUCT_TRACEABILITY_DIFFERENCE'
                  ? 'Producto con origen insuficiente'
                  : 'Advertencia'
            }
            error={closeError}
            onCancel={cancelClose}
            onConfirm={confirmCloseDay}
          />
        ) : null}
      </>
    )
  }

  const handleExport = async () => {
    if (!canExport || exportState === 'EXPORTING') return

    setExportState('EXPORTING')

    try {
      const { exportProductionDayWorkbook } = await import(
        '../export/productionDayWorkbook'
      )
      await exportProductionDayWorkbook(productionDay, calculation, {
        productionDays: allProductionDays,
      })
      setExportState('SUCCESS')
    } catch {
      setExportState('ERROR')
    }
  }

  return (
    <div className="space-y-5">
      <Link
        to="/jornadas?process=PACKING"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-brand-800"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Todas las jornadas
      </Link>

      <PageHeader
        eyebrow="Detalle de jornada · Envasado"
        title={formatIsoDate(productionDay.date)}
        description={
          isBalanceOnly
            ? 'Domingo de procesamiento físico vinculado íntegramente a saldos de jornadas anteriores.'
            : `Datos reconstruidos desde ${sourceSheet} y validados producto por producto.`
        }
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <StatusBadge tone={statusBadge.tone} truncateText={false}>
              {statusBadge.label}
            </StatusBadge>
            {isBalanceOnly ? (
              <StatusBadge tone="info" truncateText={false}>
                JORNADA DE SALDOS
              </StatusBadge>
            ) : null}
            {isUserManagedDay(productionDay.date, process) && !isClosed ? (
              <>
                <ActionLink
                  to={`/jornadas/${productionDay.date}/editar?process=${process}`}
                  variant="secondary"
                  size="sm"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Seguir editando
                </ActionLink>
                <button
                  type="button"
                  disabled={!isReadyToClose}
                  onClick={handleCloseDay}
                  className={buttonStyles('primary', 'sm')}
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  Cerrar jornada
                </button>
              </>
            ) : null}
            <button
              type="button"
              className={buttonStyles('secondary', 'sm')}
              disabled={!canExport || exportState === 'EXPORTING'}
              onClick={handleExport}
              title={
                canExport
                  ? 'Descargar jornada cerrada en formato Excel'
                  : 'Disponible únicamente para jornadas cerradas y cuadradas'
              }
            >
              {exportState === 'EXPORTING' ? (
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Download className="size-4" aria-hidden="true" />
              )}
              {exportState === 'EXPORTING' ? 'Generando…' : 'Exportar Excel'}
            </button>
          </div>
        }
      />

      {hasVisibleClosureObservations ? (
        <SectionCard
          title={
            isClosed ? 'Observaciones de cierre' : 'Observaciones detectadas'
          }
          description="Quedan asociadas a la jornada para revisión y auditoría."
          className="border-amber-300/80 ring-1 ring-amber-200/50 dark:border-amber-500/40 dark:ring-amber-500/15"
          action={
            <StatusBadge tone="warning" truncateText={false}>
              {visibleClosureObservations.length}{' '}
              {visibleClosureObservations.length === 1
                ? 'OBSERVACIÓN'
                : 'OBSERVACIONES'}
            </StatusBadge>
          }
        >
          <ul className="divide-y divide-amber-100 dark:divide-amber-500/10">
            {visibleClosureObservations.map((observation) => (
              <li
                key={`${observation.code}-${
                  observation.familyKey ?? observation.productId ?? 'GENERAL'
                }`}
                className="flex items-start gap-3 bg-amber-50/50 px-4 py-3 dark:bg-amber-500/5 sm:px-5"
              >
                <span
                  className="grid size-7 shrink-0 place-items-center rounded-md bg-amber-500 text-slate-950"
                  aria-hidden="true"
                >
                  <AlertTriangle className="size-3.5" />
                </span>
                <p className="text-xs leading-5 text-slate-700 dark:text-ui-text-dark-pale">
                  {observation.message}
                </p>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      <p className="sr-only" role="status" aria-live="polite">
        {exportState === 'SUCCESS'
          ? 'El archivo Excel de la jornada se descargó correctamente.'
          : exportState === 'ERROR'
            ? 'No se pudo generar el archivo Excel. Inténtalo nuevamente.'
            : ''}
      </p>
      {exportState === 'ERROR' ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
        >
          No se pudo generar el archivo Excel. Inténtalo nuevamente.
        </div>
      ) : null}

      <nav
        aria-label="Secciones de la jornada"
        className="flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50/80 p-1 dark:bg-slate-50/5"
      >
        {(
          [
            ['#cuadre', 'Cuadre'],
            ['#produccion', 'Producción'],
            ['#saldos', 'Saldos'],
          ] as const
        ).map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="shrink-0 rounded-md px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-white hover:text-brand-800 dark:hover:bg-slate-800"
          >
            {label}
          </a>
        ))}
      </nav>

      <section
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"
        aria-label="Indicadores de la jornada"
      >
        <MetricCard
          label="Materia prima"
          value={formatCentiKg(productionDay.declaredRawMaterialKg100)}
          icon={<Waves className="size-5" />}
          className="xl:col-span-2"
        />
        <MetricCard
          label={isBalanceOnly ? 'Procesado físicamente' : 'Producto terminado'}
          value={
            isBalanceOnly
              ? formatCentiKg(
                  calculation.day.declaredReportedKg100 +
                    calculation.night.declaredReportedKg100,
                )
              : formatCentiKg(calculation.declaredFinishedKg100)
          }
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
            washAuthorization={productionDay.nucaWashAuthorization}
          />
        )}
      </section>

      <section
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Producción por turno"
      >
        <MetricCard
          label="Producción Día"
          value={formatCentiKg(calculation.productiveDayKg100)}
          icon={<Sun className="size-5" />}
        />
        <MetricCard
          label="Producción Noche"
          value={formatCentiKg(calculation.productiveNightKg100)}
          icon={<Moon className="size-5" />}
        />
        <MetricCard
          label="Saldo anterior procesado"
          value={formatCentiKg(calculation.processedPreviousBalanceKg100)}
          icon={<Boxes className="size-5" />}
        />
        <MetricCard
          label="Tratamiento"
          value={formatCentiKg(calculation.treatmentKg100)}
          icon={<Waves className="size-5" />}
        />
      </section>

      <div id="produccion" className="scroll-mt-28">
        <ProductionBreakdown products={calculation.products} />
      </div>

      <div id="saldos" className="scroll-mt-28 space-y-5">
        <ReceivedBalancePanel
          productionDay={productionDay}
          calculation={calculation}
        />
        {!isBalanceOnly ? (
          <BalancePanel
            products={calculation.products}
            originDate={productionDay.date}
            positions={balancePositions}
          />
        ) : null}
      </div>

      {isCloseConfirmationOpen ? (
        <CloseDayDialog
          titleId="day-close-title"
          title="Cerrar jornada"
          description="Después del cierre, esta jornada quedará en solo lectura."
          summary={[
            { label: 'Fecha', value: formatIsoDate(productionDay.date) },
            {
              label: 'Materia prima',
              value: formatCentiKg(productionDay.declaredRawMaterialKg100),
            },
            {
              label: 'Producto terminado',
              value: formatCentiKg(calculation.declaredFinishedKg100),
            },
            {
              label: 'Saldo final',
              value: formatCentiKg(calculation.newClosingBalanceKg100),
            },
            {
              label: 'Diferencia',
              value: formatCentiKg(calculation.differenceKg100),
            },
            {
              label: 'Estado',
              value: isReadyToClose
                ? hasClosureWarnings
                  ? 'Lista para cerrar con observación'
                  : 'Lista para cerrar'
                : 'Requiere revisión',
            },
          ]}
          warnings={operationalState.validation.warnings}
          error={closeError}
          onCancel={cancelClose}
          onConfirm={confirmCloseDay}
        />
      ) : null}
    </div>
  )
}

export default ProductionDayPage