import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import PageLoader from './PageLoader'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (isAuthenticated === undefined) {
    return <PageLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (isAuthenticated && user && !user.isEmailVerified) {
    return <Navigate to="/verify-otp" replace />
  }

  return children
}
