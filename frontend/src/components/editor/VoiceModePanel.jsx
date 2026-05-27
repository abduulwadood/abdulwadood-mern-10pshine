import { X } from 'lucide-react'
import { VOICE_LANGUAGES } from '../../constants'
import { Button } from '../ui/button'
import { VoiceInputButton } from './VoiceInputButton'
import { VoiceStatusDisplay } from './VoiceStatusDisplay'
import { cn } from '../../lib/utils'

export function VoiceModePanel({
  language,
  onLanguageChange,
  appendMode,
  onAppendModeChange,
  isListening,
  onStart,
  onStop,
  interimTranscript,
  finalTranscript,
  error,
  isSupported,
  onClose,
}) {
  return (
    <div className="mx-4 mb-2 p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-indigo-800 flex items-center gap-1.5">
          🎤 Voice Input
        </span>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Language toggle */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Language</p>
        <div className="flex gap-2">
          {Object.values(VOICE_LANGUAGES).map(lang => (
            <button
              key={lang.code}
              type="button"
              onClick={() => onLanguageChange(lang.code)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all',
                language === lang.code
                  ? 'border-indigo-500 bg-indigo-600 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300'
              )}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mode selection */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Mode</p>
        <div className="flex flex-col gap-1.5">
          {[
            { value: false, label: 'Replace content', desc: 'Replaces the entire note content' },
            { value: true, label: 'Append to note', desc: 'Adds voice content at the end' },
          ].map(option => (
            <label key={String(option.value)} className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="voiceMode"
                checked={appendMode === option.value}
                onChange={() => onAppendModeChange(option.value)}
                className="mt-0.5 accent-indigo-600"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">{option.label}</span>
                <p className="text-xs text-gray-400">{option.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <VoiceInputButton
        isListening={isListening}
        isSupported={isSupported}
        onStart={onStart}
        onStop={onStop}
        language={language}
      />

      <VoiceStatusDisplay
        isListening={isListening}
        interimTranscript={interimTranscript}
        finalTranscript={finalTranscript}
        language={language}
        error={error}
      />
    </div>
  )
}
