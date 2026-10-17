import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import InvitationDataBadge from '../../components/InvitationDataBadge'
import ListSkeleton from '../../components/ListSkeleton'
import { usePageHeader } from '../../hooks/usePageHeader'
import api from '../../lib/api'
import { clientOrderStatus } from '../../lib/clientOrderStatus'
import { formatDate } from '../../lib/format'

// Ajakan singkat sesuai status data undangan.
const NEXT_STEP = {
  choose_mode: 'Pilih cara pengerjaan undangan',
  waiting_data: 'Lengkapi data mempelai & acara',
  submitted: 'Data terkirim, undangan sedang disiapkan',
}

export default function ClientInvitationsPage() {
  usePageHeader('Undangan Saya', 'Isi data mempelai & acara untuk setiap pesanan undangan')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api
      .get('/client/invitations')
      .then(({ data }) => {
        if (!cancelled) setItems(data.data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Gagal memuat undangan.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <ListSkeleton rows={3} />
      </div>
    )
  }

  if (error) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>

  if (items.length === 0) {
    return (
      <div className="animate-fade-up rounded-2xl bg-white px-6 py-12 text-center shadow-sm ring-1 ring-slate-200">
        <p className="text-4xl">💌</p>
        <p className="mt-3 text-base font-semibold text-slate-900">Belum ada undangan</p>
        <p className="mt-1 text-sm text-slate-500">Undangan muncul di sini setelah kamu membuat pesanan.</p>
        <Link
          to="/client/katalog"
          className="mt-5 inline-block rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
        >
          Lihat Katalog
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {items.map((item, index) => {
        const status = clientOrderStatus(item.status)
        const done = item.status === 'completed'
        return (
          <Link
            key={item.id}
            to={`/client/undangan/${item.id}`}
            className="animate-fade-up group flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-violet-300"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            {item.theme?.thumbnail ? (
              <img
                src={item.theme.thumbnail}
                alt={item.theme.name}
                className="h-28 w-20 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
              />
            ) : (
              <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-2xl">💌</div>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
                  {item.order_number}
                </span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <p className="truncate text-sm font-semibold text-slate-900">{item.theme?.name ?? item.product_service_name}</p>
              <p className="text-xs text-slate-500">
                {item.package?.name} · {formatDate(item.created_at)}
              </p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                {done ? (
                  <span className="text-xs font-medium text-emerald-700">Undangan sudah jadi 🎉</span>
                ) : (
                  <InvitationDataBadge status={item.data_status} />
                )}
                <span className="text-xs font-semibold text-violet-600 group-hover:underline">
                  {done ? 'Lihat' : (NEXT_STEP[item.data_status] ?? 'Buka')} →
                </span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
