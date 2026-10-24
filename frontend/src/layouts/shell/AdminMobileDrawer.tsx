import { X } from 'lucide-react'
import { RefObject } from 'react'
import { AdminSidebarContent } from './AdminSidebarContent'

export interface AdminMobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  closeButtonRef: RefObject<HTMLButtonElement | null>
  mobileNavigationRef: RefObject<HTMLDialogElement | null>
}

export function AdminMobileDrawer({
  isOpen,
  onClose,
  closeButtonRef,
  mobileNavigationRef,
}: AdminMobileDrawerProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 xl:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        aria-label="Cerrar menú de navegación"
        tabIndex={-1}
        onClick={onClose}
      />
      <dialog
        open
        ref={mobileNavigationRef}
        id="mobile-navigation"
        className="relative m-0 h-full w-[min(20rem,88vw)] border-0 p-0 shadow-2xl"
        aria-modal="true"
        aria-labelledby="mobile-navigation-title"
      >
        <h2 id="mobile-navigation-title" className="sr-only">
          Menú de navegación
        </h2>
        <button
          ref={closeButtonRef}
          type="button"
          className="absolute right-3 top-4 z-10 grid size-10 place-items-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Cerrar menú"
          onClick={onClose}
        >
          <X className="size-5" aria-hidden="true" />
        </button>
        <AdminSidebarContent onNavigate={onClose} />
      </dialog>
    </div>
  )
}
