const STYLES = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-slate-900 text-white',
  welcome: 'bg-white text-slate-900 ring-1 ring-slate-200',
}

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
}

const CLOSE_STYLES = {
  success: 'text-white/70 hover:text-white',
  error: 'text-white/70 hover:text-white',
  info: 'text-white/70 hover:text-white',
  welcome: 'text-slate-400 hover:text-slate-600',
}

export default function ToastViewport({ toasts, onDismiss }) {
  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-100 flex flex-col items-center gap-2 p-3 sm:inset-x-auto sm:right-4 sm:items-end sm:p-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`animate-toast-in pointer-events-auto flex w-full max-w-[calc(100vw-1.5rem)] items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg sm:max-w-sm ${STYLES[t.variant]}`}
        >
          {t.variant === 'welcome' ? (
            <>
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500 text-xs text-emerald-600">
                ✓
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{t.message.title}</p>
                {t.message.description && (
                  <p className="mt-0.5 font-normal text-slate-500">{t.message.description}</p>
                )}
              </div>
            </>
          ) : (
            <>
              <span aria-hidden="true">{ICONS[t.variant]}</span>
              <p className="flex-1">{t.message}</p>
            </>
          )}
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className={`shrink-0 ${CLOSE_STYLES[t.variant]}`}
            aria-label="Tutup notifikasi"
          >
            &#x2715;
          </button>
        </div>
      ))}
    </div>
  )
}
