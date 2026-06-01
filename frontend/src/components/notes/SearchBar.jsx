import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { selectFilters, setFilters, setPage } from '../../features/notes/notesSlice'
import { useDebounce } from '../../hooks/useDebounce'
import { Input } from '../ui/input'
import { cn } from '../../lib/utils'

export function SearchBar({ className }) {
  const dispatch = useDispatch()
  const filters = useSelector(selectFilters)
  const [value, setValue] = useState(filters.search || '')
  const debouncedValue = useDebounce(value, 500)

  // Sync clear from outside (e.g. "Clear all filters")
  useEffect(() => {
    if (!filters.search && value) setValue('')
  }, [filters.search])

  // Dispatch on debounce
  useEffect(() => {
    dispatch(setFilters({ search: debouncedValue }))
    if (debouncedValue !== filters.search) dispatch(setPage(1))
  }, [debouncedValue])

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <Input
        type="search"
        placeholder="Search notes..."
        value={value}
        onChange={e => setValue(e.target.value)}
        className="pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
