import CopyButton from '../CopyButton'
import Modal from '../Modal'
import { WhatsAppIcon } from '../partner/ClientAccessShareModal'
import { buildPartnerAccessMessage, buildPartnerWaLink } from '../../lib/partnerAccess'

// Ditampilkan setelah admin menambahkan partner: status email otomatis
// + tombol kirim info login lewat WhatsApp ke nomor partner.
export default function PartnerAccessShareModal({ account, onClose }) {
  if (!account) return null

  const message = buildPartnerAccessMessage(account)

  return (
    <Modal open={Boolean(account)} onClose={onClose} title="Kirim Info Login Partner">
      <div className="space-y-4">
        {account.email_sent ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
            Partner berhasil dibuat dan info login sudah dikirim otomatis ke email <strong>{account.email}</strong>.
          </p>
        ) : (
          <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            Partner berhasil dibuat, tapi email otomatis gagal terkirim. Kirim info login lewat WhatsApp di bawah.
          </p>
        )}

        <dl className="divide-y divide-slate-100 rounded-lg bg-slate-50 text-sm ring-1 ring-slate-200">
          <Row label="Perusahaan" value={account.company_name} />
          <Row label="Email" value={account.email} copy />
          <Row label="Password" value={account.password} copy mono />
          <Row label="Link Login" value={account.login_url} copy />
        </dl>

        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
          Password hanya ditampilkan sekali di sini. Partner akan diminta membuat password baru saat pertama login.
        </p>

        <a
          href={buildPartnerWaLink(account, message)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <WhatsAppIcon />
          Kirim via WhatsApp
        </a>

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
