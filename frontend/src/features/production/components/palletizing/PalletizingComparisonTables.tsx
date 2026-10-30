import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { formatCentiKgValue } from '../../../../utils/formatters'
import { getSackWeightKg, roundSackCount } from '../../model/sackPresentation'
import type {
  PalletizingComparisonMode,
  PalletizingRowCalculation,
  PalletizingTotals,
} from '../../model/palletizingTypes'

interface PalletizingTableProps {
  readonly calculatedRows: readonly PalletizingRowCalculation[]
  readonly totals: PalletizingTotals
}

export function PalletizingQuickTable({
  calculatedRows,
  totals,
  comparisonMode,
}: PalletizingTableProps & { readonly comparisonMode: PalletizingComparisonMode }) {
  return (
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
  )
}

export function PalletizingDetailedTable({
  calculatedRows,
  totals,
}: PalletizingTableProps) {
  return (
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
                      {r.row.videojetBagsCount ??
                        roundSackCount(
                          r.row.videojetQrKg100 / 100,
                          getSackWeightKg(
                            r.row.productName,
                            r.row.presentationName,
                            r.row.sackKg,
                          ),
                        )}
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
  )
}
