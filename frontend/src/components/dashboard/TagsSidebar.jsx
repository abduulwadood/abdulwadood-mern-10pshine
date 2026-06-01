import { useState } from 'react'
import { ChevronDown, ChevronUp, Tag } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { selectFilters, setFilters, setPage } from '../../features/notes/notesSlice'
import { useGetUserTagsQuery } from '../../features/notes/notesApi'
import { Skeleton } from '../ui/skeleton'
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

const VISIBLE_COUNT = 5

export function TagsSidebar() {
  const dispatch = useDispatch()
  const filters = useSelector(selectFilters)
  const [expanded, setExpanded] = useState(false)
  const { data, isLoading } = useGetUserTagsQuery()

  // Handle both array-of-strings and array-of-objects formats
  const rawTags = data?.data?.tags ?? data?.data ?? []
  const tags = rawTags.map(t =>
    typeof t === 'string' ? { name: t, count: null } : { name: t.name ?? t.tag, count: t.count ?? null }
  )

  const activeTags = filters.tags || []
  const visibleTags = expanded ? tags : tags.slice(0, VISIBLE_COUNT)
  const hiddenCount = tags.length - VISIBLE_COUNT

  function handleTagClick(tagName) {
    const isActive = activeTags.includes(tagName)
    dispatch(setFilters({ tags: isActive ? activeTags.filter(t => t !== tagName) : [tagName] }))
    dispatch(setPage(1))
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array(4).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full rounded-full" />
        ))}
      </div>
    )
  }

  if (!tags.length) {
    return (
      <p className="text-xs text-gray-400 leading-relaxed">
        No tags yet. Add tags to your notes!
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {visibleTags.map(({ name, count }) => {
        const isActive = activeTags.includes(name)
        return (
          <button
            key={name}
            type="button"
            onClick={() => handleTagClick(name)}
            className={cn(
              'w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors text-left',
              isActive
                ? 'bg-indigo-100 text-indigo-700'
                : `hover:opacity-80 ${getTagColor(name)} bg-opacity-50`
            )}
          >
            <span className="truncate">#{name}</span>
            {count != null && (
              <span className="flex-shrink-0 text-xs opacity-60">({count})</span>
            )}
          </button>
        )
      })}

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(o => !o)}
          className="w-full flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 py-1 transition-colors"
        >
          {expanded ? (
            <><ChevronUp className="w-3 h-3" />Show less</>
          ) : (
            <><ChevronDown className="w-3 h-3" />+{hiddenCount} more</>
          )}
        </button>
      )}
    </div>
  )
}
