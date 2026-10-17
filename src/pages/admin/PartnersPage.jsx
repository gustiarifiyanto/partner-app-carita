import { useState } from 'react'
import { Link } from 'react-router-dom'
import CreatePartnerModal from '../../components/admin/CreatePartnerModal'
import DeletePartnerModal from '../../components/admin/DeletePartnerModal'
import PartnerAccessShareModal from '../../components/admin/PartnerAccessShareModal'
import Pagination from '../../components/Pagination'
import PartnerAvatar from '../../components/PartnerAvatar'
import SearchInput from '../../components/SearchInput'
import SegmentedTabs from '../../components/SegmentedTabs'
import StatusBadge from '../../components/StatusBadge'
import TableSkeleton from '../../components/TableSkeleton'
import { useApiList } from '../../hooks/useApiList'
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch'
import { usePageHeader } from '../../hooks/usePageHeader'
import { formatCurrency } from '../../lib/format'

const VERIFICATION_TABS = [
  { value: '', label: 'Semua' },
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
]

export default function PartnersPage() {
  usePageHeader('Partners', 'Kelola data partner')

  const { items, meta, loading, error, filters, setFilters, refetch } = useApiList('/admin/partners', {
    search: '',
    verification_status: '',
    status: '',
    page: 1,
  })
  const [searchInput, setSearchInput] = useDebouncedSearch(filters.search, setFilters)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [createdAccount, setCreatedAccount] = useState(null)

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))

  return (
    <div className="space-y-6">
      <div className="animate-fade-up flex justify-end">
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-500/30 active:translate-y-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Partner
        </button>
      </div>

      <section
        className="animate-fade-up overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
        style={{ animationDelay: '80ms' }}
      >
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Daftar Partner</h2>
            {meta && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {meta.total}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Cari perusahaan / email / kode referral..."
              className="lg:w-64"
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <SegmentedTabs
                tabs={VERIFICATION_TABS}
                value={filters.verification_status}
                onChange={(value) => setFilter('verification_status', value)}
              />

              <select
                value={filters.status}
                onChange={(e) => setFilter('status', e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Semua Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}

        <div className="table-scroll">
          <table className="min-w-full divide-y divide-slate-200 text-sm whitespace-nowrap">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Perusahaan</th>
                <th className="hidden px-4 py-3 text-left font-medium text-slate-500 sm:table-cell">Kontak</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Verifikasi</th>
                <th className="hidden px-4 py-3 text-left font-medium text-slate-500 sm:table-cell">Status</th>
                <th className="hidden px-4 py-3 text-right font-medium text-slate-500 sm:table-cell">Revenue</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton rows={5} columns={6} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <p className="text-sm font-medium text-slate-500">Tidak ada partner.</p>
                    {filters.search && (
                      <p className="mt-1 text-xs text-slate-400">
                        Tidak ada hasil untuk &ldquo;{filters.search}&rdquo;.
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                items.map((partner, index) => (
                  <tr
                    key={partner.id}
                    className="animate-fade-up transition-colors duration-150 hover:bg-slate-50"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <td className="px-4 py-3">
                      <Link to={`/admin/partners/${partner.id}`} className="group flex items-center gap-3">
                        <span className="transition-transform duration-200 group-hover:scale-110">
                          <PartnerAvatar partner={partner} size="sm" />
                        </span>
                        <span className="font-medium text-slate-900 group-hover:text-indigo-600">
                          {partner.company_name}
                        </span>
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                      <p>{partner.user?.name}</p>
                      <p className="text-xs text-slate-400">{partner.user?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={partner.verification_status} />
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <StatusBadge status={partner.user?.status} />
                    </td>
                    <td className="hidden px-4 py-3 text-right font-semibold tabular-nums text-slate-900 sm:table-cell">
                      {formatCurrency(partner.total_revenue)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/partners/${partner.id}`}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                        >
                          Detail
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(partner)}
                          className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:border-red-600 hover:bg-red-600 hover:text-white"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination meta={meta} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} />
      </section>

      <CreatePartnerModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(account) => {
          setShowCreate(false)
          setCreatedAccount(account ?? null)
          refetch()
        }}
      />

      <PartnerAccessShareModal account={createdAccount} onClose={() => setCreatedAccount(null)} />

      <DeletePartnerModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => {
          setDeleteTarget(null)
          refetch()
        }}
        partner={deleteTarget}
      />
    </div>
  )
}
