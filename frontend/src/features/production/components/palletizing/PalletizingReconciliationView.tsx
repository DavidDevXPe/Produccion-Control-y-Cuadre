import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Layers,
  Table as TableIcon,
  XCircle,
} from 'lucide-react'
import { buttonStyles } from '../../../../components/ui/buttonStyles'
import { SegmentedTabs } from '../../../../components/ui/SegmentedTabs'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { formatCentiKgValue } from '../../../../utils/formatters'
import {
  PALLETIZING_SAMPLE_CUADRADO,
  PALLETIZING_SAMPLE_DESCUADRE,
} from '../../data/palletizingSampleData'
import {
  calculatePalletizingRow,
  calculatePalletizingTotals,
} from '../../model/palletizingCalculations'
import type {
  PalletizingComparisonMode,
  PalletizingRowInput,
} from '../../model/palletizingTypes'
import { downloadPalletizingReconciliationWorkbook } from '../../export/palletizingReconciliationWorkbook'

export interface PalletizingReconciliationViewProps {
  readonly initialRows?: readonly PalletizingRowInput[] | undefined
  readonly title?: string
  readonly subtitle?: string
}

export function PalletizingReconciliationView({
  initialRows,
  title = 'CONTROL DE ENVASADO, CONGELAMIENTO, VIDEOJET Y PALETIZADO',
  subtitle = 'Sistema de Control Operativo, Trazabilidad QR y Cuadre de Producción',
}: PalletizingReconciliationViewProps) {
  const [viewMode, setViewMode] = useState<'QUICK' | 'DETAILED'>('QUICK')
  const [comparisonMode, setComparisonMode] = useState<PalletizingComparisonMode>('EXCEL')
  const [simulationPreset, setSimulationPreset] = useState<'DESCUADRE' | 'CUADRADO'>('DESCUADRE')
  const [isExporting, setIsExporting] = useState(false)

  // Determinar los datos a mostrar (si hay props iniciales o presets de simulación)
  const currentRows = useMemo(() => {
    if (initialRows && initialRows.length > 0) {
      return initialRows
    }
    return simulationPreset === 'DESCUADRE'
      ? PALLETIZING_SAMPLE_DESCUADRE
      : PALLETIZING_SAMPLE_CUADRADO
  }, [initialRows, simulationPreset])

  const calculatedRows = useMemo(
    () => currentRows.map((row) => calculatePalletizingRow(row, { comparisonMode })),
    [currentRows, comparisonMode],
  )

  const totals = useMemo(
    () => calculatePalletizingTotals(calculatedRows),
    [calculatedRows],
  )

  const handleDownloadExcel = async () => {
    if (isExporting) return
    try {
      setIsExporting(true)
      await downloadPalletizingReconciliationWorkbook({
        rows: currentRows,
        comparisonMode,
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabecera y Controles */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-ui-audit-banner-border dark:bg-ui-audit-banner-bg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
                <Layers className="size-4.5" />
              </span>
              <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                {title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-ui-audit-desc-text">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Selector de Simulación / Datos */}
            {!initialRows && (
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-1 dark:border-ui-audit-banner-border dark:bg-ui-audit-shield-bg">
                <button
                  type="button"
                  onClick={() => setSimulationPreset('DESCUADRE')}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    simulationPreset === 'DESCUADRE'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  🔴 Caso con Descuadres (15,460 kg)
                </button>
                <button
                  type="button"
                  onClick={() => setSimulationPreset('CUADRADO')}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    simulationPreset === 'CUADRADO'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  🟢 Caso Cuadrado (4,970 kg)
                </button>
              </div>
            )}

            {/* Toggle de Modo de Vista */}
            <SegmentedTabs
              caption="Modo de vista"
              label="Modo de cuadre"
              options={[
                {
                  value: 'QUICK',
                  label: 'Control Rápido (11 col.)',
                  icon: <TableIcon className="size-3.5" />,
                },
                {
                  value: 'DETAILED',
                  label: 'Conciliación de Cámara (15 col.)',
                  icon: <Layers className="size-3.5" />,
                },
              ]}
              value={viewMode}
              onChange={(val) => setViewMode(val as 'QUICK' | 'DETAILED')}
            />

            {/* Toggle de Base de Cuadre Paletizado */}
            <SegmentedTabs
              caption="Criterio de cuadre paletizado"
              label="Criterio de cuadre"
              options={[
                {
                  value: 'EXCEL',
                  label: 'Excel (vs Envasado)',
                },
                {
                  value: 'SMART_CLOSEST',
                  label: 'Inteligente (Etapa cercana)',
                },
                {
                  value: 'VIDEOJET',
                  label: 'Videojet QR (Estricto)',
                },
              ]}
              value={comparisonMode}
              onChange={(val) => setComparisonMode(val as PalletizingComparisonMode)}
            />

            {/* Botón Descargar Excel */}
            <button
              type="button"
              onClick={handleDownloadExcel}
              disabled={isExporting}
              className={buttonStyles('primary', 'sm')}
            >
              <Download className="size-4" aria-hidden="true" />
              {isExporting ? 'Generando Excel...' : 'Descargar informe de cuadre (.xlsx)'}
            </button>
          </div>
        </div>

        {/* Barra Superior de KPIs */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-ui-audit-banner-border dark:bg-ui-audit-shield-bg/60">
            <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500 dark:text-ui-audit-desc-text">
              Total Envasado
            </span>
            <div className="number-tabular mt-1 text-lg font-extrabold text-slate-900 dark:text-white">
              {formatCentiKgValue(totals.totalPackingKg100)}
              <span className="ml-1 text-xs font-semibold text-slate-400">kg</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-ui-audit-banner-border dark:bg-ui-audit-shield-bg/60">
            <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500 dark:text-ui-audit-desc-text">
              Total Congelado
            </span>
            <div className="number-tabular mt-1 text-lg font-extrabold text-slate-900 dark:text-white">
              {formatCentiKgValue(totals.totalFreezingKg100)}
              <span className="ml-1 text-xs font-semibold text-slate-400">kg</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-ui-audit-banner-border dark:bg-ui-audit-shield-bg/60">
            <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500 dark:text-ui-audit-desc-text">
              Total Videojet QR
            </span>
            <div className="number-tabular mt-1 text-lg font-extrabold text-slate-900 dark:text-white">
              {formatCentiKgValue(totals.totalVideojetQrKg100)}
              <span className="ml-1 text-xs font-semibold text-slate-400">kg</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-ui-audit-banner-border dark:bg-ui-audit-shield-bg/60">
            <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500 dark:text-ui-audit-desc-text">
              Total Paletizado
            </span>
            <div className="number-tabular mt-1 text-lg font-extrabold text-slate-900 dark:text-white">
              {formatCentiKgValue(totals.totalPalletizedKg100)}
              <span className="ml-1 text-xs font-semibold text-slate-400">kg</span>
            </div>
          </div>

          <div className="col-span-2 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 sm:col-span-1 dark:border-ui-audit-banner-border dark:bg-ui-audit-shield-bg/60">
            <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500 dark:text-ui-audit-desc-text">
              {viewMode === 'DETAILED' ? 'Saldo Total en Cámara' : 'Pendiente Paletizar'}
            </span>
            <div
              className={`number-tabular mt-1 text-lg font-extrabold ${
                totals.totalDiffToPalletizeKg100 < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : totals.totalDiffToPalletizeKg100 > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {formatCentiKgValue(
                viewMode === 'DETAILED'
                  ? totals.totalCameraBalanceKg100
                  : totals.totalDiffToPalletizeKg100,
              )}
              <span className="ml-1 text-xs font-semibold text-slate-400">kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Multietapa */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-ui-audit-banner-border dark:bg-ui-audit-banner-bg">
        <div className="overflow-x-auto">
          {viewMode === 'QUICK' ? (
            /* TABLA 1: CONTROL RÁPIDO (11 COLUMNAS) */
            <table className="w-full min-w-[76rem] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/90 text-[0.6875rem] font-bold uppercase tracking-wider text-slate-700 dark:border-ui-audit-banner-border dark:bg-ui-audit-shield-bg dark:text-slate-300">
                  <th scope="col" className="w-12 px-3 py-3 text-center">N°</th>
                  <th scope="col" className="min-w-[18rem] px-4 py-3">Descripción del Producto / Presentación</th>
                  <th scope="col" className="px-3 py-3 text-right">Envasado (kg)</th>
                  <th scope="col" className="px-3 py-3 text-right">Congelamiento (kg)</th>
                  <th scope="col" className="px-3 py-3 text-right">Dif. Env. vs Cong. (kg)</th>
                  <th scope="col" className="px-3 py-3 text-right">Videojet QR (kg)</th>
                  <th scope="col" className="px-3 py-3 text-right">Dif. Cong. vs Videojet (kg)</th>
                  <th scope="col" className="px-3 py-3 text-right">Paletizado (kg)</th>
                  <th scope="col" className="px-3 py-3 text-right">
                    <span>Dif. por Paletizar (kg)</span>
                    <span className="block text-[0.625rem] font-normal text-slate-400 dark:text-slate-500">
                      {comparisonMode === 'EXCEL'
                        ? '(vs Envasado)'
                        : comparisonMode === 'SMART_CLOSEST'
                          ? '(Inteligente)'
                          : '(vs Videojet QR)'}
                    </span>
                  </th>
                  <th scope="col" className="w-20 px-3 py-3 text-right">N° Sacos</th>
                  <th scope="col" className="w-36 px-4 py-3 text-center">Semáforo / Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-ui-audit-banner-border/60">
                {calculatedRows.map((r, i) => (
                  <tr
                    key={r.row.productId}
                    className="transition hover:bg-slate-50/80 dark:hover:bg-ui-audit-shield-bg/40"
                  >
                    <td className="px-3 py-2.5 text-center font-medium text-slate-400 dark:text-slate-500">
                      {i + 1}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">
                      {r.row.productName}
                    </td>
                    <td className="number-tabular px-3 py-2.5 text-right font-medium text-slate-800 dark:text-slate-200">
                      {formatCentiKgValue(r.row.packingKg100)}
                    </td>
                    <td className="number-tabular px-3 py-2.5 text-right font-medium text-slate-800 dark:text-slate-200">
                      {formatCentiKgValue(r.row.freezingKg100)}
                    </td>
                    <td
                      className={`number-tabular px-3 py-2.5 text-right font-semibold ${
                        r.diffPackingVsFreezingKg100 < 0
                          ? 'text-rose-600 dark:text-rose-400 font-bold'
                          : r.diffPackingVsFreezingKg100 > 0
                            ? 'text-sky-600 dark:text-sky-400'
                            : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {formatCentiKgValue(r.diffPackingVsFreezingKg100)}
                    </td>
                    <td className="number-tabular px-3 py-2.5 text-right font-medium text-slate-800 dark:text-slate-200">
                      {formatCentiKgValue(r.row.videojetQrKg100)}
                    </td>
                    <td
                      className={`number-tabular px-3 py-2.5 text-right font-semibold ${
                        r.diffFreezingVsVideojetKg100 < 0
                          ? 'text-rose-600 dark:text-rose-400 font-bold'
                          : r.diffFreezingVsVideojetKg100 > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {formatCentiKgValue(r.diffFreezingVsVideojetKg100)}
                    </td>
                    <td className="number-tabular px-3 py-2.5 text-right font-medium text-slate-800 dark:text-slate-200">
                      {formatCentiKgValue(r.row.palletizedKg100)}
                    </td>
                    <td
                      className={`number-tabular px-3 py-2.5 text-right font-semibold ${
                        r.diffToPalletizeKg100 < 0
                          ? 'text-rose-600 dark:text-rose-400 font-bold'
                          : r.diffToPalletizeKg100 > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      <div>{formatCentiKgValue(r.diffToPalletizeKg100)}</div>
                      {comparisonMode === 'SMART_CLOSEST' && r.comparisonBasisLabel && (
                        <span className="block text-[0.625rem] font-normal text-slate-400 dark:text-slate-500">
                          vs {r.comparisonBasisLabel}
                        </span>
                      )}
                    </td>
                    <td className="number-tabular px-3 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                      {r.bagsCount}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex justify-center" title={r.statusReason}>
                        <StatusBadge tone={r.statusTone} truncateText={false}>
                          {r.status === 'CUADRADO'
                            ? 'Cuadrado'
                            : r.status === 'PENDIENTE'
                              ? 'Pendiente'
                              : 'Descuadre'}
                        </StatusBadge>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-100 font-bold text-slate-950 dark:border-ui-audit-banner-border dark:bg-ui-audit-shield-bg dark:text-white">
                  <td colSpan={2} className="px-4 py-3 text-center uppercase tracking-wider">
                    TOTAL GENERAL
                  </td>
                  <td className="number-tabular px-3 py-3 text-right">
                    {formatCentiKgValue(totals.totalPackingKg100)}
                  </td>
                  <td className="number-tabular px-3 py-3 text-right">
                    {formatCentiKgValue(totals.totalFreezingKg100)}
                  </td>
                  <td
                    className={`number-tabular px-3 py-3 text-right ${
                      totals.totalDiffPackingVsFreezingKg100 < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : totals.totalDiffPackingVsFreezingKg100 > 0
                          ? 'text-sky-600 dark:text-sky-400'
                          : ''
                    }`}
                  >
                    {formatCentiKgValue(totals.totalDiffPackingVsFreezingKg100)}
                  </td>
                  <td className="number-tabular px-3 py-3 text-right">
                    {formatCentiKgValue(totals.totalVideojetQrKg100)}
                  </td>
                  <td
                    className={`number-tabular px-3 py-3 text-right ${
                      totals.totalDiffFreezingVsVideojetKg100 !== 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : ''
                    }`}
                  >
                    {formatCentiKgValue(totals.totalDiffFreezingVsVideojetKg100)}
                  </td>
                  <td className="number-tabular px-3 py-3 text-right">
                    {formatCentiKgValue(totals.totalPalletizedKg100)}
                  </td>
                  <td
                    className={`number-tabular px-3 py-3 text-right ${
                      totals.totalDiffToPalletizeKg100 < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : totals.totalDiffToPalletizeKg100 > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : ''
                    }`}
                  >
                    {formatCentiKgValue(totals.totalDiffToPalletizeKg100)}
                  </td>
                  <td className="number-tabular px-3 py-3 text-right text-base font-extrabold text-slate-900 dark:text-white">
                    {totals.totalBagsCount}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <StatusBadge tone={totals.overallStatusTone} truncateText={false}>
                        {totals.overallStatus === 'CUADRADO'
                          ? 'Cuadrado'
                          : totals.overallStatus === 'PENDIENTE'
                            ? 'Pendiente'
                            : 'Descuadre'}
                      </StatusBadge>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            /* TABLA 2: CONCILIACIÓN DE CÁMARA Y ARRASTRE DE SALDOS (15 COLUMNAS) */
            <table className="w-full min-w-[92rem] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/90 text-[0.6875rem] font-bold uppercase tracking-wider text-slate-700 dark:border-ui-audit-banner-border dark:bg-ui-audit-shield-bg dark:text-slate-300">
                  <th scope="col" className="w-10 px-2.5 py-3 text-center">N°</th>
                  <th scope="col" className="min-w-[16rem] px-3.5 py-3">Descripción del Producto / Presentación</th>
                  <th scope="col" className="px-2.5 py-3 text-right">Envasado</th>
                  <th scope="col" className="px-2.5 py-3 text-right">Congelamiento</th>
                  <th scope="col" className="px-2.5 py-3 text-right">Dif. Env-Cong</th>
                  <th scope="col" className="w-20 px-2.5 py-3 text-right">Sacos QR</th>
                  <th scope="col" className="px-2.5 py-3 text-right">Videojet QR (kg)</th>
                  <th scope="col" className="px-2.5 py-3 text-right">Block sin QR</th>
                  <th scope="col" className="px-2.5 py-3 text-right">Dif. Videojet</th>
                  <th scope="col" className="px-2.5 py-3 text-right">Paletizado</th>
                  <th scope="col" className="px-2.5 py-3 text-right">Saldo Inicial</th>
                  <th scope="col" className="px-2.5 py-3 text-right">Dif. Física Paletizar</th>
                  <th scope="col" className="w-24 px-2.5 py-3 text-right">Sacos Palet.</th>
                  <th scope="col" className="px-2.5 py-3 text-right">Saldo Final Cámara</th>
                  <th scope="col" className="w-32 px-3 py-3 text-center">Semáforo / Cuadre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-ui-audit-banner-border/60">
                {calculatedRows.map((r, i) => (
                  <tr
                    key={r.row.productId}
                    className="transition hover:bg-slate-50/80 dark:hover:bg-ui-audit-shield-bg/40"
                  >
                    <td className="px-2.5 py-2.5 text-center font-medium text-slate-400 dark:text-slate-500">
                      {i + 1}
                    </td>
                    <td className="px-3.5 py-2.5 font-semibold text-slate-900 dark:text-white">
                      {r.row.productName}
                    </td>
                    <td className="number-tabular px-2.5 py-2.5 text-right font-medium text-slate-800 dark:text-slate-200">
                      {formatCentiKgValue(r.row.packingKg100)}
                    </td>
                    <td className="number-tabular px-2.5 py-2.5 text-right font-medium text-slate-800 dark:text-slate-200">
                      {formatCentiKgValue(r.row.freezingKg100)}
                    </td>
                    <td
                      className={`number-tabular px-2.5 py-2.5 text-right font-semibold ${
                        r.diffPackingVsFreezingKg100 < 0
                          ? 'text-rose-600 dark:text-rose-400 font-bold'
                          : r.diffPackingVsFreezingKg100 > 0
                            ? 'text-sky-600 dark:text-sky-400'
                            : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {formatCentiKgValue(r.diffPackingVsFreezingKg100)}
                    </td>
                    <td className="number-tabular px-2.5 py-2.5 text-right font-medium text-slate-700 dark:text-slate-300">
                      {r.row.videojetBagsCount ?? Math.floor(r.row.videojetQrKg100 / 2000)}
                    </td>
                    <td className="number-tabular px-2.5 py-2.5 text-right font-medium text-slate-800 dark:text-slate-200">
                      {formatCentiKgValue(r.row.videojetQrKg100)}
                    </td>
                    <td className="number-tabular px-2.5 py-2.5 text-right font-medium text-slate-600 dark:text-slate-400">
                      {formatCentiKgValue(r.row.looseBlockWithoutQrKg100 ?? 0)}
                    </td>
                    <td
                      className={`number-tabular px-2.5 py-2.5 text-right font-semibold ${
                        r.diffFreezingVsVideojetKg100 !== 0
                          ? 'text-rose-600 dark:text-rose-400 font-bold'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {formatCentiKgValue(r.diffFreezingVsVideojetKg100)}
                    </td>
                    <td className="number-tabular px-2.5 py-2.5 text-right font-medium text-slate-800 dark:text-slate-200">
                      {formatCentiKgValue(r.row.palletizedKg100)}
                    </td>
                    <td className="number-tabular px-2.5 py-2.5 text-right font-medium text-slate-600 dark:text-slate-400">
                      {formatCentiKgValue(r.row.initialCameraBalanceKg100 ?? 0)}
                    </td>
                    <td
                      className={`number-tabular px-2.5 py-2.5 text-right font-semibold ${
                        r.diffPhysicalPalletizeKg100 !== 0
                          ? 'text-rose-600 dark:text-rose-400 font-bold'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {formatCentiKgValue(r.diffPhysicalPalletizeKg100)}
                    </td>
                    <td className="number-tabular px-2.5 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                      {r.bagsCount}
                    </td>
                    <td className="number-tabular px-2.5 py-2.5 text-right font-bold text-slate-800 dark:text-slate-300">
                      {formatCentiKgValue(r.row.finalCameraBalanceKg100 ?? 0)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex justify-center" title={r.statusReason}>
                        <StatusBadge tone={r.statusTone} truncateText={false}>
                          {r.status === 'CUADRADO'
                            ? 'Cuadrado'
                            : r.status === 'PENDIENTE'
                              ? 'Pendiente'
                              : 'Descuadre'}
                        </StatusBadge>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-100 font-bold text-slate-950 dark:border-ui-audit-banner-border dark:bg-ui-audit-shield-bg dark:text-white">
                  <td colSpan={2} className="px-4 py-3 text-center uppercase tracking-wider">
                    TOTAL GENERAL
                  </td>
                  <td className="number-tabular px-2.5 py-3 text-right">
                    {formatCentiKgValue(totals.totalPackingKg100)}
                  </td>
                  <td className="number-tabular px-2.5 py-3 text-right">
                    {formatCentiKgValue(totals.totalFreezingKg100)}
                  </td>
                  <td className="number-tabular px-2.5 py-3 text-right">
                    {formatCentiKgValue(totals.totalDiffPackingVsFreezingKg100)}
                  </td>
                  <td className="number-tabular px-2.5 py-3 text-right">
                    {totals.totalBagsCount}
                  </td>
                  <td className="number-tabular px-2.5 py-3 text-right">
                    {formatCentiKgValue(totals.totalVideojetQrKg100)}
                  </td>
                  <td className="number-tabular px-2.5 py-3 text-right">
                    {formatCentiKgValue(totals.totalLooseBlockWithoutQrKg100)}
                  </td>
                  <td className="number-tabular px-2.5 py-3 text-right">
                    {formatCentiKgValue(totals.totalDiffFreezingVsVideojetKg100)}
                  </td>
                  <td className="number-tabular px-2.5 py-3 text-right">
                    {formatCentiKgValue(totals.totalPalletizedKg100)}
                  </td>
                  <td className="number-tabular px-2.5 py-3 text-right">
                    {formatCentiKgValue(totals.totalInitialCameraBalanceKg100)}
                  </td>
                  <td className="number-tabular px-2.5 py-3 text-right">0.00</td>
                  <td className="number-tabular px-2.5 py-3 text-right text-base font-extrabold text-slate-900 dark:text-white">
                    {totals.totalBagsCount}
                  </td>
                  <td className="number-tabular px-2.5 py-3 text-right text-base font-extrabold text-slate-900 dark:text-white">
                    {formatCentiKgValue(totals.totalCameraBalanceKg100)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex justify-center">
                      <StatusBadge tone={totals.overallStatusTone} truncateText={false}>
                        {totals.overallStatus === 'CUADRADO'
                          ? 'Cuadrado'
                          : totals.overallStatus === 'PENDIENTE'
                            ? 'Pendiente'
                            : 'Descuadre'}
                      </StatusBadge>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* Bloque Inferior: Criterios Operativos y Semáforo */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-xs text-slate-600 dark:border-ui-audit-banner-border dark:bg-ui-audit-banner-bg dark:text-ui-audit-desc-text">
        <h3 className="mb-2.5 font-bold uppercase tracking-wider text-slate-900 dark:text-white">
          * Criterios de Conciliación y Auditoría Operativa
        </h3>
        <ul className="space-y-1.5 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="font-semibold text-slate-900 dark:text-slate-200">• Presentación y Pesajes:</span>
            <span>Envasado y congelamiento operan en blocks de 10 kg. Videojet y Paletizado operan por sacos armados de 20 kg (2 blocks por saco).</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-slate-900 dark:text-slate-200">• Saldo Inicial y Arrastre:</span>
            <span>Los blocks sueltos (10 kg) del turno anterior se integran a la producción del turno actual para completar sacos de 20 kg (ej. Manto Estándar: 10 kg hoy + 10 kg anterior = 20 kg paletizados).</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-slate-900 dark:text-slate-200">• Dif. Videojet (kg):</span>
            <span>(Congelamiento + Saldo Inicial) − Videojet QR kg − Saldo Block sin QR = 0 kg.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-slate-900 dark:text-slate-200">• Dif. Física Paletizar (kg):</span>
            <span>(Congelamiento + Saldo Inicial) − (Paletizado + Saldo Final en Cámara) = 0 kg (conciliación exacta al descontar el stock físico en cámara).</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-slate-900 dark:text-slate-200">• Semáforo Operativo:</span>
            <div className="flex flex-wrap items-center gap-3 pt-0.5">
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" /> 🟢 Cuadrado: Proceso 100% conciliado en frío, rotulado Videojet y estiba de cámara.
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-3.5" /> 🟡 Pendiente: Saldo físico en cámara a la espera de completar pallet.
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
                <XCircle className="size-3.5" /> 🔴 Descuadre: Merma física en túneles, desfase en QR o sobregiro en cámara.
              </span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  )
}
