import styles from './ProgressBar.module.css'

interface ProgressBarProps {
  value: number
  height?: number
}

/** Barre de progression (encodage, chiffrement). */
export function ProgressBar({ value, height = 6 }: ProgressBarProps) {
  return (
    <div className={styles.track} style={{ height }}>
      <div
        className={styles.fill}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
