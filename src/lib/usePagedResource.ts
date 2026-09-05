/*
 * État partagé des pages de liste (prêches, utilisateurs, paiements).
 *
 * Les trois pages répétaient le même triptyque filtres + recherche débouncée +
 * page, avec la même remise à zéro de la page et les mêmes dérivations. Ce hook
 * porte cet état, et rien d'autre : il n'appelle aucune route — la page garde
 * son propre hook `api/` et lui passe les valeurs. La couche `api/` reste la
 * seule à connaître les URL.
 *
 * Il ne dispense PAS de la règle sur les `queryKey` (cf. en-tête de
 * `api/http.ts`) : une valeur non déterministe passée en filtre boucle, qu'elle
 * transite par ce hook ou non.
 */
import { useCallback, useMemo, useState } from 'react'
import type { OnChangeFn, SortingState } from '@tanstack/react-table'
import type { PageResponse } from '../api/types'
import { useDebouncedValue } from './useDebouncedValue'

export interface PagedResourceOptions<F extends object> {
  /** Valeurs initiales des filtres, de forme libre et propre à la page. */
  initialFilters: F
  /** Taille de page envoyée au serveur. */
  pageSize?: number
  /** Tri initial, au format TanStack Table. */
  initialSorting?: SortingState
  /** Délai du debounce de recherche. */
  searchDelay?: number
}

export interface PagedResource<F extends object> {
  filters: F
  /** Fusionne un patch dans les filtres et remet la page à 0. */
  setFilters: (patch: Partial<F>) => void
  /** Valeur brute du champ de recherche (input contrôlé). */
  search: string
  /** Écrit la recherche et remet la page à 0. */
  setSearch: (value: string) => void
  /** Recherche débouncée et trimmée, `undefined` si vide — prête pour `q`. */
  q: string | undefined
  /** Page indexée à 0 (convention Spring). */
  page: number
  setPage: (page: number) => void
  pageSize: number
  sorting: SortingState
  /** Accepte un updater comme une valeur (contrat `onSortingChange`). */
  setSorting: OnChangeFn<SortingState>
  /** Tri au format Spring `'champ,desc'`, ou `undefined`. */
  sort: string | undefined
}

export function usePagedResource<F extends object>({
  initialFilters,
  pageSize = 20,
  initialSorting = [],
  searchDelay,
}: PagedResourceOptions<F>): PagedResource<F> {
  const [filters, setFiltersState] = useState<F>(initialFilters)
  const [search, setSearchState] = useState('')
  const [page, setPage] = useState(0)
  const [sorting, setSortingState] = useState<SortingState>(initialSorting)

  const debounced = useDebouncedValue(search.trim(), searchDelay)

  const setFilters = useCallback((patch: Partial<F>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }))
    setPage(0)
  }, [])

  const setSearch = useCallback((value: string) => {
    setSearchState(value)
    setPage(0)
  }, [])

  // Un changement de tri renvoie forcément à la première page : garder la page
  // courante afficherait une tranche arbitraire du nouvel ordre.
  const setSorting = useCallback<OnChangeFn<SortingState>>((updater) => {
    setSortingState((prev) => (typeof updater === 'function' ? updater(prev) : updater))
    setPage(0)
  }, [])

  const sort = useMemo(() => {
    const first = sorting[0]
    return first ? `${first.id},${first.desc ? 'desc' : 'asc'}` : undefined
  }, [sorting])

  return {
    filters,
    setFilters,
    search,
    setSearch,
    q: debounced || undefined,
    page,
    setPage,
    pageSize,
    sorting,
    setSorting,
    sort,
  }
}

// ─── Dérivations d'une enveloppe paginée (fonction pure, pas un hook) ────────

/** Tableau vide partagé : garde l'identité de `rows` stable entre deux rendus
 *  sans données, pour que TanStack Table ne reconstruise pas son row model. */
const EMPTY: readonly never[] = []

export interface PageView<T> {
  rows: T[]
  totalPages: number
  totalElements: number
}

export function pageView<T>(data: PageResponse<T> | undefined): PageView<T> {
  return {
    rows: data?.content ?? (EMPTY as unknown as T[]),
    totalPages: data?.totalPages ?? 1,
    totalElements: data?.totalElements ?? 0,
  }
}
