import { FileText, Search, Pin, Mic, Archive } from 'lucide-react'
import { Button } from '../ui/button'

const CONFIGS = {
  default: {
    icon: <FileText className="w-14 h-14 text-gray-300" />,
    title: 'No notes yet!',
    description: 'Start capturing your thoughts today.',
    actionLabel: '+ Create your first note',
  },
  search: {
    icon: <Search className="w-14 h-14 text-gray-300" />,
    title: 'No notes found',
    description: 'Try different keywords or clear your search.',
    actionLabel: 'Clear search',
  },
  pinned: {
    icon: <Pin className="w-14 h-14 text-gray-300" />,
    title: 'No pinned notes',
    description: 'Pin important notes to find them quickly.',
    actionLabel: null,
  },
  voice: {
    icon: <Mic className="w-14 h-14 text-gray-300" />,
    title: 'No voice notes yet',
    description: 'Try creating a note using your voice.',
    actionLabel: '+ Create voice note',
  },
  archived: {
    icon: <Archive className="w-14 h-14 text-gray-300" />,
    title: 'No archived notes',
    description: 'Archived notes will appear here.',
    actionLabel: null,
  },
}

export function EmptyState({ variant = 'default', onAction }) {
  const config = CONFIGS[variant] || CONFIGS.default
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="mb-4">{config.icon}</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{config.title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-xs leading-relaxed">{config.description}</p>
      {config.actionLabel && onAction && (
        <Button onClick={onAction} variant="default" size="sm">
          {config.actionLabel}
        </Button>
      )}
    </div>
  )
}
