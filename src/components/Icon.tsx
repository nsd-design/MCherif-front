/*
 * Jeu d'icônes SVG (stroke) repris des maquettes. Couleur héritée via
 * currentColor, taille paramétrable. Aucune couleur en dur.
 */
export type IconName =
  | 'dashboard'
  | 'prayers'
  | 'publish'
  | 'users'
  | 'payments'
  | 'notifications'
  | 'settings'
  | 'search'
  | 'plus'
  | 'chevronDown'
  | 'chevronLeft'
  | 'chevronRight'
  | 'calendar'
  | 'upload'
  | 'audio'
  | 'check'
  | 'close'
  | 'lock'
  | 'dots'
  | 'sun'
  | 'moon'
  | 'download'

const PATHS: Record<IconName, string> = {
  dashboard: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  prayers:
    'M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0M21 16a3 3 0 11-6 0 3 3 0 016 0',
  publish: 'M12 16V4m0 0l-5 5m5-5l5 5M4 20h16',
  users:
    'M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8m11 18v-2a4 4 0 00-3-3.87',
  payments: 'M3 7h18v13H3zM3 11h18M7 16h4',
  notifications: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0',
  settings: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  search: 'M21 21l-4.3-4.3',
  plus: 'M12 5v14M5 12h14',
  chevronDown: 'M6 9l6 6 6-6',
  chevronLeft: 'M15 18l-6-6 6-6',
  chevronRight: 'M9 18l6-6-6-6',
  calendar: 'M3 9h18M8 3v4M16 3v4',
  upload: 'M12 16V4m0 0l-5 5m5-5l5 5M4 20h16',
  audio:
    'M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0M21 16a3 3 0 11-6 0 3 3 0 016 0',
  check: 'M20 6L9 17l-5-5',
  close: 'M18 6L6 18M6 6l12 12',
  lock: 'M8 11V7a4 4 0 018 0v4',
  dots: '',
  sun: 'M12 3v2M12 19v2M5 5l1.5 1.5M17.5 17.5L19 19M3 12h2M19 12h2M5 19l1.5-1.5M17.5 6.5L19 5',
  moon: 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z',
  download: 'M12 3v12m0 0l-4-4m4 4l4-4M5 21h14',
}

interface IconProps {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
}

export function Icon({ name, size = 18, strokeWidth = 2, className }: IconProps) {
  if (name === 'search') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d={PATHS.search} />
      </svg>
    )
  }
  if (name === 'calendar') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d={PATHS.calendar} />
      </svg>
    )
  }
  if (name === 'lock') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d={PATHS.lock} />
      </svg>
    )
  }
  if (name === 'dots') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
      >
        <circle cx="12" cy="5" r="1.8" />
        <circle cx="12" cy="12" r="1.8" />
        <circle cx="12" cy="19" r="1.8" />
      </svg>
    )
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
