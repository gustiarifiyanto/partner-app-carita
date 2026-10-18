import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import CancelOrderModal from '../../components/admin/CancelOrderModal'
import DeleteOrderModal from '../../components/admin/DeleteOrderModal'
import AnimatedNumber from '../../components/AnimatedNumber'
import ConfirmDialog from '../../components/ConfirmDialog'
import DetailPageSkeleton from '../../components/DetailPageSkeleton'
import FormField from '../../components/FormField'
import {
  CommissionCard,
  CustomerIconPath,
  Detail,
  InfoCard,
  OrderTimeline,
} from '../../components/orders/OrderDetailParts'
import PartnerAvatar from '../../components/PartnerAvatar'
import StatusBadge from '../../components/StatusBadge'
import api from '../../lib/api'
import { formatCurrency, formatDate } from '../../lib/format'
import { fieldClass } from '../../lib/formStyles'
import { useAuth } from '../../hooks/useAuth'
import { usePageHeader } from '../../hooks/usePageHeader'
import { useToast } from '../../hooks/useToast'
import { ORDER_SOURCES } from '../../lib/orderSources'
import PaymentReviewActions from '../../components/admin/PaymentReviewActions'
import InvitationDataPanel from '../../components/admin/InvitationDataPanel'
import InvitationLinkPanel from '../../components/admin/InvitationLinkPanel'
import InvitationReminderCard from '../../components/orders/InvitationReminderCard'
import { PaymentHistory } from '../../components/payments/PaymentParts'

const EDIT_FIELDS = [
  ['customer_name', 'Nama Customer'],
  ['customer_email', 'Email Customer'],
  ['customer_phone', 'Telepon Customer'],
  ['product_service_name', 'Produk/Jasa'],
  ['order_amount', 'Nilai Order'],
  ['notes', 'Catatan'],
]

export default function OrderDetailPage() {
  const toast = useToast()
  const { refreshNewPartnerOrders } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [reminder, setReminder] = useState(null)
  const [invitationLink, setInvitationLink] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  // 'approve' | 'complete' | null - pop-up konfirmasi yang sedang terbuka
  const [confirmAction, setConfirmAction] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [formErrors, setFormErrors] = useState({})

  usePageHeader(
    order?.order_number ?? 'Order Detail',
    order ? `${order.partner?.company_name || 'Direct Sale'} · ${formatDate(order.created_at)}` : undefined,
  )

  const load = useCallback(() => {
    setLoading(true)
    setLoadError('')
    api
      .get(`/admin/orders/${id}`)
      .then(({ data }) => {
        setOrder(data.data)
        setForm(data.data)
        setReminder(data.invitation_reminder ?? null)
        setInvitationLink(data.invitation_link ?? null)
      })
      .catch((err) => setLoadError(err.response?.data?.message || 'Gagal memuat data order.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const handleApprove = async () => {
    setBusy(true)
    setActionError('')
    try {
      await api.put(`/admin/orders/${id}/approve`)
      setConfirmAction(null)
      load()
      refreshNewPartnerOrders()
      toast.success('Order di-approve dan sekarang sedang dikerjakan.')
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal meng-approve order.'
      setConfirmAction(null)
      setActionError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  const handleComplete = async () => {
    setBusy(true)
    setActionError('')
    try {
      await api.put(`/admin/orders/${id}/complete`)
      setConfirmAction(null)
      load()
      toast.success('Order berhasil diselesaikan, komisi telah dihitung.')
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal menyelesaikan order.'
      setConfirmAction(null)
      setActionError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setFormErrors({})
    setBusy(true)
    try {
      await api.put(`/admin/orders/${id}`, form)
      setEditing(false)
      load()
      toast.success('Perubahan order berhasil disimpan.')
    } catch (err) {
      if (err.response?.status === 422) {
        setFormErrors(err.response.data.errors || {})
      } else {
        const message = err.response?.data?.message || 'Gagal mengupdate order.'
        setActionError(message)
        toast.error(message)
      }
    } finally {
      setBusy(false)
    }
  }

  // Only show the skeleton on the first load; reloads after approve/complete/
  // cancel keep the page on screen so it doesn't flash.
  if (loading && !order) return <DetailPageSkeleton />
  if (loadError) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{loadError}</p>

  const canDelete = order.status !== 'completed'
  const payments = order.payments || []
  const waitingPayment = payments.find((p) => p.status === 'waiting_verification')
  // Order dengan bukti bayar di-approve lewat "Terima" di panel Pembayaran.
  const approveViaPayment = payments.length > 0 && !payments.some((p) => p.status === 'paid')
  const commissionRate = Number(order.partner?.commission_rate ?? 0)
  const estimatedCommission = order.partner ? (Number(order.order_amount) * commissionRate) / 100 : 0
  // Order katalog baru bisa diselesaikan setelah client mengirim data undangan.
  const waitingInvitationData = ['choose_mode', 'waiting_data'].includes(order.invitation_data_status)

  return (
    <div className="space-y-6">
      <Link
        to="/admin/orders"
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

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
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
            <p className="mt-1 text-xs text-white/70">
              Asal order: {ORDER_SOURCES[order.source]?.label || 'Admin'}
              {order.referral_code_used ? ` · Kode referral ${order.referral_code_used}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {order.status === 'pending_approval' && (
              <>
                {!approveViaPayment && (
                  <HeroButton onClick={() => setConfirmAction('approve')} disabled={busy} primary>
                    Approve
                  </HeroButton>
                )}
                <HeroButton onClick={() => setEditing((v) => !v)} active={editing}>
                  {editing ? 'Batal Edit' : 'Edit'}
                </HeroButton>
              </>
            )}
            {order.status === 'confirmed' && (
              <HeroButton
                onClick={() => setConfirmAction('complete')}
                disabled={busy || waitingInvitationData}
                primary
                title={waitingInvitationData ? 'Menunggu client mengirim data undangan' : undefined}
              >
                {waitingInvitationData ? 'Menunggu Data Client' : 'Selesaikan Order'}
              </HeroButton>
            )}
            {['awaiting_payment', 'pending_approval', 'confirmed'].includes(order.status) && (
              <HeroButton onClick={() => setShowCancel(true)} disabled={busy}>
                Batalkan
              </HeroButton>
            )}
            {canDelete && (
              <HeroButton onClick={() => setShowDelete(true)} disabled={busy} danger>
                Hapus
              </HeroButton>
            )}
          </div>
        </div>
      </section>

      {actionError && (
        <p className="animate-error-in rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{actionError}</p>
      )}

      <OrderTimeline order={order} />

      <InvitationReminderCard
        reminder={reminder}
        endpoint={`/admin/orders/${order.id}/invitation/remind`}
        orderNumber={order.order_number}
        senderName="Admin Carita Studio"
        onUpdated={setReminder}
      />

      <InvitationLinkPanel
        key={invitationLink?.url ?? 'new'}
        order={order}
        link={invitationLink}
        onSaved={() => load()}
        onUpdated={setInvitationLink}
      />

      <InvitationDataPanel order={order} onChanged={load} />

      {payments.length > 0 && (
        <section className="animate-fade-up space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Pembayaran</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {waitingPayment
                  ? 'Cek mutasi rekening. Terima = order langsung masuk tahap pengerjaan.'
                  : approveViaPayment
                    ? 'Menunggu bukti transfer baru dari pengirim.'
                    : 'Pembayaran order ini sudah lunas.'}
              </p>
            </div>
            {waitingPayment && (
              <PaymentReviewActions
                payment={waitingPayment}
                orderNumber={order.order_number}
                onDone={() => {
                  load()
                  refreshNewPartnerOrders()
                }}
              />
            )}
          </div>
          <PaymentHistory payments={payments} showUploader />
        </section>
      )}

      {editing ? (
        <form
          onSubmit={handleEditSubmit}
          className="animate-fade-up space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        >
          <h3 className="text-sm font-semibold text-slate-900">Edit Order</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {EDIT_FIELDS.map(([field, label]) => (
              <FormField key={field} label={label} error={formErrors[field]}>
                <input
                  value={form[field] ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
                  className={fieldClass(formErrors[field])}
                />
              </FormField>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {busy ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <InfoCard title="Customer" accent="bg-sky-50 text-sky-600" icon={<CustomerIconPath />} delay={320}>
            <Detail label="Nama" value={order.customer_name} />
            <Detail label="Email" value={order.customer_email} />
            <Detail label="Telepon" value={order.customer_phone} />
            <Detail label="Catatan" value={order.notes} multiline />
          </InfoCard>

          <InfoCard title="Partner" accent="bg-violet-50 text-violet-600" icon={PARTNER_ICON} delay={400}>
            {order.partner ? (
              <Link
                to={`/admin/partners/${order.partner.id}`}
                className="group mb-3 flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-violet-200 hover:bg-violet-50/50"
              >
                <PartnerAvatar partner={order.partner} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900 group-hover:text-violet-700">
                    {order.partner.company_name}
                  </p>
                  <p className="truncate text-xs text-slate-500">{order.partner.user?.email}</p>
                </div>
              </Link>
            ) : (
              <p className="mb-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                Direct Sale &mdash; order tanpa partner.
              </p>
            )}
            <Detail label="Dibuat oleh" value={order.created_by?.name} />
            <Detail label="Di-approve oleh" value={order.approved_by?.name} />
          </InfoCard>

          <CommissionCard order={order} delay={480} />
        </div>
      )}

      <ConfirmDialog
        open={confirmAction === 'approve'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleApprove}
        loading={busy}
        tone="indigo"
        title="Setujui Order Ini?"
        description="Order akan dikonfirmasi dan masuk tahap pengerjaan."
        confirmLabel="Ya, Approve"
        loadingLabel="Menyetujui..."
        icon={<path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />}
      >
        <OrderSummary order={order} />
        <p className="mt-3 text-center text-xs text-slate-500">
          Setelah di-approve, order tidak bisa diedit lagi. Komisi dihitung saat order diselesaikan.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmAction === 'complete'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleComplete}
        loading={busy}
        tone="emerald"
        title="Selesaikan Order?"
        description="Order ditandai selesai dan komisi partner dihitung otomatis."
        confirmLabel="Ya, Selesaikan"
        loadingLabel="Menyelesaikan..."
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        }
      >
        <OrderSummary order={order}>
          <SummaryRow
            label={order.partner ? `Komisi partner (${commissionRate}%)` : 'Komisi partner'}
            value={order.partner ? formatCurrency(estimatedCommission) : 'Direct Sale, tanpa komisi'}
            highlight
          />
        </OrderSummary>
        <p className="mt-3 text-center text-xs text-slate-500">Tindakan ini tidak bisa dibatalkan.</p>
      </ConfirmDialog>

      <CancelOrderModal
        open={showCancel}
        onClose={() => setShowCancel(false)}
        onCancelled={() => {
          setShowCancel(false)
          load()
          refreshNewPartnerOrders()
        }}
        orderId={id}
      />

      <DeleteOrderModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onDeleted={() => {
          refreshNewPartnerOrders()
          navigate('/admin/orders', { replace: true })
        }}
        order={order}
      />
    </div>
  )
}

const PARTNER_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
  />
)

// Ringkasan order di dalam pop-up konfirmasi.
function OrderSummary({ order, children }) {
  return (
    <dl className="divide-y divide-slate-100 rounded-xl bg-slate-50 px-4 text-sm ring-1 ring-slate-200">
      <SummaryRow label="No. Order" value={<span className="font-mono tracking-wider">{order.order_number}</span>} />
      <SummaryRow label="Customer" value={order.customer_name} />
      <SummaryRow label="Partner" value={order.partner?.company_name || 'Direct Sale'} />
      <SummaryRow label="Produk/Jasa" value={order.product_service_name} />
      <SummaryRow label="Nilai Order" value={formatCurrency(order.order_amount)} />
      {children}
    </dl>
  )
}

function SummaryRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className={`truncate text-right font-semibold ${highlight ? 'text-emerald-600' : 'text-slate-900'}`}>
        {value || '-'}
      </dd>
    </div>
  )
}

function HeroButton({ children, onClick, disabled, primary, danger, active, title }) {
  const style = primary
    ? 'bg-white text-indigo-700 shadow-md hover:shadow-lg'
    : danger
      ? 'bg-red-500/90 text-white hover:bg-red-500'
      : active
        ? 'bg-white/30 text-white ring-1 ring-white/60'
        : 'bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-lg px-3.5 py-2 text-sm font-semibold backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${style}`}
    >
      {children}
    </button>
  )
}
