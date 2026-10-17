import { useState } from 'react'
import FormField from '../FormField'
import Modal from '../Modal'
import api from '../../lib/api'
import { fieldClass } from '../../lib/formStyles'
import { useToast } from '../../hooks/useToast'

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  phone: '',
  company_name: '',
  address: '',
  city: '',
  province: '',
  postal_code: '',
  commission_rate: '',
}

export default function CreatePartnerModal({ open, onClose, onCreated }) {
  const toast = useToast()
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleClose = () => {
    setForm(INITIAL_FORM)
    setErrors({})
    setGeneralError('')
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setGeneralError('')
    setSubmitting(true)

    try {
      const payload = { ...form }
      if (!payload.commission_rate) delete payload.commission_rate

      const { data } = await api.post('/admin/partners', payload)
      setForm(INITIAL_FORM)
      onCreated(data.account)
      toast.success('Partner berhasil ditambahkan.')
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
      } else {
        const message = err.response?.data?.message || 'Gagal membuat partner.'
        setGeneralError(message)
        toast.error(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Tambah Partner">
      {generalError && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{generalError}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <fieldset className="space-y-3">
          <legend className="mb-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Akun
          </legend>
          <FormField label="Nama" error={errors.name}>
            <input
              value={form.name}
              onChange={handleChange('name')}
              className={fieldClass(errors.name)}
              required
            />
          </FormField>
          <FormField label="Email" error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              className={fieldClass(errors.email)}
              required
            />
          </FormField>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Password" error={errors.password}>
              <input
                type="password"
                value={form.password}
                onChange={handleChange('password')}
                className={fieldClass(errors.password)}
                required
              />
            </FormField>
            <FormField label="Konfirmasi Password">
              <input
                type="password"
                value={form.password_confirmation}
                onChange={handleChange('password_confirmation')}
                className={fieldClass(false)}
                required
              />
            </FormField>
          </div>
          <FormField label="Telepon" error={errors.phone}>
            <input
              value={form.phone}
              onChange={handleChange('phone')}
              className={fieldClass(errors.phone)}
              required
            />
          </FormField>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Perusahaan
          </legend>
          <FormField
            label="Nama Perusahaan"
            error={errors.company_name}
            hint='Nama ini yang tampil ke client saat memakai kode referral partner, mis. "Kode dari Carita Studio".'
          >
            <input
              value={form.company_name}
              onChange={handleChange('company_name')}
              className={fieldClass(errors.company_name)}
              required
            />
          </FormField>
          <FormField label="Alamat">
            <input value={form.address} onChange={handleChange('address')} className={fieldClass(false)} />
          </FormField>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FormField label="Kota">
              <input value={form.city} onChange={handleChange('city')} className={fieldClass(false)} />
            </FormField>
            <FormField label="Provinsi">
              <input value={form.province} onChange={handleChange('province')} className={fieldClass(false)} />
            </FormField>
            <FormField label="Kode Pos">
              <input
                value={form.postal_code}
                onChange={handleChange('postal_code')}
                className={fieldClass(false)}
              />
            </FormField>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Komisi
          </legend>
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Data rekening bank diisi sendiri oleh partner dari menu Profile, demi keamanan pencairan komisi.
          </p>
          <FormField
            label="Rate Komisi (%)"
            error={errors.commission_rate}
            hint="Default 20% jika dikosongkan"
          >
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.commission_rate}
              onChange={handleChange('commission_rate')}
              className={fieldClass(errors.commission_rate)}
              placeholder="20"
            />
          </FormField>
        </fieldset>

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
            {submitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
