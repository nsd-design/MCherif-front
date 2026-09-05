import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/msw/server'
import { api, ApiError, restoreSession, setSessionExpiredHandler, unwrap } from './http'
import { clearTokens } from './tokenStore'
import type { ProblemDetail } from './types'

function problem(code: string, status: number): ProblemDetail {
  return { status, code }
}

// `tokenStore` est un singleton de module : purger entre les tests évite toute
// fuite d'un access token posé par un test précédent.
afterEach(() => {
  clearTokens()
})

describe('refresh sur 401 (src/api/http.ts)', () => {
  it('rafraîchit puis rejoue une fois avec succès', async () => {
    let statsCalls = 0
    let refreshCalls = 0
    server.use(
      http.get('/api/v1/admin/dashboard/stats', () => {
        statsCalls++
        if (statsCalls === 1) return HttpResponse.json(problem('unauthorized', 401), { status: 401 })
        return HttpResponse.json({})
      }),
      http.post('/api/v1/admin/auth/refresh', () => {
        refreshCalls++
        return HttpResponse.json({ accessToken: 'token-2', expiresIn: 3600 })
      }),
    )

    const result = await api.GET('/api/v1/admin/dashboard/stats')
    expect(unwrap(result)).toEqual({})
    expect(statsCalls).toBe(2)
    expect(refreshCalls).toBe(1)
  })

  it('ne déclenche qu\'un seul refresh pour deux 401 concurrents (single-flight)', async () => {
    let refreshCalls = 0
    server.use(
      http.post('/api/v1/admin/auth/refresh', () => {
        refreshCalls++
        return HttpResponse.json({ accessToken: 'token-2', expiresIn: 3600 })
      }),
    )

    await Promise.all([restoreSession(), restoreSession()])
    expect(refreshCalls).toBe(1)
  })

  it('signale la session expirée si le refresh échoue, sans boucle', async () => {
    server.use(
      http.get('/api/v1/admin/dashboard/stats', () =>
        HttpResponse.json(problem('unauthorized', 401), { status: 401 }),
      ),
      http.post('/api/v1/admin/auth/refresh', () => new HttpResponse(null, { status: 401 })),
    )

    let expiredCalls = 0
    setSessionExpiredHandler(() => {
      expiredCalls++
    })

    const result = await api.GET('/api/v1/admin/dashboard/stats')
    expect(() => unwrap(result)).toThrow(ApiError)
    expect(expiredCalls).toBe(1)

    setSessionExpiredHandler(() => {})
  })

  it('exclut /admin/auth/* du mécanisme de refresh (401 métier)', async () => {
    let refreshCalls = 0
    server.use(
      http.post('/api/v1/admin/auth/login', () =>
        HttpResponse.json(problem('invalid-credentials', 401), { status: 401 }),
      ),
      http.post('/api/v1/admin/auth/refresh', () => {
        refreshCalls++
        return HttpResponse.json({ accessToken: 'token-2', expiresIn: 3600 })
      }),
    )

    const result = await api.POST('/api/v1/admin/auth/login', {
      body: { email: 'a@b.com', password: 'x' },
    })
    expect(refreshCalls).toBe(0)
    try {
      unwrap(result)
      expect.unreachable('unwrap doit lever pour un 401')
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError)
      expect((e as ApiError).code).toBe('invalid-credentials')
    }
  })
})
