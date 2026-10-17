import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import logo from '../assets/logo/logo_carita_v4.png'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import PageTransition from './PageTransition'
import UserMenu from './UserMenu'

const COLLAPSE_KEY = 'sidebar-collapsed'

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

export default function DashboardLayout({ navItems, brandTitle, brandSubtitle, headerRight, profileHref }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Desktop-only: shrink the sidebar to an icon rail. Mobile keeps the slide-in drawer.
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [tooltip, setTooltip] = useState(null)
  const [pageHeader, setPageHeader] = useState({ title: '', subtitle: '' })
  const [scrolled, setScrolled] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const toast = useToast()
  const {
    user,
    refreshUnreadNotifications,
    refreshUnreadMarketingKits,
    refreshNewOrderAlerts,
    refreshNewPartners,
    refreshNewPartnerOrders,
    refreshNewCommissions,
  } = useAuth()

  // There's no live push yet, so this is how users pull in new orders,
  // partners, payout requests and announcements without a browser reload:
  // remount the current page (it refetches its data) and re-poll the badges.
  const handleRefresh = () => {
    setRefreshKey((key) => key + 1)
    if (user?.role === 'admin') {
      refreshNewPartners()
      refreshNewPartnerOrders()
      refreshNewCommissions()
    } else if (user?.role === 'partner') {
      refreshUnreadNotifications()
      if (user?.partner?.verification_status === 'verified') {
        refreshUnreadMarketingKits()
        refreshNewOrderAlerts()
      }
    }
    toast.success('Halaman diperbarui.')
  }

  useEffect(() => {
    // Below md, the shell isn't height-locked so the whole document scrolls
    // instead of <main> internally - listen on window too so the sticky
    // header's transparency still reacts to scroll on mobile.
    function handleWindowScroll() {
      setScrolled(window.scrollY > 4)
    }
    window.addEventListener('scroll', handleWindowScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleWindowScroll)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
    } catch {
      // Storage unavailable (private mode etc.) - the toggle still works for this visit.
    }
  }, [collapsed])

  // Ctrl/Cmd + B toggles the sidebar, like most editors.
  useEffect(() => {
    function handleKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setCollapsed((v) => !v)
        setTooltip(null)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((v) => !v)
    setTooltip(null)
  }

  // Text next to icons fades out *before* the rail narrows (and back in only
  // after it has widened), so a half-width label is never visible. Its content
  // has a fixed width inside, so it is clipped invisibly rather than squeezed
  // into "Pa..." mid-animation. Mobile (drawer) always shows labels.
  const fade = `overflow-hidden whitespace-nowrap ${collapsed ? 'md:ml-0 md:max-w-0 md:opacity-0' : ''}`
  const fadeStyle = {
    transition: collapsed
      ? 'opacity 120ms ease-out, max-width 300ms ease-in-out, margin 300ms ease-in-out'
      : 'opacity 180ms ease-in 160ms, max-width 300ms ease-in-out, margin 300ms ease-in-out',
  }

  // Tooltips live outside the <aside> (which clips overflow) and are placed
  // next to the hovered icon - only while the rail is collapsed.
  const showTooltip = (label) => (e) => {
    if (!collapsed) return
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      label,
      top: rect.top + rect.height / 2,
      left: rect.right + 10,
    })
  }
  const hideTooltip = () => setTooltip(null)

  return (
    <div className="min-h-screen bg-slate-50 md:flex md:h-screen md:overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col overflow-hidden border-r border-black/5 transition-[transform,width] duration-300 ease-in-out md:static md:z-auto md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'md:w-[72px]' : 'md:w-64'}`}
        style={{
          backgroundImage: 'linear-gradient(195deg, #FDFBF4 0%, #F0E4C7 100%)',
        }}
      >
        <div className="flex items-center justify-between py-5 pr-4 pl-[18px]">
          <div className="flex min-w-0 items-center">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white p-1 shadow-sm ring-1 ring-slate-900/5">
              <img src={logo} alt="" className="h-full w-full object-contain" />
            </span>
            <div className={`ml-2.5 max-w-48 ${fade}`} style={fadeStyle}>
              <div className="w-40">
                <p className="truncate text-sm font-semibold text-slate-800">{brandTitle}</p>
                <p className="truncate text-xs text-amber-800/60">{brandSubtitle}</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-amber-800/50 hover:bg-black/5 hover:text-slate-800 md:hidden"
            aria-label="Tutup menu"
          >
            &#x2715;
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-x-hidden overflow-y-auto px-3 py-3">
          {navItems.map((item) =>
            item.section ? (
              // Penanda seksi (mis. "Promosi"): label kecil + garis emas. Saat
              // sidebar diciutkan hanya garisnya yang tampil.
              <div key={`section-${item.section}`} className="flex items-center gap-2 px-3.5 pt-4 pb-1">
                <span
                  className={`text-[10px] font-bold tracking-[0.18em] text-amber-700/80 uppercase ${fade}`}
                  style={fadeStyle}
                >
                  {item.section}
                </span>
                <span className="h-px flex-1 bg-gradient-to-r from-amber-400/60 to-transparent" />
              </div>
            ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => {
                setSidebarOpen(false)
                hideTooltip()
              }}
              onMouseEnter={showTooltip(item.label)}
              onMouseLeave={hideTooltip}
              aria-label={collapsed ? item.label : undefined}
              style={({ isActive }) =>
                isActive
                  ? {
                      backgroundImage: item.accent
                        ? 'linear-gradient(90deg, #D97706 0%, #B45309 100%)'
                        : 'linear-gradient(90deg, #7C3AED 0%, #2563EB 100%)',
                    }
                  : undefined
              }
              className={({ isActive }) =>
                `flex items-center rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  isActive
                    ? `text-white shadow-md ${item.accent ? 'shadow-amber-900/25' : 'shadow-blue-950/20'}`
                    : item.accent
                      ? 'bg-amber-100/60 text-amber-900 ring-1 ring-amber-300/50 hover:bg-amber-100'
                      : 'text-slate-600 hover:bg-black/5 hover:text-slate-900'
                }`
              }
            >
              <span className="relative shrink-0">
                {item.icon}
                {item.badge > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 hidden h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white transition-transform duration-300 md:block ${
                      collapsed ? 'md:scale-100' : 'md:scale-0'
                    }`}
                  />
                )}
              </span>
              <span className={`-my-1 ml-3 max-w-48 py-1 ${fade}`} style={fadeStyle}>
                <span className="flex w-[164px] items-center gap-2 pr-0.5">
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.locked && (
                    <svg
                      className="h-3.5 w-3.5 shrink-0 opacity-60"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-label="Terkunci"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a1.5 1.5 0 0 0 1.5-1.5v-8.25a1.5 1.5 0 0 0-1.5-1.5H6.75a1.5 1.5 0 0 0-1.5 1.5v8.25a1.5 1.5 0 0 0 1.5 1.5Z"
                      />
                    </svg>
                  )}
                  {item.badge > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </span>
              </span>
            </NavLink>
            ),
          )}
        </nav>

        <div className="shrink-0 border-t border-black/5 px-3 py-3">
          <button
            type="button"
            onClick={toggleCollapsed}
            onMouseEnter={showTooltip('Tampilkan menu (Ctrl+B)')}
            onMouseLeave={hideTooltip}
            title={collapsed ? undefined : 'Sembunyikan menu (Ctrl+B)'}
            className="hidden w-full items-center rounded-lg px-3.5 py-2 text-sm font-medium text-slate-500 hover:bg-black/5 hover:text-slate-900 md:flex"
            aria-label={collapsed ? 'Tampilkan menu' : 'Sembunyikan menu'}
            aria-expanded={!collapsed}
          >
            <svg
              className={`h-5 w-5 shrink-0 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m18.75 4.5-7.5 7.5 7.5 7.5m-6-15L5.25 12l7.5 7.5" />
            </svg>
            <span className={`ml-3 max-w-48 text-left ${fade}`} style={fadeStyle}>
              Sembunyikan menu
            </span>
          </button>

          <div
            className={`overflow-hidden text-center ${collapsed ? 'max-h-24 md:max-h-0 md:opacity-0' : 'max-h-24'}`}
            style={{
              transition: collapsed
                ? 'opacity 120ms ease-out, max-height 300ms ease-in-out'
                : 'opacity 180ms ease-in 160ms, max-height 300ms ease-in-out',
            }}
          >
            <div className="w-58 pt-2">
              <p className="text-xs font-medium whitespace-nowrap text-slate-600">Created by LookCreative Studio</p>
              <p className="text-[11px] whitespace-nowrap text-amber-800/60">Best Creative Support</p>
              <p className="mt-1 text-[11px] whitespace-nowrap text-amber-800/50">Version 1.0.0 &middot; 2026</p>
            </div>
          </div>
        </div>
      </aside>

      {tooltip && (
        <div
          role="tooltip"
          className="animate-toast-in pointer-events-none fixed z-[60] hidden rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white shadow-lg md:block"
          style={{
            top: tooltip.top,
            left: tooltip.left,
            marginTop: '-0.875rem',
          }}
        >
          {tooltip.label}
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col md:overflow-hidden">
        <main
          className="flex-1 md:overflow-y-auto"
          style={{
            backgroundImage: 'linear-gradient(180deg, #F8FAFF 0%, #F5F3FF 100%)',
          }}
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
        >
          <div
            data-app-header
            className={`sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 transition-all duration-200 md:px-8 ${
              scrolled
                ? 'border-b border-slate-200/60 bg-white/70 shadow-sm backdrop-blur-md'
                : 'border-b border-slate-200 bg-white shadow-sm'
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
                aria-label="Buka menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold text-slate-900 md:text-xl">{pageHeader.title}</h1>
                {pageHeader.subtitle && (
                  <p className="truncate text-xs text-slate-500 md:text-sm">{pageHeader.subtitle}</p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {headerRight}
              <UserMenu profileHref={profileHref} onRefresh={handleRefresh} />
            </div>
          </div>

          <div className="px-4 py-6 sm:px-6 md:px-8 md:py-8">
            <PageTransition refreshKey={refreshKey}>
              <Outlet context={{ setPageHeader }} />
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  )
}
