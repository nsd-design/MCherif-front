import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../api/http'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Ne pas rejouer les erreurs métier (4xx) ; seulement réseau/5xx, une fois.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status < 500) return false
        return failureCount < 1
      },
    },
    mutations: {
      retry: false,
    },
  },
})
