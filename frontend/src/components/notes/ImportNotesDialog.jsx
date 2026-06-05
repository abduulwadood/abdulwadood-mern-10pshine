import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'
import {
  Upload,
  FileJson,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { toast } from 'sonner'
import { API_BASE_URL } from '../../constants'
import { getAccessToken } from '../../utils/tokenUtils'

export default function ImportNotesDialog({ isOpen, onClose, onImported }) {
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef(null)

  function handleFile(f) {
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.json')) {
      toast.error('Only JSON files are allowed')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB.')
      return
    }
    setFile(f)
    setResult(null)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  async function handleImport() {
    if (!file) return
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = getAccessToken()
      const response = await fetch(`${API_BASE_URL}/notes/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const json = await response.json()

      if (!response.ok) {
        throw new Error(json?.message || json?.error?.message || 'Import failed')
      }

      setResult(json.data)
      toast.success(`${json.data.imported} notes imported!`)
      onImported?.()
    } catch (err) {
      toast.error(err.message || 'Import failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleClose() {
    setFile(null)
    setResult(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-600" />
            Import Notes
          </DialogTitle>
          <DialogDescription>
            Upload a JSON file exported from this app to restore your notes.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                dragOver
                  ? 'border-indigo-500 bg-indigo-50'
                  : file
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileJson className="w-10 h-10 text-green-500" />
                  <p className="font-medium text-green-700 text-sm">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null) }}
                    className="text-xs text-red-500 flex items-center gap-1 hover:underline"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-10 h-10 text-gray-400" />
                  <p className="font-medium text-gray-700 text-sm">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-xs text-gray-400">JSON files only · Max 5MB</p>
                </div>
              )}
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                Notes will be added to your account. Existing notes will not be affected.
              </p>
            </div>
          </>
        ) : (
          <div className="py-4 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <div>
              <p className="text-lg font-bold text-gray-900">Import Complete!</p>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>
                  ✅ Imported:{' '}
                  <strong className="text-green-700">{result.imported} notes</strong>
                </p>
                <p>
                  📄 Total in file: <strong>{result.total} notes</strong>
                </p>
                {result.skipped > 0 && (
                  <p>
                    ⚠️ Skipped:{' '}
                    <strong className="text-amber-600">{result.skipped} notes</strong>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button
              onClick={handleImport}
              disabled={!file || isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Import Notes
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
