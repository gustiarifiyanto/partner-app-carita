import { useState } from 'react'
import DeleteMarketingKitModal from '../../components/admin/DeleteMarketingKitModal'
import MarketingKitFormModal from '../../components/admin/MarketingKitFormModal'
import { CheckCircleIcon } from '../../components/icons/HelpIcons'
import { MarketingKitIcon } from '../../components/icons/NavIcons'
import CategoryChips from '../../components/marketing/CategoryChips'
import KitCard from '../../components/marketing/KitCard'
import MetricCard from '../../components/MetricCard'
import Pagination from '../../components/Pagination'
import SearchInput from '../../components/SearchInput'
import SegmentedTabs from '../../components/SegmentedTabs'
import StatCardSkeleton from '../../components/StatCardSkeleton'
import { useApiList } from '../../hooks/useApiList'
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch'
import { usePageHeader } from '../../hooks/usePageHeader'
import { useToast } from '../../hooks/useToast'
import api from '../../lib/api'
import { downloadFile } from '../../lib/marketingKit'

const STATUS_TABS = [
  { value: '', label: 'Semua' },
  { value: 'published', label: 'Tampil' },
  { value: 'draft', label: 'Disembunyikan' },
]

const DownloadIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
    />
  </svg>
)

export default function MarketingKitPage() {
  usePageHeader('Marketing Kit', 'Materi promosi yang bisa diunduh partner')
  const toast = useToast()

  const { items, meta, loading, error, filters, setFilters, refetch } = useApiList('/admin/marketing-kits', {
    category: '',
    search: '',
    status: '',
    page: 1,
  })
  const [searchInput, setSearchInput] = useDebouncedSearch(filters.search, setFilters)
  const [formState, setFormState] = useState({ open: false, kit: null, key: 0 })
  const [downloadingId, setDownloadingId] = useState(null)
  const [deletingKit, setDeletingKit] = useState(null)

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
  const summary = meta?.summary
  const categories = meta?.categories

  const openForm = (kit = null) => setFormState((prev) => ({ open: true, kit, key: prev.key + 1 }))
  const closeForm = () => setFormState((prev) => ({ ...prev, open: false }))

  const handleDownload = async (kit) => {
    setDownloadingId(kit.id)
    try {
      await downloadFile(`/admin/marketing-kits/${kit.id}/download`, kit.file_name)
    } catch {
      toast.error('Gagal mengunduh file.')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleTogglePublish = async (kit) => {
    try {
      const { data } = await api.put(`/admin/marketing-kits/${kit.id}/publish`)
      toast.success(data.message)
      refetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status materi.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {summary ? (
          <>
            <MetricCard
              label="Total Materi"
              value={summary.total}
              icon={<MarketingKitIcon />}
              gradient="linear-gradient(135deg, #FBBF24, #D97706)"
            />
            <MetricCard
              label="Tampil ke Partner"
              value={summary.published}
              icon={<CheckCircleIcon />}
              gradient="linear-gradient(135deg, #34D399, #059669)"
            />
            <div className="col-span-2 sm:col-span-1">
              <MetricCard
                label="Total Diunduh"
                value={summary.total_downloads}
                icon={<DownloadIcon />}
                gradient="linear-gradient(135deg, #60A5FA, #2563EB)"
              />
            </div>
          </>
        ) : (
          Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
        )}
      </div>

      <section className="animate-fade-up space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Cari judul / deskripsi materi..."
            className="lg:flex-1"
          />
          <div className="w-full lg:w-auto">
            <SegmentedTabs tabs={STATUS_TABS} value={filters.status} onChange={(value) => setFilter('status', value)} />
          </div>
          <button
            type="button"
            onClick={() => openForm()}
            disabled={!categories}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-amber-600/30 disabled:opacity-60"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Upload Materi
          </button>
        </div>

        <CategoryChips
          categories={categories}
          counts={summary?.by_category}
          total={summary?.total ?? 0}
          value={filters.category}
          onChange={(value) => setFilter('category', value)}
        />
      </section>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-4 py-14 text-center shadow-sm ring-1 ring-slate-200">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <MarketingKitIcon />
          </span>
          <p className="text-sm font-medium text-slate-700">
            {filters.search || filters.category || filters.status ? 'Tidak ada materi yang cocok.' : 'Belum ada marketing kit.'}
          </p>
          <p className="max-w-sm text-sm text-slate-500">
            Upload logo, konten sosial media, katalog, video, caption, atau materi cetak untuk dipakai partner
            mempromosikan produk.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((kit, i) => (
              <KitCard
                key={kit.id}
                kit={kit}
                mode="admin"
                busy={downloadingId === kit.id}
                onDownload={handleDownload}
                onOpenLink={(k) => window.open(k.external_url, '_blank', 'noopener,noreferrer')}
                onEdit={openForm}
                onTogglePublish={handleTogglePublish}
                onDelete={setDeletingKit}
                style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
              />
            ))}
          </div>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 empty:hidden">
            <Pagination meta={meta} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} />
          </div>
        </>
      )}

      <DeleteMarketingKitModal
        kit={deletingKit}
        onClose={() => setDeletingKit(null)}
        onDeleted={() => {
          setDeletingKit(null)
          refetch()
        }}
      />

      {formState.open && (
        <MarketingKitFormModal
          key={formState.key}
          open={formState.open}
          kit={formState.kit}
          categories={categories}
          onClose={closeForm}
          onSaved={() => {
            closeForm()
            refetch()
          }}
        />
      )}
    </div>
  )
}
