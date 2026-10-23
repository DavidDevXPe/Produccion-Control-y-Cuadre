import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addRecentProductId } from '../../../storage/recentProductsStore'
import { ProductPicker } from './ProductPicker'

interface TestItem {
  id: string
  name: string
  family: string
  stockKg?: number
}

const MOCK_ITEMS: TestItem[] = [
  { id: '1', name: 'Aleta cruda', family: 'ALETA', stockKg: 100 },
  { id: '2', name: 'Manto entero', family: 'MANTO', stockKg: 250 },
  { id: '3', name: 'Nuca limpia', family: 'NUCA' },
]

describe('ProductPicker component', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders Combobox and action button with proper labels', () => {
    render(
      <ProductPicker
        items={MOCK_ITEMS}
        getItemId={(item) => item.id}
        getItemLabel={(item) => item.name}
        onAdd={vi.fn()}
        label="Buscar producto"
        buttonLabel="Agregar"
      />,
    )

    expect(screen.getByRole('combobox', { name: 'Buscar producto' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Agregar' })).toBeInTheDocument()
  })

  it('triggers onAdd and saves to recents when option is chosen', async () => {
    const handleAdd = vi.fn()
    render(
      <ProductPicker
        items={MOCK_ITEMS}
        getItemId={(item) => item.id}
        getItemLabel={(item) => item.name}
        getItemMeta={(item) => ({
          group: item.family,
          secondaryText: item.stockKg ? `Disp: ${item.stockKg} kg` : undefined,
        })}
        onAdd={handleAdd}
        scopeKey="test-scope"
        buttonLabel="Agregar"
      />,
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'manto' } })

    const option = screen.getByRole('option', { name: /Manto entero/i })
    fireEvent.click(option)

    expect(handleAdd).toHaveBeenCalledWith(MOCK_ITEMS[1])
  })

  it('offers creating a product when the search has no matches', () => {
    const handleCreate = vi.fn()
    render(
      <ProductPicker
        items={MOCK_ITEMS}
        getItemId={(item) => item.id}
        getItemLabel={(item) => item.name}
        onAdd={vi.fn()}
        onCreateNew={handleCreate}
        label="Buscar producto"
      />,
    )

    const input = screen.getByRole('combobox', { name: 'Buscar producto' })
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Producto nuevo' } })

    fireEvent.click(screen.getByRole('button', { name: /Crear producto/i }))
    expect(handleCreate).toHaveBeenCalledWith('Producto nuevo')
  })

  it('shares recent products with balance pickers that use origin-specific option ids', () => {
    const balanceItems = [
      {
        id: 'origin-day|2',
        productId: '2',
        name: 'Manto entero · saldo del 08 OCT',
        family: 'MANTO',
      },
    ]

    render(
      <>
        <ProductPicker
          items={MOCK_ITEMS}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.name}
          onAdd={vi.fn()}
          label="Buscar producto"
          scopeKey="PACKING:REPORTS"
        />
        <ProductPicker
          items={balanceItems}
          getItemId={(item) => item.id}
          getItemRecentId={(item) => item.productId}
          getItemLabel={(item) => item.name}
          onAdd={vi.fn()}
          label="Buscar saldo"
          scopeKey="PACKING:REPORTS"
        />
      </>,
    )

    const reportInput = screen.getByRole('combobox', { name: 'Buscar producto' })
    fireEvent.focus(reportInput)
    fireEvent.change(reportInput, { target: { value: 'Manto entero' } })
    fireEvent.click(screen.getByRole('option', { name: /Manto entero/i }))

    fireEvent.focus(screen.getByRole('combobox', { name: 'Buscar saldo' }))

    const balanceList = screen.getByRole('listbox')
    expect(within(balanceList).getByText('Usados recientemente')).toBeInTheDocument()
    expect(within(balanceList).getAllByRole('option')[0]).toHaveTextContent(
      'Manto entero · saldo del 08 OCT',
    )
  })

  it('prioritizes the exact recently used balance origin without duplicating its product', () => {
    const scopeKey = 'PACKING:REPORTS'
    addRecentProductId(scopeKey, '2', 16)
    addRecentProductId(scopeKey, 'origin-day-09|2', 16)
    const balances = [
      {
        id: 'origin-day-08|2',
        productId: '2',
        name: 'Manto entero · saldo del 08 OCT',
        family: 'MANTO',
      },
      {
        id: 'origin-day-09|2',
        productId: '2',
        name: 'Manto entero · saldo del 09 OCT',
        family: 'MANTO',
      },
    ]

    render(
      <ProductPicker
        items={balances}
        getItemId={(item) => item.id}
        getItemRecentId={(item) => item.productId}
        getItemLabel={(item) => item.name}
        onAdd={vi.fn()}
        label="Buscar saldo"
        scopeKey={scopeKey}
      />,
    )

    fireEvent.focus(screen.getByRole('combobox', { name: 'Buscar saldo' }))

    const recentOptions = within(screen.getByRole('listbox')).getAllByRole('option')
    expect(recentOptions[0]).toHaveTextContent('saldo del 09 OCT')
    expect(recentOptions).toHaveLength(3)
  })

  it('allows keyboard navigation with Arrow keys and Enter to add', () => {
    const handleAdd = vi.fn()
    render(
      <ProductPicker
        items={MOCK_ITEMS}
        getItemId={(item) => item.id}
        getItemLabel={(item) => item.name}
        onAdd={handleAdd}
        buttonLabel="Agregar a Túnel"
      />,
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(handleAdd).toHaveBeenCalledWith(MOCK_ITEMS[0])
  })

  it('disables combobox and button when disabled prop is true', () => {
    render(
      <ProductPicker
        items={MOCK_ITEMS}
        getItemId={(item) => item.id}
        getItemLabel={(item) => item.name}
        onAdd={vi.fn()}
        disabled={true}
      />,
    )

    expect(screen.getByRole('combobox')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Agregar' })).toBeDisabled()
  })

  it('keeps primary button disabled until a product is selected, and enables it when matched', () => {
    const handleAdd = vi.fn()
    render(
      <ProductPicker
        items={MOCK_ITEMS}
        getItemId={(item) => item.id}
        getItemLabel={(item) => item.name}
        onAdd={handleAdd}
        buttonLabel="Agregar producto"
        compactButtonLabel="Agregar"
      />,
    )

    const button = screen.getByRole('button', { name: 'Agregar producto' })
    // Initially disabled because no product is selected yet
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('title', 'Selecciona un producto del catálogo para agregarlo')

    // Type a search query: matching item enables the button
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'manto' } })

    expect(button).not.toBeDisabled()

    // Clicking the enabled button adds the matched item
    fireEvent.click(button)
    expect(handleAdd).toHaveBeenCalledWith(MOCK_ITEMS[1])
  })
})

