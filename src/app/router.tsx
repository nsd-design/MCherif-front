import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '../routes/layouts/AppLayout'
import { AuthLayout } from '../routes/layouts/AuthLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from '../pages/auth/LoginPage'
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { PrayersListPage } from '../pages/prayers/PrayersListPage'
import { PrayerDetailPage } from '../pages/prayers/PrayerDetailPage'
import { PublishPage } from '../pages/publish/PublishPage'
import { UsersPage } from '../pages/users/UsersPage'
import { PaymentsPage } from '../pages/payments/PaymentsPage'
import { NotificationsPage } from '../pages/notifications/NotificationsPage'
import { SettingsPage } from '../pages/settings/SettingsPage'

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/connexion', element: <LoginPage /> },
      { path: '/mot-de-passe/reinitialiser', element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/tableau-de-bord" replace /> },
          { path: '/tableau-de-bord', element: <DashboardPage /> },
          { path: '/preches', element: <PrayersListPage /> },
          { path: '/preches/:id', element: <PrayerDetailPage /> },
          { path: '/publication', element: <PublishPage /> },
          { path: '/utilisateurs', element: <UsersPage /> },
          { path: '/abonnements', element: <PaymentsPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/parametres', element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/tableau-de-bord" replace /> },
])
