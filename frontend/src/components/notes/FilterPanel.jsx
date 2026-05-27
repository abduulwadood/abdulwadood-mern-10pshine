import { useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { selectFilters, setFilters, resetFilters, setPage } from '../../features/notes/notesSlice'
import { NOTE_COLORS } from '../../constants'
import { cn } from '../../lib/utils'

const QUICK_TABS = [
  { label: 'All', key: 'all' },
  { label: 'Pinned', key: 'pinned' },
  { label: 'Archived', key: 'archived' },
  { label: 'Voice', key: 'voice' },
  { label: 'Typed', key: 'typed' },
]

function getActiveTab(filters) {
  if (filters.isPinned === true) return 'pinned'
  if (filters.isArchived === true) return 'archived'
  if (filters.inputMethod === 'voice') return 'voice'
  if (filters.inputMethod === 'typed') return 'typed'
  return 'all'
}

function applyQuickTab(tab, dispatch) {
  dispatch(setPage(1))
  if (tab === 'all') {
    dispatch(setFilters({ isPinned: null, isArchived: false, inputMethod: 'all' }))
  } else if (tab === 'pinned') {
    dispatch(setFilters({ isPinned: true, isArchived: false, inputMethod: 'all' }))
  } else if (tab === 'archived') {
    dispatch(setFilters({ isPinned: null, isArchived: true, inputMethod: 'all' }))
  } else if (tab === 'voice') {
    dispatch(setFilters({ isPinned: null, isArchived: false, inputMethod: 'voice' }))
  } else if (tab === 'typed') {
    dispatch(setFilters({ isPinned: null, isArchived: false, inputMethod: 'typed' }))
  }
}

export function FilterPanel() {
  const dispatch = useDispatch()
  const filters = useSelector(selectFilters)
  const [expanded, setExpanded] = useState(false)

  const activeTab = getActiveTab(filters)

  const advancedFilterCount = [
    filters.voiceLanguage ? 1 : 0,
    filters.tags?.length > 0 ? 1 : 0,
    filters.color ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  function handleVoiceLanguage(lang) {
    dispatch(setFilters({ voiceLanguage: filters.voiceLanguage === lang ? '' : lang }))
    dispatch(setPage(1))
  }

  function handleColor(color) {
    dispatch(setFilters({ color: filters.color === color ? '' : color }))
    dispatch(setPage(1))
  }

  function handleInputMethod(method) {
    dispatch(setFilters({ inputMethod: method }))
    dispatch(setPage(1))
  }

  function handleReset() {
    dispatch(resetFilters())
    dispatch(setPage(1))
  }

  return (
    <div className="space-y-2">
      {/* Quick filter tabs + advanced toggle */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {QUICK_TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => applyQuickTab(tab.key, dispatch)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
              activeTab === tab.key
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            )}
          >
            {tab.label}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setExpanded(o => !o)}
          className={cn(
            'ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
            expanded || advancedFilterCount > 0
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          )}
        >
          Filters
          {advancedFilterCount > 0 && (
            <span className="bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {advancedFilterCount}
            </span>
          )}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Advanced filters panel */}
      {expanded && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-4">
          {/* Input Method */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-medium text-gray-500 w-24">Input Method</span>
            <div className="flex gap-1.5 flex-wrap">
              {['all', 'typed', 'voice', 'mixed'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleInputMethod(m)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
                    filters.inputMethod === m
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  )}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-medium text-gray-500 w-24">Language</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => handleVoiceLanguage('en-US')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
                  filters.voiceLanguage === 'en-US'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                )}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => handleVoiceLanguage('ur-PK')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
                  filters.voiceLanguage === 'ur-PK'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                )}
              >
                اردو
              </button>
            </div>
          </div>

          {/* Color */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-medium text-gray-500 w-24">Color</span>
            <div className="flex gap-1.5 flex-wrap">
              {NOTE_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => handleColor(c.value)}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 transition-all hover:scale-110',
                    filters.color === c.value
                      ? 'border-indigo-600 scale-110'
                      : 'border-gray-300'
                  )}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              <X className="w-3 h-3" />
              Clear all filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
