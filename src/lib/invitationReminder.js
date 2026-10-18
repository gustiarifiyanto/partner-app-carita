// Pesan pengingat ke client untuk segera mengisi data undangan (mempelai & acara).
// *teks* = huruf tebal di WhatsApp.
export function buildInvitationReminderMessage(reminder, orderNumber, senderName) {
  const lines = [
    `Halo Kak${reminder.client_name ? ` ${reminder.client_name}` : ''} 👋`,
    '',
    `Pesanan undangan digital *${orderNumber}* sudah kami terima. Supaya undangannya *bisa langsung dikerjakan*, mohon segera lengkapi data mempelai & acara ya Kak 🙏`,
    '',
    `📝 Isi data di sini: ${reminder.form_url}`,
    '(Klik link ➜ login ➜ form langsung terbuka ➜ isi data ➜ tekan *Kirim Data*)',
  ]

  if (!reminder.has_logged_in) {
    lines.push(
      '',
      `Login pakai email *${reminder.email}* dan password yang sudah dikirim sebelumnya. Lupa password? Pakai tombol "Lupa password?" di halaman login.`,
    )
  }

  lines.push('', 'Terima kasih!', senderName ? `— ${senderName}` : '')

  return lines.join('\n').trim()
}

// Pesan WA admin ke client saat undangan sudah jadi (setelah order selesai).
export function buildInvitationReadyMessage(link, orderNumber, expiresLabel) {
  return [
    `Halo Kak${link.client_name ? ` ${link.client_name}` : ''} 👋`,
    '',
    `Kabar gembira! Undangan digital untuk pesanan *${orderNumber}* sudah jadi 🎉`,
    '',
    `💌 Link undangan: ${link.url}`,
    expiresLabel ? `⏳ Aktif sampai: ${expiresLabel}` : null,
    '',
    'Silakan dicek dan dibagikan ke tamu undangan ya Kak. Kalau ada yang perlu direvisi, langsung kabari kami saja.',
    'Link ini juga bisa dilihat kapan saja di menu *Undangan Saya*.',
    '',
    'Terima kasih sudah mempercayakan undangannya ke Carita Studio! 🙏',
  ]
    .filter((line) => line !== null)
    .join('\n')
}
