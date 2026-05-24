import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, CheckCircle } from 'lucide-react'
import { useVerifyOTPMutation, useResendOTPMutation } from '../../features/auth/authApi'
import AuthLayout from '../../components/layout/AuthLayout'
import { AuthFormWrapper } from '../../components/auth/AuthFormWrapper'
import { OTPInput } from '../../components/auth/OTPInput'
import { Button } from '../../components/ui/button'
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
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) { setCanResend(true); return }
    const id = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { clearInterval(id); setCanResend(true); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [cooldown])

  const reset = useCallback(() => {
    setCanResend(false)
    setCooldown(RESEND_COOLDOWN)
  }, [])

  const minutes = Math.floor(cooldown / 60)
  const seconds = cooldown % 60
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return { canResend, display, reset }
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
  const [otpKey, setOtpKey] = useState(0) // remount OTPInput to clear it

  const { timeLeft, display: expiryDisplay, isExpired } = useCountdown(otpExpiresAt)
  const { canResend, display: resendDisplay, reset: resetCooldown } = useResendCooldown()

  const [verifyOTP, { isLoading: isVerifying }] = useVerifyOTPMutation()
  const [resendOTP, { isLoading: isResending }] = useResendOTPMutation()

  // Redirect if no email
  useEffect(() => {
    if (!email) navigate(ROUTES.REGISTER, { replace: true })
  }, [email, navigate])

  function triggerShake() {
    setShakeOTP(true)
    setTimeout(() => setShakeOTP(false), 500)
  }

  const handleVerify = async () => {
    if (otpValue.length !== 6 || isExpired) return
    setOtpError('')

    try {
      await verifyOTP({ email, otp: otpValue }).unwrap()
      sessionStorage.removeItem('pending_verification_email')
      setIsVerified(true)
      toast.success(TOAST_MESSAGES.OTP_VERIFIED)
      setTimeout(() => {
        navigate(ROUTES.LOGIN, {
          state: { message: 'Account verified! Please login to continue.' },
        })
      }, 1500)
    } catch (error) {
      const msg = error?.data?.message || error?.message || 'Invalid OTP. Please try again.'
      setOtpError(msg)
      triggerShake()
      // Clear boxes by remounting
      setOtpValue('')
      setOtpKey(k => k + 1)
    }
  }

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

  // Auto-submit when 6th digit is entered
  useEffect(() => {
    if (otpValue.length === 6 && !isExpired && !isVerified) {
      handleVerify()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpValue])

  if (!email) return null

  return (
    <AuthLayout>
      <AuthFormWrapper
        title="Verify your email"
        subtitle={
          <span>
            We sent a 6-digit code to{' '}
            <span className="font-medium text-indigo-600">{email}</span>
          </span>
        }
      >
        <div className="space-y-6">
          {isVerified ? (
            <div className="flex flex-col items-center gap-3 py-4 animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-green-600 font-medium">Email verified!</p>
              <p className="text-muted-foreground text-sm">Redirecting to login...</p>
            </div>
          ) : (
            <>
              {/* OTP boxes */}
              <div className={cn('space-y-3', shakeOTP && 'shake')}>
                <OTPInput
                  key={otpKey}
                  onChange={setOtpValue}
                  error={!!otpError}
                  disabled={isVerifying || isExpired}
                />
                {otpError && (
                  <p role="alert" className="text-sm text-red-500 text-center">
                    {otpError}
                  </p>
                )}
              </div>

              {/* Expiry timer */}
              <div className="text-center text-sm">
                {isExpired ? (
                  <p className="text-red-500 font-medium">
                    Code expired. Please request a new one.
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Code expires in{' '}
                    <span className={cn('font-mono font-medium', timeLeft <= 60 && 'text-red-500')}>
                      {expiryDisplay}
                    </span>
                  </p>
                )}
              </div>

              {/* Verify button */}
              <Button
                onClick={handleVerify}
                disabled={otpValue.length !== 6 || isVerifying || isExpired}
                className="w-full"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Verify Email'
                )}
              </Button>

              {/* Resend */}
              <div className="text-center text-sm text-muted-foreground space-y-1">
                <p>Didn&apos;t receive the code?</p>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="text-primary font-medium hover:underline underline-offset-4 disabled:opacity-50"
                  >
                    {isResending ? (
                      <span className="flex items-center gap-1 justify-center">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      'Resend OTP →'
                    )}
                  </button>
                ) : (
                  <p className="text-muted-foreground">
                    Resend OTP{' '}
                    <span className="font-mono">({resendDisplay})</span>
                  </p>
                )}
              </div>
            </>
          )}

          <div className="text-center">
            <Link
              to={ROUTES.REGISTER}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Register
            </Link>
          </div>
        </div>
      </AuthFormWrapper>
    </AuthLayout>
  )
}
