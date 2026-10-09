import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
import { calculateProductionDay, kg } from '../model/calculations'
import { ProductionBreakdown } from './ProductionBreakdown'

describe('ProductionBreakdown', () => {
  it('does not render or reserve Tunnel columns when there was no movement', () => {
    const calculation = calculateProductionDay(WEDNESDAY_PRODUCTION_DAY)

    render(<ProductionBreakdown products={calculation.products} />)

    const region = screen.getByRole('region', {
      name: 'Producción por familia, turno y concepto de cuadre',
    })
    expect(within(region).queryByText('Túnel')).not.toBeInTheDocument()
    expect(within(region).getByRole('table')).toHaveClass('min-w-[56rem]')
    expect(within(region).queryByText('Propio')).not.toBeInTheDocument()
    expect(within(region).queryByText('Saldo ant.')).not.toBeInTheDocument()
  })

  it('renders Saldo ant. columns when previous balances are processed, without Propio', () => {
    const calculation = calculateProductionDay(WEDNESDAY_PRODUCTION_DAY)
    const productsWithBalance = calculation.products.map((product, index) =>
      index === 0
        ? {
            ...product,
            day: {
              ...product.day,
              previousBalanceProcessedKg100: kg(500),
            },
          }
        : product,
    )

    render(<ProductionBreakdown products={productsWithBalance} />)

    const region = screen.getByRole('region', {
      name: 'Producción por familia, turno y concepto de cuadre',
    })
    expect(within(region).getByRole('table')).toHaveClass('min-w-[86rem]')
    expect(within(region).getAllByText('Saldo ant.').length).toBeGreaterThan(0)
    expect(within(region).queryByText('Propio')).not.toBeInTheDocument()
  })

  it('shows Tunnel columns when applicable and renders zero movements as an em dash', () => {
    const calculation = calculateProductionDay(WEDNESDAY_PRODUCTION_DAY)
    const products = calculation.products.map((product, index) =>
      index === 0
        ? {
            ...product,
            tunnel: {
              ...product.tunnel,
              DAY: {
                ...product.tunnel.DAY,
                reportedKg100: kg(1),
                ownProductionKg100: kg(1),
              },
            },
          }
        : product,
    )

    render(<ProductionBreakdown products={products} />)

    const region = screen.getByRole('region', {
      name: 'Producción por familia, turno y concepto de cuadre',
    })
    expect(within(region).getByText('Túnel')).toBeInTheDocument()
    expect(within(region).getByRole('table')).toHaveClass('min-w-[100rem]')
    expect(within(region).getAllByText('—').length).toBeGreaterThan(0)
  })
})
