import { LayoutGrid, List } from 'lucide-react'
import { cn } from '../../lib/utils'

export function ViewToggle({ view, onToggle }) {
  return (
    <div className="flex border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle('grid')}
        title="Grid view"
        className={cn(
          'p-2 transition-colors',
          view === 'grid'
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-gray-500 hover:bg-gray-50'
        )}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onToggle('list')}
        title="List view"
        className={cn(
          'p-2 transition-colors border-l border-gray-200',
          view === 'list'
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-gray-500 hover:bg-gray-50'
        )}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  )
}
