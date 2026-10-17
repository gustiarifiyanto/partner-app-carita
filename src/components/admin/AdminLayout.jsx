import DashboardLayout from '../DashboardLayout'
import AdminNotificationBell from './AdminNotificationBell'
import {
  ActivityLogsIcon,
  CatalogIcon,
  CommissionsIcon,
  DashboardIcon,
  MarketingKitIcon,
  NotificationsIcon,
  OrdersIcon,
  PartnersIcon,
  PaymentsIcon,
  ReportsIcon,
} from '../icons/NavIcons'

// New partners / partner orders / payout requests are surfaced through the
// header bell (AdminNotificationBell), so the nav itself carries no badges.
const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', end: true, icon: <DashboardIcon /> },
  { to: '/admin/partners', label: 'Partners', end: false, icon: <PartnersIcon /> },
  { to: '/admin/orders', label: 'Orders', end: false, icon: <OrdersIcon /> },
  { to: '/admin/payments', label: 'Pembayaran', end: false, icon: <PaymentsIcon /> },
  { to: '/admin/commissions', label: 'Commissions', end: false, icon: <CommissionsIcon /> },
  { to: '/admin/notifications', label: 'Make Notification', end: false, icon: <NotificationsIcon /> },
  { to: '/admin/activity-logs', label: 'Activity Logs', end: false, icon: <ActivityLogsIcon /> },
  { to: '/admin/reports', label: 'Reports', end: false, icon: <ReportsIcon /> },
  { to: '/admin/catalog', label: 'Katalog', end: false, icon: <CatalogIcon /> },
  { section: 'Promosi' },
  { to: '/admin/marketing-kit', label: 'Marketing Kit', end: false, icon: <MarketingKitIcon />, accent: true },
]

export default function AdminLayout() {
  return (
    <DashboardLayout
      navItems={NAV_ITEMS}
      brandTitle="Partner Management"
      brandSubtitle="Admin Panel"
      headerRight={<AdminNotificationBell />}
    />
  )
}
