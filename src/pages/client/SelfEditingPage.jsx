import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import InvitationDataBadge from '../../components/InvitationDataBadge'
import ListSkeleton from '../../components/ListSkeleton'
import { usePageHeader } from '../../hooks/usePageHeader'
import api from '../../lib/api'
import { formatDate } from '../../lib/format'

// Menu Self Editing: undangan yang dipesan dengan add-on Self Editing (dipilih saat checkout).
export default function SelfEditingPage() {
  usePageHeader('Self Editing', 'Edit undangan kamu sendiri dengan preview langsung')
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

  const selfItems = items.filter((item) => item.editing_mode === 'self')

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <ListSkeleton rows={3} />
      </div>
    )
  }

  if (error) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>

  return (
    <div className="space-y-6">
      <section className="animate-fade-up rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500 p-5 text-white shadow-lg sm:p-6">
        <p className="text-2xl">✏️</p>
        <h2 className="mt-1 text-lg font-semibold">Buat undanganmu sendiri</h2>
        <ol className="mt-3 grid grid-cols-1 gap-2 text-sm text-white/90 sm:grid-cols-3">
          <li className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm">1. Isi data, kata-kata & foto</li>
          <li className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm">2. Cek tampilannya di preview</li>
          <li className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm">3. Ajukan terbit, revisi mandiri 5x</li>
        </ol>
      </section>

      {selfItems.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {selfItems.map((item, index) => (
            <InvitationCard key={item.id} item={item} index={index} cta={ctaFor(item)} />
          ))}
        </div>
      )}

      {selfItems.length === 0 && (
        <div className="rounded-2xl bg-white px-4 py-10 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Belum ada undangan Self Editing.</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-400">
            Pilih add-on <strong>Self Editing</strong> saat membuat pesanan dari Katalog (tema bertanda ✏️ Self
            Editing). Kamu bisa mengedit undangan sendiri dan revisi mandiri sampai 5x setelah terbit.
          </p>
          <Link
            to="/client/katalog"
            className="mt-4 inline-block rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Lihat Katalog
          </Link>
        </div>
      )}
    </div>
  )
}

function ctaFor(item) {
  if (item.invitation_url) return 'Lihat undangan'
  if (item.data_status === 'submitted') return 'Menunggu diterbitkan'
  return 'Lanjut edit'
}

function InvitationCard({ item, index, cta }) {
  return (
    <Link
      to={`/client/self-editing/${item.id}`}
      className="animate-fade-up group flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-violet-300"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {item.theme?.thumbnail ? (
        <img
          src={item.theme.thumbnail}
          alt={item.theme.name}
          className="h-24 w-16 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
        />
      ) : (
        <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-2xl">💌</div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="w-fit rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
          {item.order_number}
        </span>
        <p className="truncate text-sm font-semibold text-slate-900">{item.theme?.name ?? item.product_service_name}</p>
        <p className="text-xs text-slate-500">
          {item.package?.name} · {formatDate(item.created_at)}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
          {item.editing_mode === 'self' ? <InvitationDataBadge status={item.data_status} mode="self" /> : <span />}
          <span className="text-xs font-semibold text-violet-600 group-hover:underline">{cta} →</span>
        </div>
      </div>
    </Link>
  )
}
