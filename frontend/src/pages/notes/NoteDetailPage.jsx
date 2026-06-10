import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  useGetNoteByIdQuery,
  useDeleteNoteMutation,
  useToggleArchiveMutation,
  useTogglePinMutation,
} from '@/features/notes/notesApi'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ChevronLeft, Edit, Trash2, Archive, Pin, Copy,
  Loader2, Mic, Layers, Keyboard,
} from 'lucide-react'
import ExportNoteButton from '@/components/notes/ExportNoteButton'
import { ROUTES } from '@/constants'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import './NoteDetailPage.css'

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60)     return 'just now'
  if (s < 3600)   return `${Math.floor(s / 60)}m ago`
  if (s < 86400)  return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const INPUT_CFG = {
  voice: { Icon: Mic,      label: 'Voice', cls: 'nd-badge--voice' },
  mixed: { Icon: Layers,   label: 'Mixed', cls: 'nd-badge--mixed' },
  typed: { Icon: Keyboard, label: 'Typed', cls: 'nd-badge--typed' },
}

const useReadingProgress = () => {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const scrollable = el.scrollHeight - el.clientHeight
      setPct(scrollable > 0 ? (el.scrollTop / scrollable) * 100 : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return pct
}

const NoteDetailPage = () => {
  const { id }   = useParams()
  const navigate = useNavigate()
  const pct      = useReadingProgress()

  const [mounted,     setMounted]     = useState(false)
  const [deleteOpen,  setDeleteOpen]  = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)

  const { data, isLoading, error } = useGetNoteByIdQuery(id)
  const [deleteNote,    { isLoading: deleting  }] = useDeleteNoteMutation()
  const [toggleArchive, { isLoading: archiving }] = useToggleArchiveMutation()
  const [togglePin,     { isLoading: pinning   }] = useTogglePinMutation()

  useEffect(() => { const t = setTimeout(() => setMounted(true), 20); return () => clearTimeout(t) }, [])

  if (isLoading) return (
    <div className="nd-state">
      <Loader2 className="nd-spinner animate-spin" />
    </div>
  )

  if (error || !data?.data?.note) return (
    <div className="nd-state">
      <h2 className="nd-state-title">Note not found</h2>
      <button className="nd-state-back" onClick={() => navigate(ROUTES.DASHBOARD)}>
        <ChevronLeft size={14} /> Back to Dashboard
      </button>
    </div>
  )

  const note = data.data.note
  const { Icon: InputIcon, label: inputLabel, cls: inputCls } =
    INPUT_CFG[note.inputMethod] ?? INPUT_CFG.typed

  const handleDelete = async () => {
    try {
      await deleteNote(id).unwrap()
      toast.success('Note deleted')
      navigate(ROUTES.DASHBOARD)
    } catch { toast.error('Could not delete note') }
  }

  const handleArchive = async () => {
    try {
      await toggleArchive(id).unwrap()
      toast.success(note.isArchived ? 'Note restored' : 'Note archived')
      setArchiveOpen(false)
    } catch { toast.error('Could not archive note') }
  }

  const handlePin = async () => {
    try {
      await togglePin(id).unwrap()
      toast.success(note.isPinned ? 'Unpinned' : 'Pinned to top')
    } catch { toast.error('Could not pin note') }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(note.content.replace(/<[^>]*>/g, ''))
    toast.success('Copied to clipboard')
  }

  const readMins = Math.max(1, Math.ceil((note.wordCount || 0) / 200))

  return (
    <>
      {/* ── Progress bar ── */}
      <div className="nd-progress" style={{ width: `${pct}%` }} />

      <div className={cn('nd-root', mounted && 'nd-root--in')}>

        {/* ── Navbar ── */}
        <header className="nd-nav">
          <button className="nd-back" onClick={() => navigate(ROUTES.DASHBOARD)}>
            <ChevronLeft size={14} className="nd-back-icon" />
            Back
          </button>

          <div className="nd-nav-actions">
            <button
              className={cn('nd-icon-btn', note.isPinned && 'nd-icon-btn--active')}
              onClick={handlePin}
              disabled={pinning}
              title={note.isPinned ? 'Unpin' : 'Pin'}
            >
              <Pin size={15} />
            </button>

            <button className="nd-icon-btn" onClick={handleCopy} title="Copy text">
              <Copy size={15} />
            </button>

            <button
              className="nd-icon-btn"
              onClick={() => setArchiveOpen(true)}
              title={note.isArchived ? 'Restore' : 'Archive'}
            >
              <Archive size={15} />
            </button>

            <div className="nd-nav-divider" />

            <ExportNoteButton noteId={note._id} noteTitle={note.title} />

            <button
              className="nd-edit-btn"
              onClick={() => navigate(ROUTES.NOTE_EDIT.replace(':id', id))}
            >
              <Edit size={13} />
              Edit
            </button>

            <button
              className="nd-del-icon-btn"
              onClick={() => setDeleteOpen(true)}
              title="Delete"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </header>

        {/* ── Reading column ── */}
        <main className="nd-column">

          {/* Badges */}
          <div className="nd-eyebrow nd-a nd-a1">
            <span className={cn('nd-badge', inputCls)}>
              <InputIcon size={11} />
              {inputLabel}
            </span>
            {note.isPinned   && <span className="nd-badge nd-badge--pin">Pinned</span>}
            {note.isArchived && <span className="nd-badge nd-badge--arch">Archived</span>}
            {note.voiceLanguage === 'ur-PK' && (
              <span className="nd-badge nd-badge--urdu">اردو</span>
            )}
          </div>

          {/* Title */}
          <h1 className="nd-title nd-a nd-a2">{note.title}</h1>

          {/* Meta */}
          <div className="nd-meta nd-a nd-a3">
            <span className="nd-chip">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              {readMins} min read
            </span>
            <span className="nd-sep" />
            <span className="nd-chip">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              </svg>
              {note.wordCount || 0} words
            </span>
            <span className="nd-sep" />
            <span className="nd-chip">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {new Date(note.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </span>
            <span className="nd-sep" />
            <span className="nd-chip nd-chip--accent">Updated {timeAgo(note.updatedAt)}</span>
          </div>

          {/* Tags */}
          {note.tags?.length > 0 && (
            <div className="nd-tags nd-a nd-a4">
              {note.tags.map(t => (
                <span key={t} className="nd-tag">#{t}</span>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="nd-divider nd-a nd-a5" />

          {/* Prose — NO card wrapper */}
          <article
            className={cn('nd-prose nd-a nd-a6', note.voiceLanguage === 'ur-PK' && 'nd-prose--rtl')}
            dangerouslySetInnerHTML={{ __html: note.content }}
          />

        </main>

        {/* ── Sticky footer ── */}
        <footer className="nd-footer nd-a nd-a7">
          <span className="nd-footer-id">ID {note._id?.slice(-8)}</span>
          <div className="nd-footer-right">
            <button className="nd-fb nd-fb--del" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={13} /> Delete
            </button>
            <button className="nd-fb" onClick={() => setArchiveOpen(true)}>
              <Archive size={13} /> {note.isArchived ? 'Restore' : 'Archive'}
            </button>
            <button
              className="nd-fb nd-fb--primary"
              onClick={() => navigate(ROUTES.NOTE_EDIT.replace(':id', id))}
            >
              <Edit size={13} /> Edit Note
            </button>
          </div>
        </footer>
      </div>

      {/* ── Delete dialog ── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>
              "{note.title}" will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting
                ? <><Loader2 size={13} className="animate-spin mr-1" />Deleting…</>
                : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Archive dialog ── */}
      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {note.isArchived ? 'Restore note?' : 'Archive note?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {note.isArchived
                ? 'Move this note back to your active notes.'
                : 'Move this note to your archive.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={archiving}>
              {archiving
                ? <><Loader2 size={13} className="animate-spin mr-1" />Working…</>
                : (note.isArchived ? 'Restore' : 'Archive')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default NoteDetailPage
