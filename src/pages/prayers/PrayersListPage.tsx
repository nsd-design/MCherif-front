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
import { textColumn, dateColumn, badgeColumn } from '../../components/columns'
import { SkeletonRows } from '../../components/Skeleton'
import { ErrorState } from '../../components/ErrorState'
import { ConfirmModal } from '../../components/Modal'
import { Card } from '../../components/Card'
import { PrayerDrawer } from './PrayerDrawer'
import { useDeletePrayer, usePrayers, type PrayerFilters } from '../../api/prayers'
import { pageView, usePagedResource } from '../../lib/usePagedResource'
import { formatDuration, formatNumber } from '../../lib/format'
import { toast } from '../../store/toast'
import { errorMessageFor } from '../../i18n/errors'
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
  // Sélection du tiroir : état d'affichage propre à la page, hors du hook de liste.
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const removePrayer = useDeletePrayer()

  const { data, isLoading, isError, error, refetch } = usePrayers({
    ...filterToQuery(filter),
    q: list.q,
    sort: list.sort,
    page: list.page,
    size: list.pageSize,
  })

  const { rows, totalPages, totalElements } = pageView(data)

  async function confirmDeletePrayer() {
    if (!deleteId) return
    try {
      await removePrayer.mutateAsync(deleteId)
      toast.success('Prêche supprimé.')
      if (selectedId === deleteId) setSelectedId(null)
    } catch (e) {
      toast.error(errorMessageFor(e, { conflict: 'Dépubliez le prêche avant de le supprimer.' }))
    } finally {
      setDeleteId(null)
    }
  }

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
      textColumn<PrayerListItem>({
        id: 'theme',
        header: 'Thème',
        size: 110,
        enableSorting: true,
        accessor: (row) => row.theme,
      }),
      dateColumn<PrayerListItem>({
        id: 'recordedOn',
        header: 'Date',
        size: 130,
        enableSorting: true,
        accessor: (row) => row.recordedOn,
      }),
      textColumn<PrayerListItem, number>({
        id: 'durationSec',
        header: 'Durée',
        size: 90,
        enableSorting: true,
        accessor: (row) => row.durationSec ?? 0,
        format: formatDuration,
      }),
      badgeColumn<PrayerListItem, PrayerListItem['status']>({
        id: 'status',
        header: 'Statut',
        size: 130,
        enableSorting: true,
        accessor: (row) => row.status,
        render: (status) => (status ? <PrayerStatusBadge status={status} /> : null),
      }),
      badgeColumn<PrayerListItem, PrayerListItem['access']>({
        id: 'access',
        header: 'Accès',
        size: 100,
        enableSorting: true,
        accessor: (row) => row.access,
        render: (access) => (access ? <AccessBadge access={access} /> : null),
      }),
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
      {
        id: 'actions',
        header: () => 'Action',
        size: 110,
        cell: ({ row }) => (
          <span className={styles.actions}>
            <button
              type="button"
              className={styles.actionBtn}
              aria-label="Modifier"
              onClick={(e) => {
                e.stopPropagation()
                if (row.original.id) navigate(`/preches/${row.original.id}`)
              }}
            >
              <Icon name="edit" size={15} />
            </button>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.danger}`}
              aria-label="Supprimer"
              onClick={(e) => {
                e.stopPropagation()
                if (row.original.id) setDeleteId(row.original.id)
              }}
            >
              <Icon name="delete" size={15} />
            </button>
          </span>
        ),
      },
    ],
    [navigate],
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
            onRowClick={(p) => p.id && setSelectedId(p.id)}
            isRowHighlighted={(p) => p.id === selectedId}
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

      <PrayerDrawer prayerId={selectedId} onClose={() => setSelectedId(null)} />

      <ConfirmModal
        open={deleteId !== null}
        title="Supprimer ce prêche ?"
        description="Cette action est définitive. Le fichier chiffré et ses statistiques seront supprimés."
        confirmLabel="Supprimer"
        danger
        onConfirm={confirmDeletePrayer}
        onCancel={() => setDeleteId(null)}
      />
    </>
  )
}
