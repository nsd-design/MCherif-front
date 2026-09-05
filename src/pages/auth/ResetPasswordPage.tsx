import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styles from './LoginPage.module.css'
import { TextField } from '../../components/TextField'
import { Button } from '../../components/Button'
import { resetPassword } from '../../api/auth'
import { toast } from '../../store/toast'
import { errorMessageFor } from '../../i18n/errors'
import { fr } from '../../i18n/fr'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 10) {
      setError('Le mot de passe doit contenir au moins 10 caractères.')
      return
    }
    setBusy(true)
    try {
      await resetPassword(token, password)
      toast.success('Mot de passe réinitialisé. Connectez-vous.')
      navigate('/connexion', { replace: true })
    } catch (err) {
      // 401 ici = token de reset invalide ou expiré (TTL 30 min), pas une
      // session expirée : reprendre la formulation du cas « lien absent ».
      setError(errorMessageFor(err, { unauthorized: 'Lien invalide ou expiré.' }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <img src="/cheick.jpeg" alt="" className={styles.avatar} />
        <div className={styles.title}>Nouveau mot de passe</div>
        <div className={styles.subtitle}>Choisissez un mot de passe d'au moins 10 caractères</div>
      </div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <TextField
          label="Nouveau mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        {!token && <div className={styles.error}>Lien invalide ou expiré.</div>}
        {error && <div className={styles.error}>{error}</div>}
        <Button type="submit" variant="primary" block disabled={busy || !token}>
          {busy ? fr.common.loading : 'Réinitialiser'}
        </Button>
      </form>
    </div>
  )
}
