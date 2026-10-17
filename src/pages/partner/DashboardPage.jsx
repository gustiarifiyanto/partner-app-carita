import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircleIcon,
  ClockIcon,
  OrderFlowIcon,
  PercentIcon,
  RevenueIcon,
  WalletIcon,
} from '../../components/icons/HelpIcons'
import ChangePasswordModal from '../../components/ChangePasswordModal'
import LottiePlayer from '../../components/LottiePlayer'
import MetricCard from '../../components/MetricCard'
import ReferralCodeCard from '../../components/ReferralCodeCard'
import StatCardSkeleton from '../../components/StatCardSkeleton'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../hooks/useAuth'
import { usePageHeader } from '../../hooks/usePageHeader'
import api from '../../lib/api'
import { buildWaLink, rejectedConfirmMessage } from '../../lib/contact'
import { formatCurrency, formatDate, formatDateTime } from '../../lib/format'

const WELCOME_LOTTIE_URL = 'https://lottie.host/13c30575-639c-4d1f-a782-d34bd2fe3ead/j4V92ZSVrK.json'
const ACCOUNT_INFO_LOTTIE_URL = 'https://lottie.host/ed5c8da7-3235-4ad7-86b2-8e607844e2e4/x9iYJ9YrKn.json'
const PAYOUT_OVERDUE_DAYS = 7
const VERIFICATION_SLA_HOURS = 48

function daysSince(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function hoursSince(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime()
  return Math.floor(diffMs / (1000 * 60 * 60))
}

export default function DashboardPage() {
  const { user, updateUser } = useAuth()
  // Partner yang dibuatkan akun oleh admin masih memakai password sementara:
  // login pertamanya diperlakukan sama seperti partner yang baru mendaftar.
  const mustChangePassword = Boolean(user?.must_change_password)
  const [isFirstVisit] = useState(
    () => sessionStorage.getItem('justRegistered') === '1' || Boolean(user?.must_change_password),
  )
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  usePageHeader('Dashboard', data?.partner?.company_name)

  useEffect(() => {
    let cancelled = false

    api
      .get('/partner/dashboard')
      .then(({ data: body }) => {
        if (!cancelled) setData(body.data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Gagal memuat dashboard.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (error) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  const { partner, statistics } = data

  const payoutDaysWaiting = partner.payment_requested_at ? daysSince(partner.payment_requested_at) : null
  const payoutOverdue = payoutDaysWaiting !== null && payoutDaysWaiting >= PAYOUT_OVERDUE_DAYS

  const missingBankInfo = !partner.bank_name || !partner.bank_account_number || !partner.bank_account_holder
  const missingProvince = !partner.province
  const needsProfileCompletion = missingBankInfo || missingProvince

  const pendingHours =
    partner.verification_status === 'pending' && partner.created_at ? hoursSince(partner.created_at) : null
  const verificationOverdue = pendingHours !== null && pendingHours >= VERIFICATION_SLA_HOURS

  const waVerificationHref = buildWaLink(
    `Halo Admin, saya ${partner.company_name} sudah mendaftar sejak ${formatDate(
      partner.created_at,
    )} namun akun saya belum diverifikasi lebih dari 2x24 jam. Mohon bantu proses verifikasi akun saya.`,
  )

  const waRejectedHref = buildWaLink(rejectedConfirmMessage(partner.company_name))

  const waHref = buildWaLink(
    `Halo Admin, saya ${partner.company_name} ingin menanyakan status pencairan komisi saya yang sudah diajukan sejak ${formatDate(
      partner.payment_requested_at,
    )} namun belum dibayar.`,
  )

  const waConfirmHref = buildWaLink(
    `Halo Admin, saya ${partner.company_name} sudah melengkapi data rekening bank dan provinsi di profil. Mohon bantu proses verifikasi akun saya.`,
  )

  return (
    <div className="space-y-8">
      {mustChangePassword && (
        <div className="animate-fade-up flex flex-col gap-3 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-900">Buat password baru dulu, yuk</p>
            <p className="mt-0.5 text-sm text-amber-800">
              Kamu masih memakai password sementara dari admin. Ganti dengan password pilihanmu sendiri supaya akun
              kamu aman.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowChangePassword(true)}
            className="shrink-0 rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-amber-50 hover:bg-amber-800"
          >
            Ganti Password
          </button>
        </div>
      )}

      <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <LottiePlayer
          path={WELCOME_LOTTIE_URL}
          className="h-24 w-24 shrink-0 sm:h-28 sm:w-28"
          style={{ aspectRatio: '1 / 1' }}
        />
        <div className="min-w-0">
          <p className="text-lg font-semibold text-slate-900">
            {isFirstVisit
              ? `Selamat Bergabung dengan Carita Studio, ${partner.company_name}!`
              : `Selamat datang kembali, ${partner.company_name}!`}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {isFirstVisit
              ? 'Lengkapi profil kamu terlebih dahulu agar bisa explore semua fitur yang ada di Mitra App kami ya.'
              : 'Semoga performa order & komisi kamu makin cuan hari ini.'}
          </p>
        </div>
      </div>

      {partner.verification_status === 'rejected' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="space-y-1">
            <p>
              Akun kamu <strong>ditolak</strong> saat verifikasi.
              {partner.rejection_reason && <> Alasan: {partner.rejection_reason}</>}
            </p>
            <p>
              Silakan konfirmasi ke admin lewat WhatsApp
              {partner.auto_delete_at && (
                <>
                  {' '}
                  paling lambat <strong>{formatDateTime(partner.auto_delete_at)}</strong>
                </>
              )}
              . Jika tidak ada konfirmasi, akun kamu akan <strong>dihapus otomatis</strong>.
            </p>
          </div>
          <a
            href={waRejectedHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Konfirmasi via WhatsApp
          </a>
        </div>
      )}

      {partner.verification_status === 'pending' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <p>
            Akun kamu masih menunggu verifikasi admin. Kamu belum bisa membuat order sampai diverifikasi. Proses
            verifikasi maksimal <strong>2x24 jam</strong>. Jika sudah melewati batas waktu tersebut, silakan hubungi
            admin ya.
          </p>
          {verificationOverdue && (
            <a
              href={waVerificationHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Hubungi Admin via WhatsApp
            </a>
          )}
        </div>
      )}

      {needsProfileCompletion && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <p>
            Lengkapi dulu{' '}
            {missingBankInfo && missingProvince
              ? 'data rekening bank dan provinsi'
              : missingBankInfo
                ? 'data rekening bank'
                : 'data provinsi'}{' '}
            di halaman <strong>Edit Profil</strong>, lalu konfirmasi ulang ke admin via WhatsApp untuk proses
            verifikasi akun kamu.
          </p>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              to="/partner/profile"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Lengkapi Profil
            </Link>
            <a
              href={waConfirmHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Konfirmasi via WhatsApp
            </a>
          </div>
        </div>
      )}

      {payoutOverdue && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>
            Pencairan komisi kamu sudah diajukan sejak <strong>{formatDate(partner.payment_requested_at)}</strong>{' '}
            ({payoutDaysWaiting} hari lalu) dan belum dibayar. Silakan hubungi admin untuk konfirmasi.
          </p>
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Hubungi Admin via WhatsApp
          </a>
        </div>
      )}

      <ReferralCodeCard partner={partner} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <MetricCard
          label="Total Order"
          value={statistics.total_orders}
          icon={<OrderFlowIcon />}
          gradient="linear-gradient(135deg, #60A5FA, #2563EB)"
        />
        <MetricCard
          label="Order Selesai"
          value={statistics.completed_orders}
          icon={<CheckCircleIcon />}
          gradient="linear-gradient(135deg, #34D399, #059669)"
        />
        <MetricCard
          label="Menunggu Approval"
          value={statistics.pending_approval_orders}
          icon={<ClockIcon />}
          gradient="linear-gradient(135deg, #FBBF24, #D97706)"
        />
        <MetricCard
          label="Total Revenue"
          value={formatCurrency(statistics.total_revenue)}
          icon={<RevenueIcon />}
          gradient="linear-gradient(135deg, #22D3EE, #0284C7)"
        />
        <MetricCard
          label="Total Komisi"
          value={formatCurrency(statistics.total_commission)}
          icon={<PercentIcon />}
          gradient="linear-gradient(135deg, #A78BFA, #7C3AED)"
        />
        <MetricCard
          label="Komisi Terbayar"
          value={formatCurrency(statistics.paid_commission)}
          icon={<WalletIcon />}
          gradient="linear-gradient(135deg, #2DD4BF, #0D9488)"
        />
        <MetricCard
          label="Tabungan komisi anda"
          value={formatCurrency(statistics.pending_commission)}
          icon={<WalletIcon />}
          gradient="linear-gradient(135deg, #FB7185, #DC2626)"
        />
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <LottiePlayer
          path={ACCOUNT_INFO_LOTTIE_URL}
          loop={false}
          className="h-12 w-12 shrink-0"
          style={{ aspectRatio: '1 / 1' }}
        />
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Info Akun</h2>
          <div className="mt-1">
            <StatusBadge status={partner.verification_status} />
          </div>
        </div>
      </div>

      <ChangePasswordModal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSuccess={() => updateUser({ must_change_password: false })}
        title="Buat Password Baru"
        oldPasswordLabel="Password Sementara (dari admin)"
      />
    </div>
  )
}
