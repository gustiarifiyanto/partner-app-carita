import { useState } from 'react'
import Modal from '../Modal'
import { Detail } from '../orders/OrderDetailParts'
import api from '../../lib/api'
import { formatDateTime } from '../../lib/format'
import { useToast } from '../../hooks/useToast'

// Status akun client yang terhubung ke order + aksi "buat password baru & bagikan".
// Membuat ulang password hanya bisa selama client belum mengganti password-nya sendiri.
export default function ClientAccountCard({ orderId, account, onRegenerated, delay = 0 }) {
  const toast = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sendEmail, setSendEmail] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  if (!account) return null

  const status = getAccountStatus(account)

  const handleRegenerate = async () => {
    setSubmitting(true)
    try {
      const { data } = await api.post(`/partner/orders/${orderId}/client-access`, { send_email: sendEmail })
      setConfirmOpen(false)
      onRegenerated(data.client_account)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat password baru.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section
      className="animate-fade-up flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition duration-200 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
              />
            </svg>
          </span>
          <h3 className="text-sm font-semibold text-slate-900">Akun Client</h3>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${status.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>

      <dl className="space-y-3 text-sm">
        <Detail label="Nama" value={account.name} />
        {account.email && <Detail label="Email Login" value={account.email} />}
        <Detail
          label="Login Terakhir"
          value={account.last_login_at ? formatDateTime(account.last_login_at) : 'Belum pernah'}
        />
      </dl>

      <p className={`mt-4 rounded-xl px-3 py-2.5 text-xs leading-relaxed ${status.note}`}>{status.message}</p>

      {/* Dorong tombol ke bawah supaya sejajar dengan kartu lain di baris yang sama */}
      <div className="flex-1" />

      {account.can_regenerate && (
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="mt-4 w-full rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-500/30 active:translate-y-0"
        >
          Buat Password Baru &amp; Bagikan
        </button>
      )}

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Buat Password Baru?">
        <p className="text-sm text-slate-600">
          Password sementara yang lama tidak akan berlaku lagi. Setelah ini kamu bisa membagikan password baru ke client
          lewat WhatsApp atau email.
        </p>
        <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300"
          />
          <span>Kirim juga otomatis ke email client</span>
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setConfirmOpen(false)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={submitting}
            className="rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {submitting ? 'Memproses...' : 'Ya, Buat Password Baru'}
          </button>
        </div>
      </Modal>
    </section>
  )
}

// 3 tahap akun client: belum pernah login -> sudah login tapi masih pakai
// password sementara -> sudah membuat password sendiri.
function getAccountStatus(account) {
  if (account.password_changed) {
    return {
      label: 'Aktif',
      badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
      dot: 'bg-emerald-500',
      note: 'bg-emerald-50 text-emerald-800',
      message:
        'Client sudah login dan membuat password sendiri. Kalau lupa, client bisa memakai "Lupa password?" di halaman login.',
    }
  }

  if (account.has_logged_in) {
    return {
      label: 'Sudah login',
      badge: 'bg-sky-50 text-sky-700 ring-sky-600/20',
      dot: 'bg-sky-500',
      note: 'bg-sky-50 text-sky-800',
      message:
        'Client sudah login, tapi masih memakai password sementara. Client akan terus diingatkan untuk membuat password baru di dashboard-nya.',
    }
  }

  return {
    label: 'Belum login',
    badge: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    dot: 'animate-pulse bg-amber-500',
    note: 'bg-amber-50 text-amber-800',
    message: 'Client belum pernah login. Kalau info login belum sampai, buat password baru lalu bagikan lagi.',
  }
}
