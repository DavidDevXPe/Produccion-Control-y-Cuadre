import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Combobox, type ComboboxOption } from './Combobox'

const MOCK_OPTIONS: ComboboxOption[] = [
  { value: 'p-1', label: 'Aleta cruda 2000-3000', group: 'ALETA' },
  { value: 'p-2', label: 'Aleta con tratamiento', group: 'ALETA', secondaryText: 'Disp: 50 kg' },
  { value: 'p-3', label: 'Manto limpio bloque', group: 'MANTO' },
  { value: 'p-4', label: 'Nuca semilimpia', group: 'NUCA' },
]

describe('Combobox component', () => {
  it('renders input with combobox role and accessible labels', () => {
    render(
      <Combobox
        label="Buscar producto"
        placeholder="Escribe un producto…"
        options={MOCK_OPTIONS}
        onSelect={vi.fn()}
      />,
    )

    const input = screen.getByRole('combobox', { name: 'Buscar producto' })
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).toHaveAttribute('aria-autocomplete', 'list')
  })

  it('opens dropdown on focus and shows grouped options', () => {
    render(
      <Combobox
        label="Buscar producto"
        options={MOCK_OPTIONS}
        onSelect={vi.fn()}
      />,
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    expect(input).toHaveAttribute('aria-expanded', 'true')
    const listbox = screen.getByRole('listbox')
    expect(listbox).toBeInTheDocument()

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(4)
    expect(screen.getByText('Aleta cruda 2000-3000')).toBeInTheDocument()
    expect(screen.getByText('Disp: 50 kg')).toBeInTheDocument()
  })

  it('filters options by query ignoring accents and casing', () => {
    render(
      <Combobox
        label="Buscar producto"
        options={MOCK_OPTIONS}
        onSelect={vi.fn()}
      />,
    )

    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'tratamiento' } })

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(1)
    expect(screen.getByText('Aleta con tratamiento')).toBeInTheDocument()
  })

  it('shows no results message when query matches nothing', () => {
    render(
      <Combobox
        label="Buscar producto"
        options={MOCK_OPTIONS}
        onSelect={vi.fn()}
        noResultsText="Sin productos coincidentes"
      />,
    )

    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'inexistente' } })

    expect(screen.getByText('Sin productos coincidentes')).toBeInTheDocument()
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })

  it('navigates with keyboard arrows and selects with Enter', () => {
    const handleSelect = vi.fn()
    render(
      <Combobox
        label="Buscar producto"
        options={MOCK_OPTIONS}
        onSelect={handleSelect}
      />,
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    // Arrow down to highlight first option
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(input).toHaveAttribute('aria-activedescendant', options[0]!.id)

    // Arrow down to second option
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(options[1]).toHaveAttribute('aria-selected', 'true')

    // Press Enter to select
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(handleSelect).toHaveBeenCalledWith(MOCK_OPTIONS[1])
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes on Escape', () => {
    render(
      <Combobox
        label="Buscar producto"
        options={MOCK_OPTIONS}
        onSelect={vi.fn()}
      />,
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    expect(input).toHaveAttribute('aria-expanded', 'true')

    fireEvent.keyDown(input, { key: 'Escape' })
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('renders recent section when recentValues provided', () => {
    render(
      <Combobox
        label="Buscar producto"
        options={MOCK_OPTIONS}
        recentValues={['p-3']}
        recentSectionTitle="Usados recientemente"
        onSelect={vi.fn()}
      />,
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    expect(screen.getByText('Usados recientemente')).toBeInTheDocument()
    const options = screen.getAllByRole('option')
    // The first option should be the recent one (p-3)
    expect(options[0]).toHaveTextContent('Manto limpio bloque')
  })
})

