import { Skeleton } from '../ui/skeleton'

export function EditorSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-3 flex items-center gap-3">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-7 flex-1" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="border-b px-4 py-2 flex gap-2">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-8" />
        ))}
      </div>
      <div className="px-4 py-3 border-b flex gap-3">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 flex-1" />
      </div>
      <div className="flex-1 p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  )
}
