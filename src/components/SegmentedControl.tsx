import styles from './SegmentedControl.module.css'

interface Segment<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel?: string
}

/** Bascule segmentée (Gratuit/Premium, Tous/Abonnés, Clair/Sombre). */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div className={styles.wrap} role="tablist" aria-label={ariaLabel}>
      {segments.map((seg) => {
        const active = seg.value === value
        return (
          <button
            key={seg.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`${styles.segment} ${active ? styles.active : ''}`}
            onClick={() => onChange(seg.value)}
          >
            {seg.label}
          </button>
        )
      })}
    </div>
  )
}
