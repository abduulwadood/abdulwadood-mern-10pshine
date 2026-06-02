import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft, Pin, PinOff, Archive, ArchiveRestore,
  Pencil, Trash2, Mic, Clock, FileText, Calendar,
  RefreshCw, Loader2,
} from 'lucide-react'
import {
  useGetNoteByIdQuery,
  useDeleteNoteMutation,
  useTogglePinMutation,
  useToggleArchiveMutation,
} from '../../features/notes/notesApi'
import { ROUTES, TOAST_MESSAGES } from '../../constants'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { TagBadge } from '../../components/notes/TagBadge'
import { DeleteConfirmDialog } from '../../components/notes/DeleteConfirmDialog'
import { Skeleton } from '../../components/ui/skeleton'
import { formatDate, formatRelativeDate, formatWordCount, formatReadingTime } from '../../utils/formatters'
import { cn } from '../../lib/utils'

function DetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20 ml-auto" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="rounded-2xl p-6 space-y-4 bg-white border">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-8 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  )
}

export default function NoteDetailPage() {
  const { id: noteId } = useParams()
  const navigate = useNavigate()

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data, isLoading, error } = useGetNoteByIdQuery(noteId, { skip: !noteId })
  const [deleteNote, { isLoading: isDeleting }] = useDeleteNoteMutation()
  const [togglePin, { isLoading: isPinning }] = useTogglePinMutation()
  const [toggleArchive, { isLoading: isArchiving }] = useToggleArchiveMutation()

  const note = data?.data?.note ?? data?.data

  async function handleDelete() {
    try {
      await deleteNote(noteId).unwrap()
      toast.success(TOAST_MESSAGES.NOTE_DELETED)
      navigate(ROUTES.DASHBOARD, { replace: true })
    } catch {
      toast.error(TOAST_MESSAGES.ERROR_GENERIC)
    }
  }

  async function handlePin() {
    try {
      await togglePin(noteId).unwrap()
      toast.success(note?.isPinned ? TOAST_MESSAGES.NOTE_UNPINNED : TOAST_MESSAGES.NOTE_PINNED)
    } catch {
      toast.error(TOAST_MESSAGES.ERROR_GENERIC)
    }
  }

  async function handleArchive() {
    try {
      await toggleArchive(noteId).unwrap()
      toast.success(note?.isArchived ? TOAST_MESSAGES.NOTE_UNARCHIVED : TOAST_MESSAGES.NOTE_ARCHIVED)
    } catch {
      toast.error(TOAST_MESSAGES.ERROR_GENERIC)
    }
  }

  const isUrdu = note?.voiceLanguage === 'ur-PK'

  if (isLoading) return <DetailSkeleton />

  if (error || (!isLoading && !note)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <FileText className="w-12 h-12 text-gray-300" />
        <p className="text-gray-500 text-sm">Note not found or couldn&apos;t be loaded.</p>
        <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.DASHBOARD)}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to notes
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 lg:px-6 py-3 border-b border-gray-200 bg-white sticky top-16 z-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePin}
            disabled={isPinning}
            className={cn(note?.isPinned && 'text-indigo-600 border-indigo-300 bg-indigo-50')}
          >
            {isPinning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
              note?.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline ml-1.5">{note?.isPinned ? 'Unpin' : 'Pin'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleArchive}
            disabled={isArchiving}
          >
            {isArchiving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
              note?.isArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline ml-1.5">{note?.isArchived ? 'Unarchive' : 'Archive'}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => navigate(`/notes/${noteId}/edit`)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span className="hidden sm:inline ml-1.5">Edit</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Note content */}
      <div className="flex-1 overflow-auto px-4 lg:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header card */}
          <div
            className="rounded-2xl border p-6 space-y-4"
            style={{ backgroundColor: note?.color || '#ffffff' }}
          >
            {/* Badges */}
            <div className="flex items-center flex-wrap gap-2">
              {note?.isPinned && (
                <Badge variant="secondary" className="gap-1">
                  <Pin className="w-3 h-3 fill-current" />Pinned
                </Badge>
              )}
              {note?.isArchived && (
                <Badge variant="secondary" className="gap-1">
                  <Archive className="w-3 h-3" />Archived
                </Badge>
              )}
              {note?.inputMethod && note.inputMethod !== 'typed' && (
                <Badge variant="secondary" className="gap-1">
                  <Mic className="w-3 h-3" />
                  {note.inputMethod === 'voice' ? 'Voice Note' : 'Mixed Note'}
                </Badge>
              )}
              {note?.voiceLanguage && (
                <Badge variant="outline">
                  {note.voiceLanguage === 'ur-PK' ? '🇵🇰 اردو' : '🇺🇸 English'}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className={cn('text-2xl font-bold text-gray-900 leading-tight', isUrdu && 'text-right')}
              dir={isUrdu ? 'rtl' : 'ltr'}>
              {note?.title || 'Untitled'}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatReadingTime(note?.readingTimeSeconds)}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {formatWordCount(note?.wordCount)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Created {formatDate(note?.createdAt)}
              </span>
              {note?.updatedAt && note.updatedAt !== note.createdAt && (
                <span className="flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Updated {formatRelativeDate(note.updatedAt)}
                </span>
              )}
            </div>
          </div>

          {/* Note content */}
          <div className="bg-white rounded-2xl border p-6">
            {note?.content ? (
              <div
                className={cn(
                  'prose prose-sm max-w-none text-gray-700',
                  isUrdu && 'text-right font-[system-ui]'
                )}
                dir={isUrdu ? 'rtl' : 'ltr'}
                lang={note?.voiceLanguage || 'en'}
                dangerouslySetInnerHTML={{ __html: note.content }}
              />
            ) : (
              <p className="text-gray-400 text-sm italic">No content</p>
            )}
          </div>

          {/* Tags */}
          {note?.tags?.length > 0 && (
            <div className="bg-white rounded-2xl border p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tags</p>
              <div className="flex flex-wrap gap-2">
                {note.tags.map(tag => (
                  <TagBadge key={tag} tag={tag} />
                ))}
              </div>
            </div>
          )}

          {/* Action bar (bottom) */}
          <div className="flex items-center justify-between gap-3 pt-2 pb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleArchive}
                disabled={isArchiving}
                className="gap-1.5"
              >
                {note?.isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                {note?.isArchived ? 'Unarchive' : 'Archive'}
              </Button>
              <Button
                size="sm"
                onClick={() => navigate(`/notes/${noteId}/edit`)}
                className="bg-indigo-600 hover:bg-indigo-700 gap-1.5"
              >
                <Pencil className="w-4 h-4" />
                Edit Note
              </Button>
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
