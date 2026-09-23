import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const sizeClasses = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
} as const

interface ModalProps {
  /** Id of the element that titles the dialog (`aria-labelledby`). */
  titleId: string
  /** Called when the user presses Escape. */
  onClose: () => void
  size?: keyof typeof sizeClasses
  children: ReactNode
}

/**
 * Accessible confirmation dialog rendered above the whole application.
 *
 * Moves focus into the dialog, keeps Tab inside it, closes with Escape,
 * restores focus to the element that opened it and blocks page scrolling while
 * it is open. It does not close on backdrop clicks so a stray click cannot
 * discard a confirmation.
 */
export function Modal({ titleId, onClose, size = 'lg', children }: ModalProps) {
  const dialogRef = useRef<HTMLElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const dialog = dialogRef.current
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    const firstFocusable = dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
    ;(firstFocusable ?? dialog)?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab' || !dialog) return

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      )
      const first = focusable.at(0)
      const last = focusable.at(-1)

      if (!first || !last) {
        event.preventDefault()
        return
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      } else if (!dialog.contains(document.activeElement)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-[1px]">
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`my-auto w-full ${sizeClasses[size]} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl focus:outline-none`}
      >
        {children}
      </section>
    </div>,
    document.body,
  )
}
