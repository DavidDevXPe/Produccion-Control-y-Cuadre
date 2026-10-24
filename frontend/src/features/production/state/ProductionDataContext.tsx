/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from 'react'
import { fallbackValue } from './productionDataHelpers'
import type {
  OperationalCalendarDay,
  OperationalWeekView,
  ProductionDataValue,
  StoredWeekClosure,
  WeekClosureType,
} from './productionDataTypes'
import { useProductionDataProviderValue } from './useProductionDataProviderValue'

export type {
  OperationalCalendarDay,
  OperationalWeekView,
  ProductionDataValue,
  StoredWeekClosure,
  WeekClosureType,
}

const GLOBAL_CONTEXT_KEY = '__TRABUNDA_PRODUCTION_DATA_CONTEXT__' as const

const globalContextStore = globalThis as typeof globalThis & {
  [GLOBAL_CONTEXT_KEY]?: ReturnType<typeof createContext<ProductionDataValue>>
}

const ProductionDataContext =
  globalContextStore[GLOBAL_CONTEXT_KEY] ??
  (globalContextStore[GLOBAL_CONTEXT_KEY] =
    createContext<ProductionDataValue>(fallbackValue))

interface ProductionDataProviderProps {
  children: ReactNode
}

export function ProductionDataProvider({ children }: ProductionDataProviderProps) {
  const value = useProductionDataProviderValue()

  return (
    <ProductionDataContext.Provider value={value}>
      {children}
    </ProductionDataContext.Provider>
  )
}

export function useProductionData(): ProductionDataValue {
  return useContext(ProductionDataContext)
}
