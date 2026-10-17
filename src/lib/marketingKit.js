import api from './api'

// Harus sama dengan MarketingKit::ALLOWED_EXTENSIONS & MAX_FILE_KB di backend
export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'mp4', 'mov', 'zip', 'pptx', 'docx', 'xlsx']
export const MAX_FILE_BYTES = 50 * 1024 * 1024

// Warna per kategori (gradient untuk area pratinjau, kelas untuk badge)
export const CATEGORY_STYLES = {
  logo_brand: { gradient: 'linear-gradient(135deg, #FDE68A, #F59E0B)', badge: 'bg-amber-100 text-amber-800' },
  social_media: { gradient: 'linear-gradient(135deg, #F9A8D4, #DB2777)', badge: 'bg-pink-100 text-pink-700' },
  katalog: { gradient: 'linear-gradient(135deg, #93C5FD, #2563EB)', badge: 'bg-blue-100 text-blue-700' },
  video: { gradient: 'linear-gradient(135deg, #FCA5A5, #DC2626)', badge: 'bg-red-100 text-red-700' },
  copywriting: { gradient: 'linear-gradient(135deg, #C4B5FD, #7C3AED)', badge: 'bg-violet-100 text-violet-700' },
  materi_cetak: { gradient: 'linear-gradient(135deg, #6EE7B7, #059669)', badge: 'bg-emerald-100 text-emerald-700' },
  lainnya: { gradient: 'linear-gradient(135deg, #CBD5E1, #64748B)', badge: 'bg-slate-100 text-slate-700' },
}

export function categoryStyle(category) {
  return CATEGORY_STYLES[category] ?? CATEGORY_STYLES.lainnya
}

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function fileExtension(name = '') {
  const parts = name.split('.')
  return parts.length > 1 ? parts.pop().toUpperCase() : ''
}

// Unduh lewat axios (butuh token login), lalu simpan sebagai file di browser.
export async function downloadFile(endpoint, fileName) {
  const response = await api.get(endpoint, { responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName || 'marketing-kit'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
