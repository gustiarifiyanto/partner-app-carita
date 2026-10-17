// Pesan berbagi info login akun client (dibuat partner saat Buat Order).

// 08xx / +62xx / 62xx -> 62xx untuk wa.me. Kosong kalau nomor tidak valid,
// supaya WA tetap terbuka dan partner bisa memilih kontak sendiri.
export function toWaNumber(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('8')) return `62${digits}`
  return digits
}

export function buildClientAccessMessage(account, orderNumber) {
  const greeting = `Halo ${account.name}! 👋`
  const orderLine = orderNumber ? ` untuk pesanan *${orderNumber}*` : ''

  if (!account.password) {
    return [
      greeting,
      '',
      `Pesanan kamu${orderLine} sudah tercatat di Carita Studio dan masuk ke akun kamu yang sudah ada.`,
      `Silakan login untuk memantau statusnya:`,
      account.login_url,
      '',
      `Email: ${account.email}`,
      'Lupa password? Pakai tombol "Lupa password?" di halaman login.',
    ].join('\n')
  }

  return [
    greeting,
    '',
    `Akun Carita Studio kamu sudah dibuat${orderLine}. Lewat akun ini kamu bisa memantau status pesanan.`,
    '',
    `🔗 Login: ${account.login_url}`,
    `📧 Email: ${account.email}`,
    `🔑 Password: ${account.password}`,
    '',
    'Password ini sementara, kamu akan diminta membuat password baru saat pertama login. Jangan bagikan ke siapa pun ya.',
  ].join('\n')
}

export function buildClientWaLink(account, message) {
  const number = toWaNumber(account.phone)
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export function buildClientMailtoLink(account, message) {
  const subject = 'Akun Carita Studio Kamu'
  return `mailto:${account.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
}
