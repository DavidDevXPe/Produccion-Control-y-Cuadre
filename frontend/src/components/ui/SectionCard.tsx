import type { HTMLAttributes, ReactNode } from 'react'

interface SectionCardProps extends HTMLAttributes<HTMLElement> {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  contentClassName?: string
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className = '',
  contentClassName = '',
  ...props
}: SectionCardProps) {
  return (
    <section
      {...props}
      className={`min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-panel dark:border-ui-line-dark dark:bg-ui-surface-dark-deep ${className}`}
    >
      {title || description || action ? (
        <div className="flex flex-col gap-2.5 border-b border-slate-200 bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-ui-line-dark dark:bg-ui-surface-dark-deep">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-base font-semibold leading-5 text-slate-950 dark:text-ui-text-dark-strong">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-ui-text-dark-soft">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={contentClassName}>{children}</div>
    </section>
  )
}