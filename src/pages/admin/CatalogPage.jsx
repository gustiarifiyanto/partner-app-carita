import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PackageFormModal from '../../components/admin/PackageFormModal'
import ThemeFormModal from '../../components/admin/ThemeFormModal'
import ThemeTemplateModal from '../../components/admin/ThemeTemplateModal'
import WordpressConnectionCard from '../../components/admin/WordpressConnectionCard'
import { PackageCard, ThemeCard } from '../../components/catalog/CatalogCards'
import SearchInput from '../../components/SearchInput'
import SegmentedTabs from '../../components/SegmentedTabs'
import { usePageHeader } from '../../hooks/usePageHeader'
import { useToast } from '../../hooks/useToast'
import api from '../../lib/api'

const VIEW_TABS = [
  { value: 'packages', label: 'Paket' },
  { value: 'themes', label: 'Tema' },
]

const STATUS_TABS = [
  { value: '', label: 'Semua' },
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Nonaktif' },
]

export default function CatalogPage() {
  usePageHeader('Katalog', 'Kelola paket & tema undangan yang tampil ke client')
  const toast = useToast()

  const [view, setView] = useState('packages')
  const [packages, setPackages] = useState([])
  const [themes, setThemes] = useState([])
  const [categories, setCategories] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [packageModal, setPackageModal] = useState(null) // { pkg } | null
  const [themeModal, setThemeModal] = useState(null) // { theme } | null
  const [templateTheme, setTemplateTheme] = useState(null)
  const [modalKey, setModalKey] = useState(0)
  const [togglingId, setTogglingId] = useState(null)

  const load = useCallback(async () => {
    try {
      const [pkgRes, themeRes] = await Promise.all([
        api.get('/admin/catalog/packages'),
        api.get('/admin/catalog/themes'),
      ])
      setPackages(pkgRes.data.data)
      setThemes(themeRes.data.data)
      setCategories(themeRes.data.meta?.categories || {})
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat katalog.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const visibleThemes = useMemo(() => {
    const q = search.trim().toLowerCase()
    return themes.filter(
      (t) =>
        (!category || t.category === category) &&
        (!status || (status === 'active') === t.is_active) &&
        (!q || t.name.toLowerCase().includes(q)),
    )
  }, [themes, category, status, search])

  const categoryTabs = [
    { value: '', label: `Semua jenis (${themes.length})` },
    ...Object.entries(categories).map(([value, label]) => ({
      value,
      label: `${label} (${themes.filter((t) => t.category === value).length})`,
    })),
  ]

  const openPackage = (pkg = null) => {
    setModalKey((k) => k + 1)
    setPackageModal({ pkg })
  }
  const openTheme = (theme = null) => {
    setModalKey((k) => k + 1)
    setThemeModal({ theme })
  }

  const toggle = async (type, item) => {
    setTogglingId(`${type}-${item.id}`)
    try {
      const { data } = await api.put(`/admin/catalog/${type}/${item.id}/toggle`)
      toast.success(data.message)
      const replace = (list) => list.map((x) => (x.id === item.id ? data.data : x))
      if (type === 'packages') setPackages(replace)
      else setThemes(replace)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status.')
    } finally {
      setTogglingId(null)
    }
  }

  const statusBadge = (item) => (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
        item.is_active ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-slate-100 text-slate-500 ring-slate-300'
      }`}
    >
      {item.is_active ? 'Aktif' : 'Nonaktif'}
    </span>
  )

  const editButton = (onEdit, className = '') => (
    <button
      type="button"
      onClick={onEdit}
      className={`rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 ${className}`}
    >
      Edit
    </button>
  )

  const toggleButton = (type, item, className = '') => (
    <button
      type="button"
      disabled={togglingId === `${type}-${item.id}`}
      onClick={() => toggle(type, item)}
      className={`rounded-md border px-2.5 py-1 text-xs font-medium whitespace-nowrap disabled:opacity-50 ${
        item.is_active
          ? 'border-red-200 text-red-600 hover:bg-red-50'
          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
      } ${className}`}
    >
      {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
    </button>
  )

  const renderActions = (type, item, onEdit) => (
    <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
      {statusBadge(item)}
      <div className="flex gap-1.5">
        {editButton(onEdit)}
        {toggleButton(type, item)}
      </div>
    </div>
  )

  // Kartu tema sempit (2 kolom di HP), jadi aksi dipecah 2 baris:
  // jenis + status di atas, tombol Edit/Nonaktifkan selebar kartu di bawah.
  const renderThemeActions = (theme) => (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-xs text-slate-400">{theme.category_label}</p>
        {statusBadge(theme)}
      </div>
      <div className="grid grid-cols-2 gap-1.5 border-t border-slate-100 pt-2.5">
        {editButton(() => openTheme(theme), 'py-1.5')}
        {toggleButton('themes', theme, 'px-1 py-1.5')}
        <button
          type="button"
          onClick={() => setTemplateTheme(theme)}
          className={`col-span-2 rounded-md border px-2.5 py-1.5 text-xs font-medium ${
            theme.has_self_template
              ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              : 'border-dashed border-violet-300 text-violet-700 hover:bg-violet-50'
          }`}
        >
          {theme.has_self_template ? '✓ Template Self Editing' : '+ Template Self Editing'}
        </button>
        <Link
          to={`/admin/catalog/themes/${theme.id}/wordpress`}
          className={`col-span-2 rounded-md border px-2.5 py-1.5 text-center text-xs font-medium ${
            theme.has_wp_template
              ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              : 'border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50'
          }`}
        >
          {theme.has_wp_template ? '✓ Pemetaan WordPress' : '+ Pemetaan WordPress'}
        </Link>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="animate-fade-up flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-56">
          <SegmentedTabs tabs={VIEW_TABS} value={view} onChange={setView} />
        </div>
        <button
          type="button"
          onClick={() => (view === 'packages' ? openPackage() : openTheme())}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-500/30 active:translate-y-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {view === 'packages' ? 'Tambah Paket' : 'Tambah Tema'}
        </button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {view === 'packages' ? (
        <section className="animate-fade-up space-y-3">
          <p className="text-sm text-slate-500">
            Harga order diambil dari paket. Paket nonaktif tidak tampil ke client, tapi order lama tetap aman.
          </p>
          {loading ? (
            <div className="grid gap-5 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-96 animate-pulse rounded-2xl bg-slate-200/70" />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 pt-2 md:grid-cols-2 xl:grid-cols-3">
              {packages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  footer={renderActions('packages', pkg, () => openPackage(pkg))}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="animate-fade-up space-y-4">
          <WordpressConnectionCard />
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 lg:flex-row lg:items-center">
            <div className="lg:flex-1">
              <SearchInput value={search} onChange={setSearch} placeholder="Cari nama tema" />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative sm:w-56">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  aria-label="Jenis tema"
                  className={`w-full appearance-none rounded-lg border bg-white py-2 pr-9 pl-3 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                    category ? 'border-violet-300 font-medium text-violet-700' : 'border-slate-300 text-slate-700'
                  }`}
                >
                  {categoryTabs.map((tab) => (
                    <option key={tab.value} value={tab.value}>
                      {tab.label}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
              <div className="sm:shrink-0">
                <SegmentedTabs tabs={STATUS_TABS} value={status} onChange={setStatus} />
              </div>
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
              Tidak ada tema yang cocok.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {visibleThemes.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  footer={renderThemeActions(theme)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {packageModal && (
        <PackageFormModal
          key={`pkg-${modalKey}`}
          open
          pkg={packageModal.pkg}
          onClose={() => setPackageModal(null)}
          onSaved={() => {
            setPackageModal(null)
            load()
          }}
        />
      )}

      {templateTheme && (
        <ThemeTemplateModal
          key={`template-${templateTheme.id}-${templateTheme.has_self_template}`}
          theme={templateTheme}
          onClose={() => setTemplateTheme(null)}
          onSaved={() => {
            setTemplateTheme(null)
            load()
          }}
        />
      )}

      {themeModal && (
        <ThemeFormModal
          key={`theme-${modalKey}`}
          open
          theme={themeModal.theme}
          categories={categories}
          defaultCategory={category}
          onClose={() => setThemeModal(null)}
          onSaved={() => {
            setThemeModal(null)
            load()
          }}
        />
      )}
    </div>
  )
}
