import { useSelector } from 'react-redux'
import { Wifi, WifiOff } from 'lucide-react'
import { selectSocketConnected } from '../../features/notes/notesSlice'
import { cn } from '../../lib/utils'

export default function ConnectionStatus() {
  const isConnected = useSelector(selectSocketConnected)

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300',
        isConnected ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
      )}
      title={isConnected ? 'Live updates active' : 'Connecting...'}
    >
      <span className="relative flex h-2 w-2">
        {isConnected && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        )}
        <span
          className={cn(
            'relative inline-flex rounded-full h-2 w-2',
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          )}
        />
      </span>
      {isConnected ? (
        <>
          <Wifi className="w-3 h-3" />
          <span className="hidden sm:inline">Live</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          <span className="hidden sm:inline">Offline</span>
        </>
      )}
    </div>
  )
}
