import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DeletePartnerModal from '../../components/admin/DeletePartnerModal'
import RejectPartnerModal from '../../components/admin/RejectPartnerModal'
import ResetPartnerPasswordModal from '../../components/admin/ResetPartnerPasswordModal'
import AnimatedNumber from '../../components/AnimatedNumber'
import DetailPageSkeleton from '../../components/DetailPageSkeleton'
import FormField from '../../components/FormField'
import BankAccountCard from '../../components/BankAccountCard'
import { CheckCircleIcon, ClockIcon, RevenueIcon } from '../../components/icons/HelpIcons'
import { OrdersIcon } from '../../components/icons/NavIcons'
import MetricCard from '../../components/MetricCard'
import PartnerAvatar from '../../components/PartnerAvatar'
import ReferralCodeCard from '../../components/ReferralCodeCard'
import StatusBadge from '../../components/StatusBadge'
import api from '../../lib/api'
import { formatCurrency, formatDate, formatDateTime } from '../../lib/format'
import { fieldClass } from '../../lib/formStyles'
import { useToast } from '../../hooks/useToast'
import { useAuth } from '../../hooks/useAuth'
import { usePageHeader } from '../../hooks/usePageHeader'

const EDIT_FIELDS = [
  ['company_name', 'Nama Perusahaan'],
  ['phone', 'Telepon'],
  ['address', 'Alamat'],
  ['city', 'Kota'],
  ['province', 'Provinsi'],
  ['postal_code', 'Kode Pos'],
  ['commission_rate', 'Rate Komisi (%)'],
]

const INFO_SECTIONS = [
  {
    title: 'Informasi Perusahaan',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
      />
    ),
    accent: 'bg-indigo-50 text-indigo-600',
    fields: [
      ['company_name', 'Nama Perusahaan'],
      ['phone', 'Telepon'],
      ['commission_rate', 'Rate Komisi', (v) => `${Number(v)}%`],
      ['created_at', 'Bergabung', formatDate],
    ],
  },
  {
    title: 'Alamat',
    icon: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
        />
      </>
    ),
    accent: 'bg-rose-50 text-rose-600',
    fields: [
      ['address', 'Alamat'],
      ['city', 'Kota'],
      ['province', 'Provinsi'],
      ['postal_code', 'Kode Pos'],
    ],
  },
]

export default function PartnerDetailPage() {
  const toast = useToast()
  const { refreshNewPartners } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const [partner, setPartner] = useState(null)
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [formErrors, setFormErrors] = useState({})

  usePageHeader(
    partner?.company_name ?? 'Partner Detail',
    partner ? `${partner.user.name} · ${partner.user.email}` : undefined,
  )

  const load = useCallback(() => {
    setLoading(true)
    setLoadError('')
    api
      .get(`/admin/partners/${id}`)
      .then(({ data }) => {
        setPartner(data.data.partner)
        setStatistics(data.data.statistics)
        setForm(data.data.partner)
      })
      .catch((err) => setLoadError(err.response?.data?.message || 'Gagal memuat data partner.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const handleVerify = async () => {
    setBusy(true)
    setActionError('')
    try {
      const { data } = await api.put(`/admin/partners/${id}/verify`, { verification_status: 'verified' })
      load()
      refreshNewPartners()
      if (data.email_sent === false) {
        toast.error('Partner diverifikasi, tapi email pemberitahuan gagal dikirim. Kabari partner lewat WhatsApp.')
      } else {
        toast.success('Partner berhasil diverifikasi dan sudah diberi tahu lewat email.')
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal memverifikasi partner.'
      setActionError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  const handleToggleStatus = async () => {
    const nextStatus = partner.user.status === 'suspended' ? 'active' : 'suspended'
    if (!window.confirm(`Yakin ingin mengubah status partner menjadi "${nextStatus}"?`)) return

    setBusy(true)
    setActionError('')
    try {
      await api.put(`/admin/partners/${id}/status`, { status: nextStatus })
      load()
      toast.success(`Status partner diubah menjadi "${nextStatus}".`)
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal mengubah status partner.'
      setActionError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setFormErrors({})
    setBusy(true)
    try {
      // Kirim hanya field yang boleh diedit admin (rekening bank tidak termasuk).
      const payload = Object.fromEntries(EDIT_FIELDS.map(([field]) => [field, form[field]]))
      await api.put(`/admin/partners/${id}`, payload)
      setEditing(false)
      load()
      toast.success('Perubahan partner berhasil disimpan.')
    } catch (err) {
      if (err.response?.status === 422) {
        setFormErrors(err.response.data.errors || {})
      } else {
        const message = err.response?.data?.message || 'Gagal mengupdate partner.'
        setActionError(message)
        toast.error(message)
      }
    } finally {
      setBusy(false)
    }
  }

  // Only show the skeleton on the first load; later reloads (after verify,
  // suspend, edit) keep the page on screen so it doesn't flash.
  if (loading && !partner) return <DetailPageSkeleton statCards={4} />
  if (loadError) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{loadError}</p>

  const isSuspended = partner.user.status === 'suspended'
  const isRejected = partner.verification_status === 'rejected'

  return (
    <div className="space-y-6">
      <Link
        to="/admin/partners"
        className="animate-fade-up group inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <svg
          className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Kembali ke daftar partner
      </Link>

      <section
        className="animate-fade-up overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
        style={{ animationDelay: '60ms' }}
      >
        <div className="relative h-24 overflow-hidden bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 sm:h-28">
          <div className="animate-blob absolute -left-10 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
          <div
            className="animate-blob absolute -bottom-20 right-10 h-56 w-56 rounded-full bg-sky-300/25 blur-2xl"
            style={{ animationDelay: '-4s' }}
          />
        </div>

        <div className="flex flex-col gap-4 px-5 pb-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            <div className="relative -mt-10 w-fit rounded-full bg-white p-1 shadow-md">
              <PartnerAvatar partner={partner} size="lg" />
            </div>
            <div className="min-w-0 sm:pb-1">
              <h2 className="truncate text-xl font-semibold text-slate-900">{partner.company_name}</h2>
              <p className="truncate text-sm text-slate-500">
                {partner.user.name} &middot; {partner.user.email}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge status={partner.verification_status} />
                <StatusBadge status={partner.user.status} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:pb-1">
            {partner.verification_status !== 'verified' && (
              <button
                type="button"
                onClick={handleVerify}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-emerald-600/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isRejected ? 'Terima Partner' : 'Verifikasi'}
              </button>
            )}
            {partner.verification_status === 'pending' && (
              <button
                type="button"
                onClick={() => setShowReject(true)}
                disabled={busy}
                className="rounded-lg border border-red-200 px-3.5 py-2 text-sm font-medium text-red-600 hover:border-red-600 hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Tolak
              </button>
            )}
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={busy}
              className={`rounded-lg border px-3.5 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                isSuspended
                  ? 'border-emerald-200 text-emerald-700 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white'
                  : 'border-amber-200 text-amber-700 hover:border-amber-500 hover:bg-amber-500 hover:text-white'
              }`}
            >
              {isSuspended ? 'Aktifkan' : 'Suspend'}
            </button>
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className={`rounded-lg border px-3.5 py-2 text-sm font-medium ${
                editing
                  ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800'
                  : 'border-slate-200 text-slate-700 hover:border-slate-900 hover:bg-slate-900 hover:text-white'
              }`}
            >
              {editing ? 'Batal Edit' : 'Edit'}
            </button>
            <button
              type="button"
              onClick={() => setShowResetPassword(true)}
              className="rounded-lg border border-violet-200 px-3.5 py-2 text-sm font-medium text-violet-700 hover:border-violet-600 hover:bg-violet-600 hover:text-white"
            >
              Reset Password
            </button>
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              className="rounded-lg border border-red-200 px-3.5 py-2 text-sm font-medium text-red-600 hover:border-red-600 hover:bg-red-600 hover:text-white"
            >
              Hapus Akun
            </button>
          </div>
        </div>
      </section>

      {isRejected && (
        <div
          className="animate-fade-up rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100"
          style={{ animationDelay: '75ms' }}
        >
          <p>
            Partner ini <strong>ditolak</strong>
            {partner.rejected_at && <> pada {formatDateTime(partner.rejected_at)}</>}.
            {partner.rejection_reason && <> Alasan: {partner.rejection_reason}</>}
          </p>
          {partner.auto_delete_at && (
            <p className="mt-1">
              Akun akan <strong>dihapus otomatis</strong> pada {formatDateTime(partner.auto_delete_at)} jika tidak
              diterima ulang. Kalau partner sudah konfirmasi lewat WhatsApp, klik <strong>Terima Partner</strong>.
            </p>
          )}
        </div>
      )}

      <ReferralCodeCard
        partner={partner}
        viewer="admin"
        className="animate-fade-up"
        style={{ animationDelay: '90ms' }}
      />

      {actionError && (
        <p className="animate-error-in rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{actionError}</p>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: 'Total Order',
            value: <AnimatedNumber value={statistics.total_orders} />,
            icon: <OrdersIcon />,
            gradient: 'linear-gradient(135deg, #60A5FA, #2563EB)',
          },
          {
            label: 'Order Selesai',
            value: <AnimatedNumber value={statistics.completed_orders} />,
            icon: <CheckCircleIcon />,
            gradient: 'linear-gradient(135deg, #34D399, #059669)',
          },
          {
            label: 'Total Revenue',
            value: <AnimatedNumber value={statistics.total_revenue} format={formatCurrency} />,
            icon: <RevenueIcon />,
            gradient: 'linear-gradient(135deg, #22D3EE, #0284C7)',
          },
          {
            label: 'Komisi Belum Dibayar',
            value: <AnimatedNumber value={statistics.pending_commission} format={formatCurrency} />,
            icon: <ClockIcon />,
            gradient: 'linear-gradient(135deg, #FBBF24, #D97706)',
          },
        ].map((card, index) => (
          <div key={card.label} className="animate-fade-up" style={{ animationDelay: `${140 + index * 70}ms` }}>
            <MetricCard {...card} />
          </div>
        ))}
      </div>

      {editing ? (
        <form
          onSubmit={handleEditSubmit}
          className="animate-fade-up space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        >
          <h3 className="text-sm font-semibold text-slate-900">Edit Data Partner</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {EDIT_FIELDS.map(([field, label]) => (
              <FormField key={field} label={label} error={formErrors[field]}>
                <input
                  value={form[field] ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
                  className={fieldClass(formErrors[field])}
                />
              </FormField>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {busy ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {INFO_SECTIONS.map((section, index) => (
            <section
              key={section.title}
              className="animate-fade-up rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition duration-200 hover:shadow-md"
              style={{ animationDelay: `${420 + index * 80}ms` }}
            >
              <div className="mb-4 flex items-center gap-2.5">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${section.accent}`}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    {section.icon}
                  </svg>
                </span>
                <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
              </div>
              <dl className="space-y-3 text-sm">
                {section.fields.map(([field, label, transform]) => (
                  <div
                    key={field}
                    className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                  >
                    <dt className="shrink-0 text-slate-500">{label}</dt>
                    <dd className="text-right font-medium break-words text-slate-900">
                      {partner[field] ? (transform ? transform(partner[field]) : partner[field]) : '-'}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}

          <BankAccountCard
            partner={partner}
            delay={420 + INFO_SECTIONS.length * 80}
            className="md:col-span-2 xl:col-span-1"
          >
            <p className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-[11px] text-white/75">
              <svg
                className="h-3.5 w-3.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
              Hanya bisa diubah oleh partner sendiri
            </p>
          </BankAccountCard>
        </div>
      )}

      <RejectPartnerModal
        open={showReject}
        onClose={() => setShowReject(false)}
        onRejected={() => {
          setShowReject(false)
          load()
          refreshNewPartners()
        }}
        partnerId={id}
      />

      <ResetPartnerPasswordModal
        open={showResetPassword}
        onClose={() => setShowResetPassword(false)}
        partner={partner}
      />

      <DeletePartnerModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onDeleted={() => {
          setShowDelete(false)
          refreshNewPartners()
          navigate('/admin/partners', { replace: true })
        }}
        partner={partner}
      />
    </div>
  )
}
