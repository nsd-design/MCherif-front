import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
} from '@tanstack/react-table'
import styles from './DataTable.module.css'
import { Icon } from './Icon'

interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[]
  data: T[]
  onRowClick?: (row: T) => void
  /** Ligne mise en évidence (ex. sélection du drawer). */
  isRowHighlighted?: (row: T) => boolean
  /**
   * Tri SERVEUR, contrôlé par la page. Omettre les deux props rend le tableau
   * non triable : aucun en-tête ne devient cliquable, donc pas d'affordance morte.
   * L'`id` d'une colonne triable doit être le nom du champ côté API — c'est lui
   * qui part dans le `sort=champ,desc` de Spring.
   */
  sorting?: SortingState
  onSortingChange?: OnChangeFn<SortingState>
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  isRowHighlighted,
  sorting,
  onSortingChange,
}: DataTableProps<T>) {
  const sortable = onSortingChange !== undefined
  const table = useReactTable({
    data,
    columns,
    state: { sorting: sorting ?? [] },
    onSortingChange,
    // Le serveur trie et pagine : re-trier la page courante côté client
    // mentirait, elle ne contient qu'une tranche du jeu ordonné.
    manualSorting: true,
    enableSorting: sortable,
    // Opt-in explicite : une colonne n'est triable que si elle déclare
    // `enableSorting: true` ET que la page a câblé le tri.
    defaultColumn: { enableSorting: false },
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const sorted = header.column.getIsSorted()
                const label = header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())
                return (
                  <th
                    key={header.id}
                    className={styles.th}
                    scope="col"
                    aria-sort={
                      !canSort ? undefined : sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'
                    }
                    style={{ width: header.getSize() ? header.getSize() : undefined }}
                  >
                    {label === null ? null : canSort ? (
                      <button
                        type="button"
                        className={`${styles.thLabel} ${styles.thBtn}`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {label}
                        {sorted && (
                          <Icon
                            name="chevronDown"
                            size={11}
                            strokeWidth={2.6}
                            className={sorted === 'asc' ? styles.asc : styles.desc}
                          />
                        )}
                      </button>
                    ) : (
                      <span className={styles.thLabel}>{label}</span>
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={`${styles.tr} ${onRowClick ? styles.clickable : ''} ${
                isRowHighlighted?.(row.original) ? styles.highlighted : ''
              }`}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className={styles.td}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
