import CopyButton from '../CopyButton'
import Modal from '../Modal'
import { buildClientAccessMessage, buildClientMailtoLink, buildClientWaLink } from '../../lib/clientAccess'

// Ditampilkan setelah partner membuat order (atau membuat ulang password):
// info login akun client + tombol bagikan lewat WhatsApp / email.
// Password asli hanya ada di response ini, jadi partner diingatkan untuk segera membagikannya.
export default function ClientAccessShareModal({ account, orderNumber, onClose }) {
  if (!account) return null

  const message = buildClientAccessMessage(account, orderNumber)
  const isNewPassword = Boolean(account.password)

  return (
    <Modal open={Boolean(account)} onClose={onClose} title="Bagikan Akses Client">
      <div className="space-y-4">
        <div
          className={`rounded-lg px-3 py-2.5 text-sm ${
            isNewPassword ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'
          }`}
        >
          {account.status === 'created' && 'Order dibuat dan akun client otomatis dibuat.'}
          {account.status === 'regenerated' &&
            'Password baru untuk akun client sudah dibuat. Password lama tidak berlaku lagi.'}
          {account.status === 'existing' &&
            'Email ini sudah punya akun client, jadi order langsung masuk ke akun tersebut. Password tidak diubah.'}
        </div>

        <dl className="divide-y divide-slate-100 rounded-lg bg-slate-50 text-sm ring-1 ring-slate-200">
          <Row label="Nama" value={account.name} />
          <Row label="Email" value={account.email} copy />
          {isNewPassword && <Row label="Password" value={account.password} copy mono />}
          <Row label="Link Login" value={account.login_url} copy />
        </dl>

        {isNewPassword && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
            Password hanya ditampilkan sekali. Segera bagikan ke client. Kalau terlewat, kamu bisa membuat password baru
            dari halaman detail order selama client belum menggantinya.
          </p>
        )}

        {account.email_sent === true && (
          <p className="text-xs text-emerald-600">✓ Info login juga sudah dikirim otomatis ke email client.</p>
        )}
        {account.email_sent === false && (
          <p className="text-xs text-red-600">
            Email otomatis gagal terkirim. Bagikan lewat WhatsApp atau tombol Email di bawah.
          </p>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <a
            href={buildClientWaLink(account, message)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <WhatsAppIcon />
            Kirim via WhatsApp
          </a>
          <a
            href={buildClientMailtoLink(account, message)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 6.75c0-.83.67-1.5 1.5-1.5h16.5c.83 0 1.5.67 1.5 1.5v10.5c0 .83-.67 1.5-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V6.75Z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="m3 7 9 6 9-6" />
            </svg>
            Kirim via Email
          </a>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <CopyButton text={message} label="Salin pesan" successMessage="Pesan berhasil disalin." variant="light" />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
          >
            Selesai
          </button>
        </div>
      </div>
    </Modal>
  )
}

function Row({ label, value, copy = false, mono = false }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <div className="min-w-0">
        <dt className="text-xs text-slate-400">{label}</dt>
        <dd className={`truncate text-slate-900 ${mono ? 'font-mono text-base font-semibold tracking-wider' : ''}`}>
          {value || '-'}
        </dd>
      </div>
      {copy && value && <CopyButton text={value} successMessage={`${label} disalin.`} variant="light" />}
    </div>
  )
}

export function WhatsAppIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35ZM12.04 21.5h-.01a9.45 9.45 0 0 1-4.82-1.32l-.35-.21-3.58.94.96-3.49-.23-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.22 4.25-9.46 9.48-9.46 2.53 0 4.91.99 6.7 2.78a9.4 9.4 0 0 1 2.77 6.69c0 5.22-4.25 9.46-9.47 9.46Zm8.06-17.52A11.33 11.33 0 0 0 12.04.65C5.77.65.66 5.76.66 12.03c0 2 .52 3.96 1.52 5.69L.57 23.6l6.02-1.58a11.36 11.36 0 0 0 5.44 1.39h.01c6.27 0 11.38-5.11 11.38-11.38 0-3.04-1.18-5.9-3.33-8.05Z" />
    </svg>
  )
}
