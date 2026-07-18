import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import styles from './PaymentsPage.module.css'
import { TopBar } from '../../components/TopBar'
import { PageBody } from '../../components/PageBody'
import { StatCard } from '../../components/StatCard'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Icon } from '../../components/Icon'
import { DataTable } from '../../components/DataTable'
import { PaymentBadge } from '../../components/PaymentBadge'
import { TransactionBadge } from '../../components/StatusBadge'
import { SkeletonRows } from '../../components/Skeleton'
import { useTransactions, usePaymentSummary } from '../../api/hooks'
import { formatDateShort, formatGnf } from '../../lib/format'
import type { Transaction } from '../../types'

const PLAN_LABEL: Record<Transaction['plan'], string> = {
  monthly: 'Mensuel',
  yearly: 'Annuel',
}

const DROPDOWN_FILTERS = ['30 derniers jours', 'Tous les moyens', 'Tous les statuts']

export function PaymentsPage() {
  const { data, isLoading } = useTransactions()
  const summary = usePaymentSummary()

  const columns = useMemo<ColumnDef<Transaction, unknown>[]>(
    () => [
      {
        accessorKey: 'date',
        header: () => 'Date',
        size: 110,
        cell: ({ row }) => (
          <span className={styles.muted}>{formatDateShort(row.original.date)}</span>
        ),
      },
      {
        accessorKey: 'phone',
        header: () => 'Utilisateur',
        cell: ({ row }) => <span className={styles.phone}>{row.original.phone}</span>,
      },
      {
        accessorKey: 'plan',
        header: () => 'Plan',
        size: 90,
        cell: ({ row }) => (
          <span className={styles.muted}>{PLAN_LABEL[row.original.plan]}</span>
        ),
      },
      {
        accessorKey: 'method',
        header: () => 'Moyen',
        size: 180,
        enableSorting: false,
        cell: ({ row }) => <PaymentBadge method={row.original.method} />,
      },
      {
        accessorKey: 'amountGnf',
        header: () => 'Montant',
        size: 130,
        cell: ({ row }) => (
          <span className={styles.amount}>{formatGnf(row.original.amountGnf)}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: () => 'Statut',
        size: 110,
        cell: ({ row }) => <TransactionBadge status={row.original.status} />,
      },
      {
        accessorKey: 'reference',
        header: () => 'Référence',
        size: 110,
        cell: ({ row }) => <span className={styles.ref}>{row.original.reference}</span>,
      },
    ],
    [],
  )

  return (
    <>
      <TopBar
        title="Abonnements & paiements"
        showAvatar={false}
        actions={
          <Button
            variant="secondary"
            leadingIcon={<Icon name="download" size={14} strokeWidth={2.2} />}
          >
            Exporter (CSV)
          </Button>
        }
      />
      <PageBody tight>
        <div className={styles.summary}>
          {summary.isLoading || !summary.data ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <SkeletonRows rows={2} height={20} />
              </Card>
            ))
          ) : (
            <>
              <StatCard
                label="Revenus du mois"
                value={formatGnf(summary.data.monthlyRevenueGnf)}
                change={summary.data.monthlyRevenueChange}
              />
              <StatCard
                label="Abonnements actifs"
                value={summary.data.activeSubscriptions}
                change={summary.data.activeSubscriptionsChange}
              />
              <StatCard
                label="Taux de renouvellement"
                value={summary.data.renewalRate}
                change={summary.data.renewalRateChange}
                changeTone="neutral"
              />
            </>
          )}
        </div>

        <div className={styles.filters}>
          {DROPDOWN_FILTERS.map((label) => (
            <button key={label} className={styles.filter}>
              {label}
              <Icon name="chevronDown" size={11} strokeWidth={2.6} />
            </button>
          ))}
        </div>

        {isLoading || !data ? (
          <Card flush>
            <SkeletonRows rows={7} height={24} />
          </Card>
        ) : (
          <DataTable columns={columns} data={data} />
        )}
      </PageBody>
    </>
  )
}
