import ListSkeleton from '../../components/ListSkeleton'
import Pagination from '../../components/Pagination'
import SearchInput from '../../components/SearchInput'
import SegmentedTabs from '../../components/SegmentedTabs'
import { useApiList } from '../../hooks/useApiList'
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch'
import { usePageHeader } from '../../hooks/usePageHeader'
import { formatActionLabel } from '../../lib/format'

const REFERENCE_TABS = [
  { value: '', label: 'Semua' },
  { value: 'partner', label: 'Partner' },
  { value: 'client', label: 'Client' },
  { value: 'order', label: 'Order' },
  { value: 'notification', label: 'Notifikasi' },
  { value: 'marketing_kit', label: 'Marketing Kit' },
]

const REFERENCE_LABELS = {
  partner: 'Partner',
  client: 'Client',
  order: 'Order',
  notification: 'Notifikasi',
  marketing_kit: 'Marketing Kit',
}

const ROLE_AVATAR = {
  admin: 'bg-indigo-500',
  partner: 'bg-amber-500',
  client: 'bg-emerald-500',
}

// Icon + colour per kind of action, picked from the verb in the action name.
const ACTION_STYLES = [
  {
    match: /password/,
    className: 'bg-violet-100 text-violet-600',
    path: 'M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z',
  },
  {
    match: /delete|remove/,
    className: 'bg-red-100 text-red-600',
    path: 'm14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0',
  },
  {
    match: /cancel|reject|suspend|unpublish/,
    className: 'bg-amber-100 text-amber-600',
    path: 'M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636',
  },
  {
    match: /paid|payment/,
    className: 'bg-teal-100 text-teal-600',
    path: 'M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z',
  },
  {
    match: /approve|verify|complete|activate|publish/,
    className: 'bg-emerald-100 text-emerald-600',
    path: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
  {
    match: /update|edit/,
    className: 'bg-sky-100 text-sky-600',
    path: 'm16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125',
  },
  {
    match: /create|request|register/,
    className: 'bg-indigo-100 text-indigo-600',
    path: 'M12 4.5v15m7.5-7.5h-15',
  },
]

const DEFAULT_STYLE = {
  className: 'bg-slate-100 text-slate-500',
  path: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
}

function actionStyle(action = '') {
  return ACTION_STYLES.find((style) => style.match.test(action)) ?? DEFAULT_STYLE
}

function dayKey(value) {
  const d = new Date(value)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function dayLabel(value) {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (dayKey(value) === dayKey(today)) return 'Hari ini'
  if (dayKey(value) === dayKey(yesterday)) return 'Kemarin'
  return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(value),
  )
}

function formatTime(value) {
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

// Logs arrive newest-first; group consecutive entries by calendar day and give
// each entry a running index so the stagger animation flows across groups.
function groupByDay(logs) {
  const groups = []
  logs.forEach((log, order) => {
    const key = dayKey(log.created_at)
    const last = groups[groups.length - 1]
    const entry = { log, order }
    if (last?.key === key) last.entries.push(entry)
    else groups.push({ key, label: dayLabel(log.created_at), entries: [entry] })
  })
  return groups
}

export default function ActivityLogsPage() {
  usePageHeader('Activity Logs', 'Riwayat aktivitas admin, partner & client di sistem')

  const { items, meta, loading, error, filters, setFilters } = useApiList('/admin/activity-logs', {
    search: '',
    reference_type: '',
    date_from: '',
    date_to: '',
    page: 1,
  })
  const [searchInput, setSearchInput] = useDebouncedSearch(filters.search, setFilters)

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
  const hasDateFilter = filters.date_from || filters.date_to
  const groups = groupByDay(items)

  return (
    <div className="space-y-6">
      <section className="animate-fade-up space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Riwayat Aktivitas</h2>
            {meta && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {meta.total}
              </span>
            )}
          </div>
          <div className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
            <div className="w-max min-w-full lg:min-w-0">
              <SegmentedTabs
                tabs={REFERENCE_TABS}
                value={filters.reference_type}
                onChange={(value) => setFilter('reference_type', value)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Cari deskripsi / nama user..."
            className="md:flex-1"
          />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.date_from}
              max={filters.date_to || undefined}
              onChange={(e) => setFilter('date_from', e.target.value)}
              aria-label="Dari tanggal"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 md:flex-none"
            />
            <span className="text-sm text-slate-400">&ndash;</span>
            <input
              type="date"
              value={filters.date_to}
              min={filters.date_from || undefined}
              onChange={(e) => setFilter('date_to', e.target.value)}
              aria-label="Sampai tanggal"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 md:flex-none"
            />
            {hasDateFilter && (
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, date_from: '', date_to: '', page: 1 }))}
                className="animate-fade-up shrink-0 rounded-lg px-2 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </section>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <ListSkeleton rows={6} />
        </div>
      ) : items.length === 0 ? (
        <div className="animate-fade-up rounded-2xl bg-white px-4 py-12 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-medium text-slate-500">Tidak ada aktivitas.</p>
          {(filters.search || hasDateFilter) && (
            <p className="mt-1 text-xs text-slate-400">Coba ubah kata kunci atau rentang tanggal.</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section
              key={group.key}
              className="animate-fade-up rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5"
              style={{ animationDelay: `${Math.min(group.entries[0].order, 12) * 40}ms` }}
            >
              <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                {group.label}
                <span className="font-normal text-slate-400 normal-case">&middot; {group.entries.length} aktivitas</span>
              </h3>

              <ol>
                {group.entries.map(({ log, order }, index) => {
                  const style = actionStyle(log.action)
                  const isLast = index === group.entries.length - 1

                  return (
                    <li
                      key={log.id}
                      className="animate-fade-up group relative flex gap-3 pb-4 last:pb-0"
                      style={{ animationDelay: `${Math.min(order, 15) * 40}ms` }}
                    >
                      {!isLast && (
                        <span className="absolute top-9 bottom-0 left-4 w-px bg-slate-200" aria-hidden="true" />
                      )}

                      <span
                        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white transition-transform duration-200 group-hover:scale-110 ${style.className}`}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={style.path} />
                        </svg>
                      </span>

                      <div className="-mt-1 min-w-0 flex-1 rounded-xl px-3 py-1.5 transition-colors duration-150 group-hover:bg-slate-50">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="text-sm font-semibold text-slate-900">{formatActionLabel(log.action)}</p>
                          {log.reference_type && (
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                              {REFERENCE_LABELS[log.reference_type] || log.reference_type}
                              {log.reference_id ? ` #${log.reference_id}` : ''}
                            </span>
                          )}
                          <span className="ml-auto text-xs text-slate-400 tabular-nums">{formatTime(log.created_at)}</span>
                        </div>
                        <p className="mt-0.5 text-sm break-words text-slate-600">{log.description}</p>
                        {log.user && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                            <span
                              className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white ${
                                ROLE_AVATAR[log.user.role] || 'bg-slate-400'
                              }`}
                            >
                              {log.user.name?.[0]?.toUpperCase()}
                            </span>
                            {log.user.name}
                            {log.user.role && <span className="capitalize">&middot; {log.user.role}</span>}
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </section>
          ))}
        </div>
      )}

      <Pagination meta={meta} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} />
    </div>
  )
}
