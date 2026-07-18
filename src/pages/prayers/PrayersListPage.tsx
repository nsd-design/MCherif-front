import { useMemo, useState } from 'react'
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
import { Card } from '../../components/Card'
import { usePrayers } from '../../api/hooks'
import { formatDateShort, formatDuration, formatNumber } from '../../lib/format'
import { fr } from '../../i18n/fr'
import type { Prayer } from '../../types'

type Filter = 'all' | 'published' | 'draft' | 'encoding' | 'free' | 'premium'

const FILTERS: ChipOption<Filter>[] = [
  { value: 'all', label: 'Tous' },
  { value: 'published', label: 'Publiés' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'encoding', label: 'En encodage' },
  { value: 'free', label: 'Gratuits' },
  { value: 'premium', label: 'Premium' },
]

function matchesFilter(p: Prayer, filter: Filter): boolean {
  switch (filter) {
    case 'all':
      return true
    case 'free':
      return p.access === 'free'
    case 'premium':
      return p.access === 'premium'
    default:
      return p.status === filter
  }
}

export function PrayersListPage() {
  const navigate = useNavigate()
  const { data, isLoading } = usePrayers()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const rows = useMemo(() => {
    const list = data ?? []
    const q = search.trim().toLowerCase()
    return list.filter(
      (p) =>
        matchesFilter(p, filter) &&
        (q === '' ||
          p.title.toLowerCase().includes(q) ||
          p.theme.toLowerCase().includes(q)),
    )
  }, [data, filter, search])

  const columns = useMemo<ColumnDef<Prayer, unknown>[]>(
    () => [
      {
        id: 'cover',
        header: () => '',
        size: 56,
        enableSorting: false,
        cell: ({ row }) => (
          <img src={row.original.coverUrl} alt="" className={styles.cover} />
        ),
      },
      {
        accessorKey: 'title',
        header: () => 'Titre',
        cell: ({ row }) => <span className={styles.title}>{row.original.title}</span>,
      },
      { accessorKey: 'theme', header: () => 'Thème', size: 110 },
      {
        accessorKey: 'recordedAt',
        header: () => 'Date',
        size: 130,
        cell: ({ row }) => (
          <span className={styles.muted}>{formatDateShort(row.original.recordedAt)}</span>
        ),
      },
      {
        accessorKey: 'durationSec',
        header: () => 'Durée',
        size: 90,
        cell: ({ row }) => (
          <span className={styles.muted}>{formatDuration(row.original.durationSec)}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: () => 'Statut',
        size: 130,
        cell: ({ row }) => <PrayerStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'access',
        header: () => 'Accès',
        size: 100,
        cell: ({ row }) => <AccessBadge access={row.original.access} />,
      },
      {
        accessorKey: 'plays',
        header: () => 'Écoutes',
        size: 90,
        cell: ({ row }) => (
          <span className={styles.plays}>
            {row.original.plays === null ? '—' : formatNumber(row.original.plays)}
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
            {fr.nav.prayers}{' '}
            <span className={styles.count}>· 128 enregistrements</span>
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
        </div>

        {isLoading ? (
          <Card flush>
            <SkeletonRows rows={7} height={24} />
          </Card>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            onRowClick={(p) => navigate(`/preches/${p.id}`)}
          />
        )}

        <Pagination
          page={1}
          pageCount={13}
          summary="128 prêches · page 1 sur 13"
          onChange={() => undefined}
        />
      </PageBody>
    </>
  )
}
