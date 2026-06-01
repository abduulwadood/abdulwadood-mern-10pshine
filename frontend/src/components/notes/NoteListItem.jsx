import { memo, useState } from 'react'
import { Pin, PinOff, Archive, ArchiveRestore, Trash2, Mic } from 'lucide-react'
import { NoteColorDot } from './NoteColorDot'
import { TagBadge } from './TagBadge'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import { formatReadingTime, formatRelativeDate, truncateText } from '../../utils/formatters'

function ActionButton({ icon, tooltip, onClick, active, destructive }) {
  return (
    <button
      type="button"
      title={tooltip}
      onClick={onClick}
      className={cn(
        'p-1 rounded transition-colors',
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

const NoteListItem = memo(function NoteListItem({ note, onDelete, onPin, onArchive, onClick }) {
  const [showActions, setShowActions] = useState(false)

  const visibleTags = note.tags?.slice(0, 2) || []

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer',
        'hover:bg-gray-50 transition-colors group'
      )}
      onClick={() => onClick(note._id)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Color dot */}
      <NoteColorDot color={note.color} size="sm" className="flex-shrink-0" />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {note.isPinned && <Pin className="w-3 h-3 text-indigo-600 fill-indigo-600 flex-shrink-0" />}
          <h3 className="font-medium text-sm text-gray-900 truncate">{note.title || 'Untitled'}</h3>
          {note.inputMethod === 'voice' && (
            <Badge variant="secondary" className="text-xs py-0 px-1.5 flex-shrink-0 gap-0.5">
              <Mic className="w-2.5 h-2.5" />Voice
            </Badge>
          )}
          {note.voiceLanguage && (note.inputMethod === 'voice' || note.inputMethod === 'mixed') && (
            <Badge variant="outline" className="text-xs py-0 px-1 flex-shrink-0">
              {note.voiceLanguage === 'ur-PK' ? 'اردو' : 'EN'}
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {note.preview || truncateText(note.content, 100) || ''}
        </p>
      </div>

      {/* Right side: tags + metadata + actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Tags */}
        <div className="hidden sm:flex items-center gap-1">
          {visibleTags.map(tag => (
            <TagBadge key={tag} tag={tag} size="xs" />
          ))}
          {(note.tags?.length || 0) > 2 && (
            <span className="text-xs text-gray-400">+{note.tags.length - 2}</span>
          )}
        </div>

        {/* Metadata */}
        <div className="hidden md:flex flex-col items-end gap-0.5 text-xs text-gray-400">
          <span>{formatReadingTime(note.readingTimeSeconds)}</span>
          <span>{formatRelativeDate(note.createdAt)}</span>
        </div>

        {/* Actions */}
        <div
          className={cn(
            'flex items-center gap-0.5 transition-opacity duration-150',
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
    </div>
  )
})

export default NoteListItem
