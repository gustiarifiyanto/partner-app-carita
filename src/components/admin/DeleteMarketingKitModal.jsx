import { useState } from 'react'
import { useToast } from '../../hooks/useToast'
import api from '../../lib/api'
import { categoryStyle, fileExtension, formatFileSize } from '../../lib/marketingKit'
import Modal from '../Modal'

export default function DeleteMarketingKitModal({ kit, onClose, onDeleted }) {
  const toast = useToast()
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setError('')
    setDeleting(true)
    try {
      const { data } = await api.delete(`/admin/marketing-kits/${kit.id}`)
      toast.success(data.message)
      onDeleted()
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal menghapus materi.'
      setError(message)
      toast.error(message)
      setDeleting(false)
    }
  }

  return (
    <Modal open={Boolean(kit)} onClose={deleting ? () => {} : onClose} title="Hapus Materi?">
      {kit && (
        <>
          {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

          {/* Materi yang akan dihapus */}
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
            {kit.preview_url ? (
              <img src={kit.preview_url} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
            ) : (
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                style={{ backgroundImage: categoryStyle(kit.category).gradient }}
              >
                {kit.has_file ? fileExtension(kit.file_name) : kit.external_url ? 'LINK' : 'TEKS'}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{kit.title}</p>
              <p className="text-xs text-slate-500">
                {kit.category_label}
                {kit.has_file && ` · ${formatFileSize(kit.file_size)}`} · diunduh {kit.download_count}x
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m0 3.75h.008v.008H12v-.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            <p>
              Materi ini akan <strong>dihapus permanen</strong>
              {kit.has_file && ' beserta file-nya'} dan <strong>tidak bisa dikembalikan</strong>. Partner tidak bisa
              mengunduhnya lagi.
            </p>
          </div>

          {kit.is_published && (
            <p className="mt-3 text-xs text-slate-500">
              Hanya ingin menyembunyikan sementara? Tutup pop-up ini lalu pakai tombol <strong>Sembunyikan</strong>.
            </p>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
