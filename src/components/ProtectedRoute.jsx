import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { homePathForRole } from '../lib/roles'

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, token, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Memuat...
      </div>
    )
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  return children
}
