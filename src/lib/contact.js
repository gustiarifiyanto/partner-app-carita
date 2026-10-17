import { formatCurrency } from './format'

export const ADMIN_WA_NUMBER = '6287773311939'

export function buildWaLink(message) {
  return `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(message)}`
}

// Link wa.me ke nomor customer (08xx / +62xx / 62xx dinormalkan ke 62xx).
export function buildWaLinkTo(phone, message) {
  const digits = String(phone ?? '').replace(/\D/g, '')
  const number = digits.startsWith('0') ? `62${digits.slice(1)}` : digits
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

// Pesan tagihan dari partner ke client: detail pesanan, nominal, rekening, dan
// minta bukti transfer dikirim ke pengirim pesan (partner atau admin).
// proofRecipient mis. 'saya (Nama Mitra)' / 'kami (Admin Carita Studio)'.
// *teks* = huruf tebal di WhatsApp.
export function paymentRequestMessage({ customerName, pkg, theme, amount, accounts, proofRecipient }) {
  const total = formatCurrency(amount)
  const rekening = accounts
    .map((a) => `🏦 *${a.bank}*\nNo. Rek: *${a.account_number}*\na.n. ${a.account_holder}`)
    .join('\n\n')

  return [
    `Halo Kak${customerName ? ` ${customerName}` : ''} 👋`,
    '',
    'Berikut detail pesanan undangan digitalnya:',
    `📦 Paket: ${pkg.name}${pkg.validity_label ? ` (${pkg.validity_label})` : ''}`,
    `🎨 Tema: ${theme.name}`,
    `💰 Total: *${total}*`,
    '',
    `Silakan transfer *${total}* (nominal penuh) ke rekening berikut:`,
    '',
    rekening,
    '',
    `Setelah transfer, mohon kirim bukti transfernya ke ${proofRecipient} ya Kak, supaya pesanannya bisa segera diproses 🙏`,
    '',
    'Terima kasih!',
  ].join('\n')
}

// Pesan WA partner yang ditolak untuk minta akunnya ditinjau ulang sebelum dihapus otomatis.
export function rejectedConfirmMessage(companyName) {
  return `Halo Admin, akun partner saya (${companyName ?? ''}) ditolak saat verifikasi. Saya ingin konfirmasi agar akun saya bisa ditinjau ulang.`
}
