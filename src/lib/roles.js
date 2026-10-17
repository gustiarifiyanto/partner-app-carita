// Halaman awal tiap role setelah login.
export function homePathForRole(role) {
  if (role === 'admin') return '/admin'
  if (role === 'client') return '/client'
  return '/partner'
}
