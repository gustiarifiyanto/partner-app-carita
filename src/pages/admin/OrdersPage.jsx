import { useState } from 'react'
import { Link } from 'react-router-dom'
import CreateOrderModal from '../../components/admin/CreateOrderModal'
import DeleteOrderModal from '../../components/admin/DeleteOrderModal'
import ClientAccessShareModal from '../../components/partner/ClientAccessShareModal'
import Pagination from '../../components/Pagination'
import PartnerAvatar from '../../components/PartnerAvatar'
import SearchInput from '../../components/SearchInput'
import SegmentedTabs from '../../components/SegmentedTabs'
import StatusBadge from '../../components/StatusBadge'
import TableSkeleton from '../../components/TableSkeleton'
import { useApiList } from '../../hooks/useApiList'
import { useAuth } from '../../hooks/useAuth'
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch'
import { usePageHeader } from '../../hooks/usePageHeader'
import { formatCurrency, formatDate } from '../../lib/format'
import SourceBadge from '../../components/orders/SourceBadge'
import { ORDER_SOURCES } from '../../lib/orderSources'

const STATUS_TABS = [
  { value: '', label: 'Semua' },
  { value: 'awaiting_payment', label: 'Belum Bayar' },
  { value: 'pending_approval', label: 'Pending' },
  { value: 'confirmed', label: 'Dikerjakan' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function OrdersPage() {
  usePageHeader('Orders', 'Kelola order & approval')

  const { refreshNewPartnerOrders } = useAuth()
  const { items, meta, loading, error, filters, setFilters, refetch } = useApiList('/admin/orders', {
    search: '',
    status: '',
    source: '',
    sort: 'newest',
    page: 1,
  })
  const [searchInput, setSearchInput] = useDebouncedSearch(filters.search, setFilters)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  // Info login akun client dari order yang baru dibuat (dibagikan via WA/email)
  const [shared, setShared] = useState(null)

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
  const isOldestFirst = filters.sort === 'oldest'

  const handleDeleted = () => {
    setDeleteTarget(null)
    refetch()
    refreshNewPartnerOrders()
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-up flex justify-end">
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-500/30 active:translate-y-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Buat Order
        </button>
      </div>

      <section
        className="animate-fade-up overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
        style={{ animationDelay: '80ms' }}
      >
        <div className="space-y-3 border-b border-slate-200 px-4 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">Daftar Order</h2>
              {meta && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {meta.total}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <SearchInput
                value={searchInput}
                onChange={setSearchInput}
                placeholder="Cari order / customer / partner..."
                className="min-w-0 flex-1 md:w-72 md:flex-none"
              />
              <select
                value={filters.source}
                onChange={(e) => setFilter('source', e.target.value)}
                aria-label="Filter asal order"
                className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Semua Asal</option>
                {Object.entries(ORDER_SOURCES).map(([value, { label }]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setFilter('sort', isOldestFirst ? 'newest' : 'oldest')}
                title="Urutkan berdasarkan tanggal order dibuat"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
              >
                <svg
                  className={`h-4 w-4 transition-transform duration-300 ${isOldestFirst ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
                </svg>
                {isOldestFirst ? 'Terlama' : 'Terbaru'}
              </button>
            </div>
          </div>

          <div className="-mx-4 overflow-x-auto px-4">
            <div className="w-max min-w-full md:min-w-0">
              <SegmentedTabs
                tabs={STATUS_TABS}
                value={filters.status}
                onChange={(value) => setFilter('status', value)}
              />
            </div>
          </div>
        </div>

        {error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}

        <div className="table-scroll">
          <table className="min-w-full divide-y divide-slate-200 text-sm whitespace-nowrap">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Order</th>
                <th className="hidden px-4 py-3 text-left font-medium text-slate-500 sm:table-cell">Customer</th>
                <th className="hidden px-4 py-3 text-left font-medium text-slate-500 md:table-cell">Partner</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">Nilai</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton rows={5} columns={6} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <p className="text-sm font-medium text-slate-500">Tidak ada order.</p>
                    {filters.search && (
                      <p className="mt-1 text-xs text-slate-400">
                        Tidak ada hasil untuk &ldquo;{filters.search}&rdquo;.
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                items.map((order, index) => (
                  <tr
                    key={order.id}
                    className="animate-fade-up transition-colors duration-150 hover:bg-slate-50"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="inline-block rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold tracking-wide text-slate-800 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        {order.order_number}
                      </Link>
                      <p className="mt-1 text-xs text-slate-400">{formatDate(order.created_at)}</p>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-slate-900">{order.customer_name}</p>
                        <SourceBadge source={order.source} />
                      </div>
                      <p className="max-w-48 truncate text-xs text-slate-400">{order.product_service_name}</p>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      {order.partner ? (
                        <div className="flex items-center gap-2">
                          <PartnerAvatar partner={order.partner} size="sm" />
                          <span className="text-slate-700">{order.partner.company_name}</span>
                        </div>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                          Direct Sale
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                      {formatCurrency(order.order_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                        >
                          Detail
                        </Link>
                        {order.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(order)}
                            className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:border-red-600 hover:bg-red-600 hover:text-white"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination meta={meta} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} />
      </section>

      <CreateOrderModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={({ order, clientAccount }) => {
          setShowCreate(false)
          setShared({ account: clientAccount, orderNumber: order.order_number })
          refetch()
        }}
      />

      <ClientAccessShareModal
        account={shared?.account}
        orderNumber={shared?.orderNumber}
        onClose={() => setShared(null)}
      />

      <DeleteOrderModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={handleDeleted}
        order={deleteTarget}
      />
    </div>
  )
}
