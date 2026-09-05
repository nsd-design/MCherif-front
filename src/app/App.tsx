import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '../theme/ThemeProvider'
import { Toaster } from '../components/Toaster'
import { useAuthStore } from '../store/auth'
import { queryClient } from './queryClient'
import { router } from './router'

export function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap)

  // Rejoue la session depuis le cookie de refresh au premier rendu. Le double
  // montage de <StrictMode> est absorbé par le single-flight de http.ts.
  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
