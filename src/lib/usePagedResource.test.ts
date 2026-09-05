import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { usePagedResource } from './usePagedResource'

describe('usePagedResource', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('merges a filters patch and resets the page to 0', () => {
    const { result } = renderHook(() => usePagedResource<{ status: string }>({ initialFilters: { status: 'all' } }))

    act(() => result.current.setPage(3))
    expect(result.current.page).toBe(3)

    act(() => result.current.setFilters({ status: 'active' }))
    expect(result.current.filters).toEqual({ status: 'active' })
    expect(result.current.page).toBe(0)
  })

  it('resets the page immediately on search but debounces q', () => {
    const { result } = renderHook(() => usePagedResource({ initialFilters: {} }))

    act(() => result.current.setPage(2))
    act(() => result.current.setSearch('foo'))

    expect(result.current.page).toBe(0)
    expect(result.current.search).toBe('foo')
    // Pas encore débouncé : q reflète toujours la valeur précédente (vide).
    expect(result.current.q).toBeUndefined()

    act(() => {
      vi.advanceTimersByTime(350)
    })
    expect(result.current.q).toBe('foo')
  })

  it('debounces a whitespace-only search to q === undefined', () => {
    const { result } = renderHook(() => usePagedResource({ initialFilters: {} }))

    act(() => result.current.setSearch('   '))
    act(() => {
      vi.advanceTimersByTime(350)
    })
    expect(result.current.q).toBeUndefined()
  })

  it('resets the page and derives the Spring sort string on setSorting', () => {
    const { result } = renderHook(() => usePagedResource({ initialFilters: {} }))

    act(() => result.current.setPage(4))
    act(() => result.current.setSorting([{ id: 'createdAt', desc: true }]))

    expect(result.current.page).toBe(0)
    expect(result.current.sort).toBe('createdAt,desc')

    // Forme "updater" du contrat onSortingChange.
    act(() => result.current.setSorting((prev) => prev.map((s) => ({ ...s, desc: false }))))
    expect(result.current.sort).toBe('createdAt,asc')

    act(() => result.current.setSorting([]))
    expect(result.current.sort).toBeUndefined()
  })
})
