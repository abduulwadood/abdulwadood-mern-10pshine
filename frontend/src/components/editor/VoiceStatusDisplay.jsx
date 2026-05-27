import { CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

export function VoiceStatusDisplay({ isListening, interimTranscript, finalTranscript, language, error }) {
  if (!isListening && !interimTranscript && !finalTranscript && !error) return null

  return (
    <div className={cn(
      'mt-3 p-3 rounded-lg border-2 transition-all duration-300',
      isListening
        ? 'border-red-300 bg-red-50'
        : error
          ? 'border-red-500 bg-red-50'
          : 'border-green-300 bg-green-50'
    )}>
      <div className="flex items-center gap-2 mb-2">
        {isListening && (
          <>
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
            <span className="text-sm font-medium text-red-600">
              {language === 'ur-PK' ? 'سن رہا ہوں...' : 'Listening...'}
            </span>
          </>
        )}
        {!isListening && (finalTranscript || interimTranscript) && !error && (
          <>
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-sm font-medium text-green-600">Voice captured!</span>
          </>
        )}
        {error && (
          <>
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="text-sm font-medium text-red-600">{error}</span>
          </>
        )}
      </div>

      {(interimTranscript || finalTranscript) && (
        <p
          className={cn(
            'text-sm p-2 bg-white rounded border min-h-[40px] leading-relaxed',
            language === 'ur-PK' && 'text-right'
          )}
          dir={language === 'ur-PK' ? 'rtl' : 'ltr'}
        >
          <span className="text-gray-800">{finalTranscript}</span>
          <span className="text-gray-400 italic">{interimTranscript}</span>
        </p>
      )}

      {isListening && (
        <p className="text-xs text-gray-400 mt-2">
          {language === 'ur-PK'
            ? '💡 واضح طور پر بولیں۔ رکنے سے مکمل ہوگا۔'
            : '💡 Speak clearly. Pause to complete.'}
        </p>
      )}
    </div>
  )
}
