import { useState } from 'react'
import styles from './NotificationsPage.module.css'
import { TopBar } from '../../components/TopBar'
import { PageBody } from '../../components/PageBody'
import { Card, CardTitle } from '../../components/Card'
import { TextField } from '../../components/TextField'
import { TextareaField } from '../../components/TextareaField'
import { SegmentedControl } from '../../components/SegmentedControl'
import { Button } from '../../components/Button'
import { Pagination } from '../../components/Pagination'
import { TargetBadge } from '../../components/StatusBadge'
import { SkeletonRows } from '../../components/Skeleton'
import { ErrorState } from '../../components/ErrorState'
import { useNotifications, useSendNotification } from '../../api/notifications'
import { toast } from '../../store/toast'
import { errorMessage } from '../../i18n/errors'
import { formatDateShort, formatNumber } from '../../lib/format'
import { pageView, usePagedResource } from '../../lib/usePagedResource'
import { fr } from '../../i18n/fr'
import type { NotificationTarget } from '../../api/types'

const PAGE_SIZE = 20

export function NotificationsPage() {
  const list = usePagedResource({ initialFilters: {}, pageSize: PAGE_SIZE })
  const { data, isLoading, isError, error, refetch } = useNotifications(list.page, list.pageSize)
  const send = useSendNotification()

  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [target, setTarget] = useState<NotificationTarget>('ALL')

  const { rows: items, totalPages, totalElements } = pageView(data)

  async function handleSend() {
    if (!title.trim() || !message.trim()) {
      toast.error('Renseignez le titre et le message.')
      return
    }
    try {
      await send.mutateAsync({ title, message, target })
      toast.success('Notification envoyée.')
      setTitle('')
      setMessage('')
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <>
      <TopBar title={fr.nav.notifications} showAvatar={false} />
      <PageBody tight>
        <div className={styles.columns}>
          <Card className={styles.history}>
            <CardTitle>Historique</CardTitle>
            <div className={styles.list}>
              {isLoading ? (
                <SkeletonRows rows={5} height={40} />
              ) : isError ? (
                <ErrorState error={error} onRetry={() => refetch()} />
              ) : items.length === 0 ? (
                <div className={styles.emptyList}>Aucune notification envoyée</div>
              ) : (
                items.map((n) => (
                  <div key={n.id} className={styles.item}>
                    <div className={styles.itemHead}>
                      <span className={styles.itemTitle}>{n.title}</span>
                      <span className={styles.itemDate}>
                        {n.sentAt ? formatDateShort(n.sentAt) : ''}
                      </span>
                    </div>
                    <div className={styles.itemMsg}>{n.message}</div>
                    <div className={styles.itemFoot}>
                      {n.target && <TargetBadge target={n.target} />}
                      <span className={styles.itemCount}>
                        {formatNumber(n.sentCount ?? 0)} envoyées
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {totalPages > 1 && (
              <Pagination
                page={list.page + 1}
                pageCount={totalPages}
                summary={`${formatNumber(totalElements)} notifications · page ${list.page + 1} sur ${totalPages}`}
                onChange={(p) => list.setPage(p - 1)}
              />
            )}
          </Card>

          <div className={styles.side}>
            <Card className={styles.compose}>
              <CardTitle>Nouvelle notification</CardTitle>
              <TextField
                label="Titre"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
              <TextareaField
                label="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={1000}
              />
              <div className={styles.targetRow}>
                <span className={styles.targetLabel}>Cible</span>
                <SegmentedControl<NotificationTarget>
                  ariaLabel="Cible"
                  value={target}
                  onChange={setTarget}
                  segments={[
                    { value: 'ALL', label: 'Tous' },
                    { value: 'SUBSCRIBERS', label: 'Abonnés' },
                  ]}
                />
              </div>
              <Button variant="primary" block onClick={handleSend} disabled={send.isPending}>
                {send.isPending ? 'Envoi…' : 'Envoyer la notification'}
              </Button>
            </Card>

            <Card>
              <div className={styles.previewLabel}>APERÇU MOBILE</div>
              <div className={styles.preview}>
                <img src="/cheick.jpeg" alt="" className={styles.previewImg} />
                <div className={styles.previewBody}>
                  <div className={styles.previewTop}>
                    <span className={styles.previewOrg}>{fr.app.orgName}</span>
                    <span className={styles.previewTime}>maintenant</span>
                  </div>
                  <div className={styles.previewTitle}>{title || 'Titre'}</div>
                  <div className={styles.previewMsg}>{message || 'Message de la notification…'}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </PageBody>
    </>
  )
}
