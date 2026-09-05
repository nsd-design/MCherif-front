import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import styles from './LoginPage.module.css'
import { TextField } from '../../components/TextField'
import { Button } from '../../components/Button'
import { useAuthStore } from '../../store/auth'
import { forgotPassword } from '../../api/auth'
import { errorMessageFor } from '../../i18n/errors'
import { fr } from '../../i18n/fr'
import { toast } from '../../store/toast'

/** Code envoyé par e-mail (pas push) : laisser le temps de le consulter avant
 *  de réarmer le renvoi, tout en restant loin de la limite serveur (10/15min). */
const RESEND_COOLDOWN_S = 45

type Mode = 'password' | 'twofa' | 'forgot'

const HOME = '/tableau-de-bord'

/**
 * Destination mémorisée par `ProtectedRoute` avant la redirection au login.
 * N'accepte qu'un chemin INTERNE : un `//hote` ou un `https://…` transformerait
 * l'écran de connexion en redirection ouverte.
 */
function safeRedirect(from: unknown): string {
  if (typeof from !== 'string') return HOME
  if (!from.startsWith('/') || from.startsWith('//')) return HOME
  if (from.startsWith('/connexion')) return HOME
  return from
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = safeRedirect((location.state as { from?: unknown } | null)?.from)
  const login = useAuthStore((s) => s.login)
  const verifyTwoFa = useAuthStore((s) => s.verifyTwoFa)
  const pendingTwoFa = useAuthStore((s) => s.pendingTwoFa)
  const resetFlow = useAuthStore((s) => s.resetFlow)
  const status = useAuthStore((s) => s.status)

  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const step: Mode = pendingTwoFa ? 'twofa' : mode

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      // Un 200 garantit qu'un code 2FA a été envoyé ; sinon `login` lève.
      await login(email, password)
      setResendCooldown(RESEND_COOLDOWN_S)
    } catch (err) {
      setError(
        errorMessageFor(err, {
          'rate-limited':
            'Trop de tentatives de connexion. Réessayez dans une quinzaine de minutes.',
        }),
      )
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
      navigate(redirectTo, { replace: true })
    } catch (err) {
      // `invalid-code` : rester sur cet écran, ne jamais renvoyer au login.
      setError(
        errorMessageFor(err, {
          'invalid-code': 'Code invalide ou expiré. Vérifiez le code reçu.',
        }),
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleResend() {
    setError(null)
    setBusy(true)
    try {
      await login(email, password)
      toast.success('Code renvoyé.')
      setCode('')
      setResendCooldown(RESEND_COOLDOWN_S)
    } catch (err) {
      setError(
        errorMessageFor(err, {
          'rate-limited':
            'Trop de tentatives de connexion. Réessayez dans une quinzaine de minutes.',
        }),
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleForgot(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      // Confirmation affichée uniquement sur un vrai 200 : un e-mail sans compte
      // remonte désormais un 404 `not-found`.
      await forgotPassword(email)
      setInfo('Un lien de réinitialisation a été envoyé à cette adresse.')
    } catch (err) {
      setError(
        errorMessageFor(err, {
          'not-found': "Aucun compte n'est associé à cette adresse.",
        }),
      )
    } finally {
      setBusy(false)
    }
  }

  // La session survit désormais au rechargement : arriver sur /connexion avec
  // un cookie encore valide ne doit pas afficher un formulaire inutile.
  if (status === 'authenticated') {
    return <Navigate to={redirectTo} replace />
  }

  const title =
    step === 'twofa' ? fr.auth.codeTitle : step === 'forgot' ? 'Mot de passe oublié' : fr.auth.title
  const subtitle =
    step === 'twofa'
      ? fr.auth.codeSubtitle
      : step === 'forgot'
        ? 'Saisissez votre e-mail pour recevoir un lien de réinitialisation'
        : fr.auth.subtitle

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <img src="/cheick.jpeg" alt="" className={styles.avatar} />
        <div className={styles.title}>{title}</div>
        <div className={styles.subtitle}>{subtitle}</div>
      </div>

      {step === 'password' && (
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
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => {
                setMode('forgot')
                setError(null)
              }}
            >
              {fr.auth.forgot}
            </button>
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <Button type="submit" variant="primary" block disabled={busy}>
            {busy ? fr.common.loading : fr.auth.submit}
          </Button>
        </form>
      )}

      {step === 'twofa' && (
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
            <span className={styles.hint}>{fr.auth.codeHint}</span>
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => {
                resetFlow()
                setCode('')
                setError(null)
              }}
            >
              {fr.auth.back}
            </button>
          </div>
          {error && <div className={styles.error}>{error}</div>}
          {/* Code incomplet : bloquer côté client, une soumission gaspillerait
              une des 5 tentatives autorisées avant invalidation du code. */}
          <Button type="submit" variant="primary" block disabled={busy || code.length !== 6}>
            {busy ? fr.common.loading : fr.auth.verify}
          </Button>
          <button
            type="button"
            className={styles.linkBtn}
            onClick={handleResend}
            disabled={busy || resendCooldown > 0}
          >
            {resendCooldown > 0 ? `${fr.auth.resend} (${resendCooldown}s)` : fr.auth.resend}
          </button>
        </form>
      )}

      {step === 'forgot' && (
        <form className={styles.form} onSubmit={handleForgot}>
          <TextField
            label={fr.auth.email}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
          {info && <div className={styles.info}>{info}</div>}
          {error && <div className={styles.error}>{error}</div>}
          <Button type="submit" variant="primary" block disabled={busy}>
            {busy ? fr.common.loading : 'Envoyer le lien'}
          </Button>
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => {
              setMode('password')
              setInfo(null)
              setError(null)
            }}
          >
            {fr.auth.back}
          </button>
        </form>
      )}
    </div>
  )
}
