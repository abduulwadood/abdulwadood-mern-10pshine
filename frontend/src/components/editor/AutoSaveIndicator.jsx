import { Circle, CheckCircle } from 'lucide-react'
import { formatRelativeDate } from '../../utils/formatters'

export function AutoSaveIndicator({ isDirty, lastSavedAt }) {
  if (!lastSavedAt && !isDirty) return null

  if (isDirty) {
    return (
      <span className="text-xs text-amber-500 flex items-center gap-1 flex-shrink-0">
        <Circle className="w-2 h-2 fill-amber-500" />
        Unsaved changes
      </span>
    )
  }

  return (
    <span className="text-xs text-green-500 flex items-center gap-1 flex-shrink-0">
      <CheckCircle className="w-3 h-3" />
      Saved {formatRelativeDate(lastSavedAt)}
    </span>
  )
}
