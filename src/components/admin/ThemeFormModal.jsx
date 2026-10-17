import { useEffect, useState } from 'react'
import FormField from '../FormField'
import Modal from '../Modal'
import api from '../../lib/api'
import { fieldClass } from '../../lib/formStyles'
import { useToast } from '../../hooks/useToast'

const MAX_THUMBNAIL_MB = 2

function toForm(theme, defaultCategory) {
  return {
    name: theme?.name || '',
    category: theme?.category || defaultCategory || 'premium',
    demo_url: theme?.demo_url || '',
    thumbnail_url: theme?.thumbnail_url || '',
    is_active: theme ? theme.is_active : true,
  }
}

// Dirender ulang lewat `key` dari parent setiap kali dibuka.
export default function ThemeFormModal({ open, theme, categories, defaultCategory, onClose, onSaved }) {
  const toast = useToast()
  const isEdit = Boolean(theme)
  const [form, setForm] = useState(() => toForm(theme, defaultCategory))
  const [file, setFile] = useState(null)
  const [removeUpload, setRemoveUpload] = useState(false)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [filePreview, setFilePreview] = useState(null)

  useEffect(() => {
    if (!file) return undefined
    const url = URL.createObjectURL(file)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Gambar yang sedang dipakai: file baru > upload lama > link gambar dari website.
  const hasUploaded = isEdit && theme.thumbnail && theme.thumbnail !== theme.thumbnail_url && !removeUpload
  const preview = file ? filePreview : hasUploaded ? theme.thumbnail : form.thumbnail_url || null

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const handleFile = (e) => {
    const picked = e.target.files?.[0]
    e.target.value = ''
    if (!picked) return
    if (picked.size > MAX_THUMBNAIL_MB * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, thumbnail: [`Ukuran thumbnail maksimal ${MAX_THUMBNAIL_MB} MB`] }))
      return
    }
    setErrors((prev) => ({ ...prev, thumbnail: undefined }))
    setFile(picked)
  }

  const clearUpload = () => {
    if (file) setFile(null)
    else setRemoveUpload(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setError('')
    setSubmitting(true)

    const payload = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      payload.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value)
    })
    if (isEdit) payload.append('slug', theme.slug)
    if (file) payload.append('thumbnail', file)
    if (removeUpload) payload.append('remove_thumbnail', '1')

    try {
      const { data } = isEdit
        ? await api.post(`/admin/catalog/themes/${theme.id}`, payload)
        : await api.post('/admin/catalog/themes', payload)
      toast.success(data.message)
      onSaved()
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
      } else if (err.response?.status === 413) {
        setError('File terlalu besar untuk server.')
      } else {
        setError(err.response?.data?.message || 'Gagal menyimpan tema.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={submitting ? () => {} : onClose} title={isEdit ? 'Edit Tema' : 'Tambah Tema'}>
      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="mx-auto w-32 shrink-0 sm:mx-0">
            <div className="aspect-[3/4] overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
              {preview ? (
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center px-2 text-center text-xs text-slate-400">
                  Belum ada gambar
                </div>
              )}
            </div>
            <label className="mt-2 block cursor-pointer rounded-lg border border-slate-300 px-2 py-1.5 text-center text-xs font-medium text-slate-700 hover:bg-slate-50">
              Upload Gambar
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
            </label>
            {(file || hasUploaded) && (
              <button
                type="button"
                onClick={clearUpload}
                className="mt-1 w-full text-center text-xs text-red-600 hover:underline"
              >
                Hapus upload
              </button>
            )}
            {errors.thumbnail && <p className="mt-1 text-xs text-red-600">{errors.thumbnail[0]}</p>}
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <FormField label="Nama Tema" error={errors.name || errors.slug}>
              <input
                value={form.name}
                onChange={set('name')}
                className={fieldClass(errors.name || errors.slug)}
                required
              />
            </FormField>
            <FormField label="Kategori" error={errors.category}>
              <select value={form.category} onChange={set('category')} className={fieldClass(errors.category)}>
                {Object.entries(categories).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </div>

        <FormField label="Link Demo" error={errors.demo_url} hint="Halaman demo di lokcreative.com, dibuka di tab baru">
          <input
            type="url"
            value={form.demo_url}
            onChange={set('demo_url')}
            placeholder="https://lokcreative.com/..."
            className={fieldClass(errors.demo_url)}
          />
        </FormField>
        <FormField
          label="Link Gambar (opsional)"
          error={errors.thumbnail_url}
          hint="Dipakai kalau tidak ada gambar upload"
        >
          <input
            type="url"
            value={form.thumbnail_url}
            onChange={set('thumbnail_url')}
            placeholder="https://lokcreative.com/wp-content/uploads/..."
            className={fieldClass(errors.thumbnail_url)}
          />
        </FormField>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={set('is_active')}
            className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
          />
          Aktif (tampil ke client)
        </label>

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
