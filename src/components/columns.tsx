import type { ReactNode } from 'react'
import type { CellContext, ColumnDef } from '@tanstack/react-table'
import styles from './columns.module.css'
import { formatDateShort } from '../lib/format'

/*
 * Fabrique de colonnes partagées (DataTable) : les mêmes idiomes de cellule
 * (texte atténué avec repli « — », date formatée, badge de statut) étaient
 * dupliqués à l'identique entre PrayersListPage/UsersPage/PaymentsPage. Pas de
 * changement de comportement visé — juste une seule implémentation.
 */

interface TextColumnOptions<T, V> {
  id: string
  header: string
  accessor: (row: T) => V | null | undefined
  /** Par défaut : `String(value)`. */
  format?: (value: V) => string
  size?: number
  enableSorting?: boolean
}

export function textColumn<T, V = string>({
  id,
  header,
  accessor,
  format = (v: V) => String(v),
  size,
  enableSorting,
}: TextColumnOptions<T, V>): ColumnDef<T, unknown> {
  return {
    id,
    header: () => header,
    size,
    enableSorting,
    cell: ({ row }: CellContext<T, unknown>) => {
      const value = accessor(row.original)
      return <span className={styles.muted}>{value != null ? format(value) : '—'}</span>
    },
  }
}

interface DateColumnOptions<T> {
  id: string
  header: string
  accessor: (row: T) => string | null | undefined
  size?: number
  enableSorting?: boolean
}

/** `textColumn` avec `formatDateShort` — sucre syntaxique pour le cas le plus fréquent. */
export function dateColumn<T>(opts: DateColumnOptions<T>): ColumnDef<T, unknown> {
  return textColumn({ ...opts, format: formatDateShort })
}

interface BadgeColumnOptions<T, V> {
  id: string
  header: string
  accessor: (row: T) => V
  /** Chaque appelant garde son patron de garde (`v ? <Badge/> : null`, ou un
   *  badge qui gère lui-même `null`) — la fabrique ne l'impose pas. */
  render: (value: V) => ReactNode
  size?: number
  enableSorting?: boolean
}

export function badgeColumn<T, V>({
  id,
  header,
  accessor,
  render,
  size,
  enableSorting,
}: BadgeColumnOptions<T, V>): ColumnDef<T, unknown> {
  return {
    id,
    header: () => header,
    size,
    enableSorting,
    cell: ({ row }: CellContext<T, unknown>) => render(accessor(row.original)),
  }
}
