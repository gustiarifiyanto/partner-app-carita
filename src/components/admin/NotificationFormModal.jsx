import { useEffect, useRef, useState } from 'react'
import FormField from '../FormField'
import Modal from '../Modal'
import api from '../../lib/api'
import { fieldClass } from '../../lib/formStyles'
import { useToast } from '../../hooks/useToast'

const INITIAL_FORM = { type: 'promo', title: '', message: '' }
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Mounted only while the modal should be visible (parent uses `showForm && <...>`).
// A fresh component instance per open means form state can be lazily initialized
// straight from `notification`, with no reset-on-prop-change effect needed.
export default function NotificationFormModal({ notification, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState(() =>
    notification
      ? { type: notification.type, title: notification.title, message: notification.message }
      : INITIAL_FORM,
  )
  // Image state: a newly picked file, or the existing image (unless the admin removed it).
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [removeExisting, setRemoveExisting] = useState(false)
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const existingImage = !removeExisting ? notification?.image_url : null
  const shownImage = imagePreview || existingImage

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const pickImage = (file) => {
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, image: 'Gambar harus berformat JPG, PNG, atau WEBP' }))
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrors((prev) => ({ ...prev, image: 'Ukuran gambar maksimal 5MB' }))
      return
    }
    setErrors((prev) => ({ ...prev, image: undefined }))
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (notification?.image_url) setRemoveExisting(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setGeneralError('')
    setSubmitting(true)

    try {
      const payload = new FormData()
      payload.append('type', form.type)
      payload.append('title', form.title)
      payload.append('message', form.message)
      if (imageFile) payload.append('image', imageFile)

      if (notification) {
        // Multipart bodies can't be sent with a real PUT in PHP, so spoof it.
        payload.append('_method', 'PUT')
        if (removeExisting && !imageFile) payload.append('remove_image', '1')
        await api.post(`/admin/notifications/${notification.id}`, payload)
      } else {
        await api.post('/admin/notifications', payload)
      }
      onSaved()
      toast.success(notification ? 'Notifikasi berhasil diupdate.' : 'Notifikasi berhasil dibuat.')
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
      } else {
        const message = err.response?.data?.message || 'Gagal menyimpan notifikasi.'
        setGeneralError(message)
        toast.error(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={notification ? 'Edit Notifikasi' : 'Buat Notifikasi'}>
      {generalError && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{generalError}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Tipe" error={errors.type}>
          <select value={form.type} onChange={handleChange('type')} className={fieldClass(errors.type)}>
            <option value="promo">Promo</option>
            <option value="announcement">Announcement</option>
          </select>
        </FormField>

        <FormField label="Judul" error={errors.title}>
          <input value={form.title} onChange={handleChange('title')} className={fieldClass(errors.title)} required />
        </FormField>

        <FormField label="Pesan" error={errors.message}>
          <textarea
            rows={4}
            value={form.message}
            onChange={handleChange('message')}
            className={fieldClass(errors.message)}
            required
          />
        </FormField>

        <FormField label="Gambar (opsional)" error={errors.image} hint="JPG/PNG/WEBP, maks 5MB">
          <ImageDropzone image={shownImage} onPick={pickImage} onClear={clearImage} />
        </FormField>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {submitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function ImageDropzone({ image, onPick, onClear }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const openPicker = () => inputRef.current?.click()

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    onPick(e.dataTransfer.files?.[0])
  }

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="image/png,image/jpeg,image/webp"
      className="hidden"
      onChange={(e) => {
        onPick(e.target.files?.[0])
        e.target.value = ''
      }}
    />
  )

  if (image) {
    return (
      <div className="animate-fade-up group relative overflow-hidden rounded-xl ring-1 ring-slate-200">
        {input}
        <img src={image} alt="Pratinjau gambar notifikasi" className="max-h-48 w-full bg-slate-50 object-contain" />
        <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/60 to-transparent p-2 pt-8">
          <button
            type="button"
            onClick={openPicker}
            className="rounded-md bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-sm hover:bg-white"
          >
            Ganti
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-md bg-red-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-red-600"
          >
            Hapus
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openPicker}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openPicker()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
        dragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-indigo-300 hover:bg-slate-50'
      }`}
    >
      {input}
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          />
        </svg>
      </span>
      <span className="text-sm font-medium text-slate-700">Klik untuk upload gambar</span>
      <span className="text-xs text-slate-400">atau tarik &amp; lepas file ke sini</span>
    </div>
  )
}
