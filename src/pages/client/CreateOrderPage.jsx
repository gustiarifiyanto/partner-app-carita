import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import CatalogPicker from '../../components/catalog/CatalogPicker'
import FormField from '../../components/FormField'
import { useCatalog } from '../../hooks/useCatalog'
import { usePageHeader } from '../../hooks/usePageHeader'
import { useToast } from '../../hooks/useToast'
import api from '../../lib/api'
import { formatCurrency } from '../../lib/format'
import { fieldClass } from '../../lib/formStyles'

const REFERRAL_IDLE = { status: 'idle', message: '' }

export default function CreateOrderPage() {
  usePageHeader('Buat Pesanan', 'Pilih paket & tema, lalu lanjut ke pembayaran')
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const catalog = useCatalog()

  const [selection, setSelection] = useState({ package_id: '', theme_id: '' })
  const [referralCode, setReferralCode] = useState(() => (searchParams.get('ref') || '').toUpperCase())
  const [referral, setReferral] = useState(REFERRAL_IDLE)
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [prefilled, setPrefilled] = useState(false)

  // Isi otomatis dari link (?paket=slug&tema=slug) setelah katalog termuat.
  useEffect(() => {
    if (prefilled || catalog.loading) return
    const pkg = catalog.packages.find((p) => p.slug === searchParams.get('paket'))
    const theme = catalog.themes.find((t) => t.slug === searchParams.get('tema'))
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelection({ package_id: pkg ? String(pkg.id) : '', theme_id: theme ? String(theme.id) : '' })
    setPrefilled(true)
  }, [catalog, searchParams, prefilled])

  // Cek kode referral otomatis (jeda singkat setelah berhenti mengetik).
  const trimmedCode = referralCode.trim()
  useEffect(() => {
    if (!trimmedCode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReferral(REFERRAL_IDLE)
      return undefined
    }
    setReferral({ status: 'checking', message: 'Mengecek kode...' })
    const timer = setTimeout(() => {
      api
        .get(`/catalog/referral/${encodeURIComponent(trimmedCode)}`)
        .then(({ data }) =>
          setReferral({ status: data.data.valid ? 'valid' : 'invalid', message: data.message }),
        )
        .catch((err) =>
          setReferral({
            status: 'invalid',
            message:
              err.response?.status === 429
                ? 'Terlalu sering mengecek kode. Tunggu sebentar.'
                : 'Gagal mengecek kode referral.',
          }),
        )
    }, 500)
    return () => clearTimeout(timer)
  }, [trimmedCode])

  const selectedPackage = useMemo(
    () => catalog.packages.find((p) => String(p.id) === String(selection.package_id)),
    [catalog.packages, selection.package_id],
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setGeneralError('')
    setSubmitting(true)

    try {
      const { data } = await api.post('/client/orders', {
        ...selection,
        referral_code: trimmedCode || null,
        notes: notes.trim() || null,
      })
      toast.success('Pesanan berhasil dibuat.')
      navigate(`/client/orders/${data.data.id}`, { replace: true })
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
      } else {
        setGeneralError(err.response?.data?.message || 'Gagal membuat pesanan.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const referralError = errors.referral_code?.[0]
  const referralBlocked = referral.status === 'invalid' || referral.status === 'checking'

  return (
    <form onSubmit={handleSubmit} className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
      <div className="animate-fade-up space-y-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        {generalError && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{generalError}</div>}

        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Paket & Tema</h2>
          <CatalogPicker
            catalog={catalog}
            packageId={selection.package_id}
            themeId={selection.theme_id}
            onChange={(patch) => setSelection((prev) => ({ ...prev, ...patch }))}
            errors={errors}
          />
          <p className="mt-2 text-xs text-slate-500">
            Bingung pilih tema?{' '}
            <Link to="/client/katalog" className="font-medium text-violet-600 hover:underline">
              Lihat katalog lengkap
            </Link>
          </p>
        </div>

        <FormField
          label="Kode Referral (opsional)"
          error={referralError}
          hint={!referralError && referral.status === 'idle' ? 'Isi kalau kamu dapat kode dari partner Carita' : undefined}
        >
          <input
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            maxLength={20}
            placeholder="Contoh: CRT123"
            className={`${fieldClass(referralError || referral.status === 'invalid')} font-mono tracking-wider uppercase`}
          />
          {!referralError && referral.status !== 'idle' && (
            <p
              className={`mt-1 text-xs ${
                referral.status === 'valid'
                  ? 'text-emerald-600'
                  : referral.status === 'invalid'
                    ? 'text-red-600'
                    : 'text-slate-400'
              }`}
            >
              {referral.status === 'valid' ? '✓ ' : ''}
              {referral.message}
            </p>
          )}
        </FormField>

        <FormField label="Catatan (opsional)" error={errors.notes}>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={1000}
            placeholder="Misalnya tanggal acara atau permintaan khusus"
            className={fieldClass(errors.notes)}
          />
        </FormField>
      </div>

      <aside className="animate-fade-up h-fit space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:sticky lg:top-4">
        <h2 className="text-sm font-semibold text-slate-900">Ringkasan</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Paket</dt>
            <dd className="text-right font-medium text-slate-900">{selectedPackage?.name || '-'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Masa aktif</dt>
            <dd className="text-right text-slate-900">{selectedPackage?.validity_label || '-'}</dd>
          </div>
          {referral.status === 'valid' && (
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Referral</dt>
              <dd className="text-right font-mono text-slate-900">{trimmedCode}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3 border-t border-slate-100 pt-3">
            <dt className="font-medium text-slate-900">Total</dt>
            <dd className="text-lg font-bold text-slate-900">
              {selectedPackage ? formatCurrency(selectedPackage.price) : '-'}
            </dd>
          </div>
        </dl>
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
          Setelah pesanan dibuat, lakukan pembayaran dalam <strong>3 hari</strong>. Pesanan yang belum dibayar akan
          dibatalkan otomatis.
        </p>
        <button
          type="submit"
          disabled={submitting || !selection.package_id || !selection.theme_id || referralBlocked}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-[0_8px_24px_rgba(109,40,217,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundImage: 'linear-gradient(135deg, #4c1d95, #6d28d9)' }}
        >
          {submitting ? 'Memproses...' : 'Buat Pesanan'}
        </button>
      </aside>
    </form>
  )
}
