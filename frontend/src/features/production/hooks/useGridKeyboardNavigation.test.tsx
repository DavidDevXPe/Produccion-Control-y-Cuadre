import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useGridKeyboardNavigation } from './useGridKeyboardNavigation'

function TestGrid({ totalRows = 3, columns = 2 }: { totalRows?: number; columns?: number }) {
  const { getGridCellProps } = useGridKeyboardNavigation({
    totalRows,
    columns,
    gridId: 'test-grid',
  })

  return (
    <table>
      <tbody>
        {Array.from({ length: totalRows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: columns }).map((_, c) => (
              <td key={c}>
                <input
                  aria-label={`cell-${r}-${c}`}
                  defaultValue={`${r * 10 + c}`}
                  {...getGridCellProps(r, c)}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

describe('useGridKeyboardNavigation', () => {
  it('navigates down on ArrowDown and Enter', () => {
    render(<TestGrid totalRows={3} columns={2} />)

    const cell00 = screen.getByLabelText('cell-0-0') as HTMLInputElement
    const cell10 = screen.getByLabelText('cell-1-0') as HTMLInputElement
    const cell20 = screen.getByLabelText('cell-2-0') as HTMLInputElement

    cell00.focus()
    expect(document.activeElement).toBe(cell00)

    // Press ArrowDown -> moves to cell 1-0
    fireEvent.keyDown(cell00, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(cell10)

    // Press Enter -> moves to cell 2-0
    fireEvent.keyDown(cell10, { key: 'Enter', shiftKey: false })
    expect(document.activeElement).toBe(cell20)

    // Press Enter on last row -> stays on last row
    fireEvent.keyDown(cell20, { key: 'Enter', shiftKey: false })
    expect(document.activeElement).toBe(cell20)
  })

  it('navigates up on ArrowUp and Shift+Enter', () => {
    render(<TestGrid totalRows={3} columns={2} />)

    const cell01 = screen.getByLabelText('cell-0-1') as HTMLInputElement
    const cell11 = screen.getByLabelText('cell-1-1') as HTMLInputElement
    const cell21 = screen.getByLabelText('cell-2-1') as HTMLInputElement

    cell21.focus()
    expect(document.activeElement).toBe(cell21)

    // Shift+Enter -> moves up to cell 1-1
    fireEvent.keyDown(cell21, { key: 'Enter', shiftKey: true })
    expect(document.activeElement).toBe(cell11)

    // ArrowUp -> moves up to cell 0-1
    fireEvent.keyDown(cell11, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(cell01)

    // ArrowUp on top row -> stays on top row
    fireEvent.keyDown(cell01, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(cell01)
  })

  it('navigates right on ArrowRight only when at end or all text selected', () => {
    render(<TestGrid totalRows={2} columns={2} />)

    const cell00 = screen.getByLabelText('cell-0-0') as HTMLInputElement
    const cell01 = screen.getByLabelText('cell-0-1') as HTMLInputElement

    cell00.value = '1234'
    cell00.focus()

    // Cursor in middle (pos 2): ArrowRight should NOT navigate
    cell00.setSelectionRange(2, 2)
    fireEvent.keyDown(cell00, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(cell00)

    // Cursor at end (pos 4): ArrowRight should navigate to cell 0-1
    cell00.setSelectionRange(4, 4)
    fireEvent.keyDown(cell00, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(cell01)
  })

  it('navigates left on ArrowLeft only when at start or all text selected', () => {
    render(<TestGrid totalRows={2} columns={2} />)

    const cell00 = screen.getByLabelText('cell-0-0') as HTMLInputElement
    const cell01 = screen.getByLabelText('cell-0-1') as HTMLInputElement

    cell01.value = '5678'
    cell01.focus()

    // Cursor in middle (pos 2): ArrowLeft should NOT navigate
    cell01.setSelectionRange(2, 2)
    fireEvent.keyDown(cell01, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(cell01)

    // Cursor at start (pos 0): ArrowLeft should navigate to cell 0-0
    cell01.setSelectionRange(0, 0)
    fireEvent.keyDown(cell01, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(cell00)
  })

  it('selects destination cell content on focus navigation', () => {
    render(<TestGrid totalRows={2} columns={2} />)

    const cell00 = screen.getByLabelText('cell-0-0') as HTMLInputElement
    const cell10 = screen.getByLabelText('cell-1-0') as HTMLInputElement

    const selectSpy = vi.spyOn(cell10, 'select')
    cell00.focus()
    fireEvent.keyDown(cell00, { key: 'ArrowDown' })

    expect(document.activeElement).toBe(cell10)
    expect(selectSpy).toHaveBeenCalled()
  })
})
