import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import ListSkeleton from '../../components/ListSkeleton'
import { OrderTimeline } from '../../components/orders/OrderDetailParts'
import { PaymentHistory, PaymentStatusBadge } from '../../components/payments/PaymentParts'
import PaymentUploadForm from '../../components/payments/PaymentUploadForm'
import { useAuth } from '../../hooks/useAuth'
import { usePageHeader } from '../../hooks/usePageHeader'
import { useToast } from '../../hooks/useToast'
import api from '../../lib/api'
import { clientOrderStatus } from '../../lib/clientOrderStatus'
import { buildWaLink } from '../../lib/contact'
import { formatCurrency, formatDate } from '../../lib/format'

export default function ClientOrderDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  usePageHeader('Detail Pesanan', order ? `Pesanan ${order.order_number}` : undefined)

  useEffect(() => {
    let cancelled = false
    api
      .get(`/client/orders/${id}`)
      .then(({ data }) => {
        if (!cancelled) setOrder(data.data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.response?.status === 403 || err.response?.status === 404
              ? 'Pesanan tidak ditemukan.'
              : err.response?.data?.message || 'Gagal memuat pesanan.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const { data } = await api.put(`/client/orders/${id}/cancel`)
      setOrder(data.data)
      toast.success('Pesanan dibatalkan.')
      setConfirmCancel(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan pesanan.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <ListSkeleton rows={4} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        <Link to="/client" className="text-sm font-medium text-violet-600 hover:underline">
          ← Kembali ke Pesanan Saya
        </Link>
      </div>
    )
  }

  const status = clientOrderStatus(order.status)
  const fromClient = order.source === 'client'
  const fullName = user?.client?.full_name || user?.name
  const revisionHref = buildWaLink(
    `Halo Admin Carita, saya ${fullName} ingin bertanya/minta revisi untuk pesanan ${order.order_number} (${order.product_service_name}).`,
  )

  return (
    <div className="space-y-6">
      <Link to="/client" className="inline-block text-sm font-medium text-violet-600 hover:underline">
        ← Pesanan Saya
      </Link>

      <section className="animate-fade-up flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:p-6">
        {order.theme?.thumbnail && (
          <img
            src={order.theme.thumbnail}
            alt={order.theme.name}
            className="h-40 w-full shrink-0 rounded-xl object-cover ring-1 ring-slate-200 sm:h-36 sm:w-28"
          />
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold tracking-wide text-slate-800">
              {order.order_number}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${status.className}`}
            >
              {status.label}
            </span>
          </div>
          <p className="text-lg font-semibold text-slate-900">{order.product_service_name}</p>
          <p className="text-sm text-slate-500">
            Dibuat {formatDate(order.created_at)}
            {order.package?.validity_label ? ` · ${order.package.validity_label}` : ''}
            {order.partner_name ? ` · Referral: ${order.partner_name}` : ''}
          </p>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(order.order_amount)}</p>
          {order.theme?.demo_url && (
            <a
              href={order.theme.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-medium text-violet-600 hover:underline"
            >
              Lihat demo tema
            </a>
          )}
        </div>
      </section>

      <OrderTimeline order={order} />

      {order.package_id && order.status !== 'cancelled' && (
        <Link
          to={`/client/undangan/${order.id}`}
          className="animate-fade-up group flex items-center justify-between gap-3 rounded-2xl bg-violet-50 p-5 ring-1 ring-violet-200 transition hover:bg-violet-100"
        >
          <div>
            <p className="text-sm font-semibold text-violet-900">💌 Data Undangan</p>
            <p className="mt-0.5 text-sm text-violet-800">
              Isi data mempelai & acara supaya undangan bisa dikerjakan.
            </p>
          </div>
          <span className="shrink-0 text-sm font-semibold text-violet-700 group-hover:underline">Buka →</span>
        </Link>
      )}

      <section className="animate-fade-up space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">Pembayaran</h2>
          {order.payment_state === 'paid' && <PaymentStatusBadge status="paid" />}
        </div>

        {order.payment_state === 'waiting_verification' && (
          <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            Bukti transfer kamu sudah kami terima dan sedang diverifikasi admin. Biasanya selesai dalam 1x24 jam.
          </p>
        )}

        {order.payment_state === 'rejected' && order.can_upload_payment && (
          <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            Bukti transfer sebelumnya ditolak: <strong>{order.payments[0]?.rejection_reason}</strong>. Silakan upload
            bukti yang benar.
          </p>
        )}

        {order.can_upload_payment && (
          <>
            <p className="text-sm text-slate-600">
              Selesaikan pembayaran sebelum <strong>{formatDate(order.payment_due_at)}</strong>, lewat dari itu
              pesanan dibatalkan otomatis.
            </p>
            <PaymentUploadForm
              endpoint={`/client/orders/${order.id}/payments`}
              amount={order.order_amount}
              onUploaded={(updated) => setOrder(updated)}
            />
          </>
        )}

        {!fromClient && order.payments.length === 0 && (
          <p className="text-sm text-slate-500">Pembayaran pesanan ini diurus oleh partner/admin.</p>
        )}

        {order.payments.length > 0 && (
          <div className="border-t border-slate-100 pt-4">
            <p className="mb-3 text-xs font-semibold tracking-wide text-slate-400 uppercase">Riwayat Pembayaran</p>
            <PaymentHistory payments={order.payments} />
          </div>
        )}

        {order.can_cancel && (
          <div className="border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="text-sm font-medium text-red-600 hover:underline"
            >
              Batalkan pesanan
            </button>
          </div>
        )}
      </section>

      {order.invitation_url && (
        <section className="animate-fade-up rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
          <p className="text-sm font-semibold text-emerald-900">Undangan kamu sudah siap! 🎉</p>
          <a
            href={order.invitation_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block break-all text-sm font-medium text-emerald-700 hover:underline"
          >
            {order.invitation_url}
          </a>
        </section>
      )}

      <section className="animate-fade-up flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600">
          {fromClient
            ? 'Butuh bantuan atau perubahan untuk pesanan ini?'
            : 'Pesanan ini dibuat lewat partner/admin, jadi paket & tema tidak bisa diubah dari sini. Untuk revisi, hubungi admin.'}
        </div>
        <a
          href={revisionHref}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg border border-emerald-300 px-4 py-2 text-center text-sm font-medium text-emerald-700 hover:bg-emerald-50"
        >
          Minta Revisi via WhatsApp
        </a>
      </section>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={handleCancel}
        loading={cancelling}
        title="Batalkan pesanan?"
        description={`Pesanan ${order.order_number} akan dibatalkan dan tidak bisa dilanjutkan lagi.`}
        confirmLabel="Ya, Batalkan"
        icon={<path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />}
      />
    </div>
  )
}
