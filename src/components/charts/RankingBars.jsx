import { SERIES_1 } from '../../lib/chartColors'
import { formatCurrency } from '../../lib/format'

export default function RankingBars({ data }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">Belum ada data untuk rentang ini.</p>
  }

  const maxValue = Math.max(1, ...data.map((d) => d.value))

  return (
    <div className="space-y-1">
      {data.map((d, index) => {
        const pct = Math.max(2, (d.value / maxValue) * 100)
        return (
          <div
            key={d.label}
            className="animate-fade-up group -mx-2 flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-slate-50"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <p className="w-28 shrink-0 truncate text-sm text-slate-600 group-hover:text-slate-900 sm:w-36" title={d.label}>
              {d.label}
            </p>
            <div className="h-6 min-w-0 flex-1 overflow-hidden rounded bg-slate-100">
              {/* Keyed on the value so the bar re-grows when the date range changes. */}
              <div
                key={d.value}
                className="animate-bar-grow h-6 rounded-r transition-opacity group-hover:opacity-85"
                style={{ width: `${pct}%`, backgroundColor: SERIES_1, animationDelay: `${150 + index * 60}ms` }}
                role="img"
                aria-label={`${d.label}: ${formatCurrency(d.value)}`}
              />
            </div>
            <p className="w-24 shrink-0 text-right text-sm font-medium tabular-nums text-slate-900 sm:w-28">
              {formatCurrency(d.value)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
