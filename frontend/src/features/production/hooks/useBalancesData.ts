import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { exportPageToPdf } from '../../../utils/pdfExport'
import {
  calculateOutstandingBalances,
  calculateProductionDay,
  sumKg100,
} from '../model/calculations'
import { calculateFreezingAvailability, type FreezingAvailabilityPosition } from '../model/freezing'
import { isPackingProductionDay, isProductionProcess } from '../model/productionProcess'
import { explainFreezingAvailabilityByOrigin } from '../presentation/freezingAvailabilityExplanation'
import type {
  Kg100,
  OutstandingBalancePosition,
  ProductionDay,
  ProductionDayCalculation,
  ProductionProcess,
} from '../model/types'
import { useProductionData } from '../state/ProductionDataContext'

export interface OutstandingOriginGroup {
  readonly day: ProductionDay
  readonly calculation: ProductionDayCalculation
  readonly positions: readonly OutstandingBalancePosition[]
}

export function useBalancesData() {
  usePageTitle('Saldos de producción')

  const {
    activeWeekNumber,
    activeProcess,
    allProductionDays,
    getWeekView,
    setActiveProcess,
    subsequentBalanceLots,
  } = useProductionData()

  const [searchParams, setSearchParams] = useSearchParams()
  const processParam = searchParams.get('process')
  const selectedProcess: ProductionProcess = isProductionProcess(processParam)
    ? processParam
    : activeProcess

  const activeWeek = useMemo(
    () => getWeekView(activeWeekNumber, selectedProcess),
    [getWeekView, activeWeekNumber, selectedProcess],
  )

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState('')

  useEffect(() => {
    if (selectedProcess !== activeProcess) {
      setActiveProcess(selectedProcess)
    }
  }, [activeProcess, selectedProcess, setActiveProcess])

  const isFreezing = selectedProcess === 'FREEZING'
  const weekStart = activeWeek.period.startDate
  const weekEnd = activeWeek.period.endDate

  const productionDays = useMemo(
    () =>
      allProductionDays.filter(
        (day) => isPackingProductionDay(day) && day.date <= weekEnd,
      ),
    [allProductionDays, weekEnd],
  )

  const outstandingPositions = useMemo(
    () =>
      calculateOutstandingBalances(
        productionDays,
        subsequentBalanceLots,
      ).filter(
        (position) => position.pendingKg100 > 0 || position.excessKg100 > 0,
      ),
    [productionDays, subsequentBalanceLots],
  )

  // Full ledger up to week end (needed for correct excess/pending math).
  const freezingAvailability = useMemo(
    () => calculateFreezingAvailability(allProductionDays, weekEnd),
    [allProductionDays, weekEnd],
  )

  // UI scope: only positions whose Packing origin belongs to the active week.
  const freezingPositions = useMemo(
    () =>
      [...freezingAvailability]
        .filter(
          (position) =>
            (position.pendingKg100 > 0 || position.excessKg100 > 0) &&
            position.originDate >= weekStart &&
            position.originDate <= weekEnd,
        )
        .sort(
          (first, second) =>
            Number(second.excessKg100 > 0) - Number(first.excessKg100 > 0) ||
            first.originDate.localeCompare(second.originDate) ||
            first.familyName.localeCompare(second.familyName, 'es-PE') ||
            first.productName.localeCompare(second.productName, 'es-PE'),
        ),
    [freezingAvailability, weekStart, weekEnd],
  )

  const openFreezingOriginIds = useMemo(
    () => new Set(freezingPositions.map((position) => position.originDayId)),
    [freezingPositions],
  )

  const freezingOrigins = useMemo(
    () =>
      explainFreezingAvailabilityByOrigin(
        freezingAvailability.filter((position) =>
          openFreezingOriginIds.has(position.originDayId),
        ),
        allProductionDays,
      ),
    [freezingAvailability, openFreezingOriginIds, allProductionDays],
  )

  const filteredFreezingPositions: readonly FreezingAvailabilityPosition[] = useMemo(
    () =>
      freezingPositions.filter((position) => {
        const matchesSearch =
          !searchQuery.trim() ||
          position.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          position.familyName.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesDate = !selectedDate || position.originDate === selectedDate
        return matchesSearch && matchesDate
      }),
    [freezingPositions, searchQuery, selectedDate],
  )

  const outstandingByOrigin: readonly OutstandingOriginGroup[] = useMemo(
    () =>
      productionDays.flatMap((day) => {
        if (day.date < weekStart || day.date > weekEnd) return []
        if (selectedDate && day.date !== selectedDate) return []

        const positions = outstandingPositions.filter((position) => {
          if (position.originDayId !== day.id) return false
          if (!searchQuery.trim()) return true
          return (
            position.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            position.familyName.toLowerCase().includes(searchQuery.toLowerCase())
          )
        })

        return positions.length > 0
          ? [{ day, calculation: calculateProductionDay(day), positions }]
          : []
      }),
    [productionDays, weekStart, weekEnd, selectedDate, outstandingPositions, searchQuery],
  )

  const visiblePositions = useMemo(
    () =>
      isFreezing
        ? filteredFreezingPositions
        : outstandingPositions.filter((position) => {
            const inWeek =
              position.originDate >= weekStart && position.originDate <= weekEnd
            if (!inWeek) return false
            const matchesSearch =
              !searchQuery.trim() ||
              position.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              position.familyName.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesDate = !selectedDate || position.originDate === selectedDate
            return matchesSearch && matchesDate
          }),
    [
      isFreezing,
      filteredFreezingPositions,
      outstandingPositions,
      weekStart,
      weekEnd,
      searchQuery,
      selectedDate,
    ],
  )

  const totalPendingKg100: Kg100 = useMemo(
    () => sumKg100(visiblePositions.map((position) => position.pendingKg100)),
    [visiblePositions],
  )

  const totalExcessKg100: Kg100 = useMemo(
    () => sumKg100(visiblePositions.map((position) => position.excessKg100)),
    [visiblePositions],
  )

  const pendingProductCount = useMemo(
    () =>
      new Set(
        visiblePositions
          .filter((position) => position.pendingKg100 > 0)
          .map((position) => position.productId),
      ).size,
    [visiblePositions],
  )

  const freezingWeek = useMemo(
    () => getWeekView(activeWeekNumber, 'FREEZING'),
    [getWeekView, activeWeekNumber],
  )

  const originCount = useMemo(
    () => new Set(visiblePositions.map((position) => position.originDayId)).size,
    [visiblePositions],
  )

  const handleProcessChange = (process: string) => {
    if (process !== 'COMPARISON' && isProductionProcess(process)) {
      setActiveProcess(process)
      setSearchParams({ process }, { replace: true })
    }
  }

  const handleExportPdf = () => {
    exportPageToPdf(`Saldos de Produccion Semana ${activeWeek.number}`)
  }

  return {
    selectedProcess,
    activeWeek,
    isFreezing,
    weekStart,
    weekEnd,
    searchQuery,
    setSearchQuery,
    selectedDate,
    setSelectedDate,
    freezingPositions,
    filteredFreezingPositions,
    freezingOrigins,
    outstandingByOrigin,
    totalPendingKg100,
    totalExcessKg100,
    pendingProductCount,
    originCount,
    freezingWeek,
    handleProcessChange,
    handleExportPdf,
  }
}
