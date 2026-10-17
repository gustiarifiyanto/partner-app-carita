import { useEffect, useState } from 'react'
import CopyButton from '../CopyButton'
import FormField from '../FormField'
import { fieldClass } from '../../lib/formStyles'
import { formatCurrency, formatDate } from '../../lib/format'

// Bagian-bagian pembayaran transfer manual yang dipakai client, partner, dan admin.

const PAYMENT_STATUS = {
  pending: ['Menunggu Pembayaran', 'bg-orange-50 text-orange-700 ring-orange-600/20'],
  waiting_verification: ['Menunggu Verifikasi', 'bg-amber-50 text-amber-700 ring-amber-600/20'],
  paid: ['Lunas', 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'],
  rejected: ['Ditolak', 'bg-red-50 text-red-700 ring-red-600/20'],
  expired: ['Kedaluwarsa', 'bg-slate-100 text-slate-600 ring-slate-500/20'],
  failed: ['Gagal', 'bg-red-50 text-red-700 ring-red-600/20'],
  refunded: ['Dikembalikan', 'bg-slate-100 text-slate-600 ring-slate-500/20'],
}

export function PaymentStatusBadge({ status }) {
  const [label, className] = PAYMENT_STATUS[status] || [status, 'bg-slate-100 text-slate-600 ring-slate-500/20']
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}>
      {label}
    </span>
  )
}

// Rekening tujuan transfer + nominal yang harus dibayar.
export function BankAccountsInfo({ paymentInfo, amount, note }) {
  const accounts = paymentInfo.bank_accounts || []

  return (
    <div className="space-y-2 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
      {amount != null && (
        <p className="text-sm text-slate-600">
          Transfer sebesar <span className="font-bold text-slate-900">{formatCurrency(amount)}</span> ke:
        </p>
      )}
      {paymentInfo.loading ? (
        <p className="text-xs text-slate-400">Memuat rekening...</p>
      ) : accounts.length === 0 ? (
        <p className="text-xs text-amber-700">Rekening tujuan belum diatur. Hubungi admin untuk info rekening.</p>
      ) : (
        accounts.map((account) => (
          <div
            key={account.account_number}
            className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500">{account.bank}</p>
              <p className="font-mono text-base font-semibold tracking-wider text-slate-900">{account.account_number}</p>
              <p className="truncate text-xs text-slate-500">a.n. {account.account_holder}</p>
            </div>
            <CopyButton text={account.account_number} successMessage="Nomor rekening disalin." variant="light" />
          </div>
        ))
      )}
      {note && <p className="text-xs text-slate-500">{note}</p>}
    </div>
  )
}

// Pilih file bukti (gambar/PDF) + nama bank & nama pengirim.
export function PaymentProofFields({ value, onChange, errors = {}, maxMb = 5 }) {
  const [preview, setPreview] = useState(null)
  const file = value.payment_proof

  useEffect(() => {
    if (!file || file.type === 'application/pdf') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreview(null)
      return undefined
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const [sizeError, setSizeError] = useState('')
  const handleFile = (e) => {
    const picked = e.target.files?.[0]
    e.target.value = ''
    if (!picked) return
    if (picked.size > maxMb * 1024 * 1024) {
      setSizeError(`Ukuran bukti transfer maksimal ${maxMb} MB`)
      return
    }
    setSizeError('')
    onChange({ payment_proof: picked })
  }

  const fileError = sizeError || errors.payment_proof?.[0]

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 block text-sm font-medium text-slate-700">Bukti Transfer</p>
        <label
          className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed p-3 transition hover:bg-slate-50 ${
            fileError ? 'border-red-300' : 'border-slate-300'
          }`}
        >
          {preview ? (
            <img src={preview} alt="" className="h-14 w-14 shrink-0 rounded object-cover ring-1 ring-slate-200" />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-slate-100 text-xs font-semibold text-slate-400">
              {file ? 'PDF' : '+'}
            </span>
          )}
          <span className="min-w-0 text-sm">
            <span className="block truncate font-medium text-slate-700">{file ? file.name : 'Pilih foto / PDF bukti transfer'}</span>
            <span className="text-xs text-slate-400">JPG, PNG, WEBP, atau PDF · maks. {maxMb} MB</span>
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFile}
            className="hidden"
          />
        </label>
        {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Bank Pengirim (opsional)" error={errors.sender_bank}>
          <input
            value={value.sender_bank || ''}
            onChange={(e) => onChange({ sender_bank: e.target.value })}
            placeholder="Mis. BCA"
            className={fieldClass(errors.sender_bank)}
          />
        </FormField>
        <FormField label="Nama Pengirim (opsional)" error={errors.sender_name}>
          <input
            value={value.sender_name || ''}
            onChange={(e) => onChange({ sender_name: e.target.value })}
            placeholder="Sesuai rekening"
            className={fieldClass(errors.sender_name)}
          />
        </FormField>
      </div>
    </div>
  )
}

// Riwayat percobaan bayar (terbaru dulu) dengan alasan penolakan & link bukti.
export function PaymentHistory({ payments = [], showUploader = false }) {
  if (payments.length === 0) {
    return <p className="text-sm text-slate-400">Belum ada bukti pembayaran.</p>
  }

  return (
    <ul className="divide-y divide-slate-100">
      {payments.map((payment) => (
        <li key={payment.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <PaymentStatusBadge status={payment.status} />
              <span className="font-semibold text-slate-900">{formatCurrency(payment.amount)}</span>
            </div>
            <p className="text-xs text-slate-500">
              {formatDate(payment.created_at)}
              {payment.sender_bank || payment.sender_name
                ? ` · dari ${[payment.sender_bank, payment.sender_name].filter(Boolean).join(' a.n. ')}`
                : ''}
              {showUploader && payment.uploaded_by ? ` · diupload ${payment.uploaded_by.name} (${payment.uploaded_by.role})` : ''}
            </p>
            {payment.status === 'rejected' && payment.rejection_reason && (
              <p className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">Alasan ditolak: {payment.rejection_reason}</p>
            )}
          </div>
          {payment.proof_url && (
            <a
              href={payment.proof_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs font-medium text-violet-600 hover:underline"
            >
              {payment.proof_is_pdf ? 'Buka PDF bukti' : 'Lihat bukti'}
            </a>
          )}
        </li>
      ))}
    </ul>
  )
}
