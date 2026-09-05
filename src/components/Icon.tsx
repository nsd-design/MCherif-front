/*
 * Jeu d'icônes FontAwesome (gratuit — Classic Solid + Regular ; Light/Duotone/
 * Thin sont Pro, écartés). Couleur héritée via currentColor (comportement par
 * défaut de FontAwesomeIcon), taille paramétrable. Aucune couleur en dur.
 */
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faGaugeHigh,
  faMusic,
  faUpload,
  faUsers,
  faCreditCard,
  faBell,
  faSliders,
  faMagnifyingGlass,
  faPlus,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faCheck,
  faDownload,
  faPenToSquare,
  faTrashCan,
  faXmark,
  faLock,
} from '@fortawesome/free-solid-svg-icons'
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons'

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
  | 'upload'
  | 'audio'
  | 'check'
  | 'close'
  | 'lock'
  | 'download'
  | 'eye'
  | 'eyeOff'
  | 'edit'
  | 'delete'

/*
 * `close`/`lock` visés en Regular à l'origine (indicateurs passifs) : absents
 * du sous-ensemble Regular gratuit (`faXmark`/`faLock` n'y existent pas) —
 * repli sur Solid. `eye`/`eyeOff` restent en Regular (présents côté gratuit).
 */
const ICONS: Record<IconName, IconDefinition> = {
  dashboard: faGaugeHigh,
  prayers: faMusic,
  publish: faUpload,
  users: faUsers,
  payments: faCreditCard,
  notifications: faBell,
  settings: faSliders,
  search: faMagnifyingGlass,
  plus: faPlus,
  chevronDown: faChevronDown,
  chevronLeft: faChevronLeft,
  chevronRight: faChevronRight,
  upload: faUpload,
  audio: faMusic,
  check: faCheck,
  close: faXmark,
  lock: faLock,
  download: faDownload,
  eye: faEye,
  eyeOff: faEyeSlash,
  edit: faPenToSquare,
  delete: faTrashCan,
}

interface IconProps {
  name: IconName
  size?: number
  /** @deprecated Ignoré : les glyphes FontAwesome ont une graisse fixe par style (Solid/Regular), pas d'épaisseur de trait réglable. Conservé pour compatibilité avec les appels existants. */
  strokeWidth?: number
  className?: string
}

export function Icon({ name, size = 18, className }: IconProps) {
  return (
    <FontAwesomeIcon
      icon={ICONS[name]}
      style={{ fontSize: size }}
      className={className}
      aria-hidden="true"
    />
  )
}
