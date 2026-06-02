import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle,
  Loader2, ShieldAlert, FileText,
} from 'lucide-react'
import { useLoginMutation } from '../../features/auth/authApi'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { ROUTES, TOAST_MESSAGES } from '../../constants'
import { cn } from '../../lib/utils'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || ROUTES.DASHBOARD
  const successMessage = location.state?.message

  const [showPassword, setShowPassword] = useState(false)
  const [isAccountLocked, setIsAccountLocked] = useState(false)
  const [lockUntilTime, setLockUntilTime] = useState('')
  const [failedAttempts, setFailedAttempts] = useState(0)

  const [login, { isLoading }] = useLoginMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: location.state?.email || '',
      password: '',
      rememberMe: true,
    },
  })

  const onSubmit = async (data) => {
    setIsAccountLocked(false)
    try {
      await login({ email: data.email, password: data.password }).unwrap()
      setFailedAttempts(0)
      toast.success(TOAST_MESSAGES.LOGIN_SUCCESS)
      navigate(from, { replace: true })
    } catch (error) {
      const msg = error?.data?.message || error?.message || ''

      if (msg.toLowerCase().includes('lock')) {
        setIsAccountLocked(true)
        const timeMatch = msg.match(/until (.+)/i)
        if (timeMatch) setLockUntilTime(timeMatch[1])
        setFailedAttempts(0)
      } else if (msg.toLowerCase().includes('verif')) {
        toast.error('Please verify your email first.')
        navigate(ROUTES.VERIFY_OTP, { state: { email: data.email } })
      } else {
        const next = failedAttempts + 1
        setFailedAttempts(next)
        setError('password', { message: 'Invalid email or password' })
        setError('email', { message: ' ' })
        if (next >= 3) {
          const left = Math.max(0, 5 - next)
          if (left > 0) {
            toast.warning(`${left} attempt${left !== 1 ? 's' : ''} remaining before account lock`, { duration: 5000 })
          }
        }
      }
    }
  }

  const attemptsLeft = Math.max(0, 5 - failedAttempts)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4 overflow-hidden relative">

      {/* Animated background blobs */}
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Logo + heading */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-500/50 hover:scale-110 transition-transform duration-300">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Welcome Back</h1>
          <p className="text-indigo-200 text-sm">Sign in to continue to your notes</p>
        </div>

        {/* Success message from OTP verification */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2 animate-slide-down">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-300">{successMessage}</p>
          </div>
        )}

        {/* Glass card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 animate-fade-in-up">

          {/* Account locked banner */}
          {isAccountLocked && (
            <div className="mb-5 flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-sm">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Account temporarily locked due to multiple failed attempts.
                {lockUntilTime && <><br />Try again after <span className="font-semibold">{lockUntilTime}</span></>}
              </span>
            </div>
          )}

          {/* Attempts warning */}
          {!isAccountLocked && failedAttempts >= 3 && attemptsLeft > 0 && (
            <div className="mb-5 flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg text-orange-300 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {attemptsLeft} more attempt{attemptsLeft !== 1 ? 's' : ''} before account lock
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/80 text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                disabled={isLoading}
                {...register('email')}
                className={cn(
                  'w-full bg-white/5 border-white/20 text-white placeholder:text-white/30',
                  'focus-visible:ring-indigo-500 focus-visible:bg-white/10',
                  'transition-all duration-200',
                  errors.email?.message?.trim() && 'border-red-400/70 focus-visible:ring-red-400'
                )}
              />
              {errors.email?.message?.trim() && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-white/80 text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  {...register('password')}
                  className={cn(
                    'w-full pr-11 bg-white/5 border-white/20 text-white placeholder:text-white/30',
                    'focus-visible:ring-indigo-500 focus-visible:bg-white/10',
                    'transition-all duration-200',
                    errors.password && 'border-red-400/70 focus-visible:ring-red-400'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                id="rememberMe"
                type="checkbox"
                {...register('rememberMe')}
                className="w-4 h-4 rounded border-white/30 bg-white/5 accent-indigo-500 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-sm text-white/60 cursor-pointer select-none">
                Remember me
              </label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading || isAccountLocked}
              className={cn(
                'w-full py-3 rounded-xl font-semibold gap-2',
                'bg-gradient-to-r from-indigo-500 to-purple-600',
                'hover:from-indigo-600 hover:to-purple-700',
                'shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60',
                'transition-all duration-300 group',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</>
              ) : (
                <>Sign In<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/15" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-transparent text-white/40 text-xs uppercase tracking-widest">
                New to Notes?
              </span>
            </div>
          </div>

          {/* Register link */}
          <button
            type="button"
            onClick={() => navigate(ROUTES.REGISTER)}
            className={cn(
              'w-full py-2.5 px-4 rounded-xl font-medium text-sm',
              'bg-white/5 border border-white/15 text-white/80',
              'hover:bg-white/10 hover:border-white/25 hover:text-white',
              'transition-all duration-200'
            )}
          >
            Create an account
          </button>
        </div>

        <p className="text-center text-white/30 text-xs mt-6 animate-fade-in">
          By signing in you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
