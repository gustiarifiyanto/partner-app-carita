import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeaderPanel from '../HeaderPanel'
import { NotificationsIcon } from '../icons/NavIcons'
import PartnerAvatar from '../PartnerAvatar'
import SegmentedTabs from '../SegmentedTabs'
import { useAuth } from '../../hooks/useAuth'
import api from '../../lib/api'
import { formatCurrency } from '../../lib/format'

function timeAgo(value) {
  if (!value) return ''
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return 'baru saja'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} hari lalu`
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(value))
}

const INVITATION_KIND = {
  self_submit: 'Self Editing · ajukan terbit',
  self_revision: 'Self Editing · revisi setelah terbit',
  data_submitted: 'Data undangan dikirim',
  mode_switch: 'Minta pindah ke Admin Editing',
}

// The kinds of things waiting on an admin, each with its own column.
const COLUMNS = [
  {
    key: 'new_partners',
    title: 'Partner Baru',
    empty: 'Tidak ada partner menunggu verifikasi.',
    accent: 'bg-sky-100 text-sky-600',
    countClass: 'bg-sky-500',
    seeAll: '/admin/partners',
    icon: 'M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z',
    toItem: (partner) => ({
      id: partner.id,
      partner,
      title: partner.company_name,
      subtitle: `${partner.user?.name ?? '-'} · menunggu verifikasi`,
      time: partner.created_at,
      href: `/admin/partners/${partner.id}`,
    }),
  },
  {
    key: 'new_orders',
    title: 'Order Baru',
    empty: 'Tidak ada order baru dari partner atau client.',
    accent: 'bg-violet-100 text-violet-600',
    countClass: 'bg-violet-500',
    seeAll: '/admin/orders',
    icon: 'M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z',
    toItem: (order) => ({
      id: order.id,
      partner: order.partner,
      title: `${order.order_number} · ${formatCurrency(order.order_amount)}`,
      // Order client: belum dibayar; partner (kalau ada) dari kode referral.
      subtitle:
        order.source === 'client'
          ? `Client · ${order.customer_name} · menunggu pembayaran`
          : `${order.partner?.company_name ?? '-'} · ${order.customer_name}`,
      time: order.created_at,
      href: `/admin/orders/${order.id}`,
    }),
  },
  {
    key: 'client_payments',
    title: 'Bukti Bayar',
    empty: 'Tidak ada bukti bayar client yang menunggu verifikasi.',
    accent: 'bg-amber-100 text-amber-600',
    countClass: 'bg-amber-500',
    seeAll: '/admin/payments',
    icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z',
    toItem: (payment) => ({
      id: payment.id,
      partner: null,
      title: `${payment.order?.order_number ?? '-'} · ${formatCurrency(payment.amount)}`,
      subtitle: `${payment.order?.customer_name ?? '-'} · menunggu verifikasi`,
      time: payment.created_at,
      href: `/admin/orders/${payment.order_id}`,
    }),
  },
  {
    key: 'invitation_requests',
    title: 'Undangan',
    empty: 'Tidak ada data atau pengajuan undangan yang menunggu.',
    accent: 'bg-fuchsia-100 text-fuchsia-600',
    countClass: 'bg-fuchsia-500',
    seeAll: '/admin/orders',
    icon: 'M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 0 0 1.183 1.981l6.478 3.488m8.839 2.51-4.66-2.51m0 0-1.023-.55a2.25 2.25 0 0 0-2.134 0l-1.022.55m0 0-4.661 2.51m16.5 1.615a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V8.844a2.25 2.25 0 0 1 1.183-1.981l7.5-4.039a2.25 2.25 0 0 1 2.134 0l7.5 4.039a2.25 2.25 0 0 1 1.183 1.98V19.5Z',
    toItem: (request) => ({
      id: request.order_id,
      partner: request.partner,
      title: `${request.order_number ?? '-'} · ${request.customer_name ?? '-'}`,
      subtitle: INVITATION_KIND[request.kind] ?? 'Undangan',
      time: request.requested_at,
      href: `/admin/orders/${request.order_id}`,
    }),
  },
  {
    key: 'payment_requests',
    title: 'Pengajuan Komisi',
    empty: 'Tidak ada pengajuan pencairan.',
    accent: 'bg-emerald-100 text-emerald-600',
    countClass: 'bg-emerald-500',
    seeAll: '/admin/commissions',
    icon: 'M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z',
    toItem: (request) => ({
      id: request.partner.id,
      partner: request.partner,
      title: request.partner.company_name,
      subtitle: `Minta cair ${formatCurrency(request.pending_amount)}`,
      time: request.requested_at,
      href: '/admin/commissions',
    }),
  },
]

export default function AdminNotificationBell() {
  const navigate = useNavigate()
  const {
    newPartners,
    newPartnerOrders,
    newCommissions,
    newClientPayments,
    newInvitationRequests,
    refreshNewPartners,
    refreshNewPartnerOrders,
    refreshNewCommissions,
    refreshNewClientPayments,
  } = useAuth()
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState(null)
  const [mobileTab, setMobileTab] = useState('new_partners')
  const containerRef = useRef(null)
  const panelRef = useRef(null)

  const total =
    (newPartners || 0) +
    (newPartnerOrders || 0) +
    (newCommissions || 0) +
    (newClientPayments || 0) +
    (newInvitationRequests || 0)

  const loadAlerts = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/alerts')
      setAlerts(data.data)
    } catch {
      // Keep whatever was shown last - the panel isn't worth an error toast.
    }
  }, [])

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next) {
      loadAlerts()
      refreshNewPartners()
      refreshNewPartnerOrders()
      refreshNewCommissions()
      refreshNewClientPayments()
    }
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return
      setOpen(false)
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const go = (href) => {
    setOpen(false)
    navigate(href)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggle}
        className={`relative rounded-lg p-2 transition-colors ${
          open ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`}
        aria-label={`Notifikasi admin${total ? `, ${total} menunggu` : ''}`}
        aria-expanded={open}
      >
        <span className={`block ${total > 0 && !open ? 'animate-bell-ring' : ''}`}>
          <NotificationsIcon />
        </span>
        {total > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {open && (
        <HeaderPanel anchorRef={containerRef} panelRef={panelRef} maxWidth={1280}>
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Notifikasi</p>
              <p className="text-xs text-slate-400">
                {total > 0 ? `${total} hal menunggu tindakan Anda` : 'Semua sudah ditangani 🎉'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Tutup notifikasi"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile: one column at a time behind tabs. */}
          <div className="border-b border-slate-100 px-3 py-2 md:hidden">
            <SegmentedTabs
              tabs={COLUMNS.map((col) => ({
                value: col.key,
                label: `${col.title.split(' ')[0]} (${alerts?.[col.key]?.count ?? 0})`,
              }))}
              value={mobileTab}
              onChange={setMobileTab}
            />
          </div>

          <div className="grid md:grid-cols-5 md:divide-x md:divide-slate-100">
            {COLUMNS.map((col, colIndex) => (
              <AlertColumn
                key={col.key}
                column={col}
                data={alerts?.[col.key]}
                loading={!alerts}
                hiddenOnMobile={mobileTab !== col.key}
                delay={colIndex * 70}
                onNavigate={go}
              />
            ))}
          </div>
        </HeaderPanel>
      )}
    </div>
  )
}

function AlertColumn({ column, data, loading, hiddenOnMobile, delay, onNavigate }) {
  const items = (data?.items ?? []).map(column.toItem)
  const count = data?.count ?? 0

  return (
    <section className={`animate-fade-up flex flex-col ${hiddenOnMobile ? 'hidden md:flex' : 'flex'}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${column.accent}`}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d={column.icon} />
          </svg>
        </span>
        <h3 className="flex-1 text-sm font-semibold text-slate-900">{column.title}</h3>
        {count > 0 && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold text-white ${column.countClass}`}>{count}</span>
        )}
      </div>

      <ul className="max-h-72 flex-1 overflow-y-auto px-2 pb-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 px-2 py-2.5">
              <span className="h-8 w-8 animate-pulse rounded-full bg-slate-100" />
              <span className="flex-1 space-y-1.5">
                <span className="block h-3 w-3/4 animate-pulse rounded bg-slate-100" />
                <span className="block h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
              </span>
            </li>
          ))
        ) : items.length === 0 ? (
          <li className="px-3 py-8 text-center text-xs text-slate-400">{column.empty}</li>
        ) : (
          items.map((item, index) => (
            <li key={item.id} className="animate-fade-up" style={{ animationDelay: `${delay + 80 + index * 45}ms` }}>
              <button
                type="button"
                onClick={() => onNavigate(item.href)}
                className="flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-slate-50"
              >
                <PartnerAvatar partner={item.partner ?? { id: item.id }} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900">{item.title}</span>
                  <span className="block truncate text-xs text-slate-500">{item.subtitle}</span>
                  <span className="mt-0.5 block text-[11px] text-slate-400">{timeAgo(item.time)}</span>
                </span>
              </button>
            </li>
          ))
        )}
      </ul>

      <button
        type="button"
        onClick={() => onNavigate(column.seeAll)}
        className="border-t border-slate-100 px-4 py-2.5 text-center text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
      >
        {count > items.length ? `Lihat semua (${count})` : 'Buka halaman'} &rarr;
      </button>
    </section>
  )
}
