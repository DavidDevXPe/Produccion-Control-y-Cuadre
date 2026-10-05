import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { WEDNESDAY_PRODUCTION_DAY } from '../data/wednesday'
import { calculateProductionDay, kg100 } from '../model/calculations'
import {
  BalancePanel,
  type BalanceProductPosition,
} from './BalancePanel'
import { BalancePanelHeroCard } from './balancePanel/BalancePanelHeroCard'
import { BalancePanelToolbar } from './balancePanel/BalancePanelToolbar'

describe('BalancePanel', () => {
  const calculation = calculateProductionDay(WEDNESDAY_PRODUCTION_DAY)
  const productsWithBalance = calculation.products.filter(
    (product) => product.newClosingBalanceKg100 > 0,
  )

  it('renders closing view with hero card, toolbar, and product rows', () => {
    render(
      <MemoryRouter>
        <BalancePanel
          products={calculation.products}
          originDate="2026-09-16"
          view="closing"
        />
      </MemoryRouter>,
    )

    expect(
      screen.getByText('Saldo generado al cierre por producto'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Producto pendiente que esta jornada dejó como saldo al momento de su cierre.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(`${productsWithBalance.length} productos`),
    ).toBeInTheDocument()

    // First product with balance is rendered in table
    expect(
      screen.getByText(productsWithBalance[0]!.productName),
    ).toBeInTheDocument()
  })

  it('renders outstanding view with navigation link to origin day', () => {
    const samplePositions: BalanceProductPosition[] = productsWithBalance.map(
      (product) => ({
        productId: product.productId,
        processedDayKg100: kg100(0),
        processedNightKg100: kg100(0),
        pendingKg100: product.newClosingBalanceKg100,
      }),
    )

    render(
      <MemoryRouter>
        <BalancePanel
          products={calculation.products}
          originDate="2026-09-16"
          positions={samplePositions}
          view="outstanding"
        />
      </MemoryRouter>,
    )

    expect(
      screen.getByText('Saldo pendiente por producto'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /ver jornada de origen/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('collapses and expands families using toolbar buttons and family toggles', () => {
    render(
      <MemoryRouter>
        <BalancePanel
          products={calculation.products}
          originDate="2026-09-16"
          view="closing"
        />
      </MemoryRouter>,
    )

    const firstProduct = productsWithBalance[0]!
    expect(screen.getByText(firstProduct.productName)).toBeInTheDocument()

    // Collapse all
    fireEvent.click(screen.getByRole('button', { name: 'Contraer todo' }))
    expect(screen.queryByText(firstProduct.productName)).not.toBeInTheDocument()

    // Expand all
    fireEvent.click(screen.getByRole('button', { name: 'Expandir todo' }))
    expect(screen.getByText(firstProduct.productName)).toBeInTheDocument()

    // Toggle single family button
    const familyButtons = screen.getAllByRole('button', {
      name: new RegExp(firstProduct.familyName, 'i'),
    })
    fireEvent.click(familyButtons[0]!)
    expect(screen.queryByText(firstProduct.productName)).not.toBeInTheDocument()
  })

  it('renders excess alert when subsequent consumption exceeds generated balance', () => {
    const firstProduct = productsWithBalance[0]!
    const positionsWithExcess: BalanceProductPosition[] = [
      {
        productId: firstProduct.productId,
        processedDayKg100: kg100(5000),
        processedNightKg100: kg100(0),
        pendingKg100: kg100(0),
        excessKg100: kg100(1500),
      },
    ]

    render(
      <MemoryRouter>
        <BalancePanel
          products={[firstProduct]}
          originDate="2026-09-16"
          positions={positionsWithExcess}
          view="closing"
        />
      </MemoryRouter>,
    )

    expect(
      screen.getByText(/consumidos por encima de lo generado/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/Exceso 15[.,]00 kg/i)).toBeInTheDocument()
  })

  describe('BalancePanelHeroCard', () => {
    it('renders hero metrics with standard status and no excess', () => {
      render(
        <BalancePanelHeroCard
          isOutstandingView={false}
          originDate="2026-09-16"
          total={kg100(50000)}
          totalExcess={kg100(0)}
          balanceStatusLabel="Sin consumos posteriores registrados"
        />,
      )

      expect(
        screen.getByText('Sin consumos posteriores registrados'),
      ).toBeInTheDocument()
      expect(
        screen.queryByText(/consumidos por encima de lo generado/i),
      ).not.toBeInTheDocument()
    })
  })

  describe('BalancePanelToolbar', () => {
    it('triggers expand and collapse callbacks', () => {
      const onExpandAll = vi.fn()
      const onCollapseAll = vi.fn()

      render(
        <BalancePanelToolbar
          groupsCount={4}
          onExpandAll={onExpandAll}
          onCollapseAll={onCollapseAll}
        />,
      )

      expect(
        screen.getByText('4 familias con producto pendiente'),
      ).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Expandir todo' }))
      expect(onExpandAll).toHaveBeenCalled()

      fireEvent.click(screen.getByRole('button', { name: 'Contraer todo' }))
      expect(onCollapseAll).toHaveBeenCalled()
    })
  })
})
