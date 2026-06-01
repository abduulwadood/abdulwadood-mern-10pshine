import { Skeleton } from '../ui/skeleton'
import { cn } from '../../lib/utils'

export function NoteCardSkeleton({ list = false }) {
  if (list) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <Skeleton className="w-3 h-3 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5 min-w-0">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border p-4 h-[220px] flex flex-col gap-3 bg-white">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-12" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-4/6 flex-1" />
      <div className="flex items-center gap-2 mt-auto pt-1">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  )
}
