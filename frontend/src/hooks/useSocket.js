import { useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { initSocket, getSocket, disconnectSocket } from '../lib/socket'
import { selectAccessToken } from '../features/auth/authSlice'
import {
  setSocketConnected,
  noteCreated,
  noteUpdated,
  noteDeleted,
  notePinned,
  noteArchived,
} from '../features/notes/notesSlice'
import { toast } from 'sonner'

export function useSocket() {
  const dispatch = useDispatch()
  const accessToken = useSelector(selectAccessToken)

  useEffect(() => {
    if (!accessToken) return

    const socket = initSocket(accessToken)

    function onConnect() {
      dispatch(setSocketConnected(true))
    }

    function onDisconnect(reason) {
      dispatch(setSocketConnected(false))
      if (reason === 'io server disconnect') {
        socket.connect()
      }
    }

    function onConnectError() {
      dispatch(setSocketConnected(false))
    }

    function onNoteCreated({ note }) {
      dispatch(noteCreated(note))
      toast.success(`New note "${note.title}" synced`, { duration: 2000 })
    }

    function onNoteUpdated({ note }) {
      dispatch(noteUpdated(note))
    }

    function onNoteDeleted({ noteId }) {
      dispatch(noteDeleted(noteId))
      toast.info('A note was removed', { duration: 2000 })
    }

    function onNotePinned({ noteId, isPinned }) {
      dispatch(notePinned({ noteId, isPinned }))
    }

    function onNoteArchived({ noteId, isArchived }) {
      dispatch(noteArchived({ noteId, isArchived }))
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)
    socket.on('note:created', onNoteCreated)
    socket.on('note:updated', onNoteUpdated)
    socket.on('note:deleted', onNoteDeleted)
    socket.on('note:pinned', onNotePinned)
    socket.on('note:archived', onNoteArchived)

    // Sync initial state if already connected
    if (socket.connected) dispatch(setSocketConnected(true))

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onConnectError)
      socket.off('note:created', onNoteCreated)
      socket.off('note:updated', onNoteUpdated)
      socket.off('note:deleted', onNoteDeleted)
      socket.off('note:pinned', onNotePinned)
      socket.off('note:archived', onNoteArchived)
    }
  }, [accessToken, dispatch])

  // Disconnect and clear state when logged out
  useEffect(() => {
    if (!accessToken) {
      disconnectSocket()
      dispatch(setSocketConnected(false))
    }
  }, [accessToken, dispatch])

  const emitTyping = useCallback((noteId) => {
    const sock = getSocket()
    if (sock?.connected) sock.emit('note:typing', { noteId })
  }, [])

  const emitStopTyping = useCallback((noteId) => {
    const sock = getSocket()
    if (sock?.connected) sock.emit('note:stopTyping', { noteId })
  }, [])

  return { emitTyping, emitStopTyping }
}
