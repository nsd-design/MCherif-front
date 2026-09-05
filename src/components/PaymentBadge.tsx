import styles from './PaymentBadge.module.css'
import { paymentColors } from '../theme/tokens'
import { paymentMethodLabel } from '../i18n/enums'
import type { PaymentMethod } from '../api/types'

const SIGLE: Record<PaymentMethod, string> = {
  ORANGE_MONEY: 'OM',
  MTN_MOMO: 'Mo',
  YMONEY: 'YM',
  CARD: 'CB',
}

/** Pastille colorée du moyen de paiement + libellé. */
export function PaymentBadge({ method }: { method: PaymentMethod }) {
  const color = paymentColors[method]
  return (
    <span className={styles.wrap}>
      <span className={styles.chip} style={{ background: color.bg, color: color.fg }}>
        {SIGLE[method]}
      </span>
      <span className={styles.label}>{paymentMethodLabel(method)}</span>
    </span>
  )
}
