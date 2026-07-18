import styles from './StatusBadge.module.css'
import type {
  PrayerStatus,
  SubscriptionStatus,
  TransactionStatus,
  AccessTier,
  NotificationTarget,
  AdminRole,
} from '../types'
import { fr } from '../i18n/fr'

type Tone = 'success' | 'warn' | 'muted' | 'danger'

function Pill({ tone, children }: { tone: Tone; children: string }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>
}

const PRAYER_TONE: Record<PrayerStatus, Tone> = {
  published: 'success',
  encoding: 'warn',
  draft: 'muted',
  failed: 'danger',
}

export function PrayerStatusBadge({ status }: { status: PrayerStatus }) {
  const label = {
    published: fr.status.published,
    encoding: fr.status.encoding,
    draft: fr.status.draft,
    failed: fr.status.failed,
  }[status]
  return <Pill tone={PRAYER_TONE[status]}>{label}</Pill>
}

const SUB_TONE: Record<SubscriptionStatus, Tone> = {
  active: 'success',
  expired: 'danger',
  none: 'muted',
}

export function SubscriptionBadge({ status }: { status: SubscriptionStatus }) {
  const label = {
    active: fr.status.active,
    expired: fr.status.expired,
    none: fr.status.none,
  }[status]
  return <Pill tone={SUB_TONE[status]}>{label}</Pill>
}

const TX_TONE: Record<TransactionStatus, Tone> = {
  success: 'success',
  pending: 'warn',
  failed: 'danger',
}

export function TransactionBadge({ status }: { status: TransactionStatus }) {
  const label = {
    success: fr.status.success,
    pending: fr.status.pending,
    failed: fr.status.txFailed,
  }[status]
  return <Pill tone={TX_TONE[status]}>{label}</Pill>
}

/** Gratuit = pilule contour primary ; Premium = pilule neutre. */
export function AccessBadge({ access }: { access: AccessTier }) {
  if (access === 'free') {
    return <span className={`${styles.badge} ${styles.freeOutline}`}>{fr.common.free}</span>
  }
  return <Pill tone="muted">{fr.common.premium}</Pill>
}

export function TargetBadge({ target }: { target: NotificationTarget }) {
  return target === 'all' ? (
    <Pill tone="success">Tous</Pill>
  ) : (
    <Pill tone="muted">Abonnés</Pill>
  )
}

const ROLE_LABEL: Record<AdminRole, string> = {
  super: 'Super admin',
  editor: 'Éditeur',
  finance: 'Finance',
}

export function RoleBadge({ role }: { role: AdminRole }) {
  return (
    <Pill tone={role === 'super' ? 'success' : 'muted'}>{ROLE_LABEL[role]}</Pill>
  )
}
