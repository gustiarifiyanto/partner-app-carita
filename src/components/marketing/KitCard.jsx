import { useState } from 'react'
import { categoryStyle, fileExtension, formatFileSize } from '../../lib/marketingKit'
import CopyButton from '../CopyButton'

const TYPE_ICONS = {
  image:
    'm2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z',
  video:
    'm15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z',
  pdf: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
  archive:
    'm20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z',
  document:
    'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
  link: 'M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244',
}

function Svg({ d, className = 'h-4 w-4', strokeWidth = 1.75 }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}

const DOWNLOAD_ICON = 'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3'
const EXTERNAL_ICON =
  'M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25'

function Preview({ kit }) {
  if (kit.preview_url) {
    return (
      <img
        src={kit.preview_url}
        alt={kit.title}
        loading="lazy"
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
    )
  }

  // Materi berisi caption saja: tampilkan cuplikan teksnya di atas latar ivory
  if (!kit.has_file && !kit.external_url && kit.caption) {
    return (
      <div className="flex h-full items-center p-5" style={{ backgroundImage: 'linear-gradient(135deg, #FFFDF7, #F0E4C7)' }}>
        <p className="line-clamp-4 text-sm leading-relaxed text-amber-950/80 italic">&ldquo;{kit.caption}&rdquo;</p>
      </div>
    )
  }

  const type = kit.file_type ?? 'link'
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-2 text-white"
      style={{ backgroundImage: categoryStyle(kit.category).gradient }}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 transition duration-300 group-hover:scale-110">
        <Svg d={TYPE_ICONS[type] ?? TYPE_ICONS.document} className="h-7 w-7" />
      </span>
      <span className="text-xs font-bold tracking-widest opacity-90">
        {kit.has_file ? fileExtension(kit.file_name) : 'LINK'}
      </span>
    </div>
  )
}

/**
 * Kartu satu materi marketing kit.
 * mode "partner": tombol Download / Buka Link / Salin Caption.
 * mode "admin": tambahan jumlah download, status tampil, Edit, Sembunyikan/Tampilkan, Hapus.
 */
export default function KitCard({
  kit,
  mode = 'partner',
  onDownload,
  onOpenLink,
  onEdit,
  onTogglePublish,
  onDelete,
  busy,
  style,
}) {
  const [showCaption, setShowCaption] = useState(false)
  const isAdmin = mode === 'admin'
  const captionOnly = !kit.has_file && !kit.external_url && Boolean(kit.caption)

  return (
    <article
      className={`group animate-fade-up flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        isAdmin && !kit.is_published ? 'opacity-70' : ''
      }`}
      style={style}
    >
      <div className="relative h-40 overflow-hidden bg-slate-100">
        <Preview kit={kit} />
        <span
          className={`absolute top-2.5 left-2.5 rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm ${
            categoryStyle(kit.category).badge
          }`}
        >
          {kit.category_label}
        </span>
        {!isAdmin && kit.is_read === false && (
          <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Baru
          </span>
        )}
        {isAdmin && !kit.is_published && (
          <span className="absolute top-2.5 right-2.5 rounded-full bg-slate-900/80 px-2 py-0.5 text-[11px] font-semibold text-white">
            Disembunyikan
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold text-slate-900">{kit.title}</h3>
        {kit.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{kit.description}</p>}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          {kit.has_file && (
            <span>
              {fileExtension(kit.file_name)} &middot; {formatFileSize(kit.file_size)}
            </span>
          )}
          {kit.external_url && <span>Link eksternal</span>}
          {kit.caption && <span>Caption</span>}
          {isAdmin && (
            <span className="inline-flex items-center gap-1" title="Jumlah diunduh / dibuka partner">
              <Svg d={DOWNLOAD_ICON} className="h-3.5 w-3.5" />
              {kit.download_count}x
            </span>
          )}
        </div>

        {kit.caption && !captionOnly && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowCaption((v) => !v)}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800"
            >
              {showCaption ? 'Tutup caption' : 'Lihat caption'}
            </button>
            {showCaption && (
              <div className="animate-fade-up mt-2 rounded-lg bg-amber-50/60 p-3 ring-1 ring-amber-200/60">
                <p className="max-h-40 overflow-y-auto text-sm whitespace-pre-line text-slate-700">{kit.caption}</p>
                <CopyButton
                  text={kit.caption}
                  label="Salin Caption"
                  successMessage="Caption disalin."
                  variant="light"
                  className="mt-2"
                />
              </div>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {kit.has_file && (
            <button
              type="button"
              onClick={() => onDownload(kit)}
              disabled={busy}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-md hover:shadow-amber-600/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Svg d={DOWNLOAD_ICON} />
              {busy ? 'Mengunduh...' : 'Download'}
            </button>
          )}
          {kit.external_url && (
            <button
              type="button"
              onClick={() => onOpenLink(kit)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-amber-300 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50"
            >
              <Svg d={EXTERNAL_ICON} />
              Buka Link
            </button>
          )}
          {captionOnly && (
            <CopyButton
              text={kit.caption}
              label="Salin Caption"
              successMessage="Caption disalin."
              variant="light"
              className="flex-1 justify-center px-3 py-2 text-sm"
            />
          )}
        </div>

        {isAdmin && (
          <div className="mt-3 flex gap-1 border-t border-slate-100 pt-3 text-xs font-medium">
            <button
              type="button"
              onClick={() => onEdit(kit)}
              className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onTogglePublish(kit)}
              className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100"
            >
              {kit.is_published ? 'Sembunyikan' : 'Tampilkan'}
            </button>
            <button
              type="button"
              onClick={() => onDelete(kit)}
              className="ml-auto rounded-md px-2 py-1 text-red-600 hover:bg-red-50"
            >
              Hapus
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
