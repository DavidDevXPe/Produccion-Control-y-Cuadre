import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { buttonStyles } from './buttonStyles'

type ActionLinkVariant = 'primary' | 'secondary' | 'ghost'
type ActionLinkSize = 'sm' | 'md'

interface ActionLinkProps extends LinkProps {
  children: ReactNode
  variant?: ActionLinkVariant
  size?: ActionLinkSize
}

const variantClasses = {
  primary: buttonStyles('primary'),
  secondary: buttonStyles('secondary'),
  ghost: buttonStyles('ghost'),
}

const sizeClasses: Record<ActionLinkSize, string> = {
  sm: 'min-h-9 px-3 py-1.5 text-xs',
  md: 'min-h-10 px-4 py-2 text-sm',
}

export function ActionLink({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ActionLinkProps) {
  return (
    <Link
      {...props}
      className={[
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-[0.625rem] font-bold transition-colors',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Link>
  )
}

export default ActionLink
