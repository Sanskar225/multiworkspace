import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute() {
  const { isAuthenticated, expiredFlag } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    const target = expiredFlag ? '/session-expired' : '/login'
    return <Navigate to={target} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
