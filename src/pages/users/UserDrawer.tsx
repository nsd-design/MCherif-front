import { useState } from 'react'
import styles from './UserDrawer.module.css'
import { Drawer } from '../../components/Drawer'
import { Avatar } from '../../components/Avatar'
import { Button } from '../../components/Button'
import { ConfirmModal } from '../../components/Modal'
import { SkeletonRows } from '../../components/Skeleton'
import { ErrorState } from '../../components/ErrorState'
import {
  useUser,
  useRevokeDevice,
  useExtendSubscription,
  useBlockUser,
  useUnblockUser,
} from '../../api/users'
import { toast } from '../../store/toast'
import { errorMessage } from '../../i18n/errors'
import { initials } from '../../lib/initials'
import { subscriptionStatusLabel, paymentMethodLabel, planCodeLabel } from '../../i18n/enums'
import { formatDateShort, formatGnf } from '../../lib/format'

interface UserDrawerProps {
  userId: string | null
  onClose: () => void
}

export function UserDrawer({ userId, onClose }: UserDrawerProps) {
  const { data: user, isLoading, isError, error, refetch } = useUser(userId)
  const revoke = useRevokeDevice(userId ?? '')
  const extend = useExtendSubscription(userId ?? '')
  const block = useBlockUser(userId ?? '')
  const unblock = useUnblockUser(userId ?? '')

  const [confirmBlock, setConfirmBlock] = useState(false)

  async function run(action: Promise<unknown>, okMessage: string) {
    try {
      await action
      toast.success(okMessage)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const isBlocked = user?.status === 'BLOCKED'

  return (
    <Drawer open={userId !== null} onClose={onClose} ariaLabel="Détail utilisateur">
      {isLoading || !user ? (
        isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : (
          <SkeletonRows rows={6} height={40} />
        )
      ) : (
        <>
          <div className={styles.head}>
            <Avatar initials={initials(user.displayName, user.phone ?? '')} size={48} variant="soft" />
            <div className={styles.headInfo}>
              <div className={styles.name}>{user.displayName ?? 'Sans nom'}</div>
              <div className={styles.meta}>
                {user.phone}
                {user.registeredAt ? ` · inscrit le ${formatDateShort(user.registeredAt)}` : ''}
              </div>
            </div>
          </div>

          {user.subscription ? (
            <div className={styles.subCard}>
              <div className={styles.subTop}>
                <span className={styles.subLabel}>Abonnement</span>
                <span className={styles.subStatus}>
                  {subscriptionStatusLabel(user.subscription.status).toUpperCase()}
                </span>
              </div>
              <div className={styles.subPlan}>{planCodeLabel(user.subscription.planCode)}</div>
              {user.subscription.expiresAt && (
                <div className={styles.subDate}>
                  {user.subscription.status === 'ACTIVE' ? 'Valable' : 'Expiré'} jusqu'au{' '}
                  {formatDateShort(user.subscription.expiresAt)}
                </div>
              )}
            </div>
          ) : (
            <div className={styles.noSub}>Aucun abonnement actif</div>
          )}

          <div className={styles.sectionLabel}>APPAREILS LIÉS</div>
          <div className={styles.devices}>
            {(user.devices ?? []).length === 0 ? (
              <div className={styles.emptyPayments}>Aucun appareil</div>
            ) : (
              user.devices?.map((device) => (
                <div key={device.deviceId} className={styles.device}>
                  <div>
                    <div className={styles.deviceName}>
                      {device.label ?? device.platform ?? 'Appareil'}
                    </div>
                    <div className={styles.deviceMeta}>
                      {device.lastSeenAt
                        ? `Dernière écoute : ${formatDateShort(device.lastSeenAt)}`
                        : '—'}
                    </div>
                  </div>
                  {!device.revoked && device.deviceId && (
                    <button
                      className={styles.revoke}
                      disabled={revoke.isPending}
                      onClick={() => run(revoke.mutateAsync(device.deviceId!), 'Appareil révoqué.')}
                    >
                      Révoquer
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className={styles.sectionLabel}>HISTORIQUE DE PAIEMENTS</div>
          <div className={styles.payments}>
            {(user.payments ?? []).length === 0 ? (
              <div className={styles.emptyPayments}>Aucun paiement</div>
            ) : (
              user.payments?.map((p, i) => (
                <div key={i} className={styles.payment}>
                  <span className={styles.paymentLabel}>
                    {p.date ? formatDateShort(p.date) : '—'} · {planCodeLabel(p.plan)} ·{' '}
                    {paymentMethodLabel(p.method)}
                  </span>
                  <span className={styles.paymentAmount}>{formatGnf(p.amountGnf ?? 0)}</span>
                </div>
              ))
            )}
          </div>

          <div className={styles.footer}>
            <Button
              variant="primary"
              block
              disabled={extend.isPending}
              onClick={() => run(extend.mutateAsync({ days: 30 }), 'Abonnement prolongé de 30 jours.')}
            >
              Prolonger
            </Button>
            {isBlocked ? (
              <Button
                variant="secondary"
                block
                disabled={unblock.isPending}
                onClick={() => run(unblock.mutateAsync(), 'Utilisateur débloqué.')}
              >
                Débloquer
              </Button>
            ) : (
              <Button variant="danger" block onClick={() => setConfirmBlock(true)}>
                Bloquer
              </Button>
            )}
          </div>

          <ConfirmModal
            open={confirmBlock}
            title="Bloquer cet utilisateur ?"
            description="Son accès à l'application sera immédiatement suspendu."
            confirmLabel="Bloquer"
            danger
            onConfirm={() => {
              setConfirmBlock(false)
              run(block.mutateAsync(), 'Utilisateur bloqué.')
            }}
            onCancel={() => setConfirmBlock(false)}
          />
        </>
      )}
    </Drawer>
  )
}
