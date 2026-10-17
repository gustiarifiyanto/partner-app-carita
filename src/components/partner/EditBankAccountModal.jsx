import { useState } from 'react'
import FormField from '../FormField'
import Modal from '../Modal'
import api from '../../lib/api'
import { fieldClass } from '../../lib/formStyles'
import { useToast } from '../../hooks/useToast'

const BANK_FIELDS = ['bank_name', 'bank_account_number', 'bank_account_holder']

// Ubah rekening pencairan komisi. Wajib konfirmasi password (dicek backend),
// supaya sesi login yang dibajak tidak bisa mengalihkan komisi ke rekening lain.
// Parent hanya me-mount modal ini saat dibuka, jadi form selalu terisi data terbaru.
export default function EditBankAccountModal({ onClose, onSaved, partner }) {
  const toast = useToast()
  const [form, setForm] = useState(() => ({
    ...Object.fromEntries(BANK_FIELDS.map((f) => [f, partner?.[f] ?? ''])),
    current_password: '',
  }))
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleClose = () => onClose()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setError('')
    setSubmitting(true)
    try {
      await api.put('/partner/profile', form)
      toast.success('Data rekening berhasil diperbarui.')
      onSaved()
      handleClose()
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
        setError(err.response.data.message || '')
      } else {
        const message = err.response?.data?.message || 'Gagal memperbarui data rekening.'
        setError(message)
        toast.error(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const field = (name) => ({
    value: form[name] ?? '',
    onChange: (e) => setForm((prev) => ({ ...prev, [name]: e.target.value })),
    className: fieldClass(errors[name]),
  })

  return (
    <Modal open onClose={handleClose} title="Ubah Rekening Bank">
      <p className="mb-4 rounded-lg bg-indigo-50 px-3 py-2.5 text-xs leading-relaxed text-indigo-800">
        Rekening ini dipakai admin untuk mentransfer komisi kamu. Pastikan nama pemilik sesuai buku tabungan. Demi
        keamanan, hanya kamu yang bisa mengubahnya dan setiap perubahan tercatat.
      </p>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Nama Bank" error={errors.bank_name}>
            <input {...field('bank_name')} placeholder="BCA / BRI / Mandiri" required />
          </FormField>
          <FormField label="No. Rekening" error={errors.bank_account_number}>
            <input {...field('bank_account_number')} inputMode="numeric" required />
          </FormField>
        </div>
        <FormField label="Nama Pemilik Rekening" error={errors.bank_account_holder}>
          <input {...field('bank_account_holder')} required />
        </FormField>

        <div className="border-t border-slate-100 pt-4">
          <FormField
            label="Password Akun"
            error={errors.current_password}
            hint="Masukkan password login kamu untuk mengonfirmasi perubahan"
          >
            <input type="password" autoComplete="current-password" {...field('current_password')} required />
          </FormField>
        </div>

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
            className="rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Rekening'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
