import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { SegmentedTabs } from './SegmentedTabs'

const options = [
  { value: 'A', label: 'Resumen' },
  { value: 'B', label: 'Envasado' },
  { value: 'C', label: 'Congelamiento' },
] as const

function Harness({ id }: { id?: string }) {
  const [value, setValue] = useState<'A' | 'B' | 'C'>('A')

  return (
    <SegmentedTabs
      caption="Vista"
      label="Vista de rendimiento"
      options={options}
      value={value}
      onChange={setValue}
      {...(id ? { id } : {})}
    />
  )
}

describe('SegmentedTabs', () => {
  it('exposes a named tab list with a single tab stop on the selected tab', () => {
    render(<Harness />)

    expect(screen.getByRole('tablist', { name: 'Vista de rendimiento' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Resumen' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Envasado' })).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('tab', { name: 'Resumen' })).toHaveAttribute('aria-selected', 'true')
  })

  it('moves and activates with arrows, wrapping around, and with Home and End', () => {
    render(<Harness />)
    const list = screen.getByRole('tablist')

    fireEvent.keyDown(list, { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: 'Envasado' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Envasado' })).toHaveFocus()

    fireEvent.keyDown(list, { key: 'End' })
    expect(screen.getByRole('tab', { name: 'Congelamiento' })).toHaveFocus()

    fireEvent.keyDown(list, { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: 'Resumen' })).toHaveAttribute('aria-selected', 'true')

    fireEvent.keyDown(list, { key: 'ArrowLeft' })
    expect(screen.getByRole('tab', { name: 'Congelamiento' })).toHaveAttribute('aria-selected', 'true')

    fireEvent.keyDown(list, { key: 'Home' })
    expect(screen.getByRole('tab', { name: 'Resumen' })).toHaveFocus()
  })

  it('links each tab to its panel when an id is given', () => {
    render(<Harness id="perf" />)

    const tab = screen.getByRole('tab', { name: 'Envasado' })
    expect(tab).toHaveAttribute('id', 'perf-B')
    expect(tab).toHaveAttribute('aria-controls', 'perf-panel')
  })
})
