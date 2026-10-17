import DashboardLayout from '../DashboardLayout'
import { useAuth } from '../../hooks/useAuth'
import {
  CommissionsIcon,
  DashboardIcon,
  HelpIcon,
  MarketingKitIcon,
  NotificationsIcon,
  OrdersIcon,
  ProfileIcon,
} from '../icons/NavIcons'
import NotificationBell from './NotificationBell'

export default function PartnerLayout() {
  const { user, unreadNotifications, unreadMarketingKits, newOrderAlerts } = useAuth()
  const isVerified = user?.partner?.verification_status === 'verified'

  const navItems = [
    { to: '/partner', label: 'Dashboard', end: true, icon: <DashboardIcon /> },
    {
      to: '/partner/orders',
      label: 'Orders',
      end: false,
      icon: <OrdersIcon />,
      locked: !isVerified,
      badge: newOrderAlerts,
    },
    {
      to: '/partner/commissions',
      label: 'Commissions',
      end: false,
      icon: <CommissionsIcon />,
      locked: !isVerified,
    },
    {
      to: '/partner/notifications',
      label: 'Announcement',
      end: false,
      icon: <NotificationsIcon />,
      badge: unreadNotifications,
    },
    { to: '/partner/profile', label: 'Profile', end: false, icon: <ProfileIcon /> },
    { to: '/partner/help-center', label: 'Help Center', end: false, icon: <HelpIcon /> },
    { section: 'Promosi' },
    {
      to: '/partner/marketing-kit',
      label: 'Marketing Kit',
      end: false,
      icon: <MarketingKitIcon />,
      accent: true,
      locked: !isVerified,
      badge: unreadMarketingKits,
    },
  ]

  return (
    <DashboardLayout
      navItems={navItems}
      brandTitle="Partner Management"
      brandSubtitle="Partner Panel"
      headerRight={<NotificationBell />}
      profileHref="/partner/profile"
    />
  )
}
