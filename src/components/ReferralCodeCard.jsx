import logo from '../assets/logo/logo_carita_v4.png'
import CopyButton from './CopyButton'
import { buildOrderLink } from '../lib/orderLink'

const INACTIVE_REASON = {
  partner: {
    pending: 'Kode akan aktif otomatis setelah akun kamu diverifikasi admin.',
    rejected: 'Kode belum aktif karena akun kamu ditolak saat verifikasi. Hubungi admin untuk info lebih lanjut.',
    suspended: 'Kode sedang nonaktif karena akun kamu di-suspend. Hubungi admin untuk info lebih lanjut.',
  },
  admin: {
    pending: 'Aktif otomatis setelah partner diverifikasi.',
    rejected: 'Nonaktif karena partner ditolak saat verifikasi.',
    suspended: 'Nonaktif karena akun partner di-suspend.',
  },
}

function inactiveReason(partner, viewer) {
  const reasons = INACTIVE_REASON[viewer]
  if (partner.user?.status === 'suspended') return reasons.suspended
  return reasons[partner.verification_status] ?? reasons.pending
}

// Chip emas ala kartu fisik (murni dekorasi)
function CardChip() {
  return (
    <div
      className="relative h-8 w-11 overflow-hidden rounded-md shadow-inner ring-1 ring-amber-900/20"
      style={{ backgroundImage: 'linear-gradient(135deg, #F3D98B 0%, #D9AE4F 45%, #F1D27C 70%, #C99A3C 100%)' }}
    >
      <div className="absolute inset-y-0 left-1/3 w-px bg-amber-900/25" />
      <div className="absolute inset-y-0 right-1/3 w-px bg-amber-900/25" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-amber-900/25" />
      <div className="absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-amber-900/25" />
    </div>
  )
}

// Kode referral partner dalam bentuk kartu member. Dipakai client saat order dari
// dashboard client, supaya order otomatis masuk ke partner pemilik kode (kalau aktif).
export default function ReferralCodeCard({ partner, viewer = 'partner', className = '', style }) {
  if (!partner?.referral_code) return null
  const active = Boolean(partner.referral_active)
  const memberSince = partner.created_at ? new Date(partner.created_at).getFullYear() : null

  return (
    <section
      className={`flex flex-col gap-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:gap-7 ${className}`}
      style={style}
    >
      {/* Kartu */}
      <div
        className="group relative aspect-[1.586/1] w-full max-w-[360px] shrink-0 overflow-hidden rounded-2xl p-5 shadow-[0_12px_30px_-10px_rgba(120,85,30,0.35)] ring-1 ring-amber-900/10 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_-12px_rgba(120,85,30,0.45)]"
        style={{ backgroundImage: 'linear-gradient(135deg, #FFFDF7 0%, #FBF4E2 45%, #F0E4C7 100%)' }}
      >
        {/* Motif lingkaran & kilau */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-52 w-52 rounded-full border-[18px] border-amber-200/30" />
        <div className="pointer-events-none absolute -right-4 -bottom-24 h-52 w-52 rounded-full border-[10px] border-amber-300/20" />
        <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white p-1 shadow-sm ring-1 ring-amber-900/10">
                <img src={logo} alt="" className="h-full w-full object-contain" />
              </span>
              <div className="leading-tight">
                <p className="text-xs font-bold text-amber-950">Carita Studio</p>
                <p className="text-[9px] font-semibold tracking-[0.2em] text-amber-800/60 uppercase">Partner Referral</p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                active ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-stone-100 text-stone-500 ring-stone-400/30'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-stone-400'}`} />
              {active ? 'Aktif' : 'Belum Aktif'}
            </span>
          </div>

          <div>
            <CardChip />
            <p
              className={`mt-2.5 font-mono text-[1.6rem] leading-none font-bold tracking-[0.22em] sm:text-3xl ${
                active ? 'text-amber-950' : 'text-amber-950/35'
              }`}
              style={{ textShadow: '0 1px 0 rgba(255,255,255,0.9)' }}
            >
              {partner.referral_code}
            </p>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-semibold tracking-[0.2em] text-amber-800/50 uppercase">Pemilik Kartu</p>
              <p className="truncate text-xs font-semibold tracking-wide text-amber-950 uppercase">
                {partner.company_name}
              </p>
            </div>
            {memberSince && (
              <div className="shrink-0 text-right">
                <p className="text-[9px] font-semibold tracking-[0.2em] text-amber-800/50 uppercase">Sejak</p>
                <p className="text-xs font-semibold text-amber-950">{memberSince}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keterangan */}
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold text-slate-900">Kode Referral</h2>
        <p className="mt-1 text-sm text-slate-500">
          {active
            ? viewer === 'partner'
              ? 'Bagikan kode ini ke client. Order client yang memakai kode ini otomatis masuk ke order kamu.'
              : 'Order client yang memakai kode ini otomatis masuk ke partner ini.'
            : inactiveReason(partner, viewer)}
        </p>
        {active && (
          <div className="mt-4 flex flex-wrap gap-2">
            <CopyButton
              text={partner.referral_code}
              label="Salin Kode"
              successMessage="Kode referral disalin."
              variant="light"
              className="px-3.5 py-2"
            />
            {viewer === 'partner' && (
              <CopyButton
                text={buildOrderLink({ ref: partner.referral_code })}
                label="Salin Link Order"
                successMessage="Link order disalin. Client yang memesan lewat link ini otomatis memakai kode kamu."
                variant="light"
                className="px-3.5 py-2"
              />
            )}
          </div>
        )}
      </div>
    </section>
  )
}
