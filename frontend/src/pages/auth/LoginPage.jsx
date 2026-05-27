import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react'
import { useLoginMutation } from '../../features/auth/authApi'
import AuthLayout from '../../components/layout/AuthLayout'
import { AuthFormWrapper } from '../../components/auth/AuthFormWrapper'
import { PasswordInput } from '../../components/auth/PasswordInput'
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

  const successMessage = location.state?.message
  const from = location.state?.from?.pathname || ROUTES.DASHBOARD

  const [login, { isLoading }] = useLoginMutation()
  const [isAccountLocked, setIsAccountLocked] = useState(false)
  const [lockUntilTime, setLockUntilTime] = useState('')
  const [failedAttempts, setFailedAttempts] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  })

  const onSubmit = async (data) => {
    setIsAccountLocked(false)

    try {
      await login({ email: data.email, password: data.password }).unwrap()
      // setCredentials handled by onQueryStarted in authApi
      toast.success(TOAST_MESSAGES.LOGIN_SUCCESS)
      navigate(from, { replace: true })
    } catch (error) {
      const msg = error?.data?.message || error?.message || ''

      if (msg.toLowerCase().includes('lock')) {
        setIsAccountLocked(true)
        // Extract time if present (e.g. "locked until 10:45 PM")
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
      }
    }
  }

  const attemptsLeft = Math.max(0, 5 - failedAttempts)

  return (
    <AuthLayout>
      <AuthFormWrapper title="Welcome back! 👋" subtitle="Sign in to your account">
        <div className="space-y-4">
          {/* Success banner from OTP redirect */}
          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {successMessage}
            </div>
          )}

          {/* Account locked warning */}
          {isAccountLocked && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Account temporarily locked due to multiple failed attempts.
                {lockUntilTime && (
                  <>
                    <br />
                    Try again after <span className="font-medium">{lockUntilTime}</span>
                  </>
                )}
              </span>
            </div>
          )}

          {/* Failed attempts warning (3+) */}
          {!isAccountLocked && failedAttempts >= 3 && attemptsLeft > 0 && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {attemptsLeft} more attempt{attemptsLeft !== 1 ? 's' : ''} before account lock
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                {...register('email')}
                className={cn(errors.email && errors.email.message.trim() && 'border-red-500')}
                aria-invalid={!!errors.email}
                disabled={isLoading}
              />
              {errors.email && errors.email.message.trim() && (
                <p role="alert" className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <PasswordInput
              id="password"
              label="Password"
              placeholder="Enter your password"
              error={errors.password}
              disabled={isLoading}
              {...register('password')}
            />

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                id="rememberMe"
                type="checkbox"
                {...register('rememberMe')}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="rememberMe" className="font-normal cursor-pointer">
                Remember me
              </Label>
            </div>

            <Button type="submit" disabled={isLoading || isAccountLocked} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              to={ROUTES.REGISTER}
              className="text-primary font-medium hover:underline underline-offset-4"
            >
              Create one →
            </Link>
          </p>
        </div>
      </AuthFormWrapper>
    </AuthLayout>
  )
}
