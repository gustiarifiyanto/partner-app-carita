export default function StatCard({ label, value, hint }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundImage: 'linear-gradient(90deg, #7C3AED, #3B82F6)' }}
      />
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-slate-900 sm:text-2xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
