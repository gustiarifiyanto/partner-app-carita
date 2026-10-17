import { useEffect, useState } from 'react'
import NewestPartnersCard from '../../components/admin/NewestPartnersCard'
import TopPerformersCard from '../../components/admin/TopPerformersCard'
import {
  CheckCircleIcon,
  ClockIcon,
  PercentIcon,
  RevenueIcon,
  ShieldCheckIcon,
  WalletIcon,
} from '../../components/icons/HelpIcons'
import { PartnersIcon } from '../../components/icons/NavIcons'
import MetricCard from '../../components/MetricCard'
import StatCardSkeleton from '../../components/StatCardSkeleton'
import { usePageHeader } from '../../hooks/usePageHeader'
import api from '../../lib/api'
import { formatCurrency } from '../../lib/format'

export default function DashboardPage() {
  usePageHeader('Dashboard', 'Ringkasan performa partner & komisi')

  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    api
      .get('/admin/dashboard')
      .then(({ data: body }) => {
        if (!cancelled) setData(body.data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Gagal memuat dashboard.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  const { metrics, top_performers: topPerformers, newest_partners: newestPartners } = data

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <MetricCard
          label="Total Partner"
          value={metrics.total_partners}
          icon={<PartnersIcon />}
          gradient="linear-gradient(135deg, #60A5FA, #2563EB)"
        />
        <MetricCard
          label="Terverifikasi"
          value={metrics.verified_partners}
          icon={<ShieldCheckIcon />}
          gradient="linear-gradient(135deg, #34D399, #059669)"
        />
        <MetricCard
          label="Menunggu Verifikasi"
          value={metrics.pending_partners}
          icon={<ClockIcon />}
          gradient="linear-gradient(135deg, #FBBF24, #D97706)"
        />
        <MetricCard
          label="Partner Aktif"
          value={metrics.active_partners}
          icon={<CheckCircleIcon />}
          gradient="linear-gradient(135deg, #818CF8, #4F46E5)"
        />
        <MetricCard
          label="Total Revenue"
          value={formatCurrency(metrics.total_revenue)}
          icon={<RevenueIcon />}
          gradient="linear-gradient(135deg, #22D3EE, #0284C7)"
        />
        <MetricCard
          label="Total Komisi"
          value={formatCurrency(metrics.total_commission)}
          icon={<PercentIcon />}
          gradient="linear-gradient(135deg, #A78BFA, #7C3AED)"
        />
        <MetricCard
          label="Komisi Terbayar"
          value={formatCurrency(metrics.total_paid_commission)}
          icon={<WalletIcon />}
          gradient="linear-gradient(135deg, #2DD4BF, #0D9488)"
        />
        <MetricCard
          label="Komisi Belum Dibayar"
          value={formatCurrency(metrics.total_unpaid_commission)}
          icon={<WalletIcon />}
          gradient="linear-gradient(135deg, #FB7185, #DC2626)"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopPerformersCard performers={topPerformers} />
        <NewestPartnersCard partners={newestPartners} />
      </div>
    </div>
  )
}
