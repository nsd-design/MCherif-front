import { afterEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { renderWithProviders } from '../test/renderWithProviders'
import { useAuthStore } from '../store/auth'
import { ProtectedRoute } from './ProtectedRoute'

function LoginProbe() {
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  return <div>login-screen:{from ?? 'no-state'}</div>
}

function renderProtected(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/connexion" element={<LoginProbe />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/preches" element={<div>Preches Page</div>} />
      </Route>
    </Routes>,
    { route },
  )
}

afterEach(() => {
  useAuthStore.setState({ status: 'pending', isAuthenticated: false, admin: null })
})

describe('ProtectedRoute', () => {
  it('affiche un squelette sans rediriger tant que la session est "pending"', () => {
    useAuthStore.setState({ status: 'pending' })
    const { container } = renderProtected('/preches')

    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull()
    expect(screen.queryByText('Preches Page')).toBeNull()
    expect(screen.queryByText(/login-screen/)).toBeNull()
  })

  it('redirige vers /connexion avec le chemin demandé en state.from si "anonymous"', () => {
    useAuthStore.setState({ status: 'anonymous' })
    renderProtected('/preches?tab=x')

    expect(screen.getByText('login-screen:/preches?tab=x')).toBeInTheDocument()
  })

  it('affiche la route protégée si "authenticated"', () => {
    useAuthStore.setState({ status: 'authenticated' })
    renderProtected('/preches')

    expect(screen.getByText('Preches Page')).toBeInTheDocument()
    expect(screen.queryByText(/login-screen/)).toBeNull()
  })
})
