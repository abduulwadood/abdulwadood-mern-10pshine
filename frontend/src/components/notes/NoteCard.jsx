import { memo, useState } from 'react'
import { Pin, PinOff, Archive, ArchiveRestore, Trash2, Mic } from 'lucide-react'
import { Badge } from '../ui/badge'
import { TagBadge } from './TagBadge'
import { cn } from '../../lib/utils'
import { formatReadingTime, formatRelativeDate, truncateText } from '../../utils/formatters'

function ActionButton({ icon, tooltip, onClick, active, destructive }) {
  return (
    <button
      type="button"
      title={tooltip}
      onClick={onClick}
      className={cn(
        'p-1.5 rounded-md transition-colors',
        destructive
          ? 'text-gray-400 hover:bg-red-100 hover:text-red-600'
          : active
          ? 'text-indigo-600 hover:bg-indigo-50'
          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
      )}
    >
      {icon}
    </button>
  )
}

const NoteCard = memo(function NoteCard({ note, onDelete, onPin, onArchive, onClick }) {
  const [showActions, setShowActions] = useState(false)

  const inputMethodBadge = {
    voice: (
      <Badge variant="secondary" className="text-xs py-0 px-1.5 gap-0.5">
        <Mic className="w-2.5 h-2.5" />Voice
      </Badge>
    ),
    mixed: (
      <Badge variant="secondary" className="text-xs py-0 px-1.5 gap-0.5">
        <Mic className="w-2.5 h-2.5" />Mixed
      </Badge>
    ),
  }

  const languageBadge = (note.inputMethod === 'voice' || note.inputMethod === 'mixed') && note.voiceLanguage ? (
    <Badge variant="outline" className="text-xs py-0 px-1.5">
      {note.voiceLanguage === 'ur-PK' ? 'اردو' : 'EN'}
    </Badge>
  ) : null

  const visibleTags = note.tags?.slice(0, 2) || []
  const hiddenTagCount = Math.max(0, (note.tags?.length || 0) - 2)

  return (
    <div
      className={cn(
        'group relative rounded-xl border cursor-pointer',
        'p-4 h-[220px] flex flex-col gap-2',
        'hover:shadow-md transition-all duration-200 hover:-translate-y-0.5',
        'select-none'
      )}
      style={{ backgroundColor: note.color || '#ffffff' }}
      onClick={() => onClick(note._id)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Top row: pin/archive icons left, method/lang badges right */}
      <div className="flex items-center justify-between gap-1 min-h-[20px]">
        <div className="flex items-center gap-1">
          {note.isPinned && <Pin className="w-3 h-3 text-indigo-600 fill-indigo-600" />}
          {note.isArchived && <Archive className="w-3 h-3 text-gray-400" />}
        </div>
        <div className="flex items-center gap-1">
          {languageBadge}
          {inputMethodBadge[note.inputMethod] ?? null}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-snug">
        {note.title || 'Untitled'}
      </h3>

      {/* Content preview */}
      <p className="text-xs text-gray-500 line-clamp-3 flex-1 leading-relaxed">
        {note.preview || truncateText(note.content, 150) || ''}
      </p>

      {/* Tags */}
      {note.tags?.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {visibleTags.map(tag => (
            <TagBadge key={tag} tag={tag} size="xs" />
          ))}
          {hiddenTagCount > 0 && (
            <span className="text-xs text-gray-400">+{hiddenTagCount}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-black/5">
        <span>{formatReadingTime(note.readingTimeSeconds)}</span>
        <span>{formatRelativeDate(note.createdAt)}</span>
      </div>

      {/* Hover actions */}
      <div
        className={cn(
          'absolute top-2 right-2 flex items-center gap-0.5',
          'bg-white/95 rounded-lg shadow-sm border border-gray-100 p-0.5',
          'transition-opacity duration-150',
          showActions ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={e => e.stopPropagation()}
      >
        <ActionButton
          icon={note.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          tooltip={note.isPinned ? 'Unpin' : 'Pin'}
          onClick={() => onPin(note._id)}
          active={note.isPinned}
        />
        <ActionButton
          icon={note.isArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
          tooltip={note.isArchived ? 'Unarchive' : 'Archive'}
          onClick={() => onArchive(note._id)}
        />
        <ActionButton
          icon={<Trash2 className="w-3.5 h-3.5" />}
          tooltip="Delete"
          onClick={() => onDelete(note._id)}
          destructive
        />
      </div>
    </div>
  )
})

export default NoteCard
