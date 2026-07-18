import { useState } from 'react'
import styles from './NotificationsPage.module.css'
import { TopBar } from '../../components/TopBar'
import { PageBody } from '../../components/PageBody'
import { Card, CardTitle } from '../../components/Card'
import { TextField } from '../../components/TextField'
import { TextareaField } from '../../components/TextareaField'
import { SegmentedControl } from '../../components/SegmentedControl'
import { Button } from '../../components/Button'
import { TargetBadge } from '../../components/StatusBadge'
import { SkeletonRows } from '../../components/Skeleton'
import { useNotifications, useSendNotification } from '../../api/hooks'
import { formatDateShort, formatNumber } from '../../lib/format'
import { fr } from '../../i18n/fr'
import type { NotificationTarget } from '../../types'

export function NotificationsPage() {
  const { data, isLoading } = useNotifications()
  const send = useSendNotification()

  const [title, setTitle] = useState('Nouveau prêche disponible')
  const [message, setMessage] = useState(
    '« La patience et la foi » — le prêche du vendredi est en ligne. Bonne écoute.',
  )
  const [target, setTarget] = useState<NotificationTarget>('all')

  function handleSend() {
    if (!title.trim() || !message.trim()) return
    send.mutate({ title, message, target })
  }

  return (
    <>
      <TopBar title={fr.nav.notifications} showAvatar={false} />
      <PageBody tight>
        <div className={styles.columns}>
          <Card className={styles.history}>
            <CardTitle>Historique</CardTitle>
            <div className={styles.list}>
              {isLoading || !data ? (
                <SkeletonRows rows={5} height={40} />
              ) : (
                data.map((n) => (
                  <div key={n.id} className={styles.item}>
                    <div className={styles.itemHead}>
                      <span className={styles.itemTitle}>{n.title}</span>
                      <span className={styles.itemDate}>{formatDateShort(n.sentAt)}</span>
                    </div>
                    <div className={styles.itemMsg}>{n.message}</div>
                    <div className={styles.itemFoot}>
                      <TargetBadge target={n.target} />
                      <span className={styles.itemCount}>
                        {formatNumber(n.sentCount)} envoyées
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <div className={styles.side}>
            <Card className={styles.compose}>
              <CardTitle>Nouvelle notification</CardTitle>
              <TextField
                label="Titre"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <TextareaField
                label="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className={styles.targetRow}>
                <span className={styles.targetLabel}>Cible</span>
                <SegmentedControl<NotificationTarget>
                  ariaLabel="Cible"
                  value={target}
                  onChange={setTarget}
                  segments={[
                    { value: 'all', label: 'Tous' },
                    { value: 'subscribers', label: 'Abonnés' },
                  ]}
                />
              </div>
              <Button
                variant="primary"
                block
                onClick={handleSend}
                disabled={send.isPending}
              >
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
                  <div className={styles.previewMsg}>{message}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </PageBody>
    </>
  )
}
