// Pesan berbagi info login akun partner (dibuat admin dari menu Partners).
import { toWaNumber } from './clientAccess'

export function buildPartnerAccessMessage(account) {
  return [
    `Halo ${account.name}! 👋`,
    '',
    `Selamat bergabung sebagai partner Carita Studio. Akun partner untuk *${account.company_name}* sudah dibuat dan sudah terverifikasi.`,
    '',
    `🔗 Login: ${account.login_url}`,
    `📧 Email: ${account.email}`,
    `🔑 Password: ${account.password}`,
    '',
    'Password ini sementara, setelah login silakan buat password baru. Jangan lupa lengkapi data rekening bank di menu Profile ya.',
  ].join('\n')
}

export function buildPartnerWaLink(account, message) {
  return `https://wa.me/${toWaNumber(account.phone)}?text=${encodeURIComponent(message)}`
}
