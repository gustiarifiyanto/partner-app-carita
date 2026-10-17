import { useCallback, useEffect, useState } from 'react'
import MarkPaidModal from '../../components/admin/MarkPaidModal'
import AnimatedNumber from '../../components/AnimatedNumber'
import { CheckCircleIcon, ClockIcon, WalletIcon } from '../../components/icons/HelpIcons'
import ListSkeleton from '../../components/ListSkeleton'
import MetricCard from '../../components/MetricCard'
import Pagination from '../../components/Pagination'
import PartnerAvatar from '../../components/PartnerAvatar'
import SearchInput from '../../components/SearchInput'
import SegmentedTabs from '../../components/SegmentedTabs'
import StatCardSkeleton from '../../components/StatCardSkeleton'
import StatusBadge from '../../components/StatusBadge'
import TableSkeleton from '../../components/TableSkeleton'
import { useApiList } from '../../hooks/useApiList'
import { useAuth } from '../../hooks/useAuth'
import { useCountUp } from '../../hooks/useCountUp'
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch'
import { usePageHeader } from '../../hooks/usePageHeader'
import api from '../../lib/api'
import { formatCurrency, formatDate } from '../../lib/format'

const STATUS_TABS = [
  { value: '', label: 'Semua' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
]

export default function CommissionsPage() {
  usePageHeader('Commissions', 'Kelola pembayaran komisi partner')

  const { refreshNewCommissions } = useAuth()
  const [summary, setSummary] = useState(null)
  const [summaryError, setSummaryError] = useState('')

  const {
    items: requests,
    loading: requestsLoading,
    refetch: refetchRequests,
  } = useApiList('/admin/commissions/payment-requests', {})

  const { items, meta, loading, error, filters, setFilters, refetch } = useApiList('/admin/commissions', {
    search: '',
    status: '',
    page: 1,
  })

  const [searchInput, setSearchInput] = useDebouncedSearch(filters.search, setFilters)
  const [payTarget, setPayTarget] = useState(null)

  const loadSummary = useCallback(() => {
    api
      .get('/admin/commissions/summary')
      .then(({ data }) => setSummary(data.data))
      .catch((err) => setSummaryError(err.response?.data?.message || 'Gagal memuat ringkasan.'))
  }, [])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  const refetchAll = () => {
    loadSummary()
    refetchRequests()
    refetch()
    refreshNewCommissions()
  }

  const totalUnpaid = Number(summary?.total_unpaid) || 0
  const totalPaid = Number(summary?.total_paid) || 0
  const totalAll = totalUnpaid + totalPaid
  const paidPercent = totalAll > 0 ? Math.round((totalPaid / totalAll) * 100) : 0

  return (
    <div className="space-y-8">
      {summaryError && (
        <p className="animate-error-in rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{summaryError}</p>
      )}

      {summary ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <div className="animate-fade-up">
            <MetricCard
              label="Belum Dibayar"
              value={<AnimatedNumber value={totalUnpaid} format={formatCurrency} />}
              icon={<ClockIcon />}
              gradient="linear-gradient(135deg, #FBBF24, #D97706)"
            />
          </div>
          <div className="animate-fade-up" style={{ animationDelay: '80ms' }}>
            <MetricCard
              label="Sudah Dibayar"
              value={<AnimatedNumber value={totalPaid} format={formatCurrency} />}
              icon={<CheckCircleIcon />}
              gradient="linear-gradient(135deg, #34D399, #059669)"
            />
          </div>
          <div className="animate-fade-up col-span-2 lg:col-span-1" style={{ animationDelay: '160ms' }}>
            <PaidProgressCard percent={paidPercent} total={totalAll} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <div className="col-span-2 lg:col-span-1">
            <StatCardSkeleton />
          </div>
        </div>
      )}

      <section
        className="animate-fade-up rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
        style={{ animationDelay: '200ms' }}
      >
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Permintaan Pencairan</h2>
          {!requestsLoading && requests.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
              </span>
              {requests.length} menunggu
            </span>
          )}
        </div>

        {requestsLoading ? (
          <ListSkeleton rows={3} />
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircleIcon />
            </span>
            <p className="text-sm text-slate-500">Semua permintaan pencairan sudah diproses.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {requests.map((req, index) => (
              <li
                key={req.partner.id}
                className="animate-fade-up flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-3 transition duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md"
                style={{ animationDelay: `${260 + index * 60}ms` }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <PartnerAvatar partner={req.partner} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{req.partner.company_name}</p>
                    <p className="text-xs text-slate-500">Diajukan {formatDate(req.requested_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold tabular-nums text-slate-900">
                    {formatCurrency(req.pending_amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPayTarget(req.partner)}
                    className="rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-emerald-600/30 active:translate-y-0"
                  >
                    Bayar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        className="animate-fade-up overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
        style={{ animationDelay: '280ms' }}
      >
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Daftar Komisi</h2>
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
              placeholder="Cari nama partner / nomor order..."
              className="sm:w-72"
            />

            <SegmentedTabs
              tabs={STATUS_TABS}
              value={filters.status}
              onChange={(status) => setFilters((prev) => ({ ...prev, status, page: 1 }))}
            />
          </div>
        </div>

        {error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}

        <div className="table-scroll">
          <table className="min-w-full divide-y divide-slate-200 text-sm whitespace-nowrap">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Partner</th>
                <th className="hidden px-4 py-3 text-left font-medium text-slate-500 sm:table-cell">Order</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">Jumlah</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                <th className="hidden px-4 py-3 text-left font-medium text-slate-500 sm:table-cell">Dibayar</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton rows={5} columns={6} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <p className="text-sm font-medium text-slate-500">Tidak ada komisi.</p>
                    {filters.search && (
                      <p className="mt-1 text-xs text-slate-400">
                        Tidak ada hasil untuk &ldquo;{filters.search}&rdquo;.
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                items.map((commission, index) => (
                  <tr
                    key={commission.id}
                    className="animate-fade-up transition-colors duration-150 hover:bg-slate-50"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <PartnerAvatar partner={commission.partner} size="sm" />
                        <span className="font-medium text-slate-900">{commission.partner?.company_name || '-'}</span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-xs text-slate-600 sm:table-cell">
                      {commission.order?.order_number}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                      {formatCurrency(commission.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={commission.status} />
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">
                      {commission.paid_at ? formatDate(commission.paid_at) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {commission.status === 'unpaid' && commission.partner && (
                        <button
                          type="button"
                          onClick={() => setPayTarget(commission.partner)}
                          className="rounded-lg border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white"
                        >
                          Bayar
                        </button>
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

      <MarkPaidModal
        open={!!payTarget}
        partner={payTarget}
        amount={requests.find((req) => req.partner.id === payTarget?.id)?.pending_amount}
        onClose={() => setPayTarget(null)}
        onPaid={() => {
          setPayTarget(null)
          refetchAll()
        }}
      />
    </div>
  )
}

function PaidProgressCard({ percent, total }) {
  const animatedPercent = useCountUp(percent)
  // Start the bar at 0 and grow it on the next frame so the width transition plays.
  const [barWidth, setBarWidth] = useState(0)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setBarWidth(percent))
    return () => cancelAnimationFrame(frame)
  }, [percent])

  return (
    <div className="h-full rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
          style={{ backgroundImage: 'linear-gradient(135deg, #818CF8, #4F46E5)' }}
        >
          <WalletIcon />
        </div>
        <span className="text-2xl font-semibold tabular-nums text-slate-900">{Math.round(animatedPercent)}%</span>
      </div>
      <p className="mt-4 text-sm text-slate-500">Komisi terbayar dari {formatCurrency(total)}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-emerald-500 transition-[width] duration-1000 ease-out"
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  )
}
