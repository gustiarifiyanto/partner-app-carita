// Halaman awal tiap role setelah login.
export function homePathForRole(role) {
  if (role === 'admin') return '/admin'
  if (role === 'client') return '/client'
  return '/partner'
}

// Tujuan setelah login: halaman yang tadi dibuka (dari ProtectedRoute) kalau
// masih di area role itu, selain itu null.
export function redirectPathForRole(from, role) {
  const home = homePathForRole(role)
  if (typeof from !== 'string') return null
  return from === home || from.startsWith(`${home}/`) ? from : null
}
