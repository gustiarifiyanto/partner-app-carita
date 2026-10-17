import { useEffect, useState } from 'react'
import api from '../../lib/api'
import ListSkeleton from '../ListSkeleton'
import Modal from '../Modal'
import PartnerAvatar from '../PartnerAvatar'
import SegmentedTabs from '../SegmentedTabs'

function formatDateTime(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

// Mounted only while open (parent renders it conditionally), so each open
// starts with a fresh loading state for the chosen notification.
export default function NotificationReadersModal({ notification, onClose }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('read')

  useEffect(() => {
    let cancelled = false
    api
      .get(`/admin/notifications/${notification.id}/readers`)
      .then(({ data: res }) => {
        if (!cancelled) setData(res.data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Gagal memuat data pembaca.')
      })
    return () => {
      cancelled = true
    }
  }, [notification.id])

  const readCount = data?.read.length ?? 0
  const total = data?.total_partners ?? 0
  const percent = total > 0 ? Math.round((readCount / total) * 100) : 0
  const rows =
    tab === 'read'
      ? (data?.read ?? []).map((r) => ({ partner: r.partner, readAt: r.read_at }))
      : (data?.unread ?? []).map((partner) => ({ partner, readAt: null }))

  return (
    <Modal open onClose={onClose} title="Yang Sudah Melihat">
      <p className="-mt-2 mb-4 truncate text-sm text-slate-500">&ldquo;{notification.title}&rdquo;</p>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      ) : !data ? (
        <ListSkeleton rows={4} />
      ) : (
        <>
          <div className="animate-fade-up rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 p-4 ring-1 ring-indigo-100">
            <div className="flex items-end justify-between">
              <p className="text-sm text-slate-600">
                <span className="text-2xl font-semibold text-slate-900">{readCount}</span> dari {total} partner
              </p>
              <span className="text-sm font-semibold text-indigo-600">{percent}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <ProgressFill percent={percent} />
            </div>
          </div>

          <div className="mt-4">
            <SegmentedTabs
              tabs={[
                { value: 'read', label: `Sudah dilihat (${readCount})` },
                { value: 'unread', label: `Belum (${data.unread.length})` },
              ]}
              value={tab}
              onChange={setTab}
            />
          </div>

          <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
            {rows.length === 0 ? (
              <li className="py-8 text-center text-sm text-slate-400">
                {tab === 'read' ? 'Belum ada partner yang melihat.' : 'Semua partner sudah melihat. 🎉'}
              </li>
            ) : (
              rows.map(({ partner, readAt }, index) => (
                <li
                  key={`${tab}-${partner.id}`}
                  className="animate-fade-up flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50"
                  style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
                >
                  <PartnerAvatar partner={partner} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{partner.company_name}</p>
                    <p className="truncate text-xs text-slate-400">{partner.user?.email}</p>
                  </div>
                  {readAt ? (
                    <span className="shrink-0 text-right text-[11px] text-emerald-600">
                      <span className="block font-semibold">✓ Dilihat</span>
                      {formatDateTime(readAt)}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                      Belum
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </Modal>
  )
}

function ProgressFill({ percent }) {
  // Start at 0 and grow on the next frame so the width transition plays.
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setWidth(percent))
    return () => cancelAnimationFrame(frame)
  }, [percent])

  return (
    <div
      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-700 ease-out"
      style={{ width: `${width}%` }}
    />
  )
}
