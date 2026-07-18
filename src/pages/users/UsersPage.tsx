import { useMemo, useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import styles from './UsersPage.module.css'
import { TopBar } from '../../components/TopBar'
import { PageBody } from '../../components/PageBody'
import { FilterChips, type ChipOption } from '../../components/FilterChips'
import { DataTable } from '../../components/DataTable'
import { Avatar } from '../../components/Avatar'
import { SubscriptionBadge } from '../../components/StatusBadge'
import { Icon } from '../../components/Icon'
import { SkeletonRows } from '../../components/Skeleton'
import { Card } from '../../components/Card'
import { UserDrawer } from './UserDrawer'
import { useUsers } from '../../api/hooks'
import { formatDateShort } from '../../lib/format'
import { fr } from '../../i18n/fr'
import type { SubscriptionStatus, User } from '../../types'

type Filter = 'all' | SubscriptionStatus

const FILTERS: ChipOption<Filter>[] = [
  { value: 'all', label: 'Tous' },
  { value: 'active', label: 'Actifs' },
  { value: 'expired', label: 'Expirés' },
  { value: 'none', label: 'Sans abonnement' },
]

export function UsersPage() {
  const { data, isLoading } = useUsers()
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<User | null>(null)

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (u) => filter === 'all' || u.subscriptionStatus === filter,
      ),
    [data, filter],
  )

  const columns = useMemo<ColumnDef<User, unknown>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: () => 'Utilisateur',
        cell: ({ row }) => (
          <span className={styles.user}>
            <Avatar initials={row.original.initials} size={32} variant="soft" />
            <span className={styles.userName}>{row.original.fullName}</span>
          </span>
        ),
      },
      {
        accessorKey: 'phone',
        header: () => 'Téléphone',
        size: 160,
        cell: ({ row }) => <span className={styles.muted}>{row.original.phone}</span>,
      },
      {
        accessorKey: 'registeredAt',
        header: () => 'Inscription',
        size: 130,
        cell: ({ row }) => (
          <span className={styles.muted}>{formatDateShort(row.original.registeredAt)}</span>
        ),
      },
      {
        accessorKey: 'subscriptionStatus',
        header: () => 'Abonnement',
        size: 150,
        cell: ({ row }) => <SubscriptionBadge status={row.original.subscriptionStatus} />,
      },
      {
        accessorKey: 'subscriptionEndsAt',
        header: () => 'Échéance',
        size: 130,
        cell: ({ row }) => (
          <span className={styles.muted}>
            {row.original.subscriptionEndsAt
              ? formatDateShort(row.original.subscriptionEndsAt)
              : '—'}
          </span>
        ),
      },
      {
        id: 'devices',
        header: () => 'Appareils',
        size: 90,
        enableSorting: false,
        cell: ({ row }) => (
          <span className={styles.devices}>
            {row.original.devicesUsed} / {row.original.devicesMax}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => '',
        size: 44,
        enableSorting: false,
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
            {fr.nav.users} <span className={styles.count}>· 4 812 comptes</span>
          </span>
        }
        showSearch
      />
      <PageBody tight>
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
        {isLoading ? (
          <Card flush>
            <SkeletonRows rows={7} height={24} />
          </Card>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            onRowClick={setSelected}
            isRowHighlighted={(u) => u.id === selected?.id}
          />
        )}
      </PageBody>

      <UserDrawer user={selected} onClose={() => setSelected(null)} />
    </>
  )
}
