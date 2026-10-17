import { useRef, useState } from 'react'
import { useToast } from '../../hooks/useToast'
import api from '../../lib/api'
import { fieldClass } from '../../lib/formStyles'
import { ALLOWED_EXTENSIONS, MAX_FILE_BYTES, fileExtension, formatFileSize } from '../../lib/marketingKit'
import FormField from '../FormField'
import Modal from '../Modal'

const ACCEPT = ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',')

function initialForm(kit) {
  return {
    title: kit?.title ?? '',
    category: kit?.category ?? '',
    description: kit?.description ?? '',
    caption: kit?.caption ?? '',
    external_url: kit?.external_url ?? '',
    is_published: kit?.is_published ?? true,
  }
}

/**
 * Tambah / edit marketing kit. Dirender ulang (key) setiap kali dibuka supaya
 * form selalu mulai dari data materi yang dipilih.
 */
export default function MarketingKitFormModal({ open, onClose, onSaved, kit, categories }) {
  const toast = useToast()
  const isEdit = Boolean(kit)
  const [form, setForm] = useState(() => initialForm(kit))
  const [file, setFile] = useState(null)
  const [removeFile, setRemoveFile] = useState(false)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)

  const existingFile = isEdit && kit.has_file && !removeFile && !file

  const setField = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const pickFile = (picked) => {
    if (!picked) return
    const ext = fileExtension(picked.name).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrors((prev) => ({ ...prev, file: `Format .${ext || '?'} tidak didukung.` }))
      return
    }
    if (picked.size > MAX_FILE_BYTES) {
      setErrors((prev) => ({
        ...prev,
        file: 'Ukuran file maksimal 50 MB. Untuk file lebih besar, upload ke Google Drive lalu isi kolom Link.',
      }))
      return
    }
    setErrors((prev) => ({ ...prev, file: undefined }))
    setFile(picked)
  }

  const clearFile = () => {
    if (file) setFile(null)
    else setRemoveFile(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setError('')
    setSubmitting(true)
    setProgress(0)

    const payload = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      payload.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value)
    })
    if (file) payload.append('file', file)
    if (removeFile) payload.append('remove_file', '1')

    try {
      const config = {
        onUploadProgress: (evt) => {
          if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100))
        },
      }
      const { data } = isEdit
        ? await api.post(`/admin/marketing-kits/${kit.id}`, payload, config)
        : await api.post('/admin/marketing-kits', payload, config)
      toast.success(data.message)
      onSaved()
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
        setError(err.response.data.message || '')
      } else if (err.response?.status === 413) {
        setError('File terlalu besar untuk server. Gunakan link Google Drive untuk file besar.')
      } else {
        const message = err.response?.data?.message || 'Gagal menyimpan marketing kit.'
        setError(message)
        toast.error(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={submitting ? () => {} : onClose} title={isEdit ? 'Edit Materi' : 'Upload Materi Baru'}>
      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Judul" error={errors.title}>
          <input
            value={form.title}
            onChange={setField('title')}
            maxLength={150}
            placeholder="Contoh: Feed Instagram Promo Oktober"
            className={fieldClass(errors.title)}
          />
        </FormField>

        <FormField label="Kategori" error={errors.category}>
          <select value={form.category} onChange={setField('category')} className={fieldClass(errors.category)}>
            <option value="">Pilih kategori...</option>
            {Object.entries(categories ?? {}).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Deskripsi (opsional)" error={errors.description} hint="Jelaskan isi materi & cara pakainya">
          <textarea
            rows={2}
            maxLength={1000}
            value={form.description}
            onChange={setField('description')}
            className={fieldClass(errors.description)}
          />
        </FormField>

        <FormField label="File" error={errors.file} hint={`Maks. 50 MB · ${ALLOWED_EXTENSIONS.join(', ')}`}>
          <FileDropzone
            file={file}
            existing={existingFile ? kit : null}
            onPick={pickFile}
            onClear={clearFile}
            hasError={Boolean(errors.file)}
          />
        </FormField>

        <FormField
          label="Link (opsional)"
          error={errors.external_url}
          hint="Untuk file besar / video: link Google Drive, Canva, YouTube, dll."
        >
          <input
            type="url"
            value={form.external_url}
            onChange={setField('external_url')}
            placeholder="https://drive.google.com/..."
            className={fieldClass(errors.external_url)}
          />
        </FormField>

        <FormField label="Caption siap pakai (opsional)" error={errors.caption} hint="Partner bisa menyalinnya dengan 1 klik">
          <textarea
            rows={4}
            maxLength={5000}
            value={form.caption}
            onChange={setField('caption')}
            placeholder="Tulis caption / copywriting untuk postingan partner..."
            className={fieldClass(errors.caption)}
          />
        </FormField>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 text-sm hover:bg-slate-50">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={setField('is_published')}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-amber-600"
          />
          <span>
            <span className="font-medium text-slate-900">Tampilkan ke partner</span>
            <span className="block text-xs text-slate-500">Matikan kalau materi masih draft.</span>
          </span>
        </label>

        {submitting && file && (
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-500">Mengupload... {progress}%</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-md hover:shadow-amber-600/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Upload'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function FileDropzone({ file, existing, onPick, onClear, hasError }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const openPicker = () => inputRef.current?.click()

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPT}
      className="hidden"
      onChange={(e) => {
        onPick(e.target.files?.[0])
        e.target.value = ''
      }}
    />
  )

  const shown = file ? { name: file.name, size: file.size } : existing ? { name: existing.file_name, size: existing.file_size } : null

  if (shown) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-amber-50/60 px-3 py-2.5 ring-1 ring-amber-200">
        {input}
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-[10px] font-bold text-white">
          {fileExtension(shown.name) || 'FILE'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800">{shown.name}</p>
          <p className="text-xs text-slate-500">
            {formatFileSize(shown.size)}
            {file ? ' · file baru' : ' · file saat ini'}
          </p>
        </div>
        <button
          type="button"
          onClick={openPicker}
          className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
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
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        onPick(e.dataTransfer.files?.[0])
      }}
      className={`flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
        dragging
          ? 'border-amber-400 bg-amber-50'
          : hasError
            ? 'border-red-300 hover:bg-red-50/40'
            : 'border-slate-300 hover:border-amber-300 hover:bg-amber-50/40'
      }`}
    >
      {input}
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
          />
        </svg>
      </span>
      <span className="text-sm font-medium text-slate-700">Klik untuk pilih file</span>
      <span className="text-xs text-slate-400">atau tarik &amp; lepas file ke sini</span>
    </div>
  )
}
