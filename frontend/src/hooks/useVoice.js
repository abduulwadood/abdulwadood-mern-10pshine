import { useState, useRef, useCallback, useEffect } from 'react'

const isSupported =
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

export function useVoice({ onResult, onError, language = 'en-US' } = {}) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (!isSupported) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    return () => {
      recognition.stop()
    }
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError('Voice recognition is not supported in this browser.')
      return
    }

    setTranscript('')
    setInterimTranscript('')
    setError(null)

    const recognition = recognitionRef.current
    recognition.lang = language

    recognition.onstart = () => setIsListening(true)

    recognition.onend = () => setIsListening(false)

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += text
        } else {
          interim += text
        }
      }
      setInterimTranscript(interim)
      if (final) {
        setTranscript(final)
        if (onResult) onResult(final)
      }
    }

    recognition.onerror = (event) => {
      const errorMessages = {
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'No microphone found. Please check your device.',
        'not-allowed': 'Microphone access denied. Please allow microphone access.',
        'network': 'Network error occurred during voice recognition.',
        'aborted': 'Voice recognition was aborted.',
      }
      const message = errorMessages[event.error] || 'Voice recognition failed. Please try again.'
      setError(message)
      setIsListening(false)
      if (onError) onError(message)
    }

    try {
      recognition.start()
    } catch (err) {
      setError('Failed to start voice recognition.')
      setIsListening(false)
    }
  }, [language, onResult, onError])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
  }, [])

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  }
}
