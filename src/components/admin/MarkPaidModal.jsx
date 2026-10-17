import { useState } from 'react'
import CopyButton from '../CopyButton'
import FormField from '../FormField'
import Modal from '../Modal'
import api from '../../lib/api'
import { formatCurrency } from '../../lib/format'
import { fieldClass } from '../../lib/formStyles'
import { useToast } from '../../hooks/useToast'

const INITIAL_FORM = { payment_method: 'bank_transfer', reference_number: '', notes: '' }

export default function MarkPaidModal({ open, partner, amount, onClose, onPaid }) {
  const toast = useToast()
  const [form, setForm] = useState(INITIAL_FORM)
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const resetProof = () => {
    if (proofPreview) URL.revokeObjectURL(proofPreview)
    setProofFile(null)
    setProofPreview(null)
  }

  const handleClose = () => {
    setForm(INITIAL_FORM)
    resetProof()
    setError('')
    setErrors({})
    onClose()
  }

  const handleProofChange = (e) => {
    const file = e.target.files?.[0]
    if (proofPreview) URL.revokeObjectURL(proofPreview)

    if (!file) {
      setProofFile(null)
      setProofPreview(null)
      return
    }

    setProofFile(file)
    setProofPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setErrors({})
    setSubmitting(true)

    try {
      const payload = new FormData()
      payload.append('_method', 'PUT')
      payload.append('payment_method', form.payment_method)
      if (form.reference_number) payload.append('reference_number', form.reference_number)
      if (form.notes) payload.append('notes', form.notes)
      if (proofFile) payload.append('payment_proof', proofFile)

      await api.post(`/admin/commissions/partners/${partner.id}/mark-paid`, payload)
      setForm(INITIAL_FORM)
      resetProof()
      onPaid()
      toast.success(`Komisi ${partner.company_name} berhasil dibayar.`)
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
        setError(err.response.data.message || '')
      } else {
        const message = err.response?.data?.message || 'Gagal membayar komisi.'
        setError(message)
        toast.error(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!open || !partner) return null

  return (
    <Modal open={open} onClose={handleClose} title={`Bayar Komisi - ${partner.company_name}`}>
      <p className="mb-4 text-sm text-slate-500">
        Ini akan membayar <strong>seluruh komisi unpaid</strong> milik partner ini sekaligus dalam satu
        payout.
      </p>

      <BankTransferCard partner={partner} amount={amount} />

      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Metode Pembayaran" error={errors.payment_method}>
          <select
            value={form.payment_method}
            onChange={(e) => setForm((prev) => ({ ...prev, payment_method: e.target.value }))}
            className={fieldClass(errors.payment_method)}
          >
            <option value="bank_transfer">Transfer Bank</option>
            <option value="other">Lainnya</option>
          </select>
        </FormField>

        <FormField label="Nomor Referensi" error={errors.reference_number}>
          <input
            value={form.reference_number}
            onChange={(e) => setForm((prev) => ({ ...prev, reference_number: e.target.value }))}
            className={fieldClass(errors.reference_number)}
          />
        </FormField>

        <FormField label="Catatan">
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            className={fieldClass(false)}
          />
        </FormField>

        <FormField label="Bukti Transfer (opsional)" error={errors.payment_proof} hint="JPG/PNG/WEBP, maks 5MB">
          {proofPreview ? (
            <div className="flex items-center gap-3">
              <img
                src={proofPreview}
                alt="Preview bukti transfer"
                className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
              />
              <button
                type="button"
                onClick={resetProof}
                className="text-sm font-medium text-red-600 hover:underline"
              >
                Hapus foto
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleProofChange}
              className={`${fieldClass(errors.payment_proof)} file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200`}
            />
          )}
        </FormField>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Memproses...' : 'Bayar Sekarang'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// Partner's bank details with copy buttons so the admin can paste them
// straight into their banking app.
function BankTransferCard({ partner, amount }) {
  const accountNumber = String(partner.bank_account_number || '').replace(/\s+/g, '')
  const hasBank = partner.bank_name && accountNumber

  if (!hasBank) {
    return (
      <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
        Partner ini belum mengisi data rekening bank. Minta partner melengkapi profilnya sebelum transfer.
      </div>
    )
  }

  const summary = [
    `${partner.bank_name} ${accountNumber}`,
    `a.n. ${partner.bank_account_holder || '-'}`,
    amount ? `Nominal ${formatCurrency(amount)}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <div className="animate-fade-up relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 p-4 text-white shadow-lg">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/30 blur-2xl" />

      <div className="relative flex items-center justify-between gap-3">
        <span className="text-xs font-semibold tracking-widest text-white/60 uppercase">Rekening Tujuan</span>
        <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-bold tracking-wider uppercase">
          {partner.bank_name}
        </span>
      </div>

      <div className="relative mt-3 flex items-center justify-between gap-3">
        <p className="font-mono text-lg font-semibold tracking-widest break-all">{accountNumber}</p>
        <CopyButton text={accountNumber} successMessage="Nomor rekening disalin." />
      </div>

      <div className="relative mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
        <div className="min-w-0">
          <p className="text-[10px] tracking-wider text-white/50 uppercase">Atas Nama</p>
          <p className="truncate text-sm font-medium">{partner.bank_account_holder || '-'}</p>
        </div>
        <CopyButton text={partner.bank_account_holder} successMessage="Nama pemilik rekening disalin." />
      </div>

      {amount > 0 && (
        <div className="relative mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <div>
            <p className="text-[10px] tracking-wider text-white/50 uppercase">Nominal Transfer</p>
            <p className="text-sm font-semibold text-emerald-300">{formatCurrency(amount)}</p>
          </div>
          <CopyButton text={Math.round(amount)} successMessage="Nominal disalin." />
        </div>
      )}

      <div className="relative mt-4">
        <CopyButton
          text={summary}
          label="Salin semua info rekening"
          successMessage="Info rekening disalin."
          className="w-full justify-center py-1.5"
        />
      </div>
    </div>
  )
}
