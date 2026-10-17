import Skeleton from './Skeleton'

export default function ListSkeleton({ rows = 3 }) {
  return (
    <ul className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center justify-between gap-3 py-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </li>
      ))}
    </ul>
  )
}
