import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import logoutIcon from '../assets/icon_animated/logout-icon.gif'
import { useAuth } from '../hooks/useAuth'
import { getAvatarSrc } from '../lib/avatarOptions'
import Modal from './Modal'

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

function Avatar({ user, className }) {
  const avatarSrc = user?.partner?.avatar ? getAvatarSrc(user.partner.avatar) : null

  if (avatarSrc) {
    return <img src={avatarSrc} alt="" className={`${className} rounded-full object-cover`} />
  }

  return (
    <span
      className={`flex items-center justify-center rounded-full text-xs font-semibold text-white ${className}`}
      style={{ backgroundImage: 'linear-gradient(135deg, #7C3AED, #2563EB)' }}
    >
      {getInitials(user?.name)}
    </span>
  )
}

export default function UserMenu({ profileHref, onRefresh }) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const containerRef = useRef(null)

  // Spin the icon briefly so the click feels acknowledged, then close the menu.
  const handleRefresh = () => {
    if (refreshing) return
    setRefreshing(true)
    onRefresh()
    setTimeout(() => {
      setRefreshing(false)
      setOpen(false)
    }, 500)
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100"
        aria-label="Menu akun"
      >
        <Avatar user={user} className="h-8 w-8 shrink-0" />
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-[10rem] truncate text-sm font-medium text-slate-900">
            {user?.name}
          </span>
        </span>
        <svg
          className={`hidden h-4 w-4 text-slate-400 transition-transform sm:block ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-200">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
            <Avatar user={user} className="h-10 w-10 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>

          <div className="py-1">
            {profileHref && (
              <Link
                to={profileHref}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
                Profil &amp; Pengaturan
              </Link>
            )}
            {onRefresh && (
              <button
                type="button"
                onClick={handleRefresh}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <svg
                  className={`h-4 w-4 ${refreshing ? 'animate-spin text-indigo-500' : 'text-slate-400'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                {refreshing ? 'Memperbarui...' : 'Refresh Halaman'}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setShowLogoutConfirm(true)
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}

      <Modal open={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} title="Keluar dari Akun?">
        <img src={logoutIcon} alt="" className="mx-auto mb-3 h-20 w-20" />
        <p className="text-sm text-slate-600">
          Apakah kamu yakin ingin keluar dari akun ini? Kamu perlu login kembali untuk mengaksesnya.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(false)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Ya, Keluar
          </button>
        </div>
      </Modal>
    </div>
  )
}
