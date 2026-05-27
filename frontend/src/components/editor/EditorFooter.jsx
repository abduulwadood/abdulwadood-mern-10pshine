import { FileText, Clock, Save, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { AutoSaveIndicator } from './AutoSaveIndicator'
import { formatReadingTime } from '../../utils/formatters'

const CHAR_LIMIT = 50000

export function EditorFooter({
  wordCount,
  characterCount,
  lastSavedAt,
  isDirty,
  onCancel,
  onSave,
  isSaving,
  title,
}) {
  const readingTimeSeconds = Math.ceil((wordCount || 0) / 200 * 60)

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-2 border-t bg-white flex-shrink-0">
      <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap min-w-0">
        <span className="flex items-center gap-1 flex-shrink-0">
          <FileText className="w-3 h-3" />
          {wordCount} words
        </span>
        <span className="hidden sm:flex items-center gap-1 flex-shrink-0">
          <Clock className="w-3 h-3" />
          {formatReadingTime(readingTimeSeconds)}
        </span>
        <span className={`flex-shrink-0 ${characterCount > CHAR_LIMIT * 0.9 ? 'text-orange-500' : ''}`}>
          {characterCount.toLocaleString()}/{CHAR_LIMIT.toLocaleString()}
        </span>
      </div>

      <AutoSaveIndicator isDirty={isDirty} lastSavedAt={lastSavedAt} />

      <div className="flex items-center gap-2 flex-shrink-0">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-8">
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onSave}
          disabled={isSaving || !isDirty || !title.trim()}
          className="h-8 bg-indigo-600 hover:bg-indigo-700 gap-1"
        >
          {isSaving ? (
            <><Loader2 className="w-3 h-3 animate-spin" />Saving...</>
          ) : (
            <><Save className="w-3 h-3" />Save Note</>
          )}
        </Button>
      </div>
    </div>
  )
}
