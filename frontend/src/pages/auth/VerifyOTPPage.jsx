import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Loader2, CheckCircle, ShieldCheck, ArrowLeft, RefreshCw,
} from 'lucide-react'
import { useVerifyOTPMutation, useResendOTPMutation } from '../../features/auth/authApi'
import { OTPInput } from '../../components/auth/OTPInput'
import { ROUTES, TOAST_MESSAGES } from '../../constants'
import { cn } from '../../lib/utils'

const RESEND_COOLDOWN = 2 * 60

function useCountdown(expiresAt) {
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    if (!expiresAt) return

    const calc = () => Math.max(0, Math.floor((new Date(expiresAt) - new Date()) / 1000))

    setTimeLeft(calc())
    const id = setInterval(() => {
      const remaining = calc()
      setTimeLeft(remaining)
      if (remaining === 0) clearInterval(id)
    }, 1000)

    return () => clearInterval(id)
  }, [expiresAt])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return { timeLeft, display, isExpired: timeLeft === 0 }
}

function useResendCooldown() {
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const id = setTimeout(() => setSecondsLeft(s => s - 1), 1000)
    return () => clearTimeout(id)
  }, [secondsLeft])

  const reset = useCallback(() => setSecondsLeft(RESEND_COOLDOWN), [])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return { canResend: secondsLeft <= 0, display, reset }
}

export default function VerifyOTPPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const email =
    location.state?.email ||
    sessionStorage.getItem('pending_verification_email') ||
    ''

  const [otpExpiresAt, setOtpExpiresAt] = useState(
    location.state?.otpExpiresAt || new Date(Date.now() + 10 * 60 * 1000).toISOString()
  )

  const [otpValue, setOtpValue] = useState('')
  const [otpError, setOtpError] = useState('')
  const [shakeOTP, setShakeOTP] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [otpKey, setOtpKey] = useState(0)

  const { timeLeft, display: expiryDisplay, isExpired } = useCountdown(otpExpiresAt)
  const { canResend, display: resendDisplay, reset: resetCooldown } = useResendCooldown()

  const [verifyOTP, { isLoading: isVerifying }] = useVerifyOTPMutation()
  const [resendOTP, { isLoading: isResending }] = useResendOTPMutation()

  useEffect(() => {
    if (!email) navigate(ROUTES.REGISTER, { replace: true })
  }, [email, navigate])

  function triggerShake() {
    setShakeOTP(true)
    setTimeout(() => setShakeOTP(false), 500)
  }

  const handleVerify = useCallback(async (code) => {
    const otp = code ?? otpValue
    if (otp.length !== 6 || isExpired) return
    setOtpError('')

    try {
      await verifyOTP({ email, otp }).unwrap()
      sessionStorage.removeItem('pending_verification_email')
      setIsVerified(true)
      toast.success(TOAST_MESSAGES.OTP_VERIFIED)
      setTimeout(() => {
        navigate(ROUTES.LOGIN, {
          state: { message: 'Account verified! Please sign in to continue.' },
        })
      }, 1500)
    } catch (error) {
      const msg = error?.data?.message || error?.message || 'Invalid OTP. Please try again.'
      setOtpError(msg)
      triggerShake()
      setOtpValue('')
      setOtpKey(k => k + 1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, isExpired, otpValue])

  const handleResend = async () => {
    if (!canResend) return
    try {
      const result = await resendOTP({ email }).unwrap()
      if (result.data?.otpExpiresAt) setOtpExpiresAt(result.data.otpExpiresAt)
      resetCooldown()
      setOtpError('')
      toast.success(TOAST_MESSAGES.OTP_RESENT)
    } catch (error) {
      toast.error(error?.data?.message || TOAST_MESSAGES.ERROR_GENERIC)
    }
  }

  useEffect(() => {
    if (otpValue.length === 6 && !isExpired && !isVerified) {
      handleVerify(otpValue)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpValue])

  if (!email) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4 overflow-hidden relative">

      {/* Background blobs */}
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Logo + heading */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-500/50 hover:scale-110 transition-transform duration-300">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Verify your email</h1>
          <p className="text-indigo-200 text-sm">
            We sent a 6-digit code to{' '}
            <span className="text-white font-medium">{email}</span>
          </p>
        </div>

        {/* Glass card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 animate-fade-in-up">

          {isVerified ? (
            <div className="flex flex-col items-center gap-4 py-6 animate-fade-in">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-green-400 font-semibold text-lg">Email verified!</p>
              <p className="text-white/50 text-sm flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Redirecting to login...
              </p>
            </div>
          ) : (
            <div className="space-y-6">

              {/* OTP boxes */}
              <div className={cn('space-y-3', shakeOTP && 'shake')}>
                <OTPInput
                  key={otpKey}
                  onChange={setOtpValue}
                  error={!!otpError}
                  disabled={isVerifying || isExpired}
                  dark
                />
                {otpError && (
                  <p role="alert" className="text-red-400 text-sm text-center animate-slide-down">
                    {otpError}
                  </p>
                )}
              </div>

              {/* Expiry timer */}
              <div className="text-center text-sm">
                {isExpired ? (
                  <p className="text-red-400 font-medium">
                    Code expired. Please request a new one.
                  </p>
                ) : (
                  <p className="text-white/50">
                    Code expires in{' '}
                    <span className={cn('font-mono font-semibold', timeLeft <= 60 ? 'text-red-400' : 'text-white/80')}>
                      {expiryDisplay}
                    </span>
                  </p>
                )}
              </div>

              {/* Verify button */}
              <button
                type="button"
                onClick={() => handleVerify()}
                disabled={otpValue.length !== 6 || isVerifying || isExpired}
                className={cn(
                  'w-full py-3 rounded-xl font-semibold text-sm',
                  'bg-gradient-to-r from-indigo-500 to-purple-600',
                  'hover:from-indigo-600 hover:to-purple-700',
                  'shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60',
                  'transition-all duration-300 text-white',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isVerifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  'Verify Email'
                )}
              </button>

              {/* Resend */}
              <div className="text-center text-sm space-y-1">
                <p className="text-white/40">Didn&apos;t receive the code?</p>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="text-indigo-300 hover:text-indigo-200 font-semibold transition-colors flex items-center gap-1.5 mx-auto disabled:opacity-50"
                  >
                    {isResending ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sending...</>
                    ) : (
                      <><RefreshCw className="w-3.5 h-3.5" />Resend OTP</>
                    )}
                  </button>
                ) : (
                  <p className="text-white/30">
                    Resend available in{' '}
                    <span className="font-mono text-white/50">{resendDisplay}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Back link */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate(ROUTES.REGISTER)}
              className="text-white/30 hover:text-white/60 text-xs flex items-center gap-1 mx-auto transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Register
            </button>
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-6 animate-fade-in">
          Check your spam folder if you don&apos;t see the email
        </p>
      </div>
    </div>
  )
}
