import { useState } from 'react'
import NotificationFormModal from '../../components/admin/NotificationFormModal'
import NotificationReadersModal from '../../components/admin/NotificationReadersModal'
import Modal from '../../components/Modal'
import Pagination from '../../components/Pagination'
import SearchInput from '../../components/SearchInput'
import SegmentedTabs from '../../components/SegmentedTabs'
import StatusBadge from '../../components/StatusBadge'
import TableSkeleton from '../../components/TableSkeleton'
import { useApiList } from '../../hooks/useApiList'
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch'
import { usePageHeader } from '../../hooks/usePageHeader'
import api from '../../lib/api'
import { formatDate } from '../../lib/format'
import { useToast } from '../../hooks/useToast'

const TYPE_TABS = [
  { value: '', label: 'Semua' },
  { value: 'promo', label: 'Promo' },
  { value: 'announcement', label: 'Announcement' },
]

const TYPE_ICONS = {
  promo: {
    className: 'bg-gradient-to-br from-fuchsia-400 to-purple-600',
    path: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
      </>
    ),
  },
  announcement: {
    className: 'bg-gradient-to-br from-sky-400 to-blue-600',
    path: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46"
      />
    ),
  },
}

export default function NotificationsPage() {
  usePageHeader('Notifications', 'Broadcast promo & pengumuman ke semua partner')

  const toast = useToast()
  const { items, meta, loading, error, filters, setFilters, refetch } = useApiList('/admin/notifications', {
    type: '',
    search: '',
    page: 1,
  })
  const [searchInput, setSearchInput] = useDebouncedSearch(filters.search, setFilters)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [readersTarget, setReadersTarget] = useState(null)

  const openCreate = () => {
    setEditTarget(null)
    setShowForm(true)
  }

  const openEdit = (notification) => {
    setEditTarget(notification)
    setShowForm(true)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/admin/notifications/${deleteTarget.id}`)
      setDeleteTarget(null)
      refetch()
      toast.success('Notifikasi berhasil dihapus.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus notifikasi.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-up flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-500/30 active:translate-y-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Buat Notifikasi
        </button>
      </div>

      <section
        className="animate-fade-up overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
        style={{ animationDelay: '80ms' }}
      >
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Daftar Notifikasi</h2>
            {meta && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {meta.total}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Cari judul / isi pesan..."
              className="sm:w-72"
            />
            <SegmentedTabs
              tabs={TYPE_TABS}
              value={filters.type}
              onChange={(type) => setFilters((prev) => ({ ...prev, type, page: 1 }))}
            />
          </div>
        </div>

        {error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}

        <div className="table-scroll">
          <table className="min-w-full divide-y divide-slate-200 text-sm whitespace-nowrap">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Notifikasi</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Tipe</th>
                <th className="hidden px-4 py-3 text-right font-medium text-slate-500 sm:table-cell">Dibaca</th>
                <th className="hidden px-4 py-3 text-left font-medium text-slate-500 sm:table-cell">Dibuat</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton rows={5} columns={5} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <p className="text-sm font-medium text-slate-500">Belum ada notifikasi.</p>
                    {filters.search && (
                      <p className="mt-1 text-xs text-slate-400">
                        Tidak ada hasil untuk &ldquo;{filters.search}&rdquo;.
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                items.map((notification, index) => {
                  const typeIcon = TYPE_ICONS[notification.type] ?? TYPE_ICONS.announcement

                  return (
                    <tr
                      key={notification.id}
                      className="animate-fade-up transition-colors duration-150 hover:bg-slate-50"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {notification.image_url ? (
                            <img
                              src={notification.image_url}
                              alt=""
                              className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-slate-200"
                            />
                          ) : (
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${typeIcon.className}`}
                            >
                              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                {typeIcon.path}
                              </svg>
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="max-w-44 truncate font-medium text-slate-900 sm:max-w-xs">{notification.title}</p>
                            <p className="max-w-44 truncate text-xs text-slate-400 sm:max-w-xs">{notification.message}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={notification.type} />
                      </td>
                      <td className="hidden px-4 py-3 text-right sm:table-cell">
                        <button
                          type="button"
                          onClick={() => setReadersTarget(notification)}
                          title="Lihat siapa saja yang sudah melihat"
                          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-indigo-600 hover:text-white"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                            />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                          {notification.reads_count}
                        </button>
                      </td>
                      <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">{formatDate(notification.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setReadersTarget(notification)}
                            className="rounded-lg border border-indigo-200 px-3 py-1 text-xs font-medium text-indigo-600 hover:border-indigo-600 hover:bg-indigo-600 hover:text-white sm:hidden"
                          >
                            Dilihat {notification.reads_count}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(notification)}
                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(notification)}
                            className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:border-red-600 hover:bg-red-600 hover:text-white"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination meta={meta} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} />
      </section>

      {showForm && (
        <NotificationFormModal
          key={editTarget?.id ?? 'create'}
          notification={editTarget}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            refetch()
          }}
        />
      )}

      {readersTarget && (
        <NotificationReadersModal notification={readersTarget} onClose={() => setReadersTarget(null)} />
      )}

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Notifikasi?">
        <p className="text-sm text-slate-600">
          Notifikasi <span className="font-medium text-slate-900">&ldquo;{deleteTarget?.title}&rdquo;</span> akan
          dihapus dan tidak lagi terlihat oleh partner.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
