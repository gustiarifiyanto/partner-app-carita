import { useState } from 'react'
import FormField from './FormField'
import Modal from './Modal'
import PasswordInput from './PasswordInput'
import api from '../lib/api'
import { fieldClass } from '../lib/formStyles'
import { useToast } from '../hooks/useToast'

const INITIAL_FORM = {
  old_password: '',
  new_password: '',
  new_password_confirmation: '',
}

export default function ChangePasswordModal({
  open,
  onClose,
  onSuccess,
  title = 'Ganti Password',
  intro,
  oldPasswordLabel = 'Password Lama',
}) {
  const toast = useToast()
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleClose = () => {
    setForm(INITIAL_FORM)
    setErrors({})
    setError('')
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setError('')
    setSubmitting(true)

    try {
      await api.post('/auth/change-password', form)
      toast.success('Password berhasil diubah.')
      onSuccess?.()
      handleClose()
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
        setError(err.response.data.message || '')
      } else {
        const message = err.response?.data?.message || 'Gagal mengubah password.'
        setError(message)
        toast.error(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      {intro && <p className="mb-4 text-sm text-slate-600">{intro}</p>}
      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label={oldPasswordLabel} error={errors.old_password}>
          <PasswordInput
            value={form.old_password}
            onChange={(e) => setForm((prev) => ({ ...prev, old_password: e.target.value }))}
            className={fieldClass(errors.old_password)}
          />
        </FormField>

        <FormField label="Password Baru" error={errors.new_password} hint="Minimal 8 karakter">
          <PasswordInput
            value={form.new_password}
            onChange={(e) => setForm((prev) => ({ ...prev, new_password: e.target.value }))}
            className={fieldClass(errors.new_password)}
          />
        </FormField>

        <FormField label="Konfirmasi Password Baru" error={errors.new_password_confirmation}>
          <PasswordInput
            value={form.new_password_confirmation}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                new_password_confirmation: e.target.value,
              }))
            }
            className={fieldClass(errors.new_password_confirmation)}
          />
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
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Menyimpan...' : 'Ganti Password'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
