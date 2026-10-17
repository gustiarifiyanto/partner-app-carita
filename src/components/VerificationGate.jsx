import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { usePageHeader } from '../hooks/usePageHeader'
import { buildWaLink, rejectedConfirmMessage } from '../lib/contact'
import { formatDateTime } from '../lib/format'
import Modal from './Modal'

export default function VerificationGate({ title, children }) {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(false)

  const isPartner = user?.role === 'partner'
  const isVerified = !isPartner || user?.partner?.verification_status === 'verified'

  usePageHeader(title, isVerified ? undefined : 'Menu ini terkunci sementara')

  if (isVerified) return children

  const isRejected = user?.partner?.verification_status === 'rejected'
  const autoDeleteAt = user?.partner?.auto_delete_at
  const companyName = user?.partner?.company_name ?? user?.name ?? ''

  const waHref = buildWaLink(
    isRejected
      ? rejectedConfirmMessage(companyName)
      : `Halo Admin, akun partner saya (${companyName}) sudah melewati 2x24 jam dan belum diverifikasi. Mohon bantu proses verifikasi akun saya.`,
  )

  const lockedReason = isRejected
    ? 'Akun kamu ditolak saat verifikasi, jadi menu ini tidak bisa diakses.'
    : 'Akun kamu masih menunggu verifikasi admin, jadi menu ini belum bisa diakses.'

  return (
    <>
      <div className="flex flex-col items-center gap-3 rounded-xl bg-white px-4 py-14 text-center shadow-sm ring-1 ring-slate-200 sm:py-20">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a1.5 1.5 0 0 0 1.5-1.5v-8.25a1.5 1.5 0 0 0-1.5-1.5H6.75a1.5 1.5 0 0 0-1.5 1.5v8.25a1.5 1.5 0 0 0 1.5 1.5Z"
            />
          </svg>
        </span>
        <p className="text-sm font-medium text-slate-700">Menu ini terkunci sementara</p>
        <p className="max-w-sm text-sm text-slate-500">{lockedReason}</p>
      </div>

      <Modal
        open={!dismissed}
        onClose={() => setDismissed(true)}
        title={isRejected ? 'Akun Ditolak' : 'Akun Belum Diverifikasi'}
      >
        {isRejected ? (
          <div className="space-y-2 text-sm text-slate-600">
            <p>{lockedReason}</p>
            {user?.partner?.rejection_reason && (
              <p>
                Alasan: <strong>{user.partner.rejection_reason}</strong>
              </p>
            )}
            <p>
              Silakan konfirmasi ke admin lewat WhatsApp
              {autoDeleteAt && (
                <>
                  {' '}
                  paling lambat <strong>{formatDateTime(autoDeleteAt)}</strong>
                </>
              )}
              . Jika tidak ada konfirmasi, akun kamu akan <strong>dihapus otomatis</strong>.
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            {lockedReason} Proses verifikasi maksimal <strong>2x24 jam</strong>. Jika sudah melewati batas waktu
            tersebut, segera hubungi admin ya.
          </p>
        )}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
          >
            Oke, Mengerti
          </button>
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Hubungi Admin via WhatsApp
          </a>
        </div>
      </Modal>
    </>
  )
}
