import { LayoutList, Pin, Archive, Mic, Keyboard } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { selectFilters, setFilters, setPage } from '../../features/notes/notesSlice'
import { ROUTES } from '../../constants'
import { cn } from '../../lib/utils'

const FILTERS = [
  { key: 'all', label: 'All Notes', icon: <LayoutList className="w-3.5 h-3.5" /> },
  { key: 'pinned', label: 'Pinned', icon: <Pin className="w-3.5 h-3.5" /> },
  { key: 'archived', label: 'Archived', icon: <Archive className="w-3.5 h-3.5" /> },
  { key: 'voice', label: 'Voice Notes', icon: <Mic className="w-3.5 h-3.5" /> },
  { key: 'typed', label: 'Typed Notes', icon: <Keyboard className="w-3.5 h-3.5" /> },
]

function getActiveKey(filters) {
  if (filters.isPinned === true) return 'pinned'
  if (filters.isArchived === true) return 'archived'
  if (filters.inputMethod === 'voice') return 'voice'
  if (filters.inputMethod === 'typed') return 'typed'
  return 'all'
}

function applyFilter(key, dispatch) {
  dispatch(setPage(1))
  if (key === 'all') {
    dispatch(setFilters({ isPinned: null, isArchived: false, inputMethod: 'all' }))
  } else if (key === 'pinned') {
    dispatch(setFilters({ isPinned: true, isArchived: false, inputMethod: 'all' }))
  } else if (key === 'archived') {
    dispatch(setFilters({ isPinned: null, isArchived: true, inputMethod: 'all' }))
  } else if (key === 'voice') {
    dispatch(setFilters({ isPinned: null, isArchived: false, inputMethod: 'voice' }))
  } else if (key === 'typed') {
    dispatch(setFilters({ isPinned: null, isArchived: false, inputMethod: 'typed' }))
  }
}

export function QuickFilters() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const filters = useSelector(selectFilters)
  const activeKey = getActiveKey(filters)

  function handleClick(key) {
    applyFilter(key, dispatch)
    navigate(ROUTES.DASHBOARD)
  }

  return (
    <div className="space-y-0.5">
      {FILTERS.map(f => (
        <button
          key={f.key}
          type="button"
          onClick={() => handleClick(f.key)}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
            activeKey === f.key
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          )}
        >
          {f.icon}
          {f.label}
        </button>
      ))}
    </div>
  )
}
