import DashboardLayout from '../DashboardLayout'
import { CatalogIcon, DashboardIcon } from '../icons/NavIcons'

export default function ClientLayout() {
  const navItems = [
    {
      to: '/client',
      label: 'Pesanan Saya',
      end: true,
      icon: <DashboardIcon />,
    },
    {
      to: '/client/katalog',
      label: 'Katalog',
      end: false,
      icon: <CatalogIcon />,
    },
  ]

  return <DashboardLayout navItems={navItems} brandTitle="Carita Studio" brandSubtitle="Client Area" />
}
