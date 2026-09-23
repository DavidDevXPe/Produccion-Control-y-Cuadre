import { useState } from 'react'

import type { LocalUserProfile } from '../../config/localUser'

interface UserIdentityProps {
  user: LocalUserProfile
  responsive?: boolean
  className?: string
}

export function UserIdentity({
  user,
  responsive = false,
  className = '',
}: UserIdentityProps) {
  const [hasImageError, setHasImageError] = useState(false)

  return (
    <div
      className={`flex min-w-0 items-center gap-2 ${className}`}
      data-responsive={responsive || undefined}
    >
      <span
        className={`grid shrink-0 place-items-center overflow-hidden rounded-full border-[1.5px] border-ui-brand bg-ui-surface-dark text-[0.6875rem] font-bold tracking-[0.04em] text-ui-text-dark-strong ${
          responsive ? 'size-8 lg:size-[2.375rem]' : 'size-[2.375rem]'
        }`}
      >
        {hasImageError ? (
          <span role="img" aria-label={`Avatar de ${user.name}`}>
            {user.initials}
          </span>
        ) : (
          <img
            src={user.avatarUrl}
            alt={`Avatar de ${user.name}`}
            className="size-full object-cover"
            onError={() => setHasImageError(true)}
          />
        )}
      </span>
      <span
        className={
          responsive
            ? 'hidden min-w-0 flex-col justify-center lg:flex'
            : 'flex min-w-0 flex-col justify-center'
        }
      >
        <span className="block truncate text-xs font-bold leading-4 text-slate-900">
          {user.name}
        </span>
        <span className="mt-0.5 block truncate text-[0.625rem] font-medium leading-3 text-slate-500">
          {user.role}
        </span>
      </span>
    </div>
  )
}

export default UserIdentity
