export const ADMIN_WA_NUMBER = '6287773311939'

export function buildWaLink(message) {
  return `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(message)}`
}

// Pesan WA partner yang ditolak untuk minta akunnya ditinjau ulang sebelum dihapus otomatis.
export function rejectedConfirmMessage(companyName) {
  return `Halo Admin, akun partner saya (${companyName ?? ''}) ditolak saat verifikasi. Saya ingin konfirmasi agar akun saya bisa ditinjau ulang.`
}
