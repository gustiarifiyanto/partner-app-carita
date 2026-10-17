import Skeleton from './Skeleton'

export default function StatCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="absolute inset-x-0 top-0 h-1 bg-slate-200" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-7 w-24" />
      <Skeleton className="mt-2 h-3 w-16" />
    </div>
  )
}
