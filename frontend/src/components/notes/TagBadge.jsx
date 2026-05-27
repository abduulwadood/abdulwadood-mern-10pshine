import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

const TAG_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-yellow-100 text-yellow-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-indigo-100 text-indigo-700',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700',
]

function getTagColor(tag) {
  const hash = tag.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return TAG_COLORS[hash % TAG_COLORS.length]
}

export function TagBadge({ tag, size = 'sm', clickable, onClick, onRemove, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        getTagColor(tag),
        size === 'xs' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2.5 py-1',
        clickable && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      onClick={clickable ? onClick : undefined}
    >
      #{tag}
      {onRemove && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onRemove(tag) }}
          className="ml-1 hover:opacity-70 flex items-center"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}
