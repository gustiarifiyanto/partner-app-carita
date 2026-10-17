// Pill-style tab switcher with a white indicator that slides to the active tab.
// Every column is at least as wide as the longest label (min-w-max +
// minmax(max-content, 1fr)), so a label never spills past the indicator when
// the wrapper is narrower than the tabs need - the switcher grows instead.
// Wider wrappers still stretch it, with the columns kept equal.
export default function SegmentedTabs({ tabs, value, onChange }) {
  const activeIndex = Math.max(
    tabs.findIndex((tab) => tab.value === value),
    0,
  )

  return (
    <div
      className="relative grid min-w-max rounded-lg bg-slate-100 p-1 text-xs sm:text-sm"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(max-content, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 rounded-md bg-white shadow-sm transition-transform duration-300 ease-out"
        style={{
          width: `calc((100% - 0.5rem) / ${tabs.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`relative z-10 px-2 py-1.5 font-medium whitespace-nowrap sm:px-4 ${
            value === tab.value ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
