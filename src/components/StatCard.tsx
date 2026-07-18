import styles from './StatCard.module.css'

interface StatCardProps {
  label: string
  value: string
  change?: string
  /** Colore la variation en vert (positif) ou en neutre. */
  changeTone?: 'positive' | 'neutral'
}

export function StatCard({ label, value, change, changeTone = 'positive' }: StatCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
      {change && (
        <div className={`${styles.change} ${styles[changeTone]}`}>{change}</div>
      )}
    </div>
  )
}
