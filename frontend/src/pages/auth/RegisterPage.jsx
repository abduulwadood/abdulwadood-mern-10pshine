import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Eye, EyeOff, ArrowRight, Check, X, AlertCircle, Loader2, UserPlus,
} from 'lucide-react'
import { useRegisterMutation } from '../../features/auth/authApi'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { ROUTES, TOAST_MESSAGES } from '../../constants'
import { cn } from '../../lib/utils'

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long').trim(),
  lastName:  z.string().max(50, 'Last name too long').optional().or(z.literal('')),
  username:  z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed')
    .trim(),
  email:    z.string().min(1, 'Email is required').email('Please enter a valid email address').toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
})

function getPasswordStrength(password) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
    password.length >= 12,
  ].filter(Boolean).length

  if (score <= 2) return { label: 'Weak',   gradient: 'from-red-500 to-red-600',     width: '25%'  }
  if (score <= 3) return { label: 'Fair',   gradient: 'from-orange-500 to-orange-600', width: '50%' }
  if (score <= 4) return { label: 'Good',   gradient: 'from-yellow-500 to-yellow-600', width: '75%' }
  return           { label: 'Strong', gradient: 'from-green-500 to-green-600',   width: '100%' }
}

const STRENGTH_TEXT_COLOR = { Weak: 'text-red-400', Fair: 'text-orange-400', Good: 'text-yellow-400', Strong: 'text-green-400' }

const INPUT_CLASS = cn(
  'w-full bg-white/5 border-white/20 text-white placeholder:text-white/30',
  'focus-visible:ring-indigo-500 focus-visible:bg-white/10 transition-all duration-200'
)

export default function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [register, { isLoading }] = useRegisterMutation()

  const {
    register: field,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', username: '', email: '', password: '' },
  })

  const password = watch('password') || ''
  const strength = useMemo(() => getPasswordStrength(password), [password])

  const criteria = [
    { met: password.length >= 8,            label: '8+ characters'     },
    { met: /[A-Z]/.test(password),          label: 'Uppercase letter'  },
    { met: /[0-9]/.test(password),          label: 'Number'            },
    { met: /[^A-Za-z0-9]/.test(password),  label: 'Special character' },
  ]

  const onSubmit = async (data) => {
    try {
      const result = await register(data).unwrap()
      sessionStorage.setItem('pending_verification_email', data.email)
      toast.success(TOAST_MESSAGES.REGISTER_SUCCESS)
      navigate(ROUTES.VERIFY_OTP, {
        state: { email: data.email, otpExpiresAt: result.data?.otpExpiresAt },
      })
    } catch (error) {
      const msg = error?.data?.message || error?.message || ''
      if (error?.status === 409 || error?.error?.status === 409) {
        if (msg.toLowerCase().includes('email')) {
          setError('email', { message: msg })
        } else {
          setError('username', { message: msg })
        }
      } else {
        toast.error(msg || TOAST_MESSAGES.ERROR_GENERIC)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4 overflow-hidden relative">

      {/* Background blobs */}
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="w-full max-w-md relative z-10 py-4">

        {/* Logo + heading */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-3 shadow-lg shadow-indigo-500/50 hover:scale-110 transition-transform duration-300">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Create Account</h1>
          <p className="text-indigo-200 text-sm">Start capturing your thoughts today</p>
        </div>

        {/* Glass card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/20 animate-fade-in-up">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3.5">

            {/* First + Last name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-white/80 text-xs font-medium">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  disabled={isLoading}
                  {...field('firstName')}
                  className={cn(INPUT_CLASS, errors.firstName && 'border-red-400/70 focus-visible:ring-red-400')}
                />
                {errors.firstName && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-white/80 text-xs font-medium">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  disabled={isLoading}
                  {...field('lastName')}
                  className={cn(INPUT_CLASS, errors.lastName && 'border-red-400/70 focus-visible:ring-red-400')}
                />
                {errors.lastName && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-white/80 text-xs font-medium">
                Username
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm select-none">@</span>
                <Input
                  id="username"
                  placeholder="johndoe"
                  disabled={isLoading}
                  {...field('username')}
                  onChange={e => setValue('username', e.target.value.toLowerCase(), { shouldValidate: true })}
                  className={cn(INPUT_CLASS, 'pl-7', errors.username && 'border-red-400/70 focus-visible:ring-red-400')}
                />
              </div>
              {errors.username ? (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.username.message}
                </p>
              ) : (
                <p className="text-white/30 text-xs">Letters, numbers, and underscores only</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/80 text-xs font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                disabled={isLoading}
                {...field('email')}
                onChange={e => setValue('email', e.target.value.toLowerCase(), { shouldValidate: true })}
                className={cn(INPUT_CLASS, errors.email && 'border-red-400/70 focus-visible:ring-red-400')}
              />
              {errors.email && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-white/80 text-xs font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isLoading}
                  {...field('password')}
                  className={cn(INPUT_CLASS, 'pr-11', errors.password && 'border-red-400/70 focus-visible:ring-red-400')}
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

              {/* Strength bar */}
              {password && (
                <div className="space-y-1 animate-fade-in">
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full bg-gradient-to-r transition-all duration-300', strength.gradient)}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <p className="text-xs text-white/50">
                    Strength: <span className={cn('font-semibold', STRENGTH_TEXT_COLOR[strength.label])}>{strength.label}</span>
                  </p>
                </div>
              )}

              {/* Criteria checklist */}
              {password && (
                <div className="grid grid-cols-2 gap-1 pt-1 animate-fade-in">
                  {criteria.map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      {c.met
                        ? <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                        : <X     className="w-3 h-3 text-white/25 flex-shrink-0" />
                      }
                      <span className={c.met ? 'text-green-400' : 'text-white/40'}>{c.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {errors.password && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
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
                <><Loader2 className="w-4 h-4 animate-spin" />Creating account...</>
              ) : (
                <>Create Account<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </Button>
          </form>

          {/* Sign in link */}
          <div className="mt-4 text-center">
            <p className="text-white/50 text-xs">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate(ROUTES.LOGIN)}
                className="text-indigo-300 hover:text-indigo-200 font-semibold transition-colors"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-4 animate-fade-in">
          By creating an account you agree to our Terms &amp; Privacy Policy
        </p>
      </div>
    </div>
  )
}
