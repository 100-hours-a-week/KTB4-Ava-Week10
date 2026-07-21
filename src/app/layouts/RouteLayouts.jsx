import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { LoadingFallback } from '../../shared/ui/LoadingFallback'
import { useAuth } from '../providers/AuthProvider'

export function PublicOnlyLayout() {
  const { user, hydrated } = useAuth()
  if (!hydrated) return <LoadingFallback />
  return user ? <Navigate to={ROUTES.POSTS} replace /> : <Outlet />
}

export function ProtectedLayout() {
  const { user, hydrated, sessionExpired } = useAuth()
  const location = useLocation()
  if (!hydrated) return <LoadingFallback />
  if (!user) return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname, sessionExpired }} />
  return <Outlet />
}

export function RootRedirect() {
  const { user, hydrated } = useAuth()
  if (!hydrated) return <LoadingFallback />
  return <Navigate to={user ? ROUTES.POSTS : ROUTES.LOGIN} replace />
}
