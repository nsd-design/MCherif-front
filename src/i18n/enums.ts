/*
 * Dictionnaires code enum → libellé FR. Le backend ne renvoie que des codes
 * (§8 CLAUDE.md) ; ce frontend possède l'intégralité du texte affiché.
 * Repli générique si une valeur inconnue apparaît (jamais afficher le code brut).
 */
import type {
  AdminRole,
  NotificationTarget,
  PaymentMethod,
  PaymentStatus,
  PrayerAccess,
  PrayerStatus,
  SubscriptionStatus,
  UserStatus,
} from '../api/types'

function label<T extends string>(dict: Record<T, string>, value: T | null | undefined): string {
  if (value == null) return '—'
  return dict[value] ?? value
}

const PRAYER_STATUS: Record<PrayerStatus, string> = {
  DRAFT: 'Brouillon',
  ENCODING: 'En encodage',
  PUBLISHED: 'Publié',
  FAILED: 'Échec',
}
export const prayerStatusLabel = (v: PrayerStatus | null | undefined) => label(PRAYER_STATUS, v)

const PRAYER_ACCESS: Record<PrayerAccess, string> = {
  FREE: 'Gratuit',
  PREMIUM: 'Premium',
}
export const prayerAccessLabel = (v: PrayerAccess | null | undefined) => label(PRAYER_ACCESS, v)

const PAYMENT_METHOD: Record<PaymentMethod, string> = {
  ORANGE_MONEY: 'Orange Money',
  MTN_MOMO: 'MTN MoMo',
  YMONEY: 'YMoney',
  CARD: 'Carte bancaire',
}
export const paymentMethodLabel = (v: PaymentMethod | null | undefined) => label(PAYMENT_METHOD, v)

const PAYMENT_STATUS: Record<PaymentStatus, string> = {
  SUCCESS: 'Réussi',
  PENDING: 'En attente',
  FAILED: 'Échoué',
}
export const paymentStatusLabel = (v: PaymentStatus | null | undefined) => label(PAYMENT_STATUS, v)

const SUBSCRIPTION_STATUS: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Actif',
  EXPIRED: 'Expiré',
}
export const subscriptionStatusLabel = (v: SubscriptionStatus | null | undefined) =>
  label(SUBSCRIPTION_STATUS, v)

const USER_STATUS: Record<UserStatus, string> = {
  ACTIVE: 'Actif',
  BLOCKED: 'Bloqué',
}
export const userStatusLabel = (v: UserStatus | null | undefined) => label(USER_STATUS, v)

const NOTIFICATION_TARGET: Record<NotificationTarget, string> = {
  ALL: 'Tous',
  SUBSCRIBERS: 'Abonnés',
}
export const notificationTargetLabel = (v: NotificationTarget | null | undefined) =>
  label(NOTIFICATION_TARGET, v)

const ADMIN_ROLE: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Super admin',
  EDITOR: 'Éditeur',
}
export const adminRoleLabel = (v: AdminRole | null | undefined) => label(ADMIN_ROLE, v)

const PLAN_CODE: Record<string, string> = {
  MONTHLY: 'Mensuel',
  ANNUAL: 'Annuel',
}
/** planCode est une String libre côté API (repli = code brut). */
export const planCodeLabel = (code: string | null | undefined): string =>
  code == null ? '—' : (PLAN_CODE[code] ?? code)
