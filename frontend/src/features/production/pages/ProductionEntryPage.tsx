import { useMemo } from 'react'
import { ProductionEntryContent } from './ProductionEntryContent'
import { ProductionEntryReadOnlyWarning } from '../components/ProductionEntryReadOnlyWarning'
import { useProductionEntryData } from '../hooks/useProductionEntryData'
import { getPreviousProcess } from '../model/productionProcess'
import type { ProductionDay } from '../model/types'

export function ProductionEntryPage() {
  const entryData = useProductionEntryData()
  const {
    editingDate,
    selectedProcess,
    activeWeek,
    existingDay,
    isEditingAllowed,
    draft,
    calculations,
    findProductionDay,
  } = entryData

  const upstreamProcess = getPreviousProcess(selectedProcess)
  const candidateUpstreamDate = useMemo(() => {
    if (!upstreamProcess) return null
    if (
      calculations.freezingLinkedThisDayKg100 > 0 ||
      calculations.totalReportedKg100 === 0 ||
      draft.balanceUses.length > 0
    ) {
      return null
    }

    const upstreamDays = activeWeek.calendarDays
      .map((calDay) => findProductionDay(calDay.isoDate, upstreamProcess))
      .filter(Boolean) as ProductionDay[]

    const candidate = upstreamDays.find((upDay) => {
      if (upDay.date === draft.date) return false
      const existingDownstream = findProductionDay(upDay.date, selectedProcess)
      return !existingDownstream || (editingDate && existingDownstream.date === editingDate)
    })

    return candidate?.date ?? null
  }, [
    activeWeek.calendarDays,
    calculations.freezingLinkedThisDayKg100,
    calculations.totalReportedKg100,
    draft.balanceUses.length,
    draft.date,
    editingDate,
    findProductionDay,
    selectedProcess,
    upstreamProcess,
  ])

  if (!isEditingAllowed || (editingDate && !existingDay)) {
    return <ProductionEntryReadOnlyWarning editingDate={editingDate} />
  }

  return (
    <ProductionEntryContent
      data={entryData}
      upstreamProcess={upstreamProcess}
      candidateUpstreamDate={candidateUpstreamDate}
    />
  )
}

export default ProductionEntryPage
