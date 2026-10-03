import { AdminSidebarContent } from './AdminSidebarContent'

export function AdminSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-transparent dark:border-ui-line-navy xl:block">
      <AdminSidebarContent />
    </aside>
  )
}
