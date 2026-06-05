import { useState } from 'react'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Download, FileJson, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { API_BASE_URL } from '../../constants'
import { getAccessToken } from '../../utils/tokenUtils'

export default function ExportNoteButton({ noteId, noteTitle }) {
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport(format) {
    setIsExporting(true)
    try {
      const token = getAccessToken()
      const response = await fetch(
        `${API_BASE_URL}/notes/${noteId}/export?format=${format}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error?.message || error?.error?.message || 'Export failed')
      }

      const contentDisposition = response.headers.get('Content-Disposition')
      const filename =
        contentDisposition?.split('filename="')[1]?.replace('"', '') ||
        `note-export.${format}`

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`"${noteTitle}" exported as ${format.toUpperCase()}`)
    } catch (err) {
      toast.error(err.message || 'Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting} className="gap-1.5">
          {isExporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">
            {isExporting ? 'Exporting...' : 'Export'}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-xs text-gray-500">Export this note as</div>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleExport('json')}
          className="gap-2 cursor-pointer"
        >
          <FileJson className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">JSON</p>
            <p className="text-xs text-gray-400">Re-importable format</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleExport('txt')}
          className="gap-2 cursor-pointer"
        >
          <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Plain Text</p>
            <p className="text-xs text-gray-400">For printing or sharing</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
