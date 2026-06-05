import { createSlice } from '@reduxjs/toolkit'

const notesSlice = createSlice({
  name: 'notes',
  initialState: {
    notes: [],
    currentNote: null,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalNotes: 0,
      pageSize: 10,
      hasNextPage: false,
      hasPrevPage: false,
    },
    filters: {
      search: '',
      inputMethod: 'all',
      voiceLanguage: '',
      tags: [],
      isArchived: false,
      isPinned: null,
      sort: '-createdAt',
    },
    stats: null,
    tags: [],
    isVoiceActive: false,
    voiceLanguage: 'en-US',
    voiceTranscript: '',
    isLoading: false,
    error: null,
    socketConnected: false,
  },
  reducers: {
    setNotes(state, action) {
      state.notes = action.payload
    },
    setCurrentNote(state, action) {
      state.currentNote = action.payload
    },
    setPagination(state, action) {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload }
    },
    resetFilters(state) {
      state.filters = {
        search: '',
        inputMethod: 'all',
        voiceLanguage: '',
        tags: [],
        isArchived: false,
        isPinned: null,
        sort: '-createdAt',
      }
    },
    setStats(state, action) {
      state.stats = action.payload
    },
    setTags(state, action) {
      state.tags = action.payload
    },
    setVoiceActive(state, action) {
      state.isVoiceActive = action.payload
    },
    setVoiceLanguage(state, action) {
      state.voiceLanguage = action.payload
    },
    setVoiceTranscript(state, action) {
      state.voiceTranscript = action.payload
    },
    clearVoiceTranscript(state) {
      state.voiceTranscript = ''
    },
    addNoteOptimistic(state, action) {
      state.notes.unshift(action.payload)
    },
    updateNoteOptimistic(state, action) {
      const idx = state.notes.findIndex((n) => n._id === action.payload._id)
      if (idx !== -1) state.notes[idx] = action.payload
    },
    removeNoteOptimistic(state, action) {
      state.notes = state.notes.filter((n) => n._id !== action.payload)
    },
    setPage(state, action) {
      state.pagination.currentPage = action.payload
    },
    // ── Socket connection status ──────────────────────────────────────────────
    setSocketConnected(state, action) {
      state.socketConnected = action.payload
    },
    // ── Real-time note events from Socket.IO ─────────────────────────────────
    noteCreated(state, action) {
      const exists = state.notes.some((n) => n._id === action.payload._id)
      if (!exists) {
        state.notes.unshift(action.payload)
        state.pagination.totalNotes += 1
      }
    },
    noteUpdated(state, action) {
      const index = state.notes.findIndex((n) => n._id === action.payload._id)
      if (index !== -1) state.notes[index] = action.payload
    },
    noteDeleted(state, action) {
      state.notes = state.notes.filter((n) => n._id !== action.payload)
      state.pagination.totalNotes = Math.max(0, state.pagination.totalNotes - 1)
    },
    notePinned(state, action) {
      const note = state.notes.find((n) => n._id === action.payload.noteId)
      if (note) note.isPinned = action.payload.isPinned
    },
    noteArchived(state, action) {
      const note = state.notes.find((n) => n._id === action.payload.noteId)
      if (note) note.isArchived = action.payload.isArchived
    },
  },
})

export const {
  setNotes,
  setCurrentNote,
  setPagination,
  setFilters,
  resetFilters,
  setStats,
  setTags,
  setVoiceActive,
  setVoiceLanguage,
  setVoiceTranscript,
  clearVoiceTranscript,
  addNoteOptimistic,
  updateNoteOptimistic,
  removeNoteOptimistic,
  setPage,
  setSocketConnected,
  noteCreated,
  noteUpdated,
  noteDeleted,
  notePinned,
  noteArchived,
} = notesSlice.actions

export const selectAllNotes = (state) => state.notes.notes
export const selectCurrentNote = (state) => state.notes.currentNote
export const selectPagination = (state) => state.notes.pagination
export const selectFilters = (state) => state.notes.filters
export const selectStats = (state) => state.notes.stats
export const selectTags = (state) => state.notes.tags
export const selectIsVoiceActive = (state) => state.notes.isVoiceActive
export const selectVoiceLanguage = (state) => state.notes.voiceLanguage
export const selectVoiceTranscript = (state) => state.notes.voiceTranscript
export const selectSocketConnected = (state) => state.notes.socketConnected

export default notesSlice.reducer
