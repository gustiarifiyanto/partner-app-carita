import { useEffect, useRef, useState } from 'react'
import AnimatedNumber from '../../components/AnimatedNumber'
import ListSkeleton from '../../components/ListSkeleton'
import MetricCard from '../../components/MetricCard'
import Modal from '../../components/Modal'
import PartnerAvatar from '../../components/PartnerAvatar'
import RankingBars from '../../components/charts/RankingBars'
import SegmentedTabs from '../../components/SegmentedTabs'
import Skeleton from '../../components/Skeleton'
import StatCardSkeleton from '../../components/StatCardSkeleton'
import StatusBadge from '../../components/StatusBadge'
import TableSkeleton from '../../components/TableSkeleton'
import TrendChart from '../../components/charts/TrendChart'
import { CheckCircleIcon, ClockIcon, PercentIcon, RevenueIcon } from '../../components/icons/HelpIcons'
import { OrdersIcon } from '../../components/icons/NavIcons'
import { useApiList } from '../../hooks/useApiList'
import { usePageHeader } from '../../hooks/usePageHeader'
import { useToast } from '../../hooks/useToast'
import { SERIES_1 } from '../../lib/chartColors'
import { exportNodeAsJpeg, exportNodeAsPdf } from '../../lib/exportReport'
import { formatCurrency, formatDate } from '../../lib/format'

const STATUS_ORDER = ['pending_approval', 'confirmed', 'completed', 'cancelled']

const FORMAT_TABS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'jpeg', label: 'JPEG' },
]

const EXPORT_SCOPES = [
  { value: 'all', label: 'Semua Laporan', hint: 'Penjualan, tren, partner & komisi' },
  { value: 'sales', label: 'Ringkasan Penjualan', hint: 'Stat penjualan & status order' },
  { value: 'trend', label: 'Tren Revenue & Komisi', hint: 'Grafik tren + tabel data' },
  { value: 'partners', label: 'Performa Partner', hint: 'Ranking & tabel partner' },
  { value: 'commissions', label: 'Laporan Komisi', hint: 'Komisi dibayar & belum' },
]

const GROUP_TABS = [
  { value: 'day', label: 'Harian' },
  { value: 'month', label: 'Bulanan' },
]

function buildExportFilename(scope, format) {
  // Local date (not toISOString, which is UTC and lags a day before 07:00 WIB).
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return `laporan-${scope === 'all' ? 'carita' : scope}-${today}.${format === 'pdf' ? 'pdf' : 'jpg'}`
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default function ReportsPage() {
  usePageHeader('Reports & Analytics', 'Ringkasan penjualan, tren revenue, dan performa partner')

  const toast = useToast()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [groupBy, setGroupBy] = useState('day')
  const [showExport, setShowExport] = useState(false)
  const [exportFormat, setExportFormat] = useState('pdf')
  const [exportScope, setExportScope] = useState('all')
  // While set, the page renders its print layout (header, chosen sections only).
  const [exportJob, setExportJob] = useState(null)
  const reportRef = useRef(null)

  const sales = useApiList('/admin/reports/sales', { date_from: '', date_to: '' })
  const trends = useApiList('/admin/reports/revenue-trends', {
    date_from: '',
    date_to: '',
    group_by: 'day',
  })
  const partners = useApiList('/admin/reports/partners', { date_from: '', date_to: '' })
  const commissions = useApiList('/admin/reports/commissions', { date_from: '', date_to: '' })

  useEffect(() => {
    sales.setFilters({ date_from: dateFrom, date_to: dateTo })
    trends.setFilters({ date_from: dateFrom, date_to: dateTo, group_by: groupBy })
    partners.setFilters({ date_from: dateFrom, date_to: dateTo })
    commissions.setFilters({ date_from: dateFrom, date_to: dateTo })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, groupBy])

  const handleReset = () => {
    setDateFrom('')
    setDateTo('')
  }

  const anyLoading = sales.loading || trends.loading || partners.loading || commissions.loading

  // Capture once React has painted the print layout for the chosen scope.
  useEffect(() => {
    if (!exportJob) return
    let cancelled = false

    ;(async () => {
      try {
        await wait(150)
        if (cancelled || !reportRef.current) return
        const filename = buildExportFilename(exportJob.scope, exportJob.format)
        if (exportJob.format === 'pdf') await exportNodeAsPdf(reportRef.current, filename)
        else await exportNodeAsJpeg(reportRef.current, filename)
        toast.success(`Laporan ${exportJob.format.toUpperCase()} berhasil diunduh.`)
      } catch {
        toast.error('Gagal mengekspor laporan.')
      } finally {
        if (!cancelled) setExportJob(null)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [exportJob, toast])

  const startExport = () => {
    setShowExport(false)
    setExportJob({ format: exportFormat, scope: exportScope })
  }

  // During export only the chosen section(s) stay visible.
  const sectionHidden = (key) => (exportJob && exportJob.scope !== 'all' && exportJob.scope !== key ? 'hidden' : '')
  const scopeLabel = EXPORT_SCOPES.find((scope) => scope.value === exportJob?.scope)?.label

  const salesData = sales.items && !Array.isArray(sales.items) ? sales.items : null
  const commissionData = commissions.items && !Array.isArray(commissions.items) ? commissions.items : null
  const trendRows = Array.isArray(trends.items) ? trends.items : []
  const partnerRows = Array.isArray(partners.items) ? partners.items : []
  const topPartners = partnerRows.slice(0, 8).map((p) => ({ label: p.company_name, value: p.period_revenue }))
  const totalOrdersByStatus = salesData
    ? STATUS_ORDER.reduce((sum, status) => sum + (salesData.by_status[status]?.total_orders ?? 0), 0)
    : 0
  const dateInputClass =
    'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'

  return (
    <div className="space-y-8">
      <div className="animate-fade-up flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Dari Tanggal</label>
          <input
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => setDateFrom(e.target.value)}
            className={dateInputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Sampai Tanggal</label>
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => setDateTo(e.target.value)}
            className={dateInputClass}
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            type="button"
            onClick={handleReset}
            className="animate-fade-up rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            Reset
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowExport(true)}
          disabled={!!exportJob || anyLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto lg:ml-auto"
        >
          <svg
            className={`h-4 w-4 ${exportJob ? 'animate-bounce' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          {exportJob ? 'Menyiapkan file...' : 'Export Laporan'}
        </button>
      </div>

      <div ref={reportRef} className={exportJob ? 'exporting space-y-8 rounded-2xl p-6' : 'space-y-8'}>
        {exportJob && (
          <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-semibold tracking-widest text-indigo-600 uppercase">
                Carita Studio &middot; Partner Management
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900">{scopeLabel}</h1>
              <p className="mt-1 text-sm text-slate-500">
                Periode: {dateFrom ? formatDate(dateFrom) : 'Awal'} &ndash; {dateTo ? formatDate(dateTo) : 'Sekarang'}
              </p>
            </div>
            <p className="text-right text-xs text-slate-400">
              Dibuat {new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(new Date())}
            </p>
          </div>
        )}

        <section className={`space-y-4 ${sectionHidden('sales')}`}>
          <SectionTitle>Ringkasan Penjualan</SectionTitle>
          {sales.error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{sales.error}</p>}

          {sales.loading || !salesData ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  {
                    label: 'Total Order',
                    value: <AnimatedNumber value={salesData.totals.total_orders} />,
                    icon: <OrdersIcon />,
                    gradient: 'linear-gradient(135deg, #60A5FA, #2563EB)',
                  },
                  {
                    label: 'Order Selesai',
                    value: <AnimatedNumber value={salesData.totals.completed_orders} />,
                    icon: <CheckCircleIcon />,
                    gradient: 'linear-gradient(135deg, #34D399, #059669)',
                  },
                  {
                    label: 'Total Revenue',
                    value: <AnimatedNumber value={salesData.totals.total_revenue} format={formatCurrency} />,
                    icon: <RevenueIcon />,
                    gradient: 'linear-gradient(135deg, #22D3EE, #0284C7)',
                  },
                  {
                    label: 'Total Komisi',
                    value: <AnimatedNumber value={salesData.totals.total_commission} format={formatCurrency} />,
                    icon: <PercentIcon />,
                    gradient: 'linear-gradient(135deg, #A78BFA, #7C3AED)',
                  },
                ].map((card, index) => (
                  <div key={card.label} className="animate-fade-up" style={{ animationDelay: `${80 + index * 70}ms` }}>
                    <MetricCard {...card} />
                  </div>
                ))}
              </div>

              <div
                className="animate-fade-up overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
                style={{ animationDelay: '360ms' }}
              >
                <div className="table-scroll">
                  <table className="min-w-full divide-y divide-slate-200 text-sm whitespace-nowrap">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                        <th className="hidden px-4 py-3 text-left font-medium text-slate-500 sm:table-cell">Porsi</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-500">Jumlah Order</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-500">Total Nilai</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {STATUS_ORDER.map((status, index) => {
                        const row = salesData.by_status[status]
                        const count = row?.total_orders ?? 0
                        const share = totalOrdersByStatus > 0 ? (count / totalOrdersByStatus) * 100 : 0
                        return (
                          <tr
                            key={status}
                            className="animate-fade-up transition-colors hover:bg-slate-50"
                            style={{ animationDelay: `${420 + index * 50}ms` }}
                          >
                            <td className="px-4 py-3">
                              <StatusBadge status={status} />
                            </td>
                            <td className="hidden w-1/3 px-4 py-3 sm:table-cell">
                              <div className="flex items-center gap-2">
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    key={`${status}-${share}`}
                                    className="animate-bar-grow h-full rounded-full"
                                    style={{
                                      width: `${share}%`,
                                      backgroundColor: SERIES_1,
                                      animationDelay: `${500 + index * 60}ms`,
                                    }}
                                  />
                                </div>
                                <span className="w-10 text-right text-xs text-slate-500 tabular-nums">
                                  {Math.round(share)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600 tabular-nums">{count}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-900 tabular-nums">
                              {formatCurrency(row?.total_amount ?? 0)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>

        <section
          className={`animate-fade-up space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 ${sectionHidden('trend')}`}
          style={{ animationDelay: '200ms' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Tren Revenue &amp; Komisi</h2>
            <div data-export-ignore>
              <SegmentedTabs tabs={GROUP_TABS} value={groupBy} onChange={setGroupBy} />
            </div>
          </div>

          {trends.error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{trends.error}</p>}

          {trends.loading ? <Skeleton className="h-64 w-full" /> : <TrendChart data={trendRows} groupBy={groupBy} />}

          {!trends.loading && trendRows.length > 0 && (
            <details className="group rounded-xl ring-1 ring-slate-100" open={exportJob ? true : undefined}>
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50">
                Lihat tabel data ({trendRows.length} periode)
                <svg
                  className="h-4 w-4 transition-transform duration-200 group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <div className="table-scroll animate-fade-up px-1 pb-2">
                <table className="min-w-full divide-y divide-slate-200 text-sm whitespace-nowrap">
                  <thead>
                    <tr>
                      <th className="px-2 py-2 text-left font-medium text-slate-500">Periode</th>
                      <th className="px-2 py-2 text-right font-medium text-slate-500">Order</th>
                      <th className="px-2 py-2 text-right font-medium text-slate-500">Revenue</th>
                      <th className="px-2 py-2 text-right font-medium text-slate-500">Komisi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trendRows.map((row) => (
                      <tr key={row.period} className="hover:bg-slate-50">
                        <td className="px-2 py-2 text-slate-600">{row.period}</td>
                        <td className="px-2 py-2 text-right text-slate-600 tabular-nums">{row.total_orders}</td>
                        <td className="px-2 py-2 text-right text-slate-600 tabular-nums">
                          {formatCurrency(row.revenue)}
                        </td>
                        <td className="px-2 py-2 text-right text-slate-600 tabular-nums">
                          {formatCurrency(row.commission)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </section>

        <section className={`space-y-4 ${sectionHidden('partners')}`}>
          <SectionTitle>Performa Partner</SectionTitle>
          {partners.error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{partners.error}</p>}

          <div
            className="animate-fade-up rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            style={{ animationDelay: '260ms' }}
          >
            <h3 className="mb-4 text-xs font-semibold tracking-wide text-slate-400 uppercase">
              Top 8 berdasarkan Revenue
            </h3>
            {partners.loading ? <ListSkeleton rows={5} /> : <RankingBars data={topPartners} />}
          </div>

          <div
            className="animate-fade-up overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
            style={{ animationDelay: '320ms' }}
          >
            <div className="table-scroll">
              <table className="min-w-full divide-y divide-slate-200 text-sm whitespace-nowrap">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Partner</th>
                    <th className="hidden px-4 py-3 text-right font-medium text-slate-500 sm:table-cell">
                      Total Order
                    </th>
                    <th className="hidden px-4 py-3 text-right font-medium text-slate-500 sm:table-cell">
                      Order Selesai
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-slate-500">Revenue</th>
                    <th className="hidden px-4 py-3 text-right font-medium text-slate-500 sm:table-cell">Komisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {partners.loading ? (
                    <TableSkeleton rows={5} columns={5} />
                  ) : partnerRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                        Tidak ada data.
                      </td>
                    </tr>
                  ) : (
                    partnerRows.map((p, index) => (
                      <tr
                        key={p.id}
                        className="animate-fade-up transition-colors hover:bg-slate-50"
                        style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <PartnerAvatar partner={p} size="sm" />
                            <span className="font-medium text-slate-900">{p.company_name}</span>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 text-right text-slate-600 tabular-nums sm:table-cell">
                          {p.total_orders}
                        </td>
                        <td className="hidden px-4 py-3 text-right text-slate-600 tabular-nums sm:table-cell">
                          {p.completed_orders}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">
                          {formatCurrency(p.period_revenue)}
                        </td>
                        <td className="hidden px-4 py-3 text-right text-slate-600 tabular-nums sm:table-cell">
                          {formatCurrency(p.period_commission)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className={`space-y-4 ${sectionHidden('commissions')}`}>
          <SectionTitle>Laporan Komisi</SectionTitle>
          {commissions.error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{commissions.error}</p>
          )}

          {commissions.loading || !commissionData ? (
            <div className="grid grid-cols-2 gap-4">
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="animate-fade-up">
                <MetricCard
                  label="Belum Dibayar"
                  value={<AnimatedNumber value={commissionData.total_unpaid} format={formatCurrency} />}
                  icon={<ClockIcon />}
                  gradient="linear-gradient(135deg, #FBBF24, #D97706)"
                />
              </div>
              <div className="animate-fade-up" style={{ animationDelay: '80ms' }}>
                <MetricCard
                  label="Sudah Dibayar"
                  value={<AnimatedNumber value={commissionData.total_paid} format={formatCurrency} />}
                  icon={<CheckCircleIcon />}
                  gradient="linear-gradient(135deg, #34D399, #059669)"
                />
              </div>
            </div>
          )}

          <div
            className="animate-fade-up overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
            style={{ animationDelay: '160ms' }}
          >
            <div className="table-scroll">
              <table className="min-w-full divide-y divide-slate-200 text-sm whitespace-nowrap">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Partner</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-500">Belum Dibayar</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-500">Sudah Dibayar</th>
                    <th className="hidden px-4 py-3 text-right font-medium text-slate-500 sm:table-cell">
                      Jumlah Komisi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commissions.loading || !commissionData ? (
                    <TableSkeleton rows={5} columns={4} />
                  ) : commissionData.per_partner.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                        Tidak ada data.
                      </td>
                    </tr>
                  ) : (
                    commissionData.per_partner.map((row, index) => (
                      <tr
                        key={row.partner_id}
                        className="animate-fade-up transition-colors hover:bg-slate-50"
                        style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <PartnerAvatar partner={row.partner ?? { id: row.partner_id }} size="sm" />
                            <span className="font-medium text-slate-900">{row.partner?.company_name ?? '-'}</span>
                          </div>
                        </td>
                        <td
                          className={`px-4 py-3 text-right tabular-nums ${
                            Number(row.unpaid_amount) > 0 ? 'font-semibold text-amber-700' : 'text-slate-400'
                          }`}
                        >
                          {formatCurrency(row.unpaid_amount)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                          {formatCurrency(row.paid_amount)}
                        </td>
                        <td className="hidden px-4 py-3 text-right text-slate-600 tabular-nums sm:table-cell">
                          {row.total_commissions}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {(dateFrom || dateTo) && !exportJob && (
          <p className="text-xs text-slate-400">
            Menampilkan data {dateFrom ? formatDate(dateFrom) : 'awal'} &mdash;{' '}
            {dateTo ? formatDate(dateTo) : 'sekarang'}.
          </p>
        )}
      </div>

      <Modal open={showExport} onClose={() => setShowExport(false)} title="Export Laporan">
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Format file</p>
            <SegmentedTabs tabs={FORMAT_TABS} value={exportFormat} onChange={setExportFormat} />
            <p className="mt-1.5 text-xs text-slate-400">
              {exportFormat === 'pdf'
                ? 'Ukuran A4, otomatis dibagi beberapa halaman kalau laporan panjang.'
                : 'Satu gambar utuh, cocok untuk dikirim lewat WhatsApp.'}
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Isi laporan</p>
            <div className="space-y-1.5">
              {EXPORT_SCOPES.map((scope) => (
                <label
                  key={scope.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ring-1 transition ${
                    exportScope === scope.value ? 'bg-indigo-50 ring-indigo-300' : 'ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="export-scope"
                    value={scope.value}
                    checked={exportScope === scope.value}
                    onChange={() => setExportScope(scope.value)}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-900">{scope.label}</span>
                    <span className="block text-xs text-slate-500">{scope.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Periode mengikuti filter tanggal: {dateFrom ? formatDate(dateFrom) : 'awal'} &ndash;{' '}
            {dateTo ? formatDate(dateTo) : 'sekarang'}.
          </p>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowExport(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={startExport}
              className="rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:shadow-md hover:shadow-indigo-500/30"
            >
              Unduh {exportFormat.toUpperCase()}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h2 className="animate-fade-up flex items-center gap-2 text-sm font-semibold text-slate-900">
      <span className="h-4 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
      {children}
    </h2>
  )
}
