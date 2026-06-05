import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Download, FileJson, FileText, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { toast } from 'sonner'
import { API_BASE_URL } from '../../constants'
import { getAccessToken } from '../../utils/tokenUtils'

const FORMATS = [
  {
    id: 'json',
    label: 'JSON',
    description: 'Re-importable format. Keeps all note data.',
    icon: FileJson,
  },
  {
    id: 'txt',
    label: 'Plain Text',
    description: 'Human-readable. Good for printing or sharing.',
    icon: FileText,
  },
]

export default function ExportNotesDialog({ isOpen, onClose, selectedIds = [] }) {
  const [format, setFormat] = useState('json')
  const [isExporting, setIsExporting] = useState(false)

  const scope =
    selectedIds.length > 0
      ? `${selectedIds.length} selected note${selectedIds.length > 1 ? 's' : ''}`
      : 'all notes'

  async function handleExport() {
    setIsExporting(true)
    try {
      const params = new URLSearchParams({ format })
      if (selectedIds.length > 0) params.set('ids', selectedIds.join(','))

      const token = getAccessToken()
      const response = await fetch(`${API_BASE_URL}/notes/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename =
        contentDisposition?.split('filename="')[1]?.replace('"', '') ||
        `notes-export.${format}`

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Exported ${scope} successfully!`)
      onClose()
    } catch {
      toast.error('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-600" />
            Export Notes
          </DialogTitle>
          <DialogDescription>
            Exporting <strong>{scope}</strong>. Choose your preferred format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {FORMATS.map((f) => {
            const Icon = f.icon
            const isSelected = format === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormat(f.id)}
                className={cn(
                  'w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 mt-0.5',
                    isSelected ? 'text-indigo-600' : 'text-gray-400'
                  )}
                />
                <div>
                  <p
                    className={cn(
                      'font-semibold text-sm',
                      isSelected ? 'text-indigo-700' : 'text-gray-700'
                    )}
                  >
                    {f.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 ml-auto mt-0.5" />
                )}
              </button>
            )
          })}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="gap-2">
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
