import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './LoginPage.module.css'
import { TextField } from '../../components/TextField'
import { Button } from '../../components/Button'
import { useAuthStore } from '../../store/auth'
import { fr } from '../../i18n/fr'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const verifyTwoFa = useAuthStore((s) => s.verifyTwoFa)
  const pendingTwoFa = useAuthStore((s) => s.pendingTwoFa)

  const [email, setEmail] = useState('a.diallo@mohamedcherif.app')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login(email, password)
    } catch {
      setError(fr.auth.errorCredentials)
    } finally {
      setBusy(false)
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await verifyTwoFa(code)
      navigate('/tableau-de-bord', { replace: true })
    } catch {
      setError(fr.auth.errorCode)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <img src="/cheick.jpeg" alt="" className={styles.avatar} />
        <div className={styles.title}>
          {pendingTwoFa ? fr.auth.codeTitle : fr.auth.title}
        </div>
        <div className={styles.subtitle}>
          {pendingTwoFa ? fr.auth.codeSubtitle : fr.auth.subtitle}
        </div>
      </div>

      {!pendingTwoFa ? (
        <form className={styles.form} onSubmit={handleLogin}>
          <TextField
            label={fr.auth.email}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
          <TextField
            label={fr.auth.password}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
          <div className={styles.meta}>
            <span className={styles.hint}>{fr.auth.twoFaHint}</span>
            <a href="#" className={styles.link} onClick={(e) => e.preventDefault()}>
              {fr.auth.forgot}
            </a>
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <Button type="submit" variant="primary" block disabled={busy}>
            {busy ? fr.common.loading : fr.auth.submit}
          </Button>
        </form>
      ) : (
        <form className={styles.form} onSubmit={handleVerify}>
          <TextField
            label={fr.auth.code}
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            autoFocus
            required
          />
          <div className={styles.meta}>
            <span className={styles.hint}>Code de démonstration : 6 chiffres.</span>
            <a href="#" className={styles.link} onClick={(e) => e.preventDefault()}>
              {fr.auth.resend}
            </a>
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <Button type="submit" variant="primary" block disabled={busy}>
            {busy ? fr.common.loading : fr.auth.verify}
          </Button>
        </form>
      )}
    </div>
  )
}
