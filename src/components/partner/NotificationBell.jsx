import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeaderPanel from '../HeaderPanel'
import { MarketingKitIcon, NotificationsIcon, OrdersIcon } from '../icons/NavIcons'
import SegmentedTabs from '../SegmentedTabs'
import { useAuth } from '../../hooks/useAuth'
import api from '../../lib/api'
import { formatCurrency } from '../../lib/format'
import { categoryStyle } from '../../lib/marketingKit'

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
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

// Lonceng partner: 3 kolom - Order Baru (order masuk yang tidak dibuat partner
// sendiri, mis. dari client lewat kode referral), Announcement, dan Marketing Kit.
// Hanya yang BELUM dibaca/dibuka yang ditampilkan. Di HP kolomnya jadi tab.
export default function NotificationBell() {
  const navigate = useNavigate()
  const {
    user,
    unreadNotifications,
    refreshUnreadNotifications,
    unreadMarketingKits,
    refreshUnreadMarketingKits,
    newOrderAlerts,
    refreshNewOrderAlerts,
  } = useAuth()
  const isVerified = user?.partner?.verification_status === 'verified'

  const [open, setOpen] = useState(false)
  const [orders, setOrders] = useState(null)
  const [announcements, setAnnouncements] = useState(null)
  const [kits, setKits] = useState(null)
  const [mobileTab, setMobileTab] = useState('orders')
  const containerRef = useRef(null)
  const panelRef = useRef(null)

  const orderCount = isVerified ? newOrderAlerts || 0 : 0
  const kitCount = isVerified ? unreadMarketingKits || 0 : 0
  const total = orderCount + (unreadNotifications || 0) + kitCount

  const loadAll = async () => {
    const requests = [
      api
        .get('/partner/notifications', { params: { per_page: 10, unread_only: 1 } })
        .then(({ data }) => setAnnouncements(data.data || []))
        .catch(() => setAnnouncements((prev) => prev ?? [])),
    ]
    if (isVerified) {
      requests.push(
        api
          .get('/partner/order-alerts')
          .then(({ data }) => setOrders(data.data || []))
          .catch(() => setOrders((prev) => prev ?? [])),
        api
          .get('/partner/marketing-kits/recent', { params: { unread_only: 1 } })
          .then(({ data }) => setKits(data.data || []))
          .catch(() => setKits((prev) => prev ?? [])),
      )
    }
    await Promise.all(requests)
  }

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next) {
      // Di HP, buka tab pertama yang ada isinya
      if (orderCount) setMobileTab('orders')
      else if (unreadNotifications) setMobileTab('announcement')
      else if (kitCount) setMobileTab('marketing')
      loadAll()
      refreshUnreadNotifications()
      if (isVerified) {
        refreshUnreadMarketingKits()
        refreshNewOrderAlerts()
      }
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

  // Membuka detail order otomatis menandai order itu sudah dilihat (di backend).
  const openOrder = (order) => {
    setOrders((prev) => prev?.filter((o) => o.id !== order.id) ?? prev)
    go(`/partner/orders/${order.id}`)
  }

  const markAllOrdersRead = async () => {
    try {
      await api.post('/partner/order-alerts/read-all')
      setOrders([])
      refreshNewOrderAlerts()
    } catch {
      // Ignore - the badge simply stays until the next attempt.
    }
  }

  const openAnnouncement = async (notification) => {
    try {
      await api.put(`/partner/notifications/${notification.id}/read`)
      setAnnouncements((prev) => prev?.filter((n) => n.id !== notification.id) ?? prev)
      refreshUnreadNotifications()
    } catch {
      // Navigate anyway - marking read is a nice-to-have, not a blocker.
    }
    go('/partner/notifications')
  }

  const openKit = async (kit) => {
    try {
      await api.post(`/partner/marketing-kits/${kit.id}/read`)
      setKits((prev) => prev?.filter((k) => k.id !== kit.id) ?? prev)
      refreshUnreadMarketingKits()
    } catch {
      // Navigate anyway.
    }
    go('/partner/marketing-kit')
  }

  const markAllKitsRead = async () => {
    try {
      await api.post('/partner/marketing-kits/read-all')
      setKits([])
      refreshUnreadMarketingKits()
    } catch {
      // Ignore - the badge simply stays until the next attempt.
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggle}
        className={`relative rounded-lg p-2 transition-colors ${
          open ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`}
        aria-label={`Notifikasi${total ? `, ${total} belum dibaca` : ''}`}
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
        <HeaderPanel anchorRef={containerRef} panelRef={panelRef} maxWidth={900}>
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Notifikasi</p>
              <p className="text-xs text-slate-400">{total > 0 ? `${total} belum dibaca` : 'Semua sudah dibaca 🎉'}</p>
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

          {/* HP: satu kolom per tab */}
          <div className="border-b border-slate-100 px-3 py-2 md:hidden">
            <SegmentedTabs
              tabs={[
                { value: 'orders', label: `Order (${orderCount})` },
                { value: 'announcement', label: `Info (${unreadNotifications || 0})` },
                { value: 'marketing', label: `Kit (${kitCount})` },
              ]}
              value={mobileTab}
              onChange={setMobileTab}
            />
          </div>

          <div className="grid md:grid-cols-3 md:divide-x md:divide-slate-100">
            <Column
              title="Order Baru"
              unread={orderCount}
              accent="bg-emerald-100 text-emerald-600"
              countClass="bg-emerald-500"
              icon={<OrdersIcon />}
              hiddenOnMobile={mobileTab !== 'orders'}
              headerAction={
                orderCount > 0 ? (
                  <button
                    type="button"
                    onClick={markAllOrdersRead}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                  >
                    Tandai dibaca
                  </button>
                ) : null
              }
              footerLabel={isVerified ? 'Lihat semua order' : null}
              onFooter={() => go('/partner/orders')}
              footerClass="text-emerald-700 hover:bg-emerald-50"
            >
              {!isVerified ? (
                <Empty text="Orders terbuka setelah akun kamu diverifikasi admin." locked />
              ) : orders === null ? (
                <LoadingRows />
              ) : orders.length === 0 ? (
                <Empty text="Belum ada order baru dari client." />
              ) : (
                orders.map((order, index) => (
                  <Row
                    key={order.id}
                    index={index}
                    unread
                    onClick={() => openOrder(order)}
                    title={`${order.customer_name} · ${formatCurrency(order.order_amount)}`}
                    subtitle={`${order.order_number} · ${order.product_service_name}`}
                    time={timeAgo(order.created_at)}
                    thumbnail={<OrderThumb />}
                  />
                ))
              )}
            </Column>

            <Column
              title="Announcement"
              unread={unreadNotifications}
              accent="bg-indigo-100 text-indigo-600"
              countClass="bg-indigo-500"
              icon={<NotificationsIcon />}
              hiddenOnMobile={mobileTab !== 'announcement'}
              footerLabel="Lihat semua announcement"
              onFooter={() => go('/partner/notifications')}
            >
              {announcements === null ? (
                <LoadingRows />
              ) : announcements.length === 0 ? (
                <Empty text="Tidak ada announcement yang belum dibaca." />
              ) : (
                announcements.map((notification, index) => (
                  <Row
                    key={notification.id}
                    index={index}
                    unread
                    onClick={() => openAnnouncement(notification)}
                    title={notification.title}
                    subtitle={notification.message}
                    time={timeAgo(notification.created_at)}
                  />
                ))
              )}
            </Column>

            <Column
              title="Marketing Kit"
              unread={kitCount}
              accent="bg-amber-100 text-amber-700"
              countClass="bg-amber-500"
              icon={<MarketingKitIcon />}
              hiddenOnMobile={mobileTab !== 'marketing'}
              headerAction={
                kitCount > 0 ? (
                  <button
                    type="button"
                    onClick={markAllKitsRead}
                    className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 hover:underline"
                  >
                    Tandai dibaca
                  </button>
                ) : null
              }
              footerLabel={isVerified ? 'Buka Marketing Kit' : null}
              onFooter={() => go('/partner/marketing-kit')}
              footerClass="text-amber-700 hover:bg-amber-50"
            >
              {!isVerified ? (
                <Empty text="Marketing Kit terbuka setelah akun kamu diverifikasi admin." locked />
              ) : kits === null ? (
                <LoadingRows />
              ) : kits.length === 0 ? (
                <Empty text="Semua materi promosi sudah kamu buka." />
              ) : (
                kits.map((kit, index) => (
                  <Row
                    key={kit.id}
                    index={index}
                    unread
                    onClick={() => openKit(kit)}
                    title={kit.title}
                    subtitle={kit.category_label}
                    time={timeAgo(kit.published_at)}
                    thumbnail={<KitThumb kit={kit} />}
                  />
                ))
              )}
            </Column>
          </div>
        </HeaderPanel>
      )}
    </div>
  )
}

function OrderThumb() {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 text-white [&>svg]:h-5 [&>svg]:w-5">
      <OrdersIcon />
    </span>
  )
}

function Column({
  title,
  unread,
  accent,
  countClass,
  icon,
  hiddenOnMobile,
  headerAction,
  footerLabel,
  onFooter,
  footerClass = 'text-indigo-600 hover:bg-indigo-50',
  children,
}) {
  return (
    <section className={`animate-fade-up flex-col ${hiddenOnMobile ? 'hidden md:flex' : 'flex'}`}>
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg [&>svg]:h-4 [&>svg]:w-4 ${accent}`}>
          {icon}
        </span>
        <h3 className="flex-1 text-sm font-semibold text-slate-900">{title}</h3>
        {headerAction}
        {unread > 0 && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold text-white ${countClass}`}>{unread}</span>
        )}
      </div>

      <ul className="max-h-72 flex-1 overflow-y-auto px-2 pb-2">{children}</ul>

      {footerLabel && (
        <button
          type="button"
          onClick={onFooter}
          className={`border-t border-slate-100 px-4 py-2.5 text-center text-xs font-semibold ${footerClass}`}
        >
          {footerLabel} &rarr;
        </button>
      )}
    </section>
  )
}

function Row({ index, unread, onClick, title, subtitle, time, thumbnail }) {
  return (
    <li className="animate-fade-up" style={{ animationDelay: `${80 + index * 45}ms` }}>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-slate-50 ${
          unread ? 'bg-blue-50/50' : ''
        }`}
      >
        {thumbnail}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" aria-label="Belum dibaca" />}
            <span className="truncate text-sm font-medium text-slate-900">{title}</span>
          </span>
          <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{subtitle}</span>
          <span className="mt-0.5 block text-[11px] text-slate-400">{time}</span>
        </span>
      </button>
    </li>
  )
}

function KitThumb({ kit }) {
  if (kit.preview_url) {
    return (
      <img src={kit.preview_url} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-slate-200" />
    )
  }
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white [&>svg]:h-5 [&>svg]:w-5"
      style={{ backgroundImage: categoryStyle(kit.category).gradient }}
    >
      <MarketingKitIcon />
    </span>
  )
}

function LoadingRows() {
  return Array.from({ length: 3 }).map((_, i) => (
    <li key={i} className="flex items-center gap-3 px-2 py-2.5">
      <span className="h-9 w-9 animate-pulse rounded-lg bg-slate-100" />
      <span className="flex-1 space-y-1.5">
        <span className="block h-3 w-3/4 animate-pulse rounded bg-slate-100" />
        <span className="block h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
      </span>
    </li>
  ))
}

function Empty({ text, locked }) {
  return (
    <li className="flex flex-col items-center gap-2 px-3 py-8 text-center text-xs text-slate-400">
      {locked && (
        <svg
          className="h-5 w-5 text-amber-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a1.5 1.5 0 0 0 1.5-1.5v-8.25a1.5 1.5 0 0 0-1.5-1.5H6.75a1.5 1.5 0 0 0-1.5 1.5v8.25a1.5 1.5 0 0 0 1.5 1.5Z"
          />
        </svg>
      )}
      {text}
    </li>
  )
}
