import Skeleton from './Skeleton'
import StatCardSkeleton from './StatCardSkeleton'

export default function DetailPageSkeleton({ statCards = 0 }) {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-20" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      {statCards > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: statCards }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[0, 1].map((col) => (
          <div key={col} className="space-y-3 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
