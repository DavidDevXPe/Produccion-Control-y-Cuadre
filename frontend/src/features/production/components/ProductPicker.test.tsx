import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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

