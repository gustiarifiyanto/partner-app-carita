import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PackageCard, ThemeCard } from '../../components/catalog/CatalogCards'
import { usePageHeader } from '../../hooks/usePageHeader'
import api from '../../lib/api'
import { formatCurrency } from '../../lib/format'

export default function ClientCatalogPage() {
  usePageHeader('Katalog', 'Pilih paket dan tema undangan pernikahan kamu')

  const [packages, setPackages] = useState([])
  const [themes, setThemes] = useState([])
  const [categories, setCategories] = useState({})
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [selectedTheme, setSelectedTheme] = useState(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([api.get('/catalog/packages'), api.get('/catalog/themes')])
      .then(([pkgRes, themeRes]) => {
        if (cancelled) return
        setPackages(pkgRes.data.data)
        setThemes(themeRes.data.data)
        setCategories(themeRes.data.meta?.categories || {})
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Gagal memuat katalog.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const visibleThemes = useMemo(
    () => (category ? themes.filter((t) => t.category === category) : themes),
    [themes, category],
  )

  const tabs = [
    { value: '', label: 'Semua', count: themes.length },
    ...Object.entries(categories).map(([value, label]) => ({
      value,
      label,
      count: themes.filter((t) => t.category === value).length,
    })),
  ].filter((tab) => tab.value === '' || tab.count > 0)

  const toggle = (setter) => (item) => setter((prev) => (prev?.id === item.id ? null : item))

  const orderParams = new URLSearchParams()
  if (selectedPackage) orderParams.set('paket', selectedPackage.slug)
  if (selectedTheme) orderParams.set('tema', selectedTheme.slug)
  const orderHref = `/client/order/baru?${orderParams.toString()}`

  if (error) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>

  return (
    <div className="space-y-8">
      <section className="animate-fade-up space-y-4">
        <h2 className="text-base font-semibold text-slate-900">1. Pilih Paket</h2>
        {loading ? (
          <div className="grid gap-5 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200/70" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 pt-2 md:grid-cols-3">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                selected={selectedPackage?.id === pkg.id}
                onSelect={toggle(setSelectedPackage)}
              />
            ))}
          </div>
        )}
        <p className="text-xs text-slate-500">Harga ditentukan oleh paket. Semua tema bisa dipakai di paket mana pun.</p>
      </section>

      <section className="animate-fade-up space-y-4" style={{ animationDelay: '80ms' }}>
        <h2 className="text-base font-semibold text-slate-900">2. Pilih Tema</h2>

        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex w-max gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setCategory(tab.value)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition ${
                  category === tab.value
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label} <span className="opacity-70">({tab.count})</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[3/5] animate-pulse rounded-xl bg-slate-200/70" />
            ))}
          </div>
        ) : visibleThemes.length === 0 ? (
          <p className="rounded-xl bg-white px-4 py-10 text-center text-sm text-slate-400 ring-1 ring-slate-200">
            Belum ada tema di kategori ini.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visibleThemes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                selected={selectedTheme?.id === theme.id}
                onSelect={toggle(setSelectedTheme)}
              />
            ))}
          </div>
        )}
      </section>

      {(selectedPackage || selectedTheme) && (
        <div className="animate-fade-up sticky bottom-3 z-30 rounded-xl bg-white/95 px-4 py-3 shadow-[0_8px_30px_rgba(15,23,42,0.15)] ring-1 ring-slate-200 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 text-sm">
              <p className="truncate text-slate-900">
                <span className="font-semibold">{selectedPackage?.name || 'Pilih paket'}</span>
                {' · '}
                <span>{selectedTheme?.name || 'Pilih tema'}</span>
              </p>
              <p className="text-xs text-slate-500">
                {selectedPackage ? formatCurrency(selectedPackage.price) : 'Pilih paket'} ·{' '}
                {selectedPackage && selectedTheme ? 'Siap dipesan' : 'Pilih paket & tema dulu'}
              </p>
            </div>
            <Link
              to={orderHref}
              className="shrink-0 rounded-lg bg-violet-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-violet-700"
            >
              Lanjut Pesan
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
