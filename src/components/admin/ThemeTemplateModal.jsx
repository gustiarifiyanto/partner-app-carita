import { useRef, useState } from 'react'
import Modal from '../Modal'
import { useToast } from '../../hooks/useToast'
import api from '../../lib/api'

// Upload / unduh / hapus template JSON Self Editing untuk satu tema. Tema
// dengan template bisa dipesan client dengan add-on Self Editing. File export
// Elementor dikonversi otomatis di server; hasilnya ditampilkan untuk dicek.
export default function ThemeTemplateModal({ theme, onClose, onSaved }) {
  const toast = useToast()
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState([])
  const [conversion, setConversion] = useState(null)

  // Unduh lewat api (butuh token), lalu simpan sebagai file .json.
  const download = async (url, filename) => {
    try {
      const { data } = await api.get(url, { responseType: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(data)
      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)
    } catch {
      toast.error('Gagal mengunduh file.')
    }
  }

  const upload = async (file) => {
    setBusy(true)
    setErrors([])
    try {
      const body = new FormData()
      body.append('template', file)
      const { data } = await api.post(`/admin/catalog/themes/${theme.id}/template`, body)
      toast.success(data.message || 'Template disimpan.')
      // Hasil konversi Elementor ditampilkan dulu; template format kita langsung selesai.
      if (data.conversion) {
        setConversion(data.conversion)
      } else {
        onSaved()
      }
    } catch (err) {
      if (err.response?.status === 422 && err.response.data.errors) {
        setErrors(Object.values(err.response.data.errors).flat())
      } else {
        toast.error(err.response?.data?.message || 'Gagal mengupload template.')
      }
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await api.delete(`/admin/catalog/themes/${theme.id}/template`)
      toast.success('Template dihapus. Tema ini tidak bisa dipesan dengan Self Editing.')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus template.')
    } finally {
      setBusy(false)
    }
  }

  if (conversion) {
    return (
      <Modal open onClose={onSaved} title="Hasil Konversi Elementor">
        <ConversionResult conversion={conversion} onDone={onSaved} />
      </Modal>
    )
  }

  return (
    <Modal open onClose={onClose} title="Template Self Editing">
      <div className="space-y-4 text-sm">
        <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
          {theme.thumbnail && <img src={theme.thumbnail} alt="" className="h-14 w-10 rounded object-cover" />}
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{theme.name}</p>
            <p className={`text-xs font-medium ${theme.has_self_template ? 'text-emerald-600' : 'text-slate-400'}`}>
              {theme.has_self_template ? '✓ Template terpasang, bisa dipesan dengan Self Editing' : 'Belum ada template'}
            </p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-slate-500">
          Upload <strong>file export Elementor</strong> (Template → Export) dan sistem akan mengonversinya otomatis, atau
          upload template format Carita (unduh contoh untuk melihat formatnya). Isinya: warna, font, gambar sampul, urutan
          section, dan teks bawaan. Order yang sudah dibuat tetap memakai template saat checkout.
        </p>

        {errors.length > 0 && (
          <ul className="list-inside list-disc space-y-0.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full rounded-lg bg-violet-600 px-4 py-2.5 font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {busy ? 'Memproses...' : theme.has_self_template ? 'Ganti Template (.json)' : 'Upload Template / Export Elementor (.json)'}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => download('/admin/catalog/theme-template-sample', 'contoh-template-self-editing.json')}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Unduh Contoh
          </button>
          {theme.has_self_template ? (
            <button
              type="button"
              onClick={() => download(`/admin/catalog/themes/${theme.id}/template`, `template-${theme.slug}.json`)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Unduh Template Ini
            </button>
          ) : (
            <span />
          )}
        </div>

        {theme.has_self_template && (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="w-full text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
          >
            Hapus template
          </button>
        )}
      </div>
    </Modal>
  )
}

const SECTION_LABEL = {
  cover: 'Sampul',
  couple: 'Mempelai',
  quote: 'Kutipan',
  events: 'Acara',
  gallery: 'Galeri',
  closing: 'Penutup',
}

const COLOR_LABEL = { primary: 'Utama', background: 'Latar', text: 'Teks', accent: 'Aksen' }

// Ringkasan apa saja yang diambil dari file Elementor, supaya admin bisa mengecek.
function ConversionResult({ conversion, onDone }) {
  const { template } = conversion
  const defaults = template.defaults ?? {}

  return (
    <div className="space-y-4 text-sm">
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
        ✓ &quot;{conversion.title || 'Template'}&quot; dikonversi dari {conversion.sections_found} section Elementor dan
        sudah disimpan.
      </p>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-slate-500">Warna</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(template.colors ?? {}).map(([key, hex]) => (
            <span key={key} className="flex items-center gap-1.5 rounded-full bg-slate-50 py-1 pr-2.5 pl-1 text-xs ring-1 ring-slate-200">
              <span className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: hex }} />
              {COLOR_LABEL[key] ?? key} <span className="font-mono text-slate-400">{hex}</span>
            </span>
          ))}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="font-semibold text-slate-500">Font judul</dt>
          <dd className="text-slate-800">{template.fonts?.heading || '-'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">Font isi</dt>
          <dd className="text-slate-800">{template.fonts?.body || '-'}</dd>
        </div>
      </dl>

      {template.cover_image && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-500">Gambar sampul</p>
          <img src={template.cover_image} alt="" className="h-28 w-full rounded-lg object-cover ring-1 ring-slate-200" />
        </div>
      )}

      <div>
        <p className="mb-1.5 text-xs font-semibold text-slate-500">Urutan section</p>
        <div className="flex flex-wrap gap-1.5">
          {template.sections.map((key, i) => (
            <span key={key} className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
              {i + 1}. {SECTION_LABEL[key] ?? key}
            </span>
          ))}
        </div>
        {conversion.sections_skipped?.length > 0 && (
          <p className="mt-1.5 text-xs text-slate-500">
            Dilewati (belum didukung editor): {conversion.sections_skipped.join(', ')}
          </p>
        )}
      </div>

      {(defaults.quote || defaults.closing_text || defaults.opening_text) && (
        <div className="space-y-1.5 rounded-lg bg-slate-50 p-3 text-xs ring-1 ring-slate-200">
          {defaults.opening_text && (
            <p>
              <span className="font-semibold text-slate-500">Pembuka:</span> {defaults.opening_text}
            </p>
          )}
          {defaults.quote && (
            <p>
              <span className="font-semibold text-slate-500">Kutipan:</span> “{defaults.quote}”
              {defaults.quote_source ? ` — ${defaults.quote_source}` : ''}
            </p>
          )}
          {defaults.closing_text && (
            <p>
              <span className="font-semibold text-slate-500">Penutup:</span> {defaults.closing_text}
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-slate-500">
        Kurang pas? Unduh template ini dari menu tema, ubah nilainya, lalu upload ulang.
      </p>

      <button
        type="button"
        onClick={onDone}
        className="w-full rounded-lg bg-violet-600 px-4 py-2.5 font-semibold text-white hover:bg-violet-700"
      >
        Selesai
      </button>
    </div>
  )
}
