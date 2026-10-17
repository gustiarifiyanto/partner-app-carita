import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MarketingKitIcon } from '../../components/icons/NavIcons'
import CategoryChips from '../../components/marketing/CategoryChips'
import KitCard from '../../components/marketing/KitCard'
import Pagination from '../../components/Pagination'
import SearchInput from '../../components/SearchInput'
import { useApiList } from '../../hooks/useApiList'
import { useAuth } from '../../hooks/useAuth'
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch'
import { usePageHeader } from '../../hooks/usePageHeader'
import { useToast } from '../../hooks/useToast'
import api from '../../lib/api'
import { downloadFile } from '../../lib/marketingKit'

export default function MarketingKitPage() {
  usePageHeader('Marketing Kit', 'Materi promosi siap pakai dari Carita Studio')
  const toast = useToast()

  const { items, meta, loading, error, filters, setFilters } = useApiList('/partner/marketing-kits', {
    category: '',
    search: '',
    page: 1,
  })
  const [searchInput, setSearchInput] = useDebouncedSearch(filters.search, setFilters)
  const [downloadingId, setDownloadingId] = useState(null)
  const { unreadMarketingKits, refreshUnreadMarketingKits } = useAuth()

  // Membuka halaman ini = sudah melihat materi baru. Badge "Baru" di kartu tetap
  // tampil selama kunjungan ini (datanya sudah terambil sebelum ditandai).
  const hasUnreadShown = items.some((kit) => kit.is_read === false)
  const markedRef = useRef(false)
  useEffect(() => {
    if (markedRef.current || loading || (!hasUnreadShown && !unreadMarketingKits)) return
    markedRef.current = true
    api
      .post('/partner/marketing-kits/read-all')
      .then(() => refreshUnreadMarketingKits())
      .catch(() => {})
  }, [loading, hasUnreadShown, unreadMarketingKits, refreshUnreadMarketingKits])

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
  const summary = meta?.summary

  const handleDownload = async (kit) => {
    setDownloadingId(kit.id)
    try {
      await downloadFile(`/partner/marketing-kits/${kit.id}/download`, kit.file_name)
      toast.success('Materi berhasil diunduh.')
    } catch {
      toast.error('Gagal mengunduh materi. Coba lagi ya.')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleOpenLink = (kit) => {
    // Buka tab dulu (langsung dari klik supaya tidak diblokir browser), baru catat
    window.open(kit.external_url, '_blank', 'noopener,noreferrer')
    api.post(`/partner/marketing-kits/${kit.id}/track`).catch(() => {})
  }

  return (
    <div className="space-y-6">
      <section
        className="animate-fade-up relative overflow-hidden rounded-2xl p-5 shadow-sm ring-1 ring-amber-900/10 sm:p-6"
        style={{ backgroundImage: 'linear-gradient(135deg, #FFFDF7 0%, #FBF4E2 50%, #F0E4C7 100%)' }}
      >
        <div className="pointer-events-none absolute -top-16 -right-16 h-52 w-52 rounded-full border-[18px] border-amber-200/40" />
        <div className="relative flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-sm">
            <MarketingKitIcon />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-amber-950">Siap promosi, tinggal pakai!</h2>
            <p className="mt-1 text-sm text-amber-900/70">
              Download logo, konten sosial media, katalog, video, dan caption resmi Carita Studio untuk
              mempromosikan produk ke client kamu.
            </p>
            <p className="mt-2 text-xs text-amber-900/60">
              Tips: cantumkan <strong>kode referral</strong> kamu di setiap postingan supaya order client otomatis
              masuk ke akun kamu.{' '}
              <Link to="/partner" className="font-semibold text-amber-800 underline hover:text-amber-950">
                Lihat kode referral
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="animate-fade-up space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200" style={{ animationDelay: '60ms' }}>
        <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Cari materi..." />
        <CategoryChips
          categories={meta?.categories}
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
            {filters.search || filters.category ? 'Tidak ada materi yang cocok.' : 'Belum ada materi promosi.'}
          </p>
          <p className="max-w-sm text-sm text-slate-500">
            Materi baru dari admin akan muncul di sini. Cek lagi nanti ya!
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((kit, i) => (
              <KitCard
                key={kit.id}
                kit={kit}
                busy={downloadingId === kit.id}
                onDownload={handleDownload}
                onOpenLink={handleOpenLink}
                style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
              />
            ))}
          </div>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 empty:hidden">
            <Pagination meta={meta} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} />
          </div>
        </>
      )}
    </div>
  )
}
