import { useCallback, useEffect, useState } from 'react'
import BankAccountCard from '../../components/BankAccountCard'
import ChangePasswordModal from '../../components/ChangePasswordModal'
import DetailPageSkeleton from '../../components/DetailPageSkeleton'
import FormField from '../../components/FormField'
import PartnerAvatar from '../../components/PartnerAvatar'
import EditBankAccountModal from '../../components/partner/EditBankAccountModal'
import StatusBadge from '../../components/StatusBadge'
import { useToast } from '../../hooks/useToast'
import { usePageHeader } from '../../hooks/usePageHeader'
import api from '../../lib/api'
import { buildWaLink } from '../../lib/contact'
import { formatDate } from '../../lib/format'
import { fieldClass } from '../../lib/formStyles'

// Data rekening tidak ada di sini: diubah lewat EditBankAccountModal (wajib password).
const EDIT_FIELDS = [
  ['company_name', 'Nama Perusahaan'],
  ['phone', 'Telepon'],
  ['address', 'Alamat'],
  ['city', 'Kota'],
  ['province', 'Provinsi'],
  ['postal_code', 'Kode Pos'],
]

const ICONS = {
  user: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
    />
  ),
  building: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
    />
  ),
  mapPin: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
      />
    </>
  ),
  shield: (
    <>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3.25 19 6v5c0 4.5-3 8.25-7 9.75-4-1.5-7-5.25-7-9.75V6l7-2.75Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4.5" />
    </>
  ),
  chat: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
    />
  ),
}

export default function ProfilePage() {
  const toast = useToast()
  usePageHeader('Pengaturan Akun', 'Kelola informasi profil dan keamanan akun kamu')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [formErrors, setFormErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showEditBank, setShowEditBank] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setLoadError('')
    api
      .get('/partner/profile')
      .then(({ data }) => {
        setProfile(data.data)
        setForm(data.data.partner)
      })
      .catch((err) => setLoadError(err.response?.data?.message || 'Gagal memuat profil.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormErrors({})
    setBusy(true)
    try {
      const payload = Object.fromEntries(EDIT_FIELDS.map(([field]) => [field, form[field]]))
      await api.put('/partner/profile', payload)
      setEditing(false)
      toast.success('Profil berhasil diupdate.')
      load()
    } catch (err) {
      if (err.response?.status === 422) {
        setFormErrors(err.response.data.errors || {})
      } else {
        toast.error(err.response?.data?.message || 'Gagal mengupdate profil.')
      }
    } finally {
      setBusy(false)
    }
  }

  // Skeleton hanya saat pertama kali; reload setelah simpan tetap menampilkan halaman.
  if (loading && !profile) return <DetailPageSkeleton />
  if (loadError) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{loadError}</p>

  const partner = profile.partner
  const hasBank = Boolean(partner.bank_name && partner.bank_account_number)

  const waHref = buildWaLink(
    `Halo Admin, saya ${partner.company_name} butuh bantuan terkait akun partner saya di Carita Studio.`,
  )

  const infoSections = [
    {
      title: 'Informasi Akun',
      icon: ICONS.user,
      accent: 'bg-sky-50 text-sky-600',
      rows: [
        ['Nama Lengkap', profile.name],
        ['Email', profile.email],
        ['Telepon', partner.phone],
        ['Bergabung', formatDate(profile.created_at)],
      ],
    },
    {
      title: 'Perusahaan & Komisi',
      icon: ICONS.building,
      accent: 'bg-indigo-50 text-indigo-600',
      rows: [
        ['Nama Perusahaan', partner.company_name],
        ['Rate Komisi', `${Number(partner.commission_rate)}%`],
        ['Status Verifikasi', <StatusBadge key="v" status={partner.verification_status} />],
      ],
    },
    {
      title: 'Alamat',
      icon: ICONS.mapPin,
      accent: 'bg-rose-50 text-rose-600',
      rows: [
        ['Alamat', partner.address],
        ['Kota', partner.city],
        ['Provinsi', partner.province],
        ['Kode Pos', partner.postal_code],
      ],
    },
  ]

  return (
    <div className="space-y-6">
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
                {profile.name} &middot; {profile.email}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge status={partner.verification_status} />
                <StatusBadge status={profile.status} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:pb-1">
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className={`rounded-lg border px-3.5 py-2 text-sm font-medium ${
                editing
                  ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800'
                  : 'border-slate-200 text-slate-700 hover:border-slate-900 hover:bg-slate-900 hover:text-white'
              }`}
            >
              {editing ? 'Batal Edit' : 'Edit Profil'}
            </button>
            <button
              type="button"
              onClick={() => setShowChangePassword(true)}
              className="rounded-lg border border-violet-200 px-3.5 py-2 text-sm font-medium text-violet-700 hover:border-violet-600 hover:bg-violet-600 hover:text-white"
            >
              Ganti Password
            </button>
          </div>
        </div>
      </section>

      {editing ? (
        <form
          onSubmit={handleSubmit}
          className="animate-fade-up space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        >
          <h3 className="text-sm font-semibold text-slate-900">Edit Profil</h3>
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
          <p className="text-xs text-slate-500">
            Rekening bank diubah lewat tombol <strong>Ubah Rekening</strong> di kartu rekening.
          </p>
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {infoSections.map((section, index) => (
            <InfoSection key={section.title} section={section} delay={140 + index * 80} />
          ))}

          <BankAccountCard partner={partner} delay={140 + infoSections.length * 80}>
            {!hasBank && (
              <p className="mb-3 rounded-lg bg-amber-400/20 px-3 py-2 text-[11px] text-amber-100">
                Lengkapi rekening supaya komisi kamu bisa dicairkan.
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[11px] text-white/70">
                <svg
                  className="h-3.5 w-3.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  {ICONS.shield}
                </svg>
                Hanya kamu yang bisa mengubah
              </span>
              <button
                type="button"
                onClick={() => setShowEditBank(true)}
                className="rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-900 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                {hasBank ? 'Ubah Rekening' : 'Isi Rekening'}
              </button>
            </div>
          </BankAccountCard>
        </div>
      )}

      <section
        className="animate-fade-up flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-5 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between"
        style={{ animationDelay: '480ms' }}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              {ICONS.chat}
            </svg>
          </span>
          <div>
            <h3 className="text-sm font-semibold">Butuh Bantuan?</h3>
            <p className="mt-0.5 text-sm text-white/80">
              Ada kendala atau pertanyaan seputar akun kamu? Hubungi admin langsung lewat WhatsApp.
            </p>
          </div>
        </div>
        <a
          href={waHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          Hubungi Admin via WhatsApp
        </a>
      </section>

      <ChangePasswordModal open={showChangePassword} onClose={() => setShowChangePassword(false)} />

      {showEditBank && <EditBankAccountModal partner={partner} onClose={() => setShowEditBank(false)} onSaved={load} />}
    </div>
  )
}

function InfoSection({ section, delay }) {
  return (
    <section
      className="animate-fade-up rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition duration-200 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
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
        {section.rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
          >
            <dt className="shrink-0 text-slate-500">{label}</dt>
            <dd className="text-right font-medium break-words text-slate-900">{value || '-'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
