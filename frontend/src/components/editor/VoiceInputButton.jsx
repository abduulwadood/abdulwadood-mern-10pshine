import { Mic, MicOff, Square, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip'

export function VoiceInputButton({ isListening, isProcessing, isSupported, onStart, onStop, language }) {
  if (!isSupported) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button variant="outline" size="sm" disabled>
                <MicOff className="w-4 h-4 mr-2" />
                Voice Unavailable
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            Voice input not supported. Use Chrome or Edge.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (isProcessing) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Processing...
      </Button>
    )
  }

  if (isListening) {
    return (
      <div className="relative inline-flex">
        <span className="absolute inset-0 rounded-md bg-red-400 opacity-30 animate-pulse pointer-events-none" />
        <Button
          variant="destructive"
          size="sm"
          onClick={onStop}
          className="relative z-10 gap-2"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          Stop Recording
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onStart}
      className="gap-2 border-indigo-300 text-indigo-600 hover:bg-indigo-50"
    >
      <Mic className="w-4 h-4" />
      {language === 'ur-PK' ? 'آواز سے لکھیں' : 'Start Voice'}
    </Button>
  )
}
