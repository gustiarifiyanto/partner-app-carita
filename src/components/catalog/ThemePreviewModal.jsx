import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

// Preview demo tema di dalam bingkai HP (lebar mobile), tanpa pindah tab.
export default function ThemePreviewModal({ theme, onClose }) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const handleKey = (e) => e.key === 'Escape' && onClose()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKey)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="animate-card-in flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex w-full max-w-[375px] items-center justify-between gap-3 text-white">
          <p className="truncate text-sm font-semibold">{theme.name}</p>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={theme.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/25"
            >
              Buka tab baru
            </a>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25"
              aria-label="Tutup preview"
            >
              &#x2715;
            </button>
          </div>
        </div>

        <div className="relative h-[min(740px,calc(100vh-7rem))] w-[min(375px,calc(100vw-2rem))] overflow-hidden rounded-[2.25rem] border-[10px] border-slate-900 bg-white shadow-2xl">
          <div className="absolute top-0 left-1/2 z-10 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-slate-900" />
          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50 text-xs text-slate-400">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
              Memuat demo...
            </div>
          )}
          <iframe
            src={theme.demo_url}
            title={`Demo ${theme.name}`}
            onLoad={() => setLoaded(true)}
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}
