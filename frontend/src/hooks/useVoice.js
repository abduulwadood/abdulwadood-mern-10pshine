import { useState, useRef, useCallback, useEffect } from 'react'

const isSupported =
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

const MAX_DURATION_MS = 5 * 60 * 1000 // 5-minute hard cap

export function useVoice({ onResult, onError, language = 'en-US' } = {}) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState(null)

  const recognitionRef  = useRef(null)
  const accumulatedRef  = useRef('')   // all final segments across restarts
  const keepGoingRef    = useRef(false) // user intent: stay recording
  const maxTimerRef     = useRef(null)

  // Keep always-fresh refs for callbacks and language so event handlers
  // set up in useEffect never go stale, and startListening can have [] deps.
  const onResultRef  = useRef(onResult)
  const onErrorRef   = useRef(onError)
  const languageRef  = useRef(language)
  useEffect(() => { onResultRef.current = onResult }, [onResult])
  useEffect(() => { onErrorRef.current  = onError  }, [onError])
  useEffect(() => { languageRef.current = language }, [language])

  useEffect(() => {
    if (!isSupported) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous     = true  // don't stop after first final result
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          accumulatedRef.current += text + ' '
          setTranscript(accumulatedRef.current.trim())
        } else {
          interim += text
        }
      }
      setInterimTranscript(interim)
    }

    recognition.onerror = (event) => {
      // 'aborted'  → our own abort() call during cleanup, ignore
      // 'no-speech'→ silence during continuous session, ignore (onend restarts)
      if (event.error === 'aborted' || event.error === 'no-speech') return

      const msgs = {
        'audio-capture': 'No microphone found. Please check your device.',
        'not-allowed':   'Microphone access denied. Please allow microphone access.',
        'network':       'Network error occurred during voice recognition.',
      }
      const message = msgs[event.error] ?? 'Voice recognition failed. Please try again.'
      keepGoingRef.current = false
      setError(message)
      onErrorRef.current?.(message)
    }

    recognition.onend = () => {
      setInterimTranscript('')

      if (keepGoingRef.current) {
        // Chrome ended the session naturally (silence / 60-s limit).
        // Restart immediately to keep recording without user noticing.
        try {
          recognition.lang = languageRef.current
          recognition.start()
          return // remain in listening state
        } catch {
          keepGoingRef.current = false // restart failed, fall through
        }
      }

      // Fully stopped — deliver result and reset UI
      setIsListening(false)
      if (maxTimerRef.current) { clearTimeout(maxTimerRef.current); maxTimerRef.current = null }

      const finalText = accumulatedRef.current.trim()
      if (finalText) onResultRef.current?.(finalText)
    }

    return () => {
      keepGoingRef.current = false
      recognition.abort()
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current)
    }
  }, []) // stable — all dependencies handled through refs

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError('Voice recognition is not supported in this browser.')
      return
    }

    accumulatedRef.current = ''
    keepGoingRef.current   = true
    setTranscript('')
    setInterimTranscript('')
    setError(null)

    const recognition = recognitionRef.current
    recognition.lang = languageRef.current

    // Set listening immediately so the Stop button appears without waiting
    // for the async onstart event.
    setIsListening(true)
    try {
      recognition.start()
      maxTimerRef.current = setTimeout(() => {
        keepGoingRef.current = false
        recognition.stop()
      }, MAX_DURATION_MS)
    } catch {
      // start() threw (e.g. already running) — revert
      keepGoingRef.current = false
      setIsListening(false)
      setError('Failed to start voice recognition. Please try again.')
    }
  }, []) // truly stable — uses refs only

  const stopListening = useCallback(() => {
    keepGoingRef.current = false
    if (maxTimerRef.current) { clearTimeout(maxTimerRef.current); maxTimerRef.current = null }
    recognitionRef.current?.stop() // triggers onend → delivers accumulated result
  }, [])

  const resetTranscript = useCallback(() => {
    accumulatedRef.current = ''
    setTranscript('')
    setInterimTranscript('')
    setError(null)
  }, [])

  return { isListening, transcript, interimTranscript, isSupported, error, startListening, stopListening, resetTranscript }
}
