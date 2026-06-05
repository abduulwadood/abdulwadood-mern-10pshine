import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Plus, RefreshCw, X, Download, Upload } from 'lucide-react'
import { toast } from 'sonner'
import {
  selectFilters,
  selectPagination,
  setFilters,
  resetFilters,
  setPagination,
  setPage,
} from '../../features/notes/notesSlice'
import {
  useGetNotesQuery,
  useDeleteNoteMutation,
  useTogglePinMutation,
  useToggleArchiveMutation,
} from '../../features/notes/notesApi'
import { ROUTES, TOAST_MESSAGES } from '../../constants'
import { Button } from '../../components/ui/button'
import { SearchBar } from '../../components/notes/SearchBar'
import { FilterPanel } from '../../components/notes/FilterPanel'
import { SortDropdown } from '../../components/notes/SortDropdown'
import { ViewToggle } from '../../components/notes/ViewToggle'
import { NoteGrid } from '../../components/notes/NoteGrid'
import { NoteList } from '../../components/notes/NoteList'
import { NoteCardSkeleton } from '../../components/notes/NoteCardSkeleton'
import { EmptyState } from '../../components/notes/EmptyState'
import { Pagination } from '../../components/notes/Pagination'
import { DeleteConfirmDialog } from '../../components/notes/DeleteConfirmDialog'
import { TagBadge } from '../../components/notes/TagBadge'
import ExportNotesDialog from '../../components/notes/ExportNotesDialog'
import ImportNotesDialog from '../../components/notes/ImportNotesDialog'

function ActiveFilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
      {label}
      <button type="button" onClick={onRemove} className="hover:opacity-70">
        <X className="w-3 h-3" />
      </button>
    </span>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const filters = useSelector(selectFilters)
  const pagination = useSelector(selectPagination)

  const [view, setView] = useState(() => localStorage.getItem('notes_view') || 'grid')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)

  // Build query params
  const queryParams = {
    page: pagination.currentPage,
    limit: pagination.pageSize,
    sort: filters.sort,
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.inputMethod && filters.inputMethod !== 'all' ? { inputMethod: filters.inputMethod } : {}),
    ...(filters.voiceLanguage ? { voiceLanguage: filters.voiceLanguage } : {}),
    ...(filters.tags?.length ? { tags: filters.tags.join(',') } : {}),
    ...(filters.color ? { color: filters.color } : {}),
    isArchived: filters.isArchived,
    ...(filters.isPinned != null ? { isPinned: filters.isPinned } : {}),
  }

  const { data, isLoading, isFetching, error, refetch } = useGetNotesQuery(queryParams)
  const [deleteNote, { isLoading: isDeleting }] = useDeleteNoteMutation()
  const [togglePin] = useTogglePinMutation()
  const [toggleArchive] = useToggleArchiveMutation()

  // Sync pagination from API response
  useEffect(() => {
    if (data?.data?.pagination) {
      dispatch(setPagination(data.data.pagination))
    }
  }, [data, dispatch])

  const notes = data?.data?.notes || []
  const isEmpty = !isLoading && notes.length === 0

  // Compute active filter chips
  const activeChips = []
  if (filters.search) activeChips.push({ key: 'search', label: `"${filters.search}"`, clear: () => dispatch(setFilters({ search: '' })) })
  if (filters.inputMethod && filters.inputMethod !== 'all') activeChips.push({ key: 'method', label: `Type: ${filters.inputMethod}`, clear: () => dispatch(setFilters({ inputMethod: 'all' })) })
  if (filters.voiceLanguage) activeChips.push({ key: 'lang', label: `Lang: ${filters.voiceLanguage === 'ur-PK' ? 'Urdu' : 'English'}`, clear: () => dispatch(setFilters({ voiceLanguage: '' })) })
  if (filters.tags?.length) filters.tags.forEach(t => activeChips.push({ key: `tag-${t}`, label: `#${t}`, clear: () => dispatch(setFilters({ tags: filters.tags.filter(x => x !== t) })) }))
  if (filters.color) activeChips.push({ key: 'color', label: 'Color filter', clear: () => dispatch(setFilters({ color: '' })) })

  function getEmptyVariant() {
    if (filters.search) return 'search'
    if (filters.isPinned) return 'pinned'
    if (filters.isArchived) return 'archived'
    if (filters.inputMethod === 'voice') return 'voice'
    return 'default'
  }

  const handleDelete = useCallback((noteId) => setDeleteTarget(noteId), [])

  const confirmDelete = useCallback(async () => {
    try {
      await deleteNote(deleteTarget).unwrap()
      toast.success(TOAST_MESSAGES.NOTE_DELETED)
      setDeleteTarget(null)
    } catch {
      toast.error(TOAST_MESSAGES.ERROR_GENERIC)
    }
  }, [deleteTarget, deleteNote])

  const handlePin = useCallback(async (noteId) => {
    try {
      const res = await togglePin(noteId).unwrap()
      const pinned = res?.data?.note?.isPinned ?? res?.data?.isPinned
      toast.success(pinned ? TOAST_MESSAGES.NOTE_PINNED : TOAST_MESSAGES.NOTE_UNPINNED)
    } catch {
      toast.error(TOAST_MESSAGES.ERROR_GENERIC)
    }
  }, [togglePin])

  const handleArchive = useCallback(async (noteId) => {
    try {
      const res = await toggleArchive(noteId).unwrap()
      const archived = res?.data?.note?.isArchived ?? res?.data?.isArchived
      toast.success(archived ? TOAST_MESSAGES.NOTE_ARCHIVED : TOAST_MESSAGES.NOTE_UNARCHIVED)
    } catch {
      toast.error(TOAST_MESSAGES.ERROR_GENERIC)
    }
  }, [toggleArchive])

  const handleNoteClick = useCallback((noteId) => {
    navigate(ROUTES.NOTE_DETAIL.replace(':id', noteId))
  }, [navigate])

  const handlePageChange = useCallback((page) => {
    dispatch(setPage(page))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [dispatch])

  const handleViewChange = useCallback((newView) => {
    setView(newView)
    localStorage.setItem('notes_view', newView)
  }, [])

  const handleEmptyAction = useCallback(() => {
    if (filters.search) {
      dispatch(setFilters({ search: '' }))
    } else {
      navigate(ROUTES.NOTE_NEW)
    }
  }, [filters.search, dispatch, navigate])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-500 text-sm">Failed to load notes.</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-gray-200 bg-white">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Notes</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isLoading ? '...' : `${pagination.totalNotes} note${pagination.totalNotes !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportOpen(true)}
            className="gap-1.5 hidden sm:flex"
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportOpen(true)}
            className="gap-1.5 hidden sm:flex"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            onClick={() => navigate(ROUTES.NOTE_NEW)}
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Note</span>
          </Button>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-4 pt-3 pb-1">
        <SearchBar className="w-full" />
      </div>

      {/* Filter panel */}
      <div className="px-4 lg:px-6 py-3 border-b border-gray-100 bg-white">
        <FilterPanel />
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap px-4 lg:px-6 py-2 bg-white border-b border-gray-100">
          {activeChips.map(chip => (
            <ActiveFilterChip key={chip.key} label={chip.label} onRemove={chip.clear} />
          ))}
          <button
            type="button"
            onClick={() => { dispatch(resetFilters()); dispatch(setPage(1)) }}
            className="text-xs text-red-500 hover:text-red-700 font-medium ml-1 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-2.5 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          {isFetching && !isLoading && (
            <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
          )}
          <p className="text-xs text-gray-500">
            {isFetching && !isLoading ? 'Refreshing...' : `${pagination.totalNotes} results`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SortDropdown />
          <ViewToggle view={view} onToggle={handleViewChange} />
        </div>
      </div>

      {/* Notes content */}
      <div className="flex-1 px-4 lg:px-6 py-5">
        {isLoading ? (
          <div className={view === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'flex flex-col'
          }>
            {Array.from({ length: 6 }, (_, i) => (
              <NoteCardSkeleton key={i} list={view === 'list'} />
            ))}
          </div>
        ) : isEmpty ? (
          <EmptyState variant={getEmptyVariant()} onAction={handleEmptyAction} />
        ) : view === 'grid' ? (
          <NoteGrid
            notes={notes}
            onDelete={handleDelete}
            onPin={handlePin}
            onArchive={handleArchive}
            onClick={handleNoteClick}
          />
        ) : (
          <NoteList
            notes={notes}
            onDelete={handleDelete}
            onPin={handlePin}
            onArchive={handleArchive}
            onClick={handleNoteClick}
          />
        )}

        {!isEmpty && !isLoading && (
          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        )}
      </div>

      <DeleteConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />

      <ExportNotesDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      <ImportNotesDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImported={() => {
          setIsImportOpen(false)
          refetch()
        }}
      />
    </div>
  )
}
