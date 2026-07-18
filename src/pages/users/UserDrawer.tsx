import { useState } from 'react'
import styles from './UserDrawer.module.css'
import { Drawer } from '../../components/Drawer'
import { Avatar } from '../../components/Avatar'
import { Button } from '../../components/Button'
import { ConfirmModal } from '../../components/Modal'
import { formatDateShort, formatGnf } from '../../lib/format'
import type { User } from '../../types'

interface UserDrawerProps {
  user: User | null
  onClose: () => void
}

export function UserDrawer({ user, onClose }: UserDrawerProps) {
  const [confirmBlock, setConfirmBlock] = useState(false)

  return (
    <Drawer open={user !== null} onClose={onClose} ariaLabel="Détail utilisateur">
      {user && (
        <>
          <div className={styles.head}>
            <Avatar initials={user.initials} size={48} variant="soft" />
            <div className={styles.headInfo}>
              <div className={styles.name}>{user.fullName}</div>
              <div className={styles.meta}>
                {user.phone} · inscrit le {formatDateShort(user.registeredAt)}
              </div>
            </div>
          </div>

          {user.subscriptionStatus !== 'none' && user.planLabel ? (
            <div className={styles.subCard}>
              <div className={styles.subTop}>
                <span className={styles.subLabel}>Abonnement</span>
                <span className={styles.subStatus}>
                  {user.subscriptionStatus === 'active' ? 'ACTIF' : 'EXPIRÉ'}
                </span>
              </div>
              <div className={styles.subPlan}>{user.planLabel}</div>
              {user.subscriptionEndsAt && (
                <div className={styles.subDate}>
                  {user.subscriptionStatus === 'active' ? 'Valable' : 'Expiré'} jusqu'au{' '}
                  {formatDateShort(user.subscriptionEndsAt)}
                </div>
              )}
            </div>
          ) : (
            <div className={styles.noSub}>Aucun abonnement actif</div>
          )}

          <div className={styles.sectionLabel}>APPAREILS LIÉS</div>
          <div className={styles.devices}>
            {user.devices.map((device) => (
              <div key={device.id} className={styles.device}>
                <div>
                  <div className={styles.deviceName}>{device.name}</div>
                  <div className={styles.deviceMeta}>
                    Dernière écoute : {device.lastListenedLabel}
                  </div>
                </div>
                <button className={styles.revoke}>Révoquer</button>
              </div>
            ))}
          </div>

          <div className={styles.sectionLabel}>HISTORIQUE DE PAIEMENTS</div>
          <div className={styles.payments}>
            {user.payments.length === 0 ? (
              <div className={styles.emptyPayments}>Aucun paiement</div>
            ) : (
              user.payments.map((p) => (
                <div key={p.id} className={styles.payment}>
                  <span className={styles.paymentLabel}>
                    {p.dateLabel} · {p.plan} · {p.method}
                  </span>
                  <span className={styles.paymentAmount}>{formatGnf(p.amountGnf)}</span>
                </div>
              ))
            )}
          </div>

          <div className={styles.footer}>
            <Button variant="primary" block>
              Prolonger
            </Button>
            <Button variant="danger" block onClick={() => setConfirmBlock(true)}>
              Bloquer
            </Button>
          </div>

          <ConfirmModal
            open={confirmBlock}
            title="Bloquer cet utilisateur ?"
            description="Son accès à l'application sera immédiatement suspendu."
            confirmLabel="Bloquer"
            danger
            onConfirm={() => setConfirmBlock(false)}
            onCancel={() => setConfirmBlock(false)}
          />
        </>
      )}
    </Drawer>
  )
}
