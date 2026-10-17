import { formatCurrency } from '../../lib/format'

function TrophyIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 4.5h7.5v4.5a3.75 3.75 0 1 1-7.5 0V4.5Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 6H5.625a1.125 1.125 0 0 0-1.125 1.125v.75A3.375 3.375 0 0 0 7.875 11.25M15.75 6h2.625a1.125 1.125 0 0 1 1.125 1.125v.75a3.375 3.375 0 0 1-3.375 3.375M10.5 13.125v2.25M9 19.5h6l-.5-2.813a1.125 1.125 0 0 0-1.108-.937h-2.784c-.548 0-1.017.393-1.108.937L9 19.5Z"
      />
    </svg>
  )
}

function MedalIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <circle cx="12" cy="14.25" r="5.25" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 12.75 1.5 1.5 2.25-2.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.5 9.5-3.25-5m10.25 5 3.25-5" />
    </svg>
  )
}

const RANK_STYLES = [
  {
    badge: 'bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 text-white shadow-md shadow-amber-500/40',
    row: 'bg-gradient-to-r from-amber-50 to-transparent ring-1 ring-amber-100',
    value: 'text-amber-600',
    icon: TrophyIcon,
    iconClass: 'h-5 w-5 animate-champion-bounce',
    badgeClass: 'h-11 w-11 animate-champion-glow',
  },
  {
    badge: 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-sm shadow-slate-400/30',
    row: 'bg-gradient-to-r from-slate-50 to-transparent',
    value: 'text-slate-700',
    icon: MedalIcon,
    iconClass: 'h-4 w-4',
    badgeClass: 'h-9 w-9',
  },
  {
    badge: 'bg-gradient-to-br from-orange-300 to-orange-500 text-white shadow-sm shadow-orange-500/30',
    row: 'bg-gradient-to-r from-orange-50 to-transparent',
    value: 'text-orange-600',
    icon: MedalIcon,
    iconClass: 'h-4 w-4',
    badgeClass: 'h-9 w-9',
  },
]

export default function TopPerformersCard({ performers }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
          <TrophyIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">Top Performers</h2>
          <p className="truncate text-xs text-slate-400">Partner dengan revenue tertinggi &amp; komisinya</p>
        </div>
      </div>

      {performers.length === 0 ? (
        <p className="text-sm text-slate-400">Belum ada data.</p>
      ) : (
        <ul className="space-y-1">
          {performers.map((partner, index) => {
            const rank = RANK_STYLES[index]
            const RankIcon = rank?.icon

            return (
              <li
                key={partner.id}
                className={`flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition ${rank?.row ?? 'hover:bg-slate-50'}`}
              >
                <span
                  className={`flex shrink-0 items-center justify-center rounded-full font-bold ${
                    rank ? `${rank.badge} ${rank.badgeClass}` : 'h-9 w-9 bg-slate-100 text-sm text-slate-500'
                  }`}
                >
                  {RankIcon ? <RankIcon className={rank.iconClass} /> : index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{partner.company_name}</p>
                  <p className="truncate text-xs text-slate-500">{partner.user?.name}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-sm font-semibold tabular-nums ${rank?.value ?? 'text-slate-900'}`}>
                    {formatCurrency(partner.total_revenue)}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/15">
                    Komisi {formatCurrency(partner.total_commission)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
