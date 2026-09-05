import styles from './StatusBadge.module.css'
import type {
  PrayerStatus,
  SubscriptionStatus,
  PaymentStatus,
  PrayerAccess,
  NotificationTarget,
  AdminRole,
  UserStatus,
} from '../api/types'
import {
  adminRoleLabel,
  notificationTargetLabel,
  paymentStatusLabel,
  prayerAccessLabel,
  prayerStatusLabel,
  subscriptionStatusLabel,
  userStatusLabel,
} from '../i18n/enums'
import { fr } from '../i18n/fr'

type Tone = 'success' | 'warn' | 'muted' | 'danger'

function Pill({ tone, children }: { tone: Tone; children: string }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>
}

const PRAYER_TONE: Record<PrayerStatus, Tone> = {
  PUBLISHED: 'success',
  ENCODING: 'warn',
  DRAFT: 'muted',
  FAILED: 'danger',
}

export function PrayerStatusBadge({ status }: { status: PrayerStatus }) {
  return <Pill tone={PRAYER_TONE[status]}>{prayerStatusLabel(status)}</Pill>
}

const SUB_TONE: Record<SubscriptionStatus, Tone> = {
  ACTIVE: 'success',
  EXPIRED: 'danger',
}

/** Statut d'abonnement ; `null` = aucun abonnement. */
export function SubscriptionBadge({ status }: { status: SubscriptionStatus | null }) {
  if (status == null) return <Pill tone="muted">{fr.status.none}</Pill>
  return <Pill tone={SUB_TONE[status]}>{subscriptionStatusLabel(status)}</Pill>
}

const TX_TONE: Record<PaymentStatus, Tone> = {
  SUCCESS: 'success',
  PENDING: 'warn',
  FAILED: 'danger',
}

export function TransactionBadge({ status }: { status: PaymentStatus }) {
  return <Pill tone={TX_TONE[status]}>{paymentStatusLabel(status)}</Pill>
}

const USER_TONE: Record<UserStatus, Tone> = {
  ACTIVE: 'success',
  BLOCKED: 'danger',
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return <Pill tone={USER_TONE[status]}>{userStatusLabel(status)}</Pill>
}

/** Gratuit = pilule contour primary ; Premium = pilule neutre. */
export function AccessBadge({ access }: { access: PrayerAccess }) {
  if (access === 'FREE') {
    return <span className={`${styles.badge} ${styles.freeOutline}`}>{prayerAccessLabel(access)}</span>
  }
  return <Pill tone="muted">{prayerAccessLabel(access)}</Pill>
}

export function TargetBadge({ target }: { target: NotificationTarget }) {
  return (
    <Pill tone={target === 'ALL' ? 'success' : 'muted'}>{notificationTargetLabel(target)}</Pill>
  )
}

export function RoleBadge({ role }: { role: AdminRole }) {
  return <Pill tone={role === 'SUPER_ADMIN' ? 'success' : 'muted'}>{adminRoleLabel(role)}</Pill>
}
