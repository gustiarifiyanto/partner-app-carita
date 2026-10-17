import { useState } from 'react'
import { Link } from 'react-router-dom'
import LottiePlayer from '../../components/LottiePlayer'
import ClientAccessShareModal from '../../components/partner/ClientAccessShareModal'
import CreatePartnerOrderModal from '../../components/partner/CreatePartnerOrderModal'
import Pagination from '../../components/Pagination'
import SourceBadge from '../../components/orders/SourceBadge'
import StatusBadge from '../../components/StatusBadge'
import TableSkeleton from '../../components/TableSkeleton'
import { useApiList } from '../../hooks/useApiList'
import { usePageHeader } from '../../hooks/usePageHeader'
import { formatCurrency, formatDate } from '../../lib/format'

const ORDERS_LOTTIE_URL = 'https://lottie.host/cd9c580f-a96f-4206-8f1f-65f25e3e91c0/ZhkQdSgLSy.json'

export default function OrdersPage() {
  usePageHeader('Orders', 'Order milik kamu')

  const { items, meta, loading, error, filters, setFilters, refetch } = useApiList('/partner/orders', {
    search: '',
    status: '',
    page: 1,
  })
  const [searchInput, setSearchInput] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  // { order, clientAccount } dari order yang baru dibuat, untuk modal bagikan akses
  const [shareData, setShareData] = useState(null)

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }))
  }

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-white px-3 py-4 text-center shadow-sm ring-1 ring-slate-200">
        <LottiePlayer path={ORDERS_LOTTIE_URL} loop className="h-36 w-full max-w-xs sm:h-40" />
        <div>
          <p className="text-lg font-semibold text-slate-900">Yuk, terus cari client baru!</p>
          <p className="mt-1 text-sm text-slate-500">
            Makin banyak order yang kamu bawa, makin besar komisi yang kamu dapat. Semangat kejar target hari ini!
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Buat Order
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Cari nomor order / customer..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 sm:w-64"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
          >
            Cari
          </button>
        </form>

        <select
          value={filters.status}
          onChange={handleFilterChange}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Semua Status</option>
          <option value="awaiting_payment">Menunggu Pembayaran</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="confirmed">Sedang Dikerjakan</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        {error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}

        <div className="table-scroll">
          <table className="min-w-full divide-y divide-slate-200 text-sm whitespace-nowrap">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Order</th>
                <th className="hidden px-4 py-3 text-left font-medium text-slate-500 sm:table-cell">Produk/Jasa</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">Nilai</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Status Komisi</th>
                <th className="hidden px-4 py-3 text-left font-medium text-slate-500 sm:table-cell">Tanggal</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton rows={5} columns={7} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                    Belum ada order.
                  </td>
                </tr>
              ) : (
                items.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{order.order_number}</p>
                      {order.source === 'client' && (
                        <span className="mt-1 inline-block">
                          <SourceBadge source="client" />
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">{order.product_service_name}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(order.order_amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      {order.commission ? (
                        <StatusBadge status={order.commission.status} />
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/partner/orders/${order.id}`}
                        className="text-sm font-medium text-slate-900 hover:underline"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination meta={meta} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} />
      </div>

      <CreatePartnerOrderModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(created) => {
          setShowCreate(false)
          if (created?.clientAccount) setShareData(created)
          refetch()
        }}
      />

      <ClientAccessShareModal
        account={shareData?.clientAccount}
        orderNumber={shareData?.order?.order_number}
        onClose={() => setShareData(null)}
      />
    </div>
  )
}
