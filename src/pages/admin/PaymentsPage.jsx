import { Link } from 'react-router-dom'
import PaymentReviewActions from '../../components/admin/PaymentReviewActions'
import SourceBadge from '../../components/orders/SourceBadge'
import Pagination from '../../components/Pagination'
import { PaymentStatusBadge } from '../../components/payments/PaymentParts'
import SearchInput from '../../components/SearchInput'
import SegmentedTabs from '../../components/SegmentedTabs'
import TableSkeleton from '../../components/TableSkeleton'
import { useApiList } from '../../hooks/useApiList'
import { useAuth } from '../../hooks/useAuth'
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch'
import { usePageHeader } from '../../hooks/usePageHeader'
import { formatCurrency, formatDate } from '../../lib/format'

const STATUS_TABS = [
  { value: 'waiting_verification', label: 'Menunggu' },
  { value: 'paid', label: 'Lunas' },
  { value: 'rejected', label: 'Ditolak' },
  { value: '', label: 'Semua' },
]

const ROLE_LABEL = { client: 'Client', partner: 'Partner', admin: 'Admin' }

export default function PaymentsPage() {
  usePageHeader('Pembayaran', 'Verifikasi bukti transfer order')
  const { refreshNewClientPayments, refreshNewPartnerOrders } = useAuth()

  const { items, meta, loading, error, filters, setFilters, refetch } = useApiList('/admin/client-payments', {
    status: 'waiting_verification',
    search: '',
    page: 1,
  })
  const [searchInput, setSearchInput] = useDebouncedSearch(filters.search, setFilters)

  const handleReviewed = () => {
    refetch()
    refreshNewClientPayments()
    refreshNewPartnerOrders()
  }

  return (
    <div className="space-y-6">
      <section className="animate-fade-up overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Bukti Transfer</h2>
            {meta?.pending_verification_count > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {meta.pending_verification_count} menunggu
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Cari nomor order / customer..."
              className="sm:w-64"
            />
            <div className="sm:shrink-0">
              <SegmentedTabs
                tabs={STATUS_TABS}
                value={filters.status}
                onChange={(value) => setFilters((prev) => ({ ...prev, status: value, page: 1 }))}
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
                <th className="hidden px-4 py-3 text-left font-medium text-slate-500 md:table-cell">Pengirim</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">Nominal</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                <th className="hidden px-4 py-3 text-left font-medium text-slate-500 sm:table-cell">Bukti</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton rows={5} columns={6} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                    {filters.status === 'waiting_verification'
                      ? 'Tidak ada bukti yang menunggu verifikasi. 🎉'
                      : 'Tidak ada data pembayaran.'}
                  </td>
                </tr>
              ) : (
                items.map((payment) => (
                  <tr key={payment.id} className="align-top hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/orders/${payment.order_id}`}
                        className="inline-block rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold tracking-wide text-slate-800 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        {payment.order?.order_number}
                      </Link>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="max-w-40 truncate text-xs text-slate-600">{payment.order?.customer_name}</span>
                        <SourceBadge source={payment.order?.source} />
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">{formatDate(payment.created_at)}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-slate-600 md:table-cell">
                      <p>{[payment.sender_bank, payment.sender_name].filter(Boolean).join(' a.n. ') || '-'}</p>
                      <p className="mt-0.5 text-slate-400">
                        Diupload {ROLE_LABEL[payment.uploaded_by?.role] ?? '-'}
                        {payment.uploaded_by?.name ? ` · ${payment.uploaded_by.name}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={payment.status} />
                      {payment.status === 'rejected' && payment.rejection_reason && (
                        <p className="mt-1 max-w-48 truncate text-xs text-red-600" title={payment.rejection_reason}>
                          {payment.rejection_reason}
                        </p>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      {payment.proof_url ? (
                        <a
                          href={payment.proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-violet-600 hover:underline"
                        >
                          {payment.proof_is_pdf ? 'Buka PDF' : 'Lihat bukti'}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <PaymentReviewActions
                          payment={payment}
                          orderNumber={payment.order?.order_number}
                          onDone={handleReviewed}
                          compact
                        />
                      </div>
                      {payment.proof_url && (
                        <a
                          href={payment.proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 block text-right text-xs font-medium text-violet-600 hover:underline sm:hidden"
                        >
                          Lihat bukti
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination meta={meta} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} />
      </section>
    </div>
  )
}
