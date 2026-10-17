import { useCallback, useEffect, useState } from 'react'
import savingMoneyIcon from '../../assets/icon_animated/saving-money.gif'
import logo from '../../assets/logo/logo_carita_v4.png'
import ListSkeleton from '../../components/ListSkeleton'
import Pagination from '../../components/Pagination'
import StatusBadge from '../../components/StatusBadge'
import TableSkeleton from '../../components/TableSkeleton'
import { useApiList } from '../../hooks/useApiList'
import { useAuth } from '../../hooks/useAuth'
import { usePageHeader } from '../../hooks/usePageHeader'
import { useToast } from '../../hooks/useToast'
import api from '../../lib/api'
import { formatCurrency, formatDate } from '../../lib/format'

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

export default function CommissionsPage() {
  usePageHeader('Commissions', 'Riwayat komisi & pencairan')

  const { user } = useAuth()

  const toast = useToast()
  const [summary, setSummary] = useState(null)
  const [requesting, setRequesting] = useState(false)
  const [showInfoChat, setShowInfoChat] = useState(false)

  const { items, meta, loading, error, filters, setFilters } = useApiList('/partner/commissions', {
    status: '',
    page: 1,
  })

  const { items: history, loading: historyLoading } = useApiList('/partner/payment-history', {})

  const loadSummary = useCallback(() => {
    api.get('/partner/dashboard').then(({ data }) => {
      setSummary({
        pendingCommission: data.data.statistics.pending_commission,
        requestedAt: data.data.partner.payment_requested_at,
      })
    })
  }, [])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  const handleRequestPayment = async () => {
    setRequesting(true)
    try {
      await api.post('/partner/payment-request')
      toast.success('Permintaan pencairan berhasil diajukan.')
      loadSummary()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengajukan pencairan.')
    } finally {
      setRequesting(false)
    }
  }

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={savingMoneyIcon} alt="" className="h-12 w-12 shrink-0" />
            <div>
              <p className="text-sm text-slate-500">Tabungan komisi anda</p>
              <p className="text-2xl font-semibold text-slate-900">
                {summary ? formatCurrency(summary.pendingCommission) : '...'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRequestPayment}
            disabled={requesting || !summary || summary.pendingCommission <= 0 || !!summary.requestedAt}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {summary?.requestedAt ? 'Sudah Diajukan' : requesting ? 'Memproses...' : 'Ajukan Pencairan'}
          </button>
        </div>
        {summary?.requestedAt && (
          <p className="mt-2 text-xs text-slate-400">
            Diajukan pada {formatDate(summary.requestedAt)}, menunggu diproses admin.
          </p>
        )}
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <button
          type="button"
          onClick={() => setShowInfoChat((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left sm:px-5"
          aria-expanded={showInfoChat}
        >
          <span>
            <span className="block text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
              Pesan dari Tim Carita
            </span>
            <span className="mt-0.5 block text-sm text-slate-600">Info & syarat penarikan komisi</span>
          </span>
          <svg
            className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${showInfoChat ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {showInfoChat && (
          <div className="space-y-2.5 border-t border-slate-100 px-3.5 pt-3 pb-4 sm:px-5">
            <div className="flex items-end gap-2">
              <img
                src={logo}
                alt=""
                className="h-7 w-7 shrink-0 rounded-full bg-white object-contain ring-1 ring-slate-200"
              />
              <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-slate-100 px-3.5 py-2 text-sm text-slate-700 sm:max-w-[70%]">
                Halo Camin! Sebelum ajukan pencairan komisi, ada beberapa hal yang perlu diketahui ya 👇
              </div>
            </div>

            <div className="flex items-end gap-2">
              <div className="h-7 w-7 shrink-0" aria-hidden="true" />
              <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-slate-100 px-3.5 py-2 text-sm text-slate-700 sm:max-w-[70%]">
                <ul className="list-disc space-y-1.5 pl-4">
                  <li>Komisi Camin bisa ditarik kapan saja dan berapa pun jumlahnya, tanpa potongan apa pun.</li>
                  <li>Jumlah komisi yang tertera di atas real, sesuai dengan komisi Camin yang sebenarnya.</li>
                  <li>Proses validasi penarikan komisi membutuhkan waktu maksimal 2x24 jam.</li>
                  <li>Kalau pengajuan pencairan sudah berhasil, tim kami akan menghubungi Camin kembali untuk konfirmasi.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-end justify-end gap-2">
              <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-violet-600 px-3.5 py-2 text-sm text-white sm:max-w-[70%]">
                Siap kak, dimengerti! 🙌
              </div>
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                style={{ backgroundImage: 'linear-gradient(135deg, #7C3AED, #2563EB)' }}
              >
                {getInitials(user?.name)}
              </span>
            </div>

            <p className="mt-3 text-center text-[11px] text-slate-400">
              *Camin: panggilan khusus untuk partner Carita Studio
            </p>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Daftar Komisi</h2>
          <select
            value={filters.status}
            onChange={handleFilterChange}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Semua Status</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        {error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}

        <div className="table-scroll">
          <table className="min-w-full divide-y divide-slate-200 text-sm whitespace-nowrap">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Order</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">Jumlah</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                <th className="hidden px-4 py-3 text-left font-medium text-slate-500 sm:table-cell">
                  Dibayar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton rows={5} columns={4} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    Belum ada komisi.
                  </td>
                </tr>
              ) : (
                items.map((commission) => (
                  <tr key={commission.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {commission.order?.order_number}
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(commission.amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={commission.status} />
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">
                      {commission.paid_at ? formatDate(commission.paid_at) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination meta={meta} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} />
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Riwayat Pembayaran</h2>
        {historyLoading ? (
          <ListSkeleton rows={3} />
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada riwayat pembayaran.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {history.map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div className="flex items-center gap-3">
                  {payment.payment_proof_url && (
                    <a href={payment.payment_proof_url} target="_blank" rel="noreferrer">
                      <img
                        src={payment.payment_proof_url}
                        alt="Bukti transfer"
                        className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                      />
                    </a>
                  )}
                  <div>
                    <p className="font-medium text-slate-900">{formatCurrency(payment.total_amount)}</p>
                    <p className="text-xs text-slate-500">
                      {payment.payment_method === 'bank_transfer' ? 'Transfer Bank' : 'Lainnya'}
                      {payment.reference_number ? ` · ${payment.reference_number}` : ''}
                    </p>
                    {payment.payment_proof_url && (
                      <a
                        href={payment.payment_proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        Lihat bukti transfer
                      </a>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-400">{formatDate(payment.paid_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
