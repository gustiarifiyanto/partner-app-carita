import { useEffect } from 'react'
import { createPortal } from 'react-dom'

// Warna per jenis aksi: header gradient, lingkaran ikon, dan tombol konfirmasi.
const TONES = {
  indigo: {
    header: 'from-indigo-600 via-violet-600 to-fuchsia-600',
    button: 'from-indigo-500 to-violet-600 hover:shadow-indigo-500/30',
    ring: 'ring-indigo-200',
  },
  emerald: {
    header: 'from-emerald-500 via-teal-600 to-cyan-700',
    button: 'from-emerald-500 to-teal-600 hover:shadow-emerald-500/30',
    ring: 'ring-emerald-200',
  },
}

// Pop-up konfirmasi pengganti window.confirm. Tidak bisa ditutup selama `loading`.
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  icon,
  tone = 'indigo',
  confirmLabel = 'Ya, Lanjutkan',
  loadingLabel = 'Memproses...',
  cancelLabel = 'Batal',
  loading = false,
  children,
}) {
  const colors = TONES[tone] ?? TONES.indigo

  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape' && !loading) onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, loading, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm"
      onClick={() => !loading && onClose()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="animate-card-in w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`relative overflow-hidden bg-gradient-to-br ${colors.header} px-6 pb-14 pt-6 text-center`}>
          <div className="animate-blob absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
          <div
            className="animate-blob absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"
            style={{ animationDelay: '-4s' }}
          />
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-white/70 transition hover:bg-white/15 hover:text-white disabled:opacity-40"
            aria-label="Tutup"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 id="confirm-dialog-title" className="relative text-lg font-semibold text-white">
            {title}
          </h2>
          {description && <p className="relative mt-1 text-sm text-white/80">{description}</p>}
        </div>

        <div className="relative -mt-9 flex justify-center">
          <span
            className={`flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-white shadow-lg ring-4 ${colors.ring}`}
          >
            <span className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${colors.header} text-white`}>
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {icon}
              </svg>
            </span>
          </span>
        </div>

        <div className="px-6 pb-6 pt-4">
          {children}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              autoFocus
              className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br ${colors.button} px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0`}
            >
              {loading && (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? loadingLabel : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
