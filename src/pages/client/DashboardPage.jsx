import { useState } from 'react'
import { Link } from 'react-router-dom'
import ChangePasswordModal from '../../components/ChangePasswordModal'
import EmailVerificationBanner from '../../components/client/EmailVerificationBanner'
import ListSkeleton from '../../components/ListSkeleton'
import { OrderTimeline } from '../../components/orders/OrderDetailParts'
import Pagination from '../../components/Pagination'
import { useApiList } from '../../hooks/useApiList'
import { useAuth } from '../../hooks/useAuth'
import { usePageHeader } from '../../hooks/usePageHeader'
import { clientOrderStatus } from '../../lib/clientOrderStatus'
import { buildWaLink } from '../../lib/contact'
import { formatCurrency, formatDate } from '../../lib/format'

export default function ClientDashboardPage() {
  const { user, updateUser } = useAuth()
  const firstName = (user?.client?.full_name || user?.name || '').split(' ')[0]
  usePageHeader('Pesanan Saya', `Halo ${firstName}, pantau status pesanan kamu di sini`)

  const { items, meta, loading, error, setFilters, refetch } = useApiList('/client/orders', { page: 1 })
  const [showChangePassword, setShowChangePassword] = useState(false)
  const mustChangePassword = Boolean(user?.must_change_password)

  return (
    <div className="space-y-6">
      <EmailVerificationBanner onVerified={refetch} />

      {mustChangePassword && (
        <div className="animate-fade-up flex flex-col gap-3 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-900">Buat password baru dulu, yuk</p>
            <p className="mt-0.5 text-sm text-amber-800">
              Kamu masih memakai password sementara dari partner. Ganti dengan password pilihanmu sendiri supaya akun
              kamu aman.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowChangePassword(true)}
            className="shrink-0 rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-amber-50 hover:bg-amber-800"
          >
            Ganti Password
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        {error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}

        {loading ? (
          <div className="p-4">
            <ListSkeleton rows={3} />
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-slate-400">Belum ada pesanan.</p>
            <Link
              to="/client/katalog"
              className="mt-3 inline-block rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Lihat Katalog
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((order) => {
              const status = clientOrderStatus(order.status)
              return (
                <li key={order.id} className="space-y-3 px-4 py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <Link
                        to={`/client/orders/${order.id}`}
                        className="block truncate font-medium text-slate-900 hover:text-violet-700 hover:underline"
                      >
                        {order.product_service_name}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {order.order_number} · {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span className="text-sm font-semibold text-slate-900">{formatCurrency(order.order_amount)}</span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>
                  <OrderTimeline order={order} embedded />
                  <div className="flex justify-end">
                    <Link
                      to={`/client/orders/${order.id}`}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        order.status === 'awaiting_payment' && !order.has_waiting_payment
                          ? 'bg-orange-600 text-white hover:bg-orange-700'
                          : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {order.status !== 'awaiting_payment'
                        ? 'Lihat Detail'
                        : order.has_waiting_payment
                          ? 'Menunggu Verifikasi'
                          : 'Bayar Sekarang'}
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <Pagination meta={meta} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} />
      </div>

      <p className="text-center text-sm text-slate-500">
        Ada pertanyaan soal pesanan?{' '}
        <a
          href={buildWaLink(
            `Halo admin Carita Studio, saya ${user?.name} (${user?.email}) ingin bertanya soal pesanan saya.`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-violet-600 hover:underline"
        >
          Hubungi admin via WhatsApp
        </a>
      </p>

      <ChangePasswordModal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSuccess={() => updateUser({ must_change_password: false })}
        title="Buat Password Baru"
        oldPasswordLabel="Password Sementara (dari partner)"
      />
    </div>
  )
}
