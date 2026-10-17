import { useCallback, useEffect, useState } from 'react'
import api from '../lib/api'
import AuthContext from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('auth_user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'))
  // No stored token means there's nothing to re-validate, so start as "not loading".
  const [loading, setLoading] = useState(() => !!localStorage.getItem('auth_token'))
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMarketingKits, setUnreadMarketingKits] = useState(0)
  const [newOrderAlerts, setNewOrderAlerts] = useState(0)
  const [newPartnerOrders, setNewPartnerOrders] = useState(0)
  const [newPartners, setNewPartners] = useState(0)
  const [newCommissions, setNewCommissions] = useState(0)
  const [newClientPayments, setNewClientPayments] = useState(0)

  const persistSession = useCallback((nextToken, nextUser) => {
    setToken(nextToken)
    setUser(nextUser)
    localStorage.setItem('auth_token', nextToken)
    localStorage.setItem('auth_user', JSON.stringify(nextUser))
  }, [])

  const logout = useCallback(async () => {
    try {
      if (localStorage.getItem('auth_token')) {
        await api.post('/auth/logout')
      }
    } catch {
      // Token might already be invalid/expired - clearing local state is what matters.
    } finally {
      setToken(null)
      setUser(null)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      sessionStorage.removeItem('justRegistered')
    }
  }, [])

  // Merge partial fields into the stored user (e.g. must_change_password after changing it).
  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch }
      localStorage.setItem('auth_user', JSON.stringify(next))
      return next
    })
  }, [])

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password })
      persistSession(data.token, data.user)
      return data.user
    },
    [persistSession],
  )

  // Client daftar sendiri: API langsung mengembalikan token (auto-login).
  const registerClient = useCallback(
    async (payload) => {
      const { data } = await api.post('/auth/register-client', payload)
      persistSession(data.token, data.user)
      return data
    },
    [persistSession],
  )

  const refreshUnreadNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/partner/notifications', { params: { per_page: 1 } })
      setUnreadNotifications(data.meta?.unread_count ?? 0)
    } catch {
      // Badge just won't update this cycle - not worth surfacing an error for.
    }
  }, [])

  useEffect(() => {
    // Only partners have a notification inbox to badge; poll periodically so
    // announcements/promos an admin adds show up without a manual refresh.
    if (user?.role !== 'partner') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnreadNotifications(0)
      return
    }

    refreshUnreadNotifications()
    const interval = setInterval(refreshUnreadNotifications, 60000)
    return () => clearInterval(interval)
  }, [user?.role, refreshUnreadNotifications])

  // Marketing Kit hanya untuk partner yang sudah diverifikasi (API-nya terkunci
  // untuk yang belum), jadi hitungan "materi baru" hanya diambil untuk mereka.
  const isVerifiedPartner = user?.role === 'partner' && user?.partner?.verification_status === 'verified'

  const refreshUnreadMarketingKits = useCallback(async () => {
    try {
      const { data } = await api.get('/partner/marketing-kits/recent')
      setUnreadMarketingKits(data.meta?.unread_count ?? 0)
    } catch {
      // Badge just won't update this cycle - not worth surfacing an error for.
    }
  }, [])

  useEffect(() => {
    if (!isVerifiedPartner) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnreadMarketingKits(0)
      return
    }

    refreshUnreadMarketingKits()
    const interval = setInterval(refreshUnreadMarketingKits, 60000)
    return () => clearInterval(interval)
  }, [isVerifiedPartner, refreshUnreadMarketingKits])

  // "Order Baru" partner: order masuk ke akunnya yang tidak ia buat sendiri
  // (dari admin, dan nanti dari client lewat kode referral). Endpoint-nya
  // terkunci untuk partner yang belum diverifikasi.
  const refreshNewOrderAlerts = useCallback(async () => {
    try {
      const { data } = await api.get('/partner/order-alerts')
      setNewOrderAlerts(data.meta?.unread_count ?? 0)
    } catch {
      // Badge just won't update this cycle - not worth surfacing an error for.
    }
  }, [])

  useEffect(() => {
    if (!isVerifiedPartner) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewOrderAlerts(0)
      return
    }

    refreshNewOrderAlerts()
    const interval = setInterval(refreshNewOrderAlerts, 60000)
    return () => clearInterval(interval)
  }, [isVerifiedPartner, refreshNewOrderAlerts])

  const refreshNewPartnerOrders = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/orders', { params: { per_page: 1 } })
      setNewPartnerOrders(data.meta?.pending_partner_orders_count ?? 0)
    } catch {
      // Badge just won't update this cycle - not worth surfacing an error for.
    }
  }, [])

  useEffect(() => {
    // Only admins review the partner order queue; poll periodically so a new
    // order a partner submits shows up without a manual refresh.
    if (user?.role !== 'admin') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewPartnerOrders(0)
      return
    }

    refreshNewPartnerOrders()
    const interval = setInterval(refreshNewPartnerOrders, 60000)
    return () => clearInterval(interval)
  }, [user?.role, refreshNewPartnerOrders])

  const refreshNewPartners = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/partners', { params: { per_page: 1 } })
      setNewPartners(data.meta?.pending_verification_count ?? 0)
    } catch {
      // Badge just won't update this cycle - not worth surfacing an error for.
    }
  }, [])

  useEffect(() => {
    // Only admins review new partner signups; poll periodically so a partner
    // who just registered shows up without a manual refresh.
    if (user?.role !== 'admin') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewPartners(0)
      return
    }

    refreshNewPartners()
    const interval = setInterval(refreshNewPartners, 60000)
    return () => clearInterval(interval)
  }, [user?.role, refreshNewPartners])

  const refreshNewCommissions = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/commissions', { params: { per_page: 1 } })
      setNewCommissions(data.meta?.pending_payment_requests_count ?? 0)
    } catch {
      // Badge just won't update this cycle - not worth surfacing an error for.
    }
  }, [])

  useEffect(() => {
    // Only admins review payout requests; poll periodically so a partner's
    // pencairan request shows up without a manual refresh.
    if (user?.role !== 'admin') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewCommissions(0)
      return
    }

    refreshNewCommissions()
    const interval = setInterval(refreshNewCommissions, 60000)
    return () => clearInterval(interval)
  }, [user?.role, refreshNewCommissions])

  // Bukti bayar order client yang menunggu verifikasi admin (bukti di order
  // partner sudah terhitung lewat "Order Baru").
  const refreshNewClientPayments = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/client-payments', { params: { per_page: 1 } })
      setNewClientPayments(data.meta?.pending_client_order_count ?? 0)
    } catch {
      // Badge just won't update this cycle - not worth surfacing an error for.
    }
  }, [])

  useEffect(() => {
    if (user?.role !== 'admin') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewClientPayments(0)
      return
    }

    refreshNewClientPayments()
    const interval = setInterval(refreshNewClientPayments, 60000)
    return () => clearInterval(interval)
  }, [user?.role, refreshNewClientPayments])

  useEffect(() => {
    // Re-validate the stored token on load so an expired/revoked token doesn't
    // leave the UI stuck showing a "logged in" state the API will reject.
    if (!localStorage.getItem('auth_token')) {
      return
    }

    api
      .get('/auth/me')
      .then(({ data }) => {
        setUser(data.user)
        localStorage.setItem('auth_user', JSON.stringify(data.user))
      })
      .catch(() => {
        setToken(null)
        setUser(null)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        sessionStorage.removeItem('justRegistered')
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        registerClient,
        logout,
        updateUser,
        unreadNotifications,
        refreshUnreadNotifications,
        unreadMarketingKits,
        refreshUnreadMarketingKits,
        newOrderAlerts,
        refreshNewOrderAlerts,
        newPartnerOrders,
        refreshNewPartnerOrders,
        newPartners,
        refreshNewPartners,
        newCommissions,
        refreshNewCommissions,
        newClientPayments,
        refreshNewClientPayments,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
