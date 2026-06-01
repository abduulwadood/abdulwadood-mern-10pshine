import { ChevronLeft, Pin, Mic, MicOff, Save, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

export function EditorHeader({
  title,
  onTitleChange,
  isPinned,
  onPinToggle,
  isVoicePanelOpen,
  onVoicePanelToggle,
  isListening,
  voiceSupported,
  onSave,
  isSaving,
  isDirty,
  onBack,
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b bg-white flex-shrink-0">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="flex-shrink-0 h-8 px-2 gap-1"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back</span>
      </Button>

      <input
        type="text"
        value={title}
        onChange={e => onTitleChange(e.target.value)}
        placeholder="Note title..."
        maxLength={200}
        className={cn(
          'flex-1 text-base sm:text-lg font-semibold bg-transparent outline-none',
          'placeholder:text-gray-300 border-b-2 border-transparent',
          'focus:border-indigo-300 transition-colors pb-0.5'
        )}
      />

      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onPinToggle}
          title={isPinned ? 'Unpin note' : 'Pin note'}
          className={cn('h-8 w-8 p-0', isPinned && 'text-indigo-600 bg-indigo-50')}
        >
          <Pin className={cn('w-4 h-4', isPinned && 'fill-indigo-600')} />
        </Button>

        {voiceSupported && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onVoicePanelToggle}
            title="Voice input"
            className={cn(
              'h-8 w-8 p-0',
              isVoicePanelOpen && !isListening && 'text-indigo-600 bg-indigo-50',
              isListening && 'text-red-600 bg-red-50'
            )}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
        )}

        <Button
          type="button"
          size="sm"
          onClick={onSave}
          disabled={isSaving || !isDirty || !title.trim()}
          className="h-8 min-w-[72px] bg-indigo-600 hover:bg-indigo-700 gap-1"
        >
          {isSaving ? (
            <><Loader2 className="w-3 h-3 animate-spin" />Saving</>
          ) : (
            <><Save className="w-3 h-3" />Save</>
          )}
        </Button>
      </div>
    </div>
  )
}
