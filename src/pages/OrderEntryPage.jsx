import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { homePathForRole } from '../lib/roles'
import { savePendingOrder } from '../lib/orderLink'

// Pintu masuk link order dari website / partner: /order/baru?paket=&tema=&ref=
// Client yang sudah login langsung ke form order; yang belum login pilihannya
// disimpan dulu lalu diarahkan ke halaman daftar (bisa pindah ke login).
export default function OrderEntryPage() {
  const { user, token, loading } = useAuth()
  const { search } = useLocation()

  if (loading) return null

  if (token && user) {
    if (user.role === 'client') return <Navigate to={`/client/order/baru${search}`} replace />
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  savePendingOrder(search)
  return <Navigate to="/daftar?lanjut=order" replace />
}
