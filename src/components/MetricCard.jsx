export default function MetricCard({ label, value, icon, gradient }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
      <div
        className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
        style={{ backgroundImage: gradient }}
      >
        {icon}
      </div>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-slate-900 sm:text-2xl">{value}</p>
    </div>
  )
}
