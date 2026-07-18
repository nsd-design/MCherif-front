import styles from './Skeleton.module.css'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  radius?: string
  className?: string
}

/** Bloc de chargement animé. Jamais de spinner plein écran. */
export function Skeleton({ width = '100%', height = 14, radius, className }: SkeletonProps) {
  return (
    <span
      className={`${styles.skeleton} ${className ?? ''}`}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  )
}

/** Lignes de squelette empilées pour une table ou une liste. */
export function SkeletonRows({ rows = 6, height = 20 }: { rows?: number; height?: number }) {
  return (
    <div className={styles.rows}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={height} />
      ))}
    </div>
  )
}
