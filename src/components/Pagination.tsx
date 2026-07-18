import styles from './Pagination.module.css'
import { Icon } from './Icon'

interface PaginationProps {
  page: number
  pageCount: number
  summary: string
  onChange: (page: number) => void
}

/** Construit une liste compacte de pages avec ellipses autour de la page active. */
function buildPages(page: number, pageCount: number): (number | 'ellipsis')[] {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, i) => i + 1)
  }
  const middle = new Set<number>([1, page - 1, page, page + 1, pageCount])
  const sorted = [...middle].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b)
  const result: (number | 'ellipsis')[] = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) result.push('ellipsis')
    result.push(p)
    prev = p
  }
  return result
}

export function Pagination({ page, pageCount, summary, onChange }: PaginationProps) {
  const pages = buildPages(page, pageCount)
  return (
    <div className={styles.wrap}>
      <span className={styles.summary}>{summary}</span>
      <div className={styles.pages}>
        <button
          className={styles.arrow}
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="Page précédente"
        >
          <Icon name="chevronLeft" size={14} strokeWidth={2.4} />
        </button>
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e${i}`} className={styles.ellipsis}>
              …
            </span>
          ) : (
            <button
              key={p}
              className={`${styles.page} ${p === page ? styles.active : ''}`}
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ),
        )}
        <button
          className={styles.arrow}
          onClick={() => onChange(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          aria-label="Page suivante"
        >
          <Icon name="chevronRight" size={14} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  )
}
