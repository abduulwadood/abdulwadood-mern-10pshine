import { useSelector } from 'react-redux'
import { Wifi, WifiOff } from 'lucide-react'
import { selectSocketConnected } from '../../features/notes/notesSlice'
import { cn } from '../../lib/utils'

export default function ConnectionStatus() {
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 bg-green-50 text-green-700"
      title="Online"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <Wifi className="w-3 h-3" />
      <span className="hidden sm:inline">Online</span>
    </div>
  )
}
