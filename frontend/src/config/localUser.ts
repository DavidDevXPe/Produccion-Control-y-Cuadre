import davidCastilloAvatarUrl from '../assets/profile/david-castillo-160.png'

export interface LocalUserProfile {
  name: string
  role: string
  initials: string
  avatarUrl: string
}

export const localUser: LocalUserProfile = {
  name: 'David Castillo',
  role: 'Administrativo',
  initials: 'DC',
  avatarUrl: davidCastilloAvatarUrl,
}
