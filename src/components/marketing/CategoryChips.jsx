// Chip kategori dengan jumlah materi.
// HP: satu baris yang bisa digeser (scrollbar disembunyikan, tepi kanan memudar
// sebagai tanda masih ada chip lain). Tablet/desktop: chip turun ke baris baru.
export default function CategoryChips({ categories, counts = {}, total = 0, value, onChange }) {
  const chips = [{ value: '', label: 'Semua', count: total }].concat(
    Object.entries(categories ?? {}).map(([key, label]) => ({ value: key, label, count: counts[key] ?? 0 })),
  )

  return (
    <div className="relative -mx-4 sm:mx-0">
      <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto px-4 py-0.5 sm:flex-wrap sm:overflow-visible sm:px-0">
        {chips.map((chip) => {
          const active = value === chip.value
          return (
            <button
              key={chip.value || 'all'}
              type="button"
              onClick={() => onChange(chip.value)}
              className={`inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition ${
                active
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-900/20'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-amber-50 hover:text-amber-800 hover:ring-amber-200'
              }`}
            >
              {chip.label}
              <span
                className={`rounded-full px-1.5 text-[11px] font-semibold ${
                  active ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {chip.count}
              </span>
            </button>
          )
        })}
        {/* Spacer supaya chip terakhir tidak menempel ke tepi layar saat digeser di HP */}
        <span className="w-2 shrink-0 sm:hidden" aria-hidden="true" />
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent sm:hidden"
        aria-hidden="true"
      />
    </div>
  )
}
