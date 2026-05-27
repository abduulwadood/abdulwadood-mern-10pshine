import { useState } from 'react'
import { Tag } from 'lucide-react'
import { useGetUserTagsQuery } from '../../features/notes/notesApi'
import { TagBadge } from '../notes/TagBadge'
import { cn } from '../../lib/utils'

export function TagsInput({ tags, onChange, maxTags = 10 }) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const { data: userTagsData } = useGetUserTagsQuery()
  const rawTags = userTagsData?.data?.tags ?? userTagsData?.data ?? []
  const userTags = rawTags.map(t =>
    typeof t === 'string'
      ? { tag: t, count: null }
      : { tag: t.name ?? t.tag, count: t.count ?? null }
  )

  const suggestions = userTags.filter(t =>
    t.tag.toLowerCase().startsWith(inputValue.toLowerCase()) &&
    !tags.includes(t.tag) &&
    inputValue.length > 0
  ).slice(0, 5)

  function addTag(tag) {
    const cleaned = tag.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (!cleaned || tags.includes(cleaned) || tags.length >= maxTags) return
    onChange([...tags, cleaned])
    setInputValue('')
    setShowSuggestions(false)
  }

  function removeTag(tagToRemove) {
    onChange(tags.filter(t => t !== tagToRemove))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    }
    if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className="relative">
      <div className={cn(
        'flex flex-wrap items-center gap-1 px-2 py-1',
        'border rounded-lg bg-white min-h-[34px]',
        'focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-400 transition-all'
      )}>
        <Tag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        {tags.map(tag => (
          <TagBadge key={tag} tag={tag} size="xs" onRemove={removeTag} />
        ))}
        {tags.length < maxTags ? (
          <input
            type="text"
            value={inputValue}
            onChange={e => { setInputValue(e.target.value); setShowSuggestions(true) }}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder={tags.length === 0 ? 'Add tags (Enter to confirm)...' : ''}
            className="flex-1 min-w-[100px] text-xs outline-none bg-transparent py-0.5"
          />
        ) : (
          <span className="text-xs text-gray-400 ml-auto">Max {maxTags}</span>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-20 overflow-hidden">
          {suggestions.map(({ tag, count }) => (
            <button
              key={tag}
              type="button"
              onMouseDown={() => addTag(tag)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex justify-between items-center transition-colors"
            >
              <span className="font-medium">#{tag}</span>
              {count != null && (
                <span className="text-gray-400">{count} notes</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
