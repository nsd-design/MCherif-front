import { useMemo, useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import styles from './PaymentsPage.module.css'
import { TopBar } from '../../components/TopBar'
import { PageBody } from '../../components/PageBody'
import { StatCard } from '../../components/StatCard'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Icon } from '../../components/Icon'
import { DataTable } from '../../components/DataTable'
import { Pagination } from '../../components/Pagination'
import { PaymentBadge } from '../../components/PaymentBadge'
import { TransactionBadge } from '../../components/StatusBadge'
import { SkeletonRows } from '../../components/Skeleton'
import { ErrorState } from '../../components/ErrorState'
import { exportPaymentsCsv, usePayments, useSubscriptionStats } from '../../api/payments'
import { toast } from '../../store/toast'
import { errorMessage } from '../../i18n/errors'
import { planCodeLabel } from '../../i18n/enums'
import { formatDateShort, formatGnf, formatNumber, formatSignedNumber } from '../../lib/format'
import { pageView, usePagedResource } from '../../lib/usePagedResource'
import type { MetricValue, PaymentListItem, PaymentMethod, PaymentStatus } from '../../api/types'

type Period = '30' | '90' | '365' | 'all'

function changeText(m?: MetricValue): string {
  if (!m) return ''
  return `${formatSignedNumber(m.change ?? 0)} ${m.changeLabel ?? ''}`.trim()
}

/*
 * Borne basse du filtre de période, TRONQUÉE À LA JOURNÉE.
 * La précision milliseconde n'a aucun sens pour un filtre « 30 derniers jours »
 * et rendait la valeur différente à chaque rendu : la `queryKey` changeait sans
 * cesse et la page bouclait sur `GET /admin/payments` sans jamais s'afficher.
 */
function periodFrom(period: Period): string | undefined {
  if (period === 'all') return undefined
  const d = new Date()
  d.setDate(d.getDate() - Number(period))
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

const PAGE_SIZE = 20

interface Filters {
  period: Period
  method: PaymentMethod | ''
  status: PaymentStatus | ''
}

export function PaymentsPage() {
  const list = usePagedResource<Filters>({
    initialFilters: { period: '30', method: '', status: '' },
    pageSize: PAGE_SIZE,
  })
  const { period, method, status } = list.filters

  // Mémoïsé : `periodFrom` ne doit être rappelé qu'au changement de période,
  // et l'objet sert aussi de source à l'export CSV plus bas.
  const filters = useMemo(
    () => ({
      from: periodFrom(period),
      method: method || undefined,
      status: status || undefined,
    }),
    [period, method, status],
  )

  const { data, isLoading, isError, error, refetch } = usePayments({
    ...filters,
    sort: list.sort,
    page: list.page,
    size: list.pageSize,
  })
  const summary = useSubscriptionStats()

  const { rows, totalPages, totalElements } = pageView(data)

  const columns = useMemo<ColumnDef<PaymentListItem, unknown>[]>(
    () => [
      {
        accessorKey: 'date',
        id: 'createdAt',
        header: () => 'Date',
        size: 110,
        enableSorting: true,
        cell: ({ row }) => (
          <span className={styles.muted}>{row.original.date ? formatDateShort(row.original.date) : '—'}</span>
        ),
      },
      {
        accessorKey: 'userPhone',
        header: () => 'Utilisateur',
        cell: ({ row }) => <span className={styles.phone}>{row.original.userPhone}</span>,
      },
      {
        accessorKey: 'plan',
        id: 'planCode',
        header: () => 'Plan',
        size: 90,
        enableSorting: true,
        cell: ({ row }) => <span className={styles.muted}>{planCodeLabel(row.original.plan)}</span>,
      },
      {
        accessorKey: 'method',
        header: () => 'Moyen',
        size: 180,
        enableSorting: true,
        cell: ({ row }) => (row.original.method ? <PaymentBadge method={row.original.method} /> : null),
      },
      {
        accessorKey: 'amountGnf',
        header: () => 'Montant',
        size: 130,
        enableSorting: true,
        cell: ({ row }) => <span className={styles.amount}>{formatGnf(row.original.amountGnf ?? 0)}</span>,
      },
      {
        accessorKey: 'status',
        header: () => 'Statut',
        size: 110,
        enableSorting: true,
        cell: ({ row }) => (row.original.status ? <TransactionBadge status={row.original.status} /> : null),
      },
      {
        accessorKey: 'reference',
        header: () => 'Référence',
        size: 110,
        enableSorting: true,
        cell: ({ row }) => <span className={styles.ref}>{row.original.reference ?? '—'}</span>,
      },
    ],
    [],
  )

  const [exporting, setExporting] = useState(false)
  async function handleExport() {
    setExporting(true)
    try {
      await exportPaymentsCsv(filters)
      toast.success('Export CSV téléchargé.')
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <TopBar
        title="Abonnements & paiements"
        showAvatar={false}
        actions={
          <Button
            variant="secondary"
            leadingIcon={<Icon name="download" size={14} strokeWidth={2.2} />}
            onClick={handleExport}
            disabled={exporting}
          >
            Exporter (CSV)
          </Button>
        }
      />
      <PageBody tight>
        <div className={styles.summary}>
          {summary.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <SkeletonRows rows={2} height={20} />
              </Card>
            ))
          ) : summary.isError || !summary.data ? (
            <Card className={styles.span3}>
              <ErrorState error={summary.error} onRetry={() => summary.refetch()} />
            </Card>
          ) : (
            <>
              <StatCard
                label="Revenus du mois"
                value={formatGnf(summary.data.monthlyRevenueGnf?.value ?? 0)}
                change={changeText(summary.data.monthlyRevenueGnf)}
              />
              <StatCard
                label="Abonnements actifs"
                value={formatNumber(summary.data.activeSubscriptions?.value ?? 0)}
                change={changeText(summary.data.activeSubscriptions)}
              />
              <StatCard
                label="Taux de renouvellement"
                value={`${summary.data.renewalRatePct?.value ?? 0} %`}
                change={changeText(summary.data.renewalRatePct)}
                changeTone="neutral"
              />
            </>
          )}
        </div>

        <div className={styles.filters}>
          <select
            className={styles.filter}
            value={period}
            onChange={(e) => list.setFilters({ period: e.target.value as Period })}
          >
            <option value="30">30 derniers jours</option>
            <option value="90">90 derniers jours</option>
            <option value="365">12 derniers mois</option>
            <option value="all">Tout</option>
          </select>
          <select
            className={styles.filter}
            value={method}
            onChange={(e) => list.setFilters({ method: e.target.value as PaymentMethod | '' })}
          >
            <option value="">Tous les moyens</option>
            <option value="ORANGE_MONEY">Orange Money</option>
            <option value="MTN_MOMO">MTN MoMo</option>
            <option value="YMONEY">YMoney</option>
            <option value="CARD">Carte bancaire</option>
          </select>
          <select
            className={styles.filter}
            value={status}
            onChange={(e) => list.setFilters({ status: e.target.value as PaymentStatus | '' })}
          >
            <option value="">Tous les statuts</option>
            <option value="SUCCESS">Réussi</option>
            <option value="PENDING">En attente</option>
            <option value="FAILED">Échoué</option>
          </select>
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
            <div className={styles.empty}>Aucune transaction</div>
          </Card>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            sorting={list.sorting}
            onSortingChange={list.setSorting}
          />
        )}

        {totalPages > 1 && (
          <Pagination
            page={list.page + 1}
            pageCount={totalPages}
            summary={`${formatNumber(totalElements)} transactions · page ${list.page + 1} sur ${totalPages}`}
            onChange={(p) => list.setPage(p - 1)}
          />
        )}
      </PageBody>
    </>
  )
}
