import { useState } from 'react'
import { useToast } from '../../hooks/useToast'
import api from '../../lib/api'
import { fieldClass } from '../../lib/formStyles'
import CopyButton from '../CopyButton'
import FormField from '../FormField'
import Modal from '../Modal'

const INITIAL_FORM = { new_password: '', new_password_confirmation: '', send_email: true }

// Tanpa karakter yang mirip (0/O, 1/l/I) supaya mudah dibaca partner dari email/WA
const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'

function generatePassword(length = 10) {
  const bytes = new Uint32Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (n) => PASSWORD_CHARS[n % PASSWORD_CHARS.length]).join('')
}

export default function ResetPartnerPasswordModal({ open, onClose, partner }) {
  const toast = useToast()
  const [form, setForm] = useState(INITIAL_FORM)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleClose = () => {
    setForm(INITIAL_FORM)
    setShowPassword(false)
    setErrors({})
    setError('')
    onClose()
  }

  const handleGenerate = () => {
    const password = generatePassword()
    setForm((prev) => ({ ...prev, new_password: password, new_password_confirmation: password }))
    setShowPassword(true)
    setErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setError('')
    setSubmitting(true)

    try {
      const { data } = await api.put(`/admin/partners/${partner.id}/password`, form)
      if (form.send_email && !data.email_sent) toast.error(data.message)
      else toast.success(data.message)
      handleClose()
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
        setError(err.response.data.message || '')
      } else {
        const message = err.response?.data?.message || 'Gagal mereset password partner.'
        setError(message)
        toast.error(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const inputType = showPassword ? 'text' : 'password'

  return (
    <Modal open={open} onClose={handleClose} title="Reset Password Partner">
      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      <p className="mb-4 text-sm text-slate-600">
        Atur password baru untuk <span className="font-semibold text-slate-900">{partner?.company_name}</span> (
        {partner?.user.email}).
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Password Baru" error={errors.new_password} hint="Minimal 8 karakter">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={inputType}
                autoComplete="new-password"
                value={form.new_password}
                onChange={(e) => setForm((prev) => ({ ...prev, new_password: e.target.value }))}
                className={`${fieldClass(errors.new_password)} pr-9 font-mono`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? 'Tutup' : 'Lihat'}
              </button>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              className="shrink-0 rounded-lg border border-violet-200 px-3 py-2 text-sm font-medium text-violet-700 hover:border-violet-600 hover:bg-violet-600 hover:text-white"
            >
              Buat Otomatis
            </button>
          </div>
        </FormField>

        <FormField label="Konfirmasi Password Baru" error={errors.new_password_confirmation}>
          <input
            type={inputType}
            autoComplete="new-password"
            value={form.new_password_confirmation}
            onChange={(e) => setForm((prev) => ({ ...prev, new_password_confirmation: e.target.value }))}
            className={`${fieldClass(errors.new_password_confirmation)} font-mono`}
          />
        </FormField>

        {form.new_password && (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-300">
            <span>Salin password untuk dikirim manual (mis. via WhatsApp)</span>
            <CopyButton text={form.new_password} successMessage="Password disalin." />
          </div>
        )}

        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 text-sm hover:bg-slate-50">
          <input
            type="checkbox"
            checked={form.send_email}
            onChange={(e) => setForm((prev) => ({ ...prev, send_email: e.target.checked }))}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-violet-600"
          />
          <span>
            <span className="font-medium text-slate-900">Kirim password baru ke email partner</span>
            <span className="block text-xs text-slate-500">
              Dikirim ke {partner?.user.email} beserta link login & anjuran segera ganti password.
            </span>
          </span>
        </label>

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
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Menyimpan...' : form.send_email ? 'Reset & Kirim Email' : 'Reset Password'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
