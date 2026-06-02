import { BarChart3 } from 'lucide-react'
import { Skeleton } from '../ui/skeleton'
import { formatWordCount } from '../../utils/formatters'

function StatRow({ icon, label, value, indent }) {
  return (
    <div className={`flex items-center justify-between py-2 border-b border-gray-50 last:border-0 ${indent ? 'pl-6' : ''}`}>
      <div className="flex items-center gap-2">
        <span className="text-base leading-none">{icon}</span>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className="text-sm font-semibold text-gray-900 tabular-nums">{value}</span>
    </div>
  )
}

export function ProfileStats({ stats, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border p-6 space-y-3">
        <Skeleton className="h-5 w-36" />
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    )
  }

  if (!stats) return null

  const total       = stats.total        ?? stats.totalNotes      ?? 0
  const pinned      = stats.pinned       ?? stats.pinnedNotes     ?? 0
  const archived    = stats.archived     ?? stats.archivedNotes   ?? 0
  const typed       = stats.byInputMethod?.typed  ?? 0
  const voice       = stats.byInputMethod?.voice  ?? 0
  const mixed       = stats.byInputMethod?.mixed  ?? 0
  const totalWords  = stats.totalWords   ?? 0
  const readingMins = Math.ceil(totalWords / 200)

  return (
    <div className="bg-white rounded-xl border p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-indigo-600" />
        Your Statistics
      </h3>

      <StatRow icon="📝" label="Total Notes" value={total} />

      {/* Input method breakdown */}
      <StatRow icon="⌨️" label="Typed"   value={typed} indent />
      <StatRow icon="🎤" label="Voice"   value={voice} indent />
      <StatRow icon="🎤" label="Mixed"   value={mixed} indent />

      <StatRow icon="📌" label="Pinned"       value={pinned} />
      <StatRow icon="🗂️"  label="Archived"     value={archived} />
      <StatRow icon="📖" label="Total Words"  value={formatWordCount(totalWords)} />
      <StatRow icon="⏱️" label="Reading Time" value={`${readingMins} min`} />
    </div>
  )
}
