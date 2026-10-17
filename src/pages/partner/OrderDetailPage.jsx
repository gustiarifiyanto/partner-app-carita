import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AnimatedNumber from '../../components/AnimatedNumber'
import DetailPageSkeleton from '../../components/DetailPageSkeleton'
import {
  CommissionCard,
  CustomerIconPath,
  Detail,
  InfoCard,
  OrderTimeline,
} from '../../components/orders/OrderDetailParts'
import ClientAccessShareModal from '../../components/partner/ClientAccessShareModal'
import { PaymentHistory } from '../../components/payments/PaymentParts'
import PaymentUploadForm from '../../components/payments/PaymentUploadForm'
import ClientAccountCard from '../../components/partner/ClientAccountCard'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../hooks/useAuth'
import { usePageHeader } from '../../hooks/usePageHeader'
import api from '../../lib/api'
import { formatCurrency, formatDate } from '../../lib/format'

export default function OrderDetailPage() {
  const { id } = useParams()
  const { refreshNewOrderAlerts } = useAuth()
  const [order, setOrder] = useState(null)
  const [clientAccount, setClientAccount] = useState(null)
  const [sharedAccount, setSharedAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  usePageHeader(order?.order_number ?? 'Order Detail', order ? formatDate(order.created_at) : undefined)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    api
      .get(`/partner/orders/${id}`)
      .then(({ data }) => {
        setOrder(data.data)
        setClientAccount(data.client_account ?? null)
        // Membuka detail menandai notifikasi "Order Baru" order ini sudah dilihat.
        refreshNewOrderAlerts()
      })
      .catch((err) => setError(err.response?.data?.message || 'Gagal memuat data order.'))
      .finally(() => setLoading(false))
  }, [id, refreshNewOrderAlerts])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  if (loading && !order) return <DetailPageSkeleton />
  if (error) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>

  return (
    <div className="space-y-6">
      <Link
        to="/partner/orders"
        className="animate-fade-up group inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <svg
          className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Kembali ke daftar order
      </Link>

      <section
        className="animate-fade-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white shadow-lg sm:p-6"
        style={{ animationDelay: '60ms' }}
      >
        <div className="animate-blob absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
        <div
          className="animate-blob absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-sky-300/20 blur-2xl"
          style={{ animationDelay: '-4s' }}
        />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-white/15 px-2.5 py-1 font-mono text-sm font-semibold tracking-wider backdrop-blur-sm">
              {order.order_number}
            </span>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-4 text-sm text-white/70">Nilai Order</p>
          <p className="text-3xl font-semibold tracking-tight">
            <AnimatedNumber value={order.order_amount} format={formatCurrency} />
          </p>
          <p className="mt-1 text-sm text-white/80">{order.product_service_name}</p>
          {order.status === 'pending_approval' && (
            <p className="mt-4 inline-flex rounded-lg bg-white/15 px-3 py-1.5 text-xs text-white/90 backdrop-blur-sm">
              Order sedang ditinjau admin. Komisi dihitung setelah order selesai.
            </p>
          )}
        </div>
      </section>

      <OrderTimeline order={order} />

      {order.source !== 'client' && <PartnerPaymentPanel order={order} onUploaded={load} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <InfoCard title="Customer" accent="bg-sky-50 text-sky-600" icon={<CustomerIconPath />} delay={320}>
          <Detail label="Nama" value={order.customer_name} />
          {order.source === 'client' ? (
            <p className="rounded-lg bg-fuchsia-50 px-3 py-2 text-xs leading-relaxed text-fuchsia-800">
              Order ini dibuat client sendiri dengan kode referral kamu. Kontak client hanya bisa dilihat admin.
            </p>
          ) : (
            <>
              <Detail label="Email" value={order.customer_email} />
              <Detail label="Telepon" value={order.customer_phone} />
            </>
          )}
          <Detail label="Catatan" value={order.notes} multiline />
        </InfoCard>

        <ClientAccountCard orderId={order.id} account={clientAccount} onRegenerated={setSharedAccount} delay={400} />

        <CommissionCard order={order} delay={480} title="Komisi Kamu" />
      </div>

      <ClientAccessShareModal
        account={sharedAccount}
        orderNumber={order.order_number}
        onClose={() => setSharedAccount(null)}
      />
    </div>
  )
}

// Status bukti transfer untuk order yang partner buat sendiri. Kalau bukti
// terakhir ditolak admin, partner bisa upload ulang dari sini.
function PartnerPaymentPanel({ order, onUploaded }) {
  const payments = order.payments || []
  if (payments.length === 0) return null

  const latest = payments[0]
  const canReupload = order.status === 'pending_approval' && latest.status === 'rejected'

  return (
    <section className="animate-fade-up space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Pembayaran Client</h2>

      {latest.status === 'waiting_verification' && (
        <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          Bukti transfer sedang diverifikasi admin. Order otomatis dikerjakan setelah pembayaran diterima.
        </p>
      )}

      {canReupload && (
        <>
          <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            Bukti transfer ditolak admin: <strong>{latest.rejection_reason}</strong>. Upload bukti yang benar supaya order
            bisa diproses.
          </p>
          <PaymentUploadForm
            endpoint={`/partner/orders/${order.id}/payments`}
            amount={order.order_amount}
            onUploaded={onUploaded}
            submitLabel="Upload Ulang Bukti"
          />
        </>
      )}

      <div className={canReupload ? 'border-t border-slate-100 pt-4' : ''}>
        <PaymentHistory payments={payments} />
      </div>
    </section>
  )
}
