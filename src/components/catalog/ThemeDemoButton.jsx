import { useCallback, useEffect, useRef, useState } from 'react'
import ThemePreviewModal from './ThemePreviewModal'

// Tombol Lihat Demo: pilih preview di sini (pop up mobile) atau buka tab baru.
// align="right" untuk tombol di pojok kanan supaya menu tidak keluar dari modal.
export default function ThemeDemoButton({ theme, className, label = 'Lihat Demo', align = 'center' }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setMenuOpen(false)
    }
    const handleKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('mousedown', handleClick)
    window.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      window.removeEventListener('keydown', handleKey)
    }
  }, [menuOpen])

  const closePreview = useCallback(() => setPreviewOpen(false), [])

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className={className}
      >
        {label}
      </button>

      {menuOpen && (
        <div
          role="menu"
          className={`animate-fade-up absolute bottom-full z-20 mb-1.5 w-44 overflow-hidden rounded-lg bg-white py-1 text-xs shadow-lg ring-1 ring-slate-200 ${
            align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'
          }`}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false)
              setPreviewOpen(true)
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-700 hover:bg-violet-50 hover:text-violet-700"
          >
            📱 Preview di sini
          </button>
          <a
            role="menuitem"
            href={theme.demo_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="flex w-full items-center gap-2 px-3 py-2 text-slate-700 hover:bg-violet-50 hover:text-violet-700"
          >
            ↗ Buka tab baru
          </a>
        </div>
      )}

      {previewOpen && <ThemePreviewModal theme={theme} onClose={closePreview} />}
    </div>
  )
}
