// Link "pesan sekarang" ke form order client. Bisa dibuka tanpa login:
// halaman /order/baru menyimpan pilihan lalu mengarahkan ke daftar/login.
const PENDING_ORDER_KEY = 'pendingOrderQuery'

export function buildOrderLink({ paket, tema, ref } = {}) {
  const params = new URLSearchParams()
  if (paket) params.set('paket', paket)
  if (tema) params.set('tema', tema)
  if (ref) params.set('ref', ref)
  const query = params.toString()
  return `${window.location.origin}/order/baru${query ? `?${query}` : ''}`
}

// Simpan query order (paket/tema/ref) supaya bertahan melewati login/daftar.
export function savePendingOrder(search) {
  try {
    localStorage.setItem(PENDING_ORDER_KEY, search || '?')
  } catch {
    // Storage tidak tersedia: client tetap bisa memilih ulang dari katalog.
  }
}

// Ambil & hapus query order yang tersimpan. null kalau tidak ada.
export function takePendingOrder() {
  try {
    const value = localStorage.getItem(PENDING_ORDER_KEY)
    localStorage.removeItem(PENDING_ORDER_KEY)
    return value
  } catch {
    return null
  }
}

// Path tujuan setelah login/daftar untuk role client.
export function clientLandingPath() {
  const pending = takePendingOrder()
  return pending !== null ? `/client/order/baru${pending === '?' ? '' : pending}` : '/client'
}
