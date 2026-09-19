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
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { formatCentiKg, formatIsoDate } from '../../../utils/formatters'
import { BalancePanel } from '../components/BalancePanel'
import { FreezingDayDetail } from '../components/FreezingDayDetail'
import { PerformancePanel } from '../components/PerformancePanel'
import { ProductionBreakdown } from '../components/ProductionBreakdown'
import { ReceivedBalancePanel } from '../components/ReceivedBalancePanel'
import { ReconciliationPanel } from '../components/ReconciliationPanel'
import {
  calculateOutstandingBalances,
  sumKg100,
} from '../model/calculations'
import type { ClosureMessage } from '../model/businessRules'
import { isBalanceOnlyProductionDay } from '../model/productionDayMode'
import { getProductionDayOperationalState } from '../model/productionLifecycle'
import { createPortal } from 'react-dom'
import {
  getProductionProcess,
  isFreezingProductionDay,
  isProductionProcess,
} from '../model/productionProcess'
import type { ClosureObservationRecord } from '../model/types'
import { useProductionData } from '../state/ProductionDataContext'

function buildClosureObservations(
  warnings: readonly ClosureMessage[],
  closedAt: string,
): readonly ClosureObservationRecord[] {
  return warnings.map((warning) => ({
    closedAt,
    code: warning.code,
    message: warning.message,
    userId: 'local-user',
    ...(warning.familyKey !== undefined ? { familyKey: warning.familyKey } : {}),
    ...(warning.productId !== undefined ? { productId: warning.productId } : {}),
  }) satisfies ClosureObservationRecord)
}

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
  const productionDay = date ? findProductionDay(date, requestedProcess) : undefined
  usePageTitle(
    productionDay ? `Detalle del ${productionDay.displayName}` : 'Jornada no encontrada',
  )

  if (!productionDay) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <CalendarDays className="mx-auto size-10 text-slate-300" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">Jornada no encontrada</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Todavía no existe información registrada para la fecha solicitada.
        </p>
        <ActionLink to="/jornadas" className="mt-6">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver a jornadas
        </ActionLink>
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
  const sourceSheet = productionDay.lines.at(0)?.source.sheet ?? 'la hoja operativa'

  const handleCloseDay = () => {
  if (!isReadyToClose || isClosed) return

  setCloseError('')
  setIsCloseConfirmationOpen(true)
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
          isUserManagedDay(
            productionDay.date,
            process,
          ) && !isClosed
        }
        canClose={isReadyToClose && !isClosed}
        onClose={handleCloseDay}
      />

      {isCloseConfirmationOpen
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-[1px] dark:bg-[#020914]/90">
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="freezing-close-title"
                className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#203E50] dark:bg-[#0D2534]"
              >
                {/* Encabezado */}
                <div className="border-b border-slate-200 px-5 py-4 sm:px-6 dark:border-[#203E50]">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-[#FFD166]">
                      <AlertTriangle
                        className="size-4"
                        aria-hidden="true"
                      />
                    </span>

                    <div className="min-w-0">
                      <h2
                        id="freezing-close-title"
                        className="text-base font-bold text-slate-950 dark:text-[#F3F8FB]"
                      >
                        Cerrar jornada de Congelamiento
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-[#A5BED0]">
                        Después del cierre, esta jornada
                        quedará en solo lectura.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Resumen */}
                <div className="px-5 py-4 sm:px-6">
                  <dl className="grid gap-x-6 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3 dark:border-[#203E50] dark:bg-[#07141F]/70">
                    {[
                      [
                        'Fecha',
                        formatIsoDate(
                          productionDay.date,
                        ),
                      ],
                      [
                        'Congelado Día',
                        formatCentiKg(
                          calculation.day
                            .declaredReportedKg100,
                        ),
                      ],
                      [
                        'Congelado Noche',
                        formatCentiKg(
                          calculation.night
                            .declaredReportedKg100,
                        ),
                      ],
                      [
                        'Total congelado',
                        formatCentiKg(
                          totalFrozenKg100,
                        ),
                      ],
                      [
                        'Con origen identificado',
                        formatCentiKg(
                          calculation
                            .processedPreviousBalanceKg100,
                        ),
                      ],
                      [
                        'Sin origen suficiente',
                        formatCentiKg(
                          calculation
                            .reportOwnProductionKg100,
                        ),
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="min-w-0"
                      >
                        <dt className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-[#7F9BAD]">
                          {label}
                        </dt>

                        <dd className="number-tabular mt-1 text-sm font-bold text-slate-950 dark:text-[#F3F8FB]">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {/* Advertencias */}
                  {operationalState.validation.warnings
                    .length > 0 ? (
                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-slate-600 dark:text-[#A5BED0]">
                          Advertencias antes del cierre
                        </p>

                        <span className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[0.625rem] font-extrabold text-amber-800 dark:border-[#8A6A1F] dark:bg-[#2A2414] dark:text-[#FFD166]">
                          {
                            operationalState.validation
                              .warnings.length
                          }{' '}
                          {operationalState.validation
                            .warnings.length === 1
                            ? 'advertencia'
                            : 'advertencias'}
                        </span>
                      </div>

                      <div className="overflow-hidden rounded-xl border border-amber-300 bg-amber-50 dark:border-[#72581D] dark:bg-[#211D12]">
                        {operationalState.validation.warnings.map(
                          (warning, index) => (
                            <div
                              key={`${warning.code}-${
                                warning.familyKey ??
                                warning.productId ??
                                'GENERAL'
                              }`}
                              className={`flex items-start gap-3 px-4 py-3 ${
                                index > 0
                                  ? 'border-t border-amber-200 dark:border-amber-500/10'
                                  : ''
                              }`}
                            >
                              <AlertTriangle
                                className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-[#FFD166]"
                                aria-hidden="true"
                              />

                              <div className="min-w-0">
                                <p className="text-xs font-extrabold text-amber-900 dark:text-[#FFD166]">
                                  {warning.code ===
                                  'FREEZING_TRACEABILITY_DIFFERENCE'
                                    ? 'Diferencia de trazabilidad'
                                    : warning.code ===
                                        'FREEZING_PRODUCT_TRACEABILITY_DIFFERENCE'
                                      ? 'Producto con origen insuficiente'
                                      : 'Advertencia'}
                                </p>

                                <p className="mt-1 text-xs leading-5 text-slate-700 dark:text-[#E3EDF3]">
                                  {warning.message}
                                </p>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ) : null}

                  {closeError ? (
                    <div
                      role="alert"
                      className="mt-4 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                    >
                      {closeError}
                    </div>
                  ) : null}
                </div>

                {/* Botones */}
                <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6 dark:border-[#203E50] dark:bg-[#0A1A27]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCloseConfirmationOpen(
                        false,
                      )
                      setCloseError('')
                    }}
                    className="
                      inline-flex min-h-10 items-center justify-center
                      rounded-lg border border-slate-300
                      bg-white px-4
                      text-sm font-bold text-slate-700
                      transition
                      hover:bg-slate-100 hover:text-slate-950

                      dark:border-[#2B5268]
                      dark:bg-transparent
                      dark:text-[#C3D2DC]
                      dark:hover:bg-[#123247]
                      dark:hover:text-white
                    "
                  >
                    Volver a revisar
                  </button>

                  <button
                    type="button"
                    onClick={confirmCloseDay}
                    className="
                      inline-flex min-h-10 items-center justify-center
                      rounded-lg border border-emerald-700
                      bg-emerald-700 px-5
                      text-sm font-extrabold text-white
                      shadow-sm transition

                      hover:border-emerald-800
                      hover:bg-emerald-800

                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-emerald-500
                      focus-visible:ring-offset-2

                      dark:border-emerald-500
                      dark:bg-emerald-600
                      dark:hover:bg-emerald-500
                    "
                  >
                    {operationalState.validation
                      .warnings.length > 0
                      ? 'Cerrar con observación'
                      : 'Cerrar jornada'}
                  </button>
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
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
      await exportProductionDayWorkbook(productionDay, calculation)
      setExportState('SUCCESS')
    } catch {
      setExportState('ERROR')
    }
  }

  return (
    <div className="space-y-5">
      <Link
        to="/jornadas"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-800"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Todas las jornadas
      </Link>

      <PageHeader
        eyebrow="Detalle de jornada"
        title={formatIsoDate(productionDay.date)}
        description={
          isBalanceOnly
            ? 'Domingo de procesamiento físico vinculado íntegramente a saldos de jornadas anteriores.'
            : `Datos reconstruidos exclusivamente desde la hoja ${sourceSheet} y validados producto por producto.`
        }
        actions={
          <>
            <StatusBadge
              tone={
              isClosed
                ? hasVisibleClosureObservations
                  ? 'warning'
                  : isBalanced
                    ? 'success'
                    : 'danger'
                : isReadyToClose
                  ? hasClosureWarnings
                    ? 'warning'
                    : 'success'
                  : 'warning'
            }
            >
              {isClosed
                ? hasVisibleClosureObservations
                  ? 'CERRADA · CON OBSERVACIONES'
                  : isBalanced
                    ? 'CERRADA · SOLO LECTURA'
                    : 'CERRADA · REVISAR'
                : isReadyToClose
                  ? hasClosureWarnings
                    ? 'LISTA · CON OBSERVACIONES'
                    : 'LISTA PARA CERRAR'
                  : 'BORRADOR · REVISAR'}
            </StatusBadge>
            {isBalanceOnly ? (
              <StatusBadge tone="info">JORNADA DE SALDOS</StatusBadge>
            ) : null}
            {isUserManagedDay(productionDay.date, process) && !isClosed ? (
              <>
                <Link
                  to={`/jornadas/${productionDay.date}/editar?process=${process}`}
                  className="
                    inline-flex min-h-10 shrink-0 items-center justify-center gap-2
                    rounded-[0.625rem] border border-slate-300 bg-white px-4 py-2
                    text-sm font-bold text-slate-700 shadow-sm transition-colors
                    hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800

                    dark:border-[#2B5268] dark:bg-[#0D2534]
                    dark:text-[#58C8EA] dark:shadow-none
                    dark:hover:border-[#3D6A80]
                    dark:hover:bg-[#123247]
                    dark:hover:text-[#F3F8FB]
                  "
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Seguir editando
                </Link>

                <button
                  type="button"
                  disabled={!isReadyToClose}
                  onClick={handleCloseDay}
                  className="
                    inline-flex min-h-10 shrink-0 items-center justify-center gap-2
                    rounded-[0.625rem] border border-brand-700
                    bg-brand-700 px-4 py-2
                    text-sm font-bold text-white transition-colors
                    hover:bg-brand-800

                    disabled:cursor-not-allowed
                    disabled:border-slate-200
                    disabled:bg-slate-100
                    disabled:text-slate-400

                    dark:border-[#169FD0]
                    dark:bg-[#169FD0]
                    dark:text-white
                    dark:hover:bg-[#138BB6]

                    dark:disabled:border-[#203E50]
                    dark:disabled:bg-[#102331]
                    dark:disabled:text-[#60798A]
                  "
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  Cerrar jornada
                </button>
              </>
            ) : null}
            <button
              type="button"
              className="
                inline-flex min-h-10 shrink-0 items-center justify-center gap-2
                rounded-[0.625rem] border border-slate-300
                bg-white px-4 py-2
                text-sm font-bold text-slate-700
                transition-colors
                hover:border-brand-300
                hover:bg-brand-50
                hover:text-brand-800              

                disabled:cursor-not-allowed
                disabled:border-slate-200
                disabled:bg-slate-100
                disabled:text-slate-400             

                dark:border-[#2B5268]
                dark:bg-[#0D2534]
                dark:text-[#A5BED0]
                dark:hover:border-[#3D6A80]
                dark:hover:bg-[#123247]
                dark:hover:text-[#F3F8FB]             

                dark:disabled:border-[#203E50]
                dark:disabled:bg-[#102331]
                dark:disabled:text-[#60798A]
              "
              disabled={!canExport || exportState === 'EXPORTING'}
              onClick={handleExport}
              title={
                canExport
                  ? 'Descargar jornada cerrada en formato Excel'
                  : 'Disponible únicamente para jornadas cerradas y cuadradas'
              }
            >
              {exportState === 'EXPORTING' ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="size-4" aria-hidden="true" />
              )}
              {exportState === 'EXPORTING' ? 'Generando…' : 'Exportar Excel'}
            </button>
          </>
        }
      />

{hasVisibleClosureObservations ? (
  <SectionCard
    title={
      isClosed
        ? 'Observaciones de cierre'
        : 'Observaciones detectadas'
    }
    description="Estas advertencias quedan asociadas a la jornada para revisión y auditoría."
    action={
      <StatusBadge tone="warning">
        CON OBSERVACIÓN
      </StatusBadge>
    }
  >
    <div className="divide-y divide-amber-100 dark:divide-amber-500/10">
      {visibleClosureObservations.map(
        (observation) => (
          <div
            key={`${observation.code}-${
              observation.familyKey ??
              observation.productId ??
              'GENERAL'
            }`}
            className="flex items-start gap-3 px-4 py-3 sm:px-5"
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />

            <p className="text-xs leading-5 text-slate-700 dark:text-[#C3D2DC]">
              {observation.message}
            </p>
          </div>
        ),
      )}
    </div>
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
        className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-2"
      >
        <a href="#cuadre" className="shrink-0 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 hover:bg-white hover:text-brand-800">Cuadre</a>
        <a href="#produccion" className="shrink-0 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 hover:bg-white hover:text-brand-800">Producción</a>
        <a href="#saldos" className="shrink-0 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 hover:bg-white hover:text-brand-800">Saldos</a>
      </nav>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6" aria-label="Indicadores de la jornada">
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

      <section id="cuadre" className="grid scroll-mt-28 gap-5 xl:grid-cols-[1.35fr_0.85fr]">
        <ReconciliationPanel calculation={calculation} />
        {isBalanceOnly ? (
          <SectionCard
            title="Aprovechamiento"
            description="La referencia del 80% no aplica porque no existe nueva materia prima."
            contentClassName="flex min-h-36 flex-col items-center justify-center p-5 text-center"
          >
            <p className="text-xl font-extrabold text-slate-950">NO APLICA</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Jornada de saldos</p>
          </SectionCard>
        ) : (
          <PerformancePanel
            calculation={calculation}
            washAuthorization={productionDay.nucaWashAuthorization}
          />
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Producción por turno">
        <MetricCard label="Producción Día" value={formatCentiKg(calculation.productiveDayKg100)} icon={<Sun className="size-5" />} />
        <MetricCard label="Producción Noche" value={formatCentiKg(calculation.productiveNightKg100)} icon={<Moon className="size-5" />} />
        <MetricCard label="Saldo anterior procesado" value={formatCentiKg(calculation.processedPreviousBalanceKg100)} icon={<Boxes className="size-5" />} />
        <MetricCard label="Tratamiento" value={formatCentiKg(calculation.treatmentKg100)} icon={<Waves className="size-5" />} />
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
      {isCloseConfirmationOpen
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto bg-[#020914]/90 p-4">
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="day-close-title"
                className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-[#203E50] bg-[#0D2534] shadow-2xl"
              >
                <div className="border-b border-[#203E50] px-5 py-4 sm:px-6">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-400">
                      <AlertTriangle className="size-4" aria-hidden="true" />
                    </span>

                    <div>
                      <h2
                        id="day-close-title"
                        className="text-base font-bold text-[#F3F8FB]"
                      >
                        Cerrar jornada
                      </h2>

                      <p className="mt-1 text-xs leading-5 text-[#A5BED0]">
                        Después del cierre, esta jornada quedará en solo lectura.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 sm:px-6">
                  <dl className="grid gap-x-6 gap-y-3 rounded-xl border border-[#203E50] bg-[#07141F]/70 p-4 sm:grid-cols-3">
                    {[
                      ['Fecha', formatIsoDate(productionDay.date)],
                      [
                        'Materia prima',
                        formatCentiKg(
                          productionDay.declaredRawMaterialKg100,
                        ),
                      ],
                      [
                        'Producto terminado',
                        formatCentiKg(
                          calculation.declaredFinishedKg100,
                        ),
                      ],
                      [
                        'Saldo final',
                        formatCentiKg(
                          calculation.newClosingBalanceKg100,
                        ),
                      ],
                      [
                        'Diferencia',
                        formatCentiKg(
                          calculation.differenceKg100,
                        ),
                      ],
                      [
                        'Estado',
                        isReadyToClose
                          ? 'Lista para cerrar'
                          : 'Requiere revisión',
                      ],
                    ].map(([label, value]) => (
                      <div key={label} className="min-w-0">
                        <dt className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-[#7F9BAD]">
                          {label}
                        </dt>

                        <dd className="number-tabular mt-1 text-sm font-bold text-[#F3F8FB]">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {operationalState.validation.warnings.length > 0 ? (
                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[#A5BED0]">
                          Advertencias antes del cierre
                        </p>

                        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[0.625rem] font-bold text-amber-300">
                          {operationalState.validation.warnings.length}{' '}
                          {operationalState.validation.warnings.length === 1
                            ? 'advertencia'
                            : 'advertencias'}
                        </span>
                      </div>

                      <div className="overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/[0.05]">
                        {operationalState.validation.warnings.map(
                          (warning, index) => (
                            <div
                              key={`${warning.code}-${warning.familyKey ?? warning.productId ?? 'GENERAL'}`}
                              className={`flex items-start gap-3 px-4 py-3 ${
                                index > 0
                                  ? 'border-t border-amber-500/10'
                                  : ''
                              }`}
                            >
                              <AlertTriangle
                                className="mt-0.5 size-4 shrink-0 text-amber-400"
                                aria-hidden="true"
                              />

                              <div>
                                <p className="text-xs font-bold text-amber-200">
                                  Advertencia
                                </p>

                                <p className="mt-1 text-xs leading-5 text-[#C3D2DC]">
                                  {warning.message}
                                </p>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ) : null}

                  {closeError ? (
                    <div
                      role="alert"
                      className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200"
                    >
                      {closeError}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-[#203E50] bg-[#0A1A27] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCloseConfirmationOpen(false)
                      setCloseError('')
                    }}
                    className="
                      inline-flex min-h-10 items-center justify-center
                      rounded-lg border border-slate-300
                      bg-white px-4
                      text-sm font-bold text-slate-700
                      transition
                      hover:bg-slate-100 hover:text-slate-950

                      dark:border-[#2B5268]
                      dark:bg-transparent
                      dark:text-[#C3D2DC]
                      dark:hover:bg-[#123247]
                      dark:hover:text-white
                    "
                  >
                    Volver a revisar
                  </button>

                  <button
                    type="button"
                    onClick={confirmCloseDay}
                    className="
                      inline-flex min-h-10 items-center justify-center
                      rounded-lg border border-emerald-700
                      bg-emerald-700 px-5
                      text-sm font-extrabold text-white
                      shadow-sm transition

                      hover:border-emerald-800
                      hover:bg-emerald-800

                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-emerald-500
                      focus-visible:ring-offset-2

                      dark:border-emerald-500
                      dark:bg-emerald-600
                      dark:hover:bg-emerald-500
                    "
                  >
                    {operationalState.validation.warnings.length > 0
                      ? 'Cerrar con observación'
                      : 'Cerrar jornada'}
                  </button>
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

export default ProductionDayPage
