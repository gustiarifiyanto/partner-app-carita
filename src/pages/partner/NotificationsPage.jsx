import { useState } from 'react'
import bellIcon from '../../assets/icon_animated/bell-icon.gif'
import Modal from '../../components/Modal'
import Pagination from '../../components/Pagination'
import Skeleton from '../../components/Skeleton'
import StatusBadge from '../../components/StatusBadge'
import { useApiList } from '../../hooks/useApiList'
import { useAuth } from '../../hooks/useAuth'
import { usePageHeader } from '../../hooks/usePageHeader'
import { useToast } from '../../hooks/useToast'
import api from '../../lib/api'
import { formatDate } from '../../lib/format'

export default function NotificationsPage() {
  usePageHeader('Announcement', 'Promo & pengumuman dari admin')

  const toast = useToast()
  const { refreshUnreadNotifications } = useAuth()
  const { items, meta, loading, error, filters, setFilters, refetch } = useApiList(
    '/partner/notifications',
    { type: '', unread_only: '', page: 1 },
  )
  const [markingId, setMarkingId] = useState(null)
  const [selected, setSelected] = useState(null)

  const handleTypeChange = (e) => {
    setFilters((prev) => ({ ...prev, type: e.target.value, page: 1 }))
  }

  const handleUnreadOnlyChange = (e) => {
    setFilters((prev) => ({ ...prev, unread_only: e.target.checked ? '1' : '', page: 1 }))
  }

  const handleMarkRead = async (notification) => {
    setMarkingId(notification.id)
    try {
      await api.put(`/partner/notifications/${notification.id}/read`)
      refetch()
      refreshUnreadNotifications()
      setSelected((prev) => (prev?.id === notification.id ? { ...prev, is_read: true } : prev))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menandai notifikasi.')
    } finally {
      setMarkingId(null)
    }
  }

  // Opening a notification counts as seeing it, so admins get an accurate
  // "who has seen this" list without partners having to press a button.
  const openDetail = (notification) => {
    setSelected(notification)
    if (!notification.is_read) handleMarkRead(notification)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <div className="flex items-center gap-3">
          <img src={bellIcon} alt="" className="h-12 w-12 shrink-0" />
          <div>
            <p className="text-sm text-slate-500">Pengumuman</p>
            <p className="text-lg font-semibold text-slate-900">Info &amp; promo terbaru dari admin</p>
          </div>
        </div>
        {typeof meta?.unread_count === 'number' && meta.unread_count > 0 && (
          <span className="shrink-0 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
            {meta.unread_count} belum dibaca
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filters.type}
          onChange={handleTypeChange}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Semua Tipe</option>
          <option value="promo">Promo</option>
          <option value="announcement">Announcement</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={filters.unread_only === '1'}
            onChange={handleUnreadOnlyChange}
            className="rounded border-slate-300"
          />
          Hanya yang belum dibaca
        </label>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-3 h-4 w-2/3" />
              <Skeleton className="mt-2 h-3 w-full" />
            </div>
          ))
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-400">Tidak ada notifikasi.</p>
        ) : (
          items.map((notification) => (
            <div
              key={notification.id}
              role="button"
              tabIndex={0}
              onClick={() => openDetail(notification)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openDetail(notification)
                }
              }}
              className={`cursor-pointer rounded-xl bg-white p-4 shadow-sm ring-1 transition hover:shadow-md sm:p-5 ${
                notification.is_read ? 'ring-slate-200' : 'ring-slate-900/20'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <StatusBadge status={notification.type} />
                    {!notification.is_read && (
                      <span className="h-2 w-2 rounded-full bg-red-500" aria-label="Belum dibaca" />
                    )}
                  </div>
                  <h2 className="font-medium text-slate-900">{notification.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{notification.message}</p>
                  {notification.image_url && (
                    <img
                      src={notification.image_url}
                      alt=""
                      className="mt-3 h-28 w-full max-w-xs rounded-lg object-cover ring-1 ring-slate-200"
                    />
                  )}
                  <p className="mt-2 text-xs text-slate-400">{formatDate(notification.created_at)}</p>
                </div>
                {!notification.is_read && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMarkRead(notification)
                    }}
                    disabled={markingId === notification.id}
                    className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {markingId === notification.id ? 'Memproses...' : 'Tandai Dibaca'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination meta={meta} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} />

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detail Pengumuman">
        {selected && (
          <div>
            <div className="mb-1 flex items-center gap-2">
              <StatusBadge status={selected.type} />
              {!selected.is_read && (
                <span className="h-2 w-2 rounded-full bg-red-500" aria-label="Belum dibaca" />
              )}
            </div>
            {selected.image_url && (
              <a href={selected.image_url} target="_blank" rel="noreferrer" className="mb-3 block">
                <img
                  src={selected.image_url}
                  alt={selected.title}
                  className="max-h-72 w-full rounded-xl bg-slate-50 object-contain ring-1 ring-slate-200"
                />
              </a>
            )}
            <h3 className="text-base font-semibold text-slate-900">{selected.title}</h3>
            <p className="mt-2 text-sm whitespace-pre-line text-slate-600">{selected.message}</p>
            <p className="mt-3 text-xs text-slate-400">{formatDate(selected.created_at)}</p>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
              >
                Tutup
              </button>
              {!selected.is_read && (
                <button
                  type="button"
                  onClick={() => handleMarkRead(selected)}
                  disabled={markingId === selected.id}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {markingId === selected.id ? 'Memproses...' : 'Tandai Dibaca'}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
