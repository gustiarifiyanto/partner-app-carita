import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { homePathForRole } from '../lib/roles'

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, token, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Memuat...
      </div>
    )
  }

  if (!token || !user) {
    // Simpan tujuan supaya setelah login langsung kembali ke halaman ini
    // (mis. link form data undangan dari WA/email).
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  return children
}
