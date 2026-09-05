import { useMemo, useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import styles from './UsersPage.module.css'
import { TopBar } from '../../components/TopBar'
import { PageBody } from '../../components/PageBody'
import { FilterChips, type ChipOption } from '../../components/FilterChips'
import { SearchInput } from '../../components/SearchInput'
import { DataTable } from '../../components/DataTable'
import { Pagination } from '../../components/Pagination'
import { Avatar } from '../../components/Avatar'
import { SubscriptionBadge } from '../../components/StatusBadge'
import { Icon } from '../../components/Icon'
import { SkeletonRows } from '../../components/Skeleton'
import { ErrorState } from '../../components/ErrorState'
import { Card } from '../../components/Card'
import { UserDrawer } from './UserDrawer'
import { useUsers, type UserFilters } from '../../api/users'
import { pageView, usePagedResource } from '../../lib/usePagedResource'
import { initials } from '../../lib/initials'
import { formatDateShort, formatNumber } from '../../lib/format'
import { fr } from '../../i18n/fr'
import type { SubscriptionStatus, UserListItem } from '../../api/types'

type Filter = 'all' | NonNullable<UserFilters['subscription']>

const FILTERS: ChipOption<Filter>[] = [
  { value: 'all', label: 'Tous' },
  { value: 'active', label: 'Actifs' },
  { value: 'expired', label: 'Expirés' },
  { value: 'no-subscription', label: 'Sans abonnement' },
]

export function UsersPage() {
  const list = usePagedResource<{ filter: Filter }>({ initialFilters: { filter: 'all' } })
  const { filter } = list.filters
  // Sélection du tiroir : état d'affichage propre à la page, hors du hook de liste.
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data, isLoading, isError, error, refetch } = useUsers({
    subscription: filter === 'all' ? undefined : filter,
    q: list.q,
    sort: list.sort,
    page: list.page,
    size: list.pageSize,
  })

  const { rows, totalPages, totalElements } = pageView(data)

  const columns = useMemo<ColumnDef<UserListItem, unknown>[]>(
    () => [
      {
        accessorKey: 'displayName',
        header: () => 'Utilisateur',
        enableSorting: true,
        cell: ({ row }) => (
          <span className={styles.user}>
            <Avatar
              initials={initials(row.original.displayName, row.original.phone ?? '')}
              size={32}
              variant="soft"
            />
            <span className={styles.userName}>{row.original.displayName ?? 'Sans nom'}</span>
          </span>
        ),
      },
      {
        accessorKey: 'phone',
        header: () => 'Téléphone',
        size: 160,
        enableSorting: true,
        cell: ({ row }) => <span className={styles.muted}>{row.original.phone}</span>,
      },
      {
        accessorKey: 'registeredAt',
        id: 'createdAt',
        header: () => 'Inscription',
        size: 130,
        enableSorting: true,
        cell: ({ row }) => (
          <span className={styles.muted}>
            {row.original.registeredAt ? formatDateShort(row.original.registeredAt) : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'subscriptionStatus',
        header: () => 'Abonnement',
        size: 150,
        cell: ({ row }) => (
          <SubscriptionBadge
            status={(row.original.subscriptionStatus as SubscriptionStatus | null) ?? null}
          />
        ),
      },
      {
        accessorKey: 'expiresAt',
        header: () => 'Échéance',
        size: 130,
        cell: ({ row }) => (
          <span className={styles.muted}>
            {row.original.expiresAt ? formatDateShort(row.original.expiresAt) : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'deviceCount',
        header: () => 'Appareils',
        size: 90,
        cell: ({ row }) => (
          <span className={styles.devices}>{row.original.deviceCount ?? 0}</span>
        ),
      },
      {
        id: 'actions',
        header: () => '',
        size: 44,
        cell: () => (
          <span className={styles.actions}>
            <Icon name="dots" size={16} />
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <>
      <TopBar
        title={
          <span>
            {fr.nav.users} <span className={styles.count}>· {formatNumber(totalElements)} comptes</span>
          </span>
        }
        showAvatar={false}
      />
      <PageBody tight>
        <div className={styles.toolbar}>
          <SearchInput
            placeholder="Rechercher un numéro…"
            value={list.search}
            onChange={(e) => list.setSearch(e.target.value)}
          />
          <FilterChips
            options={FILTERS}
            value={filter}
            onChange={(next) => list.setFilters({ filter: next })}
          />
        </div>
        {isLoading ? (
          <Card flush>
            <SkeletonRows rows={7} height={24} />
          </Card>
        ) : isError ? (
          <Card>
            <ErrorState error={error} onRetry={() => refetch()} />
          </Card>
        ) : rows.length === 0 ? (
          <Card>
            <div className={styles.empty}>{fr.common.empty}</div>
          </Card>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            sorting={list.sorting}
            onSortingChange={list.setSorting}
            onRowClick={(u) => u.id && setSelectedId(u.id)}
            isRowHighlighted={(u) => u.id === selectedId}
          />
        )}

        {totalPages > 1 && (
          <Pagination
            page={list.page + 1}
            pageCount={totalPages}
            summary={`${formatNumber(totalElements)} comptes · page ${list.page + 1} sur ${totalPages}`}
            onChange={(p) => list.setPage(p - 1)}
          />
        )}
      </PageBody>

      <UserDrawer userId={selectedId} onClose={() => setSelectedId(null)} />
    </>
  )
}
