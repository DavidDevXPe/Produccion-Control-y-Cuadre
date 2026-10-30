import { getOperationalWeekContextForIsoDate } from '../../../utils/operationalContext'
import { kg100, sumKg100 } from './calculations'
import { getSackWeightKg, roundSackCount } from './sackPresentation'
import type { PalletizingRowInput } from './palletizingTypes'
import type { ProductionDay } from './types'

export function buildPalletizingRowsFromWeekDays(
  weekNumber: number,
  allProductionDays: readonly ProductionDay[],
): readonly PalletizingRowInput[] | undefined {
  const weekDays = allProductionDays.filter(
    (day) => getOperationalWeekContextForIsoDate(day.date).number === weekNumber,
  )

  if (weekDays.length === 0) {
    return undefined
  }

  const productsMap = new Map<
    string,
    {
      productId: string
      productName: string
      presentationName?: string
      sackKg?: number
      packingKg100: number
      freezingKg100: number
      videojetBagsCount: number
      videojetQrKg100: number
      looseBlockWithoutQrKg100: number
      initialCameraBalanceKg100: number
      palletizedBagsCount: number
      palletizedKg100: number
      finalCameraBalanceKg100: number
    }
  >()

  for (const day of weekDays) {
    const process = day.process ?? 'PACKING'

    for (const line of day.lines) {
      const pid = line.productId
      if (!productsMap.has(pid)) {
        productsMap.set(pid, {
          productId: pid,
          productName: line.productName,
          ...(line.presentationName
            ? { presentationName: line.presentationName }
            : {}),
          ...(line.sackKg !== undefined ? { sackKg: line.sackKg } : {}),
          packingKg100: 0,
          freezingKg100: 0,
          videojetBagsCount: 0,
          videojetQrKg100: 0,
          looseBlockWithoutQrKg100: 0,
          initialCameraBalanceKg100: 0,
          palletizedBagsCount: 0,
          palletizedKg100: 0,
          finalCameraBalanceKg100: 0,
        })
      }

      const entry = productsMap.get(pid)!
      const physicalShiftKg100 = sumKg100([
        line.shifts.DAY.reportedKg100,
        line.shifts.NIGHT.reportedKg100,
      ])
      const lineFinishedKg100 =
        process === 'PACKING'
          ? (line.declaredFinishedKg100 > 0 ? line.declaredFinishedKg100 : physicalShiftKg100)
          : physicalShiftKg100 > 0
            ? physicalShiftKg100
            : line.declaredFinishedKg100

      if (process === 'PACKING') {
        entry.packingKg100 += lineFinishedKg100
      } else if (process === 'FREEZING') {
        entry.freezingKg100 += lineFinishedKg100
      } else if (process === 'VIDEOJET') {
        const sackWeightKg = getSackWeightKg(
          line.productName,
          line.presentationName,
          line.sackKg,
        )
        const qrKg =
          line.videojetQrKg100 ??
          (line.videojetBagsCount !== undefined
            ? line.videojetBagsCount * sackWeightKg * 100
            : lineFinishedKg100)
        const bags =
          line.videojetBagsCount ??
          roundSackCount(qrKg / 100, sackWeightKg)
        const loose = line.looseBlockWithoutQrKg100 ?? 0
        entry.videojetBagsCount += bags
        entry.videojetQrKg100 += qrKg
        entry.looseBlockWithoutQrKg100 += loose
      } else if (process === 'PALLETIZING') {
        const initial = line.initialCameraBalanceKg100 ?? 0
        const palKg = line.palletizedKg100 ?? lineFinishedKg100
        const sackWeightKg = getSackWeightKg(
          line.productName,
          line.presentationName,
          line.sackKg,
        )
        const bags =
          line.palletizedBagsCount ??
          roundSackCount(palKg / 100, sackWeightKg)
        const finalBal = line.finalCameraBalanceKg100 ?? 0
        entry.initialCameraBalanceKg100 += initial
        entry.palletizedBagsCount += bags
        entry.palletizedKg100 += palKg
        entry.finalCameraBalanceKg100 += finalBal
      }
    }
  }

  const result: PalletizingRowInput[] = []
  for (const item of productsMap.values()) {
    result.push({
      productId: item.productId,
      productName: item.productName,
      ...(item.presentationName
        ? { presentationName: item.presentationName }
        : {}),
      ...(item.sackKg !== undefined ? { sackKg: item.sackKg } : {}),
      packingKg100: kg100(item.packingKg100),
      freezingKg100: kg100(item.freezingKg100),
      videojetBagsCount: item.videojetBagsCount,
      videojetQrKg100: kg100(item.videojetQrKg100),
      looseBlockWithoutQrKg100: kg100(item.looseBlockWithoutQrKg100),
      initialCameraBalanceKg100: kg100(item.initialCameraBalanceKg100),
      palletizedBagsCount: item.palletizedBagsCount,
      palletizedKg100: kg100(item.palletizedKg100),
      finalCameraBalanceKg100: kg100(item.finalCameraBalanceKg100),
    })
  }

  return result.length > 0 ? result : undefined
}
