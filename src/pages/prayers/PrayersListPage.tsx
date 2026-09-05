import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import styles from './PrayersListPage.module.css'
import { TopBar } from '../../components/TopBar'
import { PageBody } from '../../components/PageBody'
import { SearchInput } from '../../components/SearchInput'
import { FilterChips, type ChipOption } from '../../components/FilterChips'
import { DataTable } from '../../components/DataTable'
import { Pagination } from '../../components/Pagination'
import { Button } from '../../components/Button'
import { Icon } from '../../components/Icon'
import { PrayerStatusBadge, AccessBadge } from '../../components/StatusBadge'
import { SkeletonRows } from '../../components/Skeleton'
import { ErrorState } from '../../components/ErrorState'
import { Card } from '../../components/Card'
import { usePrayers, type PrayerFilters } from '../../api/prayers'
import { pageView, usePagedResource } from '../../lib/usePagedResource'
import { formatDateShort, formatDuration, formatNumber } from '../../lib/format'
import { fr } from '../../i18n/fr'
import type { PrayerListItem } from '../../api/types'

type Filter = 'all' | 'published' | 'draft' | 'encoding' | 'free' | 'premium'

const FILTERS: ChipOption<Filter>[] = [
  { value: 'all', label: 'Tous' },
  { value: 'published', label: 'Publiés' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'encoding', label: 'En encodage' },
  { value: 'free', label: 'Gratuits' },
  { value: 'premium', label: 'Premium' },
]

function filterToQuery(filter: Filter): Pick<PrayerFilters, 'status' | 'access'> {
  switch (filter) {
    case 'published':
      return { status: 'PUBLISHED' }
    case 'draft':
      return { status: 'DRAFT' }
    case 'encoding':
      return { status: 'ENCODING' }
    case 'free':
      return { access: 'FREE' }
    case 'premium':
      return { access: 'PREMIUM' }
    default:
      return {}
  }
}

export function PrayersListPage() {
  const navigate = useNavigate()
  const list = usePagedResource<{ filter: Filter }>({ initialFilters: { filter: 'all' } })
  const { filter } = list.filters

  const { data, isLoading, isError, error, refetch } = usePrayers({
    ...filterToQuery(filter),
    q: list.q,
    sort: list.sort,
    page: list.page,
    size: list.pageSize,
  })

  const { rows, totalPages, totalElements } = pageView(data)

  const columns = useMemo<ColumnDef<PrayerListItem, unknown>[]>(
    () => [
      {
        id: 'cover',
        header: () => '',
        size: 56,
        cell: () => (
          <span className={styles.cover}>
            <Icon name="audio" size={16} />
          </span>
        ),
      },
      {
        accessorKey: 'title',
        header: () => 'Titre',
        enableSorting: true,
        cell: ({ row }) => <span className={styles.title}>{row.original.title}</span>,
      },
      {
        accessorKey: 'theme',
        header: () => 'Thème',
        size: 110,
        enableSorting: true,
        cell: ({ row }) => <span className={styles.muted}>{row.original.theme ?? '—'}</span>,
      },
      {
        accessorKey: 'recordedOn',
        header: () => 'Date',
        size: 130,
        enableSorting: true,
        cell: ({ row }) => (
          <span className={styles.muted}>
            {row.original.recordedOn ? formatDateShort(row.original.recordedOn) : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'durationSec',
        header: () => 'Durée',
        size: 90,
        enableSorting: true,
        cell: ({ row }) => (
          <span className={styles.muted}>{formatDuration(row.original.durationSec ?? 0)}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: () => 'Statut',
        size: 130,
        enableSorting: true,
        cell: ({ row }) =>
          row.original.status ? <PrayerStatusBadge status={row.original.status} /> : null,
      },
      {
        accessorKey: 'access',
        header: () => 'Accès',
        size: 100,
        enableSorting: true,
        cell: ({ row }) =>
          row.original.access ? <AccessBadge access={row.original.access} /> : null,
      },
      {
        accessorKey: 'playCount',
        header: () => 'Écoutes',
        size: 90,
        enableSorting: true,
        cell: ({ row }) => (
          <span className={styles.plays}>
            {row.original.status === 'PUBLISHED' ? formatNumber(row.original.playCount ?? 0) : '—'}
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
            {fr.nav.prayers}{' '}
            <span className={styles.count}>· {formatNumber(totalElements)} enregistrements</span>
          </span>
        }
        showAvatar={false}
        actions={
          <Button
            variant="primary"
            leadingIcon={<Icon name="plus" size={14} strokeWidth={2.6} />}
            onClick={() => navigate('/publication')}
          >
            Nouveau prêche
          </Button>
        }
      />
      <PageBody tight>
        <div className={styles.toolbar}>
          <SearchInput
            placeholder="Rechercher un titre, un thème…"
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
            onRowClick={(p) => p.id && navigate(`/preches/${p.id}`)}
          />
        )}

        {totalPages > 1 && (
          <Pagination
            page={list.page + 1}
            pageCount={totalPages}
            summary={`${formatNumber(totalElements)} prêches · page ${list.page + 1} sur ${totalPages}`}
            onChange={(p) => list.setPage(p - 1)}
          />
        )}
      </PageBody>
    </>
  )
}
