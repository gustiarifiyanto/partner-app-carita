import { formatCurrency } from '../../lib/format'
import ThemeDemoButton from './ThemeDemoButton'

// Persen hemat dari harga coret, dibulatkan (mis. 175rb -> 75rb = 57%).
function discountPercent(pkg) {
  const original = Number(pkg.original_price)
  const price = Number(pkg.price)
  if (!original || original <= price) return null
  return Math.round(((original - price) / original) * 100)
}

// Kartu paket ala website: harga coret, badge Best Seller, daftar fitur.
export function PackageCard({ pkg, selected = false, onSelect, footer }) {
  const discount = discountPercent(pkg)

  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 transition sm:p-6 ${
        selected ? 'ring-2 ring-violet-500' : pkg.is_best_seller ? 'ring-violet-300' : 'ring-slate-200'
      } ${pkg.is_active === false ? 'opacity-60' : ''}`}
    >
      {pkg.is_best_seller && (
        <span className="absolute -top-3 left-5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
          ⭐ Best Seller
        </span>
      )}

      <p className="text-base font-semibold text-slate-900">{pkg.name}</p>
      <p className="mt-0.5 text-xs text-slate-500">{pkg.validity_label}</p>

      <div className="mt-4">
        {discount !== null && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 line-through">{formatCurrency(pkg.original_price)}</span>
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">
              Hemat {discount}%
            </span>
          </div>
        )}
        <p className="text-2xl font-bold text-slate-900">{formatCurrency(pkg.price)}</p>
      </div>

      <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600">
        {(pkg.features || []).map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {onSelect && (
        <button
          type="button"
          onClick={() => onSelect(pkg)}
          className={`mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            selected
              ? 'bg-violet-600 text-white'
              : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
          }`}
        >
          {selected ? '✓ Paket Dipilih' : 'Pilih Paket'}
        </button>
      )}
      {footer}
    </div>
  )
}

// Kartu tema: thumbnail, nama, tombol Lihat Demo (preview / tab baru) dan Pilih.
// Kartu sengaja tanpa overflow-hidden supaya menu Lihat Demo tidak terpotong.
export function ThemeCard({ theme, selected = false, onSelect, footer }) {
  return (
    <div
      className={`flex flex-col rounded-xl bg-white shadow-sm ring-1 transition ${
        selected ? 'ring-2 ring-violet-500' : 'ring-slate-200 hover:shadow-md'
      } ${theme.is_active === false ? 'opacity-60' : ''}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-xl bg-slate-100">
        {theme.offers_self_editing && (
          <span className="absolute top-2 left-2 rounded-full bg-fuchsia-600/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
            ✏️ Self Editing
          </span>
        )}
        {theme.thumbnail ? (
          <img src={theme.thumbnail} alt={theme.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">Tanpa gambar</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-2 text-sm font-medium text-slate-900">{theme.name}</p>
        <div className={`mt-auto grid gap-2 ${onSelect ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {theme.demo_url ? (
            <ThemeDemoButton
              theme={theme}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
            />
          ) : (
            <span />
          )}
          {onSelect && (
            <button
              type="button"
              onClick={() => onSelect(theme)}
              className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                selected ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
              }`}
            >
              {selected ? '✓ Dipilih' : 'Pilih'}
            </button>
          )}
        </div>
        {footer}
      </div>
    </div>
  )
}
