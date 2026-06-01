import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { toast } from 'sonner'
import { Keyboard, Mic } from 'lucide-react'
import {
  useGetNoteByIdQuery,
  useCreateNoteMutation,
  useCreateVoiceNoteMutation,
  useUpdateNoteMutation,
} from '../../features/notes/notesApi'
import { useVoice } from '../../hooks/useVoice'
import { ROUTES, TOAST_MESSAGES, VOICE_LANGUAGES } from '../../constants'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '../../components/ui/alert-dialog'
import { EditorHeader } from '../../components/editor/EditorHeader'
import { EditorToolbar } from '../../components/editor/EditorToolbar'
import { EditorFooter } from '../../components/editor/EditorFooter'
import { EditorSkeleton } from '../../components/editor/EditorSkeleton'
import { ColorPicker } from '../../components/editor/ColorPicker'
import { TagsInput } from '../../components/editor/TagsInput'
import { VoiceModePanel } from '../../components/editor/VoiceModePanel'

const CHAR_LIMIT = 50000

export default function NoteEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isCreateMode = !id
  const DRAFT_KEY = isCreateMode ? 'note_draft_new' : `note_draft_${id}`

  const [title, setTitle] = useState('')
  const [tags, setTags] = useState([])
  const [color, setColor] = useState('#ffffff')
  const [isPinned, setIsPinned] = useState(false)
  const [inputMethod, setInputMethod] = useState('typed')
  const [voiceLanguage, setVoiceLanguage] = useState('en-US')
  const [voiceMetadata, setVoiceMetadata] = useState(null)
  const [appendMode, setAppendMode] = useState(true)
  const [isDirty, setIsDirty] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const [isVoicePanelOpen, setIsVoicePanelOpen] = useState(false)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [pendingNav, setPendingNav] = useState(null)

  const handleSaveRef = useRef(null)
  const voiceResultRef = useRef(null)

  // API
  const { data: noteData, isLoading: isNoteLoading } = useGetNoteByIdQuery(id, { skip: isCreateMode })
  const [createNote, { isLoading: isCreating }] = useCreateNoteMutation()
  const [createVoiceNote, { isLoading: isCreatingVoice }] = useCreateVoiceNoteMutation()
  const [updateNote, { isLoading: isUpdating }] = useUpdateNoteMutation()
  const isSaving = isCreating || isCreatingVoice || isUpdating

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Placeholder.configure({ placeholder: 'Start writing your note...' }),
      CharacterCount.configure({ limit: CHAR_LIMIT }),
    ],
    content: '',
    onUpdate: () => setIsDirty(true),
    editorProps: {
      attributes: { class: 'focus:outline-none' },
    },
  })

  // Pre-fill edit mode
  useEffect(() => {
    if (!noteData || isCreateMode || !editor) return
    const note = noteData?.data?.note ?? noteData?.data
    if (!note) return
    setTitle(note.title || '')
    setTags(note.tags || [])
    setColor(note.color || '#ffffff')
    setIsPinned(note.isPinned || false)
    setInputMethod(note.inputMethod || 'typed')
    setVoiceLanguage(note.voiceLanguage || 'en-US')
    editor.commands.setContent(note.content || '')
    setIsDirty(false)
  }, [noteData, isCreateMode, editor])

  // Load draft (create mode only, once)
  useEffect(() => {
    if (!isCreateMode || !editor || draftLoaded) return
    setDraftLoaded(true)
    const saved = localStorage.getItem(DRAFT_KEY)
    if (!saved) return
    try {
      const draft = JSON.parse(saved)
      const ageMs = Date.now() - new Date(draft.savedAt).getTime()
      if (ageMs > 86400000) { localStorage.removeItem(DRAFT_KEY); return }
      setTitle(draft.title || '')
      setTags(draft.tags || [])
      setColor(draft.color || '#ffffff')
      setIsPinned(draft.isPinned || false)
      editor.commands.setContent(draft.content || '')
      toast.info('Restored unsaved draft', {
        action: {
          label: 'Discard',
          onClick: () => {
            localStorage.removeItem(DRAFT_KEY)
            editor.commands.clearContent()
            setTitle('')
            setTags([])
            setColor('#ffffff')
            setIsPinned(false)
            setIsDirty(false)
          },
        },
      })
    } catch {
      localStorage.removeItem(DRAFT_KEY)
    }
  }, [isCreateMode, editor, draftLoaded, DRAFT_KEY])

  // Auto-save draft (3 s debounce via cleanup)
  useEffect(() => {
    if (!isDirty || !editor) return
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          title,
          content: editor.getHTML(),
          tags,
          color,
          isPinned,
          savedAt: new Date().toISOString(),
        }))
      } catch { /* storage quota exceeded */ }
    }, 3000)
    return () => clearTimeout(timer)
  }, [isDirty, title, tags, color, isPinned, editor, DRAFT_KEY])

  // Browser unload guard
  useEffect(() => {
    const handler = (e) => {
      if (isDirty) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // Ctrl+S keyboard shortcut (stable via ref)
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSaveRef.current?.()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Voice — stable callbacks via refs to break circular dependency
  const stableOnResult = useCallback((text) => voiceResultRef.current?.(text), [])
  const stableOnError = useCallback((err) => toast.error(`Voice error: ${err}`), [])

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoice({ language: voiceLanguage, onResult: stableOnResult, onError: stableOnError })

  const handleVoiceResult = useCallback((text) => {
    if (!text.trim() || !editor) return
    if (appendMode) {
      const current = editor.getHTML()
      editor.commands.setContent(
        current && current !== '<p></p>'
          ? current + `<p>${text}</p>`
          : `<p>${text}</p>`
      )
    } else {
      editor.commands.setContent(`<p>${text}</p>`)
    }
    // Force ProseMirror to recognise the change and fire onUpdate
    editor.view.dispatch(editor.state.tr.setMeta('addToHistory', false))
    setVoiceMetadata({
      language: voiceLanguage,
      languageName: Object.values(VOICE_LANGUAGES).find(l => l.code === voiceLanguage)?.label,
    })
    setInputMethod(prev => prev === 'typed' ? 'mixed' : 'voice')
    setIsDirty(true)
    // Don't call resetTranscript here — let "Voice captured!" stay visible
    toast.success(voiceLanguage === 'ur-PK' ? 'آواز کامیابی سے شامل کی گئی!' : 'Voice content added!')
  }, [editor, appendMode, voiceLanguage])

  // Keep ref in sync so stableOnResult always calls the latest handler
  voiceResultRef.current = handleVoiceResult

  const handleStartVoice = useCallback(() => {
    resetTranscript()
    startListening()
  }, [resetTranscript, startListening])

  // Save
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      toast.error('Please add a title to your note')
      return
    }
    const content = editor?.getHTML() || ''
    if (!content || content === '<p></p>') {
      toast.error('Please add some content to your note')
      return
    }

    const payload = {
      title: title.trim(),
      content,
      tags,
      color,
      isPinned,
      inputMethod,
      ...(inputMethod !== 'typed' && { voiceLanguage }),
      ...(voiceMetadata && { voiceMetadata }),
    }

    try {
      if (isCreateMode) {
        if (inputMethod === 'voice') {
          await createVoiceNote(payload).unwrap()
        } else {
          await createNote(payload).unwrap()
        }
        toast.success(TOAST_MESSAGES.NOTE_CREATED)
      } else {
        await updateNote({ id, ...payload }).unwrap()
        toast.success(TOAST_MESSAGES.NOTE_UPDATED)
      }
      localStorage.removeItem(DRAFT_KEY)
      setIsDirty(false)
      setLastSavedAt(new Date())
      navigate(ROUTES.DASHBOARD)
    } catch (err) {
      toast.error(err?.data?.message || TOAST_MESSAGES.ERROR_GENERIC)
    }
  }, [
    title, editor, tags, color, isPinned, inputMethod,
    voiceLanguage, voiceMetadata, isCreateMode, id,
    createNote, createVoiceNote, updateNote, DRAFT_KEY, navigate,
  ])

  // Keep ref in sync for keyboard shortcut
  handleSaveRef.current = handleSave

  // Guard navigation when there are unsaved changes
  const guardedNavigate = useCallback((target) => {
    if (isDirty) {
      setPendingNav(target)
      setShowLeaveDialog(true)
    } else {
      navigate(target)
    }
  }, [isDirty, navigate])

  function handleLeave() {
    setShowLeaveDialog(false)
    navigate(pendingNav ?? -1)
  }

  const wordCount = editor?.storage.characterCount?.words() ?? 0
  const characterCount = editor?.storage.characterCount?.characters() ?? 0
  const isRtl = voiceLanguage === 'ur-PK'

  if (!isCreateMode && isNoteLoading) {
    return (
      <div className="flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
        <EditorSkeleton />
      </div>
    )
  }

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        height: 'calc(100vh - 4rem)',
        backgroundColor: color !== '#ffffff' ? color + '40' : undefined,
      }}
    >
      {/* 1. Header */}
      <EditorHeader
        title={title}
        onTitleChange={(val) => { setTitle(val); setIsDirty(true) }}
        isPinned={isPinned}
        onPinToggle={() => setIsPinned(p => !p)}
        isVoicePanelOpen={isVoicePanelOpen}
        onVoicePanelToggle={() => setIsVoicePanelOpen(p => !p)}
        isListening={isListening}
        voiceSupported={isSupported}
        onSave={handleSave}
        isSaving={isSaving}
        isDirty={isDirty}
        onBack={() => guardedNavigate(-1)}
      />

      {/* 2. Formatting toolbar */}
      <EditorToolbar editor={editor} />

      {/* 3. Metadata bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-gray-50 flex-shrink-0 flex-wrap">
        <ColorPicker value={color} onChange={setColor} />
        <div className="flex-1 min-w-[160px]">
          <TagsInput tags={tags} onChange={setTags} />
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
          {inputMethod === 'typed' && (
            <><Keyboard className="w-3 h-3" /><span>Typed</span></>
          )}
          {inputMethod === 'voice' && (
            <><Mic className="w-3 h-3 text-indigo-500" /><span className="text-indigo-500">Voice</span></>
          )}
          {inputMethod === 'mixed' && (
            <span className="text-indigo-500">🎤+⌨️ Mixed</span>
          )}
        </div>
      </div>

      {/* 4. Voice panel */}
      {isVoicePanelOpen && (
        <div className="flex-shrink-0 pt-2">
          <VoiceModePanel
            language={voiceLanguage}
            onLanguageChange={setVoiceLanguage}
            appendMode={appendMode}
            onAppendModeChange={setAppendMode}
            isListening={isListening}
            onStart={handleStartVoice}
            onStop={stopListening}
            interimTranscript={interimTranscript}
            finalTranscript={transcript}
            error={voiceError}
            isSupported={isSupported}
            onClose={() => setIsVoicePanelOpen(false)}
          />
        </div>
      )}

      {/* 5. TipTap editor (scrollable) */}
      <div
        className="flex-1 overflow-auto bg-white"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <EditorContent editor={editor} className="h-full" />
      </div>

      {/* 6. Footer */}
      <EditorFooter
        wordCount={wordCount}
        characterCount={characterCount}
        lastSavedAt={lastSavedAt}
        isDirty={isDirty}
        onCancel={() => guardedNavigate(-1)}
        onSave={handleSave}
        isSaving={isSaving}
        title={title}
      />

      {/* 7. Unsaved changes dialog */}
      {showLeaveDialog && (
        <AlertDialog open onOpenChange={() => setShowLeaveDialog(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. Are you sure you want to leave without saving?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowLeaveDialog(false)}>
                Stay
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLeave}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Leave anyway
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
