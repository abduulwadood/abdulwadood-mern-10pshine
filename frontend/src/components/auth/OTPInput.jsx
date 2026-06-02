import { useState, useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'

export function OTPInput({ onChange, error, disabled, dark = false }) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  function updateOtp(next) {
    setOtp(next)
    onChange(next.join(''))
  }

  function handleChange(index, raw) {
    const digit = raw.replace(/\D/g, '').slice(-1)
    if (!digit) return

    const next = [...otp]
    next[index] = digit
    updateOtp(next)

    if (index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (otp[index]) {
        const next = [...otp]
        next[index] = ''
        updateOtp(next)
      } else if (index > 0) {
        const next = [...otp]
        next[index - 1] = ''
        updateOtp(next)
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return

    const next = ['', '', '', '', '', '']
    pasted.split('').forEach((d, i) => { next[i] = d })
    updateOtp(next)

    const focusIndex = Math.min(pasted.length, 5)
    inputRefs.current[focusIndex]?.focus()
  }

  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={el => { inputRefs.current[index] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={e => handleChange(index, e.target.value)}
          onKeyDown={e => handleKeyDown(index, e)}
          onPaste={index === 0 ? handlePaste : undefined}
          aria-label={`Digit ${index + 1} of 6`}
          className={cn(
            'w-10 h-12 sm:w-12 sm:h-14',
            'text-center text-xl sm:text-2xl font-bold',
            'border-2 rounded-lg',
            'focus:outline-none transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            dark
              ? [
                  'bg-white/10 text-white',
                  error
                    ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/30'
                    : digit
                      ? 'border-indigo-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30'
                      : 'border-white/30 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30',
                ]
              : [
                  'bg-white',
                  error
                    ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                    : digit
                      ? 'border-indigo-500 bg-indigo-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200',
                ]
          )}
        />
      ))}
    </div>
  )
}
