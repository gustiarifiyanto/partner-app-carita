import { useState } from 'react'
import FormField from '../FormField'
import Modal from '../Modal'
import api from '../../lib/api'
import { fieldClass } from '../../lib/formStyles'
import { useToast } from '../../hooks/useToast'

const EMPTY = {
  name: '',
  price: '',
  original_price: '',
  validity_months: '12',
  featuresText: '',
  max_photos: '4',
  video_enabled: false,
  love_story_photo_enabled: false,
  digital_envelope_enabled: false,
  is_best_seller: false,
  is_active: true,
}

function toForm(pkg) {
  if (!pkg) return EMPTY
  return {
    name: pkg.name,
    price: String(Number(pkg.price)),
    original_price: pkg.original_price ? String(Number(pkg.original_price)) : '',
    validity_months: pkg.validity_months ? String(pkg.validity_months) : '',
    featuresText: (pkg.features || []).join('\n'),
    max_photos: String(pkg.max_photos),
    video_enabled: pkg.video_enabled,
    love_story_photo_enabled: pkg.love_story_photo_enabled,
    digital_envelope_enabled: pkg.digital_envelope_enabled,
    is_best_seller: pkg.is_best_seller,
    is_active: pkg.is_active,
  }
}

const TOGGLES = [
  { key: 'video_enabled', label: 'Video gallery' },
  { key: 'love_story_photo_enabled', label: 'Love story dengan foto' },
  { key: 'digital_envelope_enabled', label: 'Amplop digital' },
  { key: 'is_best_seller', label: 'Badge Best Seller' },
  { key: 'is_active', label: 'Aktif (tampil ke client)' },
]

// Dirender ulang lewat `key` dari parent setiap kali dibuka, jadi state awal
// cukup diambil dari props.
export default function PackageFormModal({ open, pkg, onClose, onSaved }) {
  const toast = useToast()
  const isEdit = Boolean(pkg)
  const [form, setForm] = useState(() => toForm(pkg))
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setError('')
    setSubmitting(true)

    const { featuresText, ...rest } = form
    const payload = {
      ...rest,
      features: featuresText.split('\n'),
      ...(isEdit ? { slug: pkg.slug } : {}),
    }

    try {
      const { data } = isEdit
        ? await api.put(`/admin/catalog/packages/${pkg.id}`, payload)
        : await api.post('/admin/catalog/packages', payload)
      toast.success(data.message)
      onSaved()
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
      } else {
        setError(err.response?.data?.message || 'Gagal menyimpan paket.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={submitting ? () => {} : onClose} title={isEdit ? 'Edit Paket' : 'Tambah Paket'}>
      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nama Paket" error={errors.name || errors.slug}>
          <input value={form.name} onChange={set('name')} className={fieldClass(errors.name || errors.slug)} required />
        </FormField>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Harga (Rp)" error={errors.price}>
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={set('price')}
              className={fieldClass(errors.price)}
              required
            />
          </FormField>
          <FormField label="Harga Coret (Rp)" error={errors.original_price} hint="Opsional, untuk tampilan diskon">
            <input
              type="number"
              min="0"
              value={form.original_price}
              onChange={set('original_price')}
              className={fieldClass(errors.original_price)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Masa Aktif (bulan)" error={errors.validity_months} hint="Kosongkan untuk lifetime">
            <input
              type="number"
              min="1"
              value={form.validity_months}
              onChange={set('validity_months')}
              className={fieldClass(errors.validity_months)}
            />
          </FormField>
          <FormField label="Maks. Foto Galeri" error={errors.max_photos}>
            <input
              type="number"
              min="0"
              value={form.max_photos}
              onChange={set('max_photos')}
              className={fieldClass(errors.max_photos)}
              required
            />
          </FormField>
        </div>

        <FormField label="Daftar Fitur" error={errors.features} hint="Satu fitur per baris, tampil di kartu paket">
          <textarea
            rows={6}
            value={form.featuresText}
            onChange={set('featuresText')}
            className={fieldClass(errors.features)}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
          {TOGGLES.map((t) => (
            <label key={t.key} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form[t.key]}
                onChange={set(t.key)}
                className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />
              {t.label}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
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
