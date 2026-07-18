import styles from './PaymentBadge.module.css'
import { paymentColors } from '../theme/tokens'
import type { PaymentMethod } from '../types'

const META: Record<PaymentMethod, { label: string; sigle: string; color: { bg: string; fg: string } }> = {
  orange: { label: 'Orange Money', sigle: 'OM', color: paymentColors.orange },
  mtn: { label: 'MTN MoMo', sigle: 'Mo', color: paymentColors.mtn },
  card: { label: 'Carte bancaire', sigle: 'CB', color: paymentColors.card },
}

/** Pastille colorée du moyen de paiement + libellé. */
export function PaymentBadge({ method }: { method: PaymentMethod }) {
  const { label, sigle, color } = META[method]
  return (
    <span className={styles.wrap}>
      <span
        className={styles.chip}
        style={{ background: color.bg, color: color.fg }}
      >
        {sigle}
      </span>
      <span className={styles.label}>{label}</span>
    </span>
  )
}
