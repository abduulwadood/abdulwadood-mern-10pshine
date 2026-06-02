import { BarChart3, Keyboard, Mic, Pin, Archive, BookOpen, Clock } from 'lucide-react'
import { useGetNoteStatsQuery } from '../../features/notes/notesApi'
import { Skeleton } from '../ui/skeleton'

function StatRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <div className="flex items-center gap-1.5 text-gray-500">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-medium text-gray-800 tabular-nums">{value ?? 0}</span>
    </div>
  )
}

function formatLargeNumber(n) {
  if (!n) return '0'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function formatMinutes(seconds) {
  if (!seconds) return '0 min'
  const m = Math.round(seconds / 60)
  return `${m} min`
}

export function StatsSidebar() {
  const { data, isLoading } = useGetNoteStatsQuery()
  const stats = data?.data?.stats || {}

  if (isLoading) {
    return (
      <div className="space-y-2.5 p-1">
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    )
  }

  const total = stats.total ?? stats.totalNotes ?? 0
  const typed = stats.byInputMethod?.typed ?? 0
  const voice = stats.byInputMethod?.voice ?? 0
  const mixed = stats.byInputMethod?.mixed ?? 0
  const pinned = stats.pinned ?? stats.pinnedNotes ?? 0
  const archived = stats.archived ?? stats.archivedNotes ?? 0
  const words = stats.totalWords ?? 0
  const readTime = stats.totalReadingTimeSeconds ?? 0

  return (
    <div className="space-y-1">
      {/* Total — prominent */}
      <div className="text-center py-2">
        <div className="text-3xl font-bold text-indigo-600">{total}</div>
        <div className="text-xs text-gray-500 mt-0.5">Total notes</div>
      </div>

      <div className="border-t border-gray-100 pt-2 space-y-1.5">
        <StatRow icon={<Keyboard className="w-3.5 h-3.5" />} label="Typed" value={typed} />
        <StatRow icon={<Mic className="w-3.5 h-3.5" />} label="Voice" value={voice} />
        <StatRow icon={<Mic className="w-3.5 h-3.5" />} label="Mixed" value={mixed} />
      </div>

      <div className="border-t border-gray-100 pt-2 space-y-1.5">
        <StatRow icon={<Pin className="w-3.5 h-3.5" />} label="Pinned" value={pinned} />
        <StatRow icon={<Archive className="w-3.5 h-3.5" />} label="Archived" value={archived} />
      </div>

      <div className="border-t border-gray-100 pt-2 space-y-1.5">
        <StatRow icon={<BookOpen className="w-3.5 h-3.5" />} label="Words" value={formatLargeNumber(words)} />
        <StatRow icon={<Clock className="w-3.5 h-3.5" />} label="Read time" value={formatMinutes(readTime)} />
      </div>
    </div>
  )
}
