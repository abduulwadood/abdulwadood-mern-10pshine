import { ArrowUpDown } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { selectFilters, setFilters, setPage } from '../../features/notes/notesSlice'
import { SORT_OPTIONS } from '../../constants'
import { cn } from '../../lib/utils'

export function SortDropdown({ className }) {
  const dispatch = useDispatch()
  const filters = useSelector(selectFilters)

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
      <select
        value={filters.sort}
        onChange={e => {
          dispatch(setFilters({ sort: e.target.value }))
          dispatch(setPage(1))
        }}
        className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
      >
        {SORT_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
