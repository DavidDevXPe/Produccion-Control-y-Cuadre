import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
import { calculateProductionBusinessSummary } from '../model/businessRules'
import { calculateProductionDay, kg100 } from '../model/calculations'
import {
  ProductionFinishedProductSection,
  type ProductionFinishedProductSectionProps,
} from './ProductionFinishedProductSection'

describe('ProductionFinishedProductSection', () => {
  const calculation = calculateProductionDay(WEDNESDAY_PRODUCTION_DAY)
  const businessSummary = calculateProductionBusinessSummary(
    WEDNESDAY_PRODUCTION_DAY,
    calculation,
  )

  function createProps(
    overrides: Partial<ProductionFinishedProductSectionProps> = {},
  ): ProductionFinishedProductSectionProps {
    return {
      isFreezing: false,
      isBalanceOnly: false,
      usesExternalAvailability: false,
      hasTunnelProduction: false,
      totalReportedKg100: kg100(5613000),
      calculation,
      businessSummary,
      ...overrides,
    }
  }

  it('renders section title, description and standard operational metrics', () => {
    const props = createProps()
    render(<ProductionFinishedProductSection {...props} />)

    expect(
      screen.getByRole('heading', { name: 'Producto terminado calculado' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Desglose operativo derivado del estado actual; ningún valor es editable.',
      ),
    ).toBeInTheDocument()

    expect(screen.getByText('Reporte propio Día')).toBeInTheDocument()
    expect(screen.getByText('Reporte propio Noche')).toBeInTheDocument()
    expect(screen.getByText('Tratamiento')).toBeInTheDocument()
    expect(screen.getByText('Saldo al cierre')).toBeInTheDocument()
    expect(screen.getByText('Producto terminado')).toBeInTheDocument()
    expect(screen.queryByText('Túnel total')).not.toBeInTheDocument()
  })

  it('renders Tunnel total metric card when hasTunnelProduction is true', () => {
    const props = createProps({ hasTunnelProduction: true })
    render(<ProductionFinishedProductSection {...props} />)

    expect(screen.getByText('Túnel total')).toBeInTheDocument()
  })

  it('renders external availability metrics and note when isFreezing is true', () => {
    const props = createProps({
      isFreezing: true,
      usesExternalAvailability: true,
    })
    render(<ProductionFinishedProductSection {...props} />)

    expect(screen.getByText('Congelado físicamente')).toBeInTheDocument()
    expect(screen.getByText('Sin origen vinculado')).toBeInTheDocument()
    expect(screen.getByText('Disponible no utilizado')).toBeInTheDocument()

    expect(screen.getByText('Referencia operativa')).toBeInTheDocument()
    expect(screen.getByText('NO APLICA')).toBeInTheDocument()
    expect(
      screen.getByText(
        'No aplica el 80%; Congelamiento se valida contra disponibilidad de Envasado.',
      ),
    ).toBeInTheDocument()
  })

  it('renders external availability metrics and note when isBalanceOnly is true', () => {
    const props = createProps({
      isBalanceOnly: true,
      usesExternalAvailability: true,
    })
    render(<ProductionFinishedProductSection {...props} />)

    expect(screen.getByText('Procesado físicamente')).toBeInTheDocument()
    expect(
      screen.getByText('Producción productiva atribuida'),
    ).toBeInTheDocument()
    expect(screen.getByText('Saldo anterior pendiente')).toBeInTheDocument()
    expect(
      screen.getByText('Jornada de saldos sin nueva materia prima.'),
    ).toBeInTheDocument()
  })

  it('renders real-time validation difference and overall utilization', () => {
    const props = createProps()
    render(<ProductionFinishedProductSection {...props} />)

    expect(screen.getByText('Diferencia final')).toBeInTheDocument()
    expect(screen.getByText('Aprovechamiento general')).toBeInTheDocument()
    expect(
      screen.getByText(
        'La referencia operativa es 80%. Un valor inferior permite cierre con observación; un valor superior a 100% requiere revisión.',
      ),
    ).toBeInTheDocument()
  })
})
