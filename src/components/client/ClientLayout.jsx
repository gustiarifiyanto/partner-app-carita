import DashboardLayout from '../DashboardLayout'
import { CatalogIcon, DashboardIcon, InvitationIcon } from '../icons/NavIcons'
import TemporaryPasswordPrompt from './TemporaryPasswordPrompt'

export default function ClientLayout() {
  const navItems = [
    {
      to: '/client',
      label: 'Pesanan Saya',
      end: true,
      icon: <DashboardIcon />,
    },
    {
      to: '/client/undangan',
      label: 'Undangan Saya',
      end: false,
      icon: <InvitationIcon />,
    },
    {
      to: '/client/katalog',
      label: 'Katalog',
      end: false,
      icon: <CatalogIcon />,
    },
  ]

  return (
    <DashboardLayout
      navItems={navItems}
      brandTitle="Carita Studio"
      brandSubtitle="Client Area"
      topContent={<TemporaryPasswordPrompt />}
    />
  )
}
