import { useState } from 'react'
import {
  buildProductionDayFromCapture,
  hasSufficientCaptureData,
  type ProductionCaptureDraft,
} from '../capture/productionCapture'
import { validateProductionClosure } from '../model/businessRules'
import { buildClosureObservations } from '../model/closureObservations'
import {
  getProductionProcess,
  productionDayKey,
} from '../model/productionProcess'
import type { BalanceLot, ProductionDay } from '../model/types'
import { getOperationalWeekContextForIsoDate } from '../../../utils/operationalContext'

interface ActiveWeekInfo {
  number: number
  period: {
    startDate: string
    endDate: string
  }
}

interface UseProductionPersistenceParams {
  draft: ProductionCaptureDraft
  editingDate?: string | undefined
  activeWeek: ActiveWeekInfo
  allProductionDays: readonly ProductionDay[]
  subsequentBalanceLots: readonly BalanceLot[]
  upsertProductionDay: (
    day: ProductionDay,
    options?: {
      allowReplace?: boolean | undefined
      previousDate?: string | undefined
    },
  ) => void
  navigate: (to: string) => void
  setSaveError: (error: string) => void
}

export function useProductionPersistence({
  draft,
  editingDate,
  activeWeek,
  allProductionDays,
  subsequentBalanceLots,
  upsertProductionDay,
  navigate,
  setSaveError,
}: UseProductionPersistenceParams) {
  const [isCloseConfirmationOpen, setIsCloseConfirmationOpen] = useState(false)

  const persist = (closeDay: boolean, confirmedWarnings = false) => {
    setSaveError('')
    const allowedPeriod = editingDate
      ? getOperationalWeekContextForIsoDate(editingDate).period
      : activeWeek.period
    if (
      draft.date < allowedPeriod.startDate ||
      draft.date > allowedPeriod.endDate
    ) {
      setSaveError(
        `La fecha debe permanecer dentro de la semana ${activeWeek.number}.`,
      )
      return
    }
    const next = buildProductionDayFromCapture(
      draft,
      allProductionDays.filter(
        (day) =>
          productionDayKey(day.date, getProductionProcess(day)) !==
          productionDayKey(draft.date, draft.process),
      ),
      subsequentBalanceLots,
      closeDay ? 'CLOSED' : 'DRAFT',
    )

    if (!closeDay && next.inputErrors.length > 0) {
      setSaveError(next.inputErrors[0] ?? 'Revisa los datos de la jornada.')
      return
    }
    if (closeDay) {
      const validation = validateProductionClosure(
        next.productionDay,
        next.calculation,
        {
          requiredDataComplete: hasSufficientCaptureData(draft),
          inputErrors: next.inputErrors,
        },
      )
      if (!validation.canClose) {
        setSaveError(
          validation.blockers[0]?.message ??
            'La jornada todavía tiene validaciones pendientes.',
        )
        return
      }
      if (!confirmedWarnings) {
        setIsCloseConfirmationOpen(true)
        return
      }
    }

    try {
      const productionDayToSave =
        closeDay
          ? (() => {
              const closedAt = new Date().toISOString()
              const validation = validateProductionClosure(
                next.productionDay,
                next.calculation,
                {
                  requiredDataComplete: hasSufficientCaptureData(draft),
                  inputErrors: next.inputErrors,
                },
              )

              return {
                ...next.productionDay,
                closureObservations: buildClosureObservations(
                  validation.warnings,
                  closedAt,
                ),
              }
            })()
          : next.productionDay

      upsertProductionDay(productionDayToSave, {
        allowReplace: Boolean(editingDate),
        previousDate: editingDate,
      })
      setIsCloseConfirmationOpen(false)
      navigate(
        `/jornadas/${productionDayToSave.date}?process=${draft.process}`,
      )
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'No se pudo guardar la jornada.',
      )
    }
  }

  return {
    isCloseConfirmationOpen,
    setIsCloseConfirmationOpen,
    persist,
  }
}
