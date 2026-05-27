import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, AlertCircle } from 'lucide-react'
import { useRegisterMutation } from '../../features/auth/authApi'
import AuthLayout from '../../components/layout/AuthLayout'
import { AuthFormWrapper } from '../../components/auth/AuthFormWrapper'
import { PasswordInput } from '../../components/auth/PasswordInput'
import { PasswordStrength } from '../../components/auth/PasswordStrength'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { ROUTES, TOAST_MESSAGES } from '../../constants'
import { cn } from '../../lib/utils'

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long').trim(),
  lastName: z.string().max(50, 'Last name too long').optional().or(z.literal('')),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed')
    .trim(),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
})

function FieldError({ error }) {
  if (!error) return null
  return (
    <p role="alert" className="text-sm text-red-500 flex items-center gap-1 mt-1">
      <AlertCircle className="w-3 h-3 flex-shrink-0" />
      {error.message}
    </p>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
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

  const password = watch('password')

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
    <AuthLayout>
      <AuthFormWrapper
        title="Create your account"
        subtitle="Start capturing your thoughts"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* First + Last name row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                {...field('firstName')}
                className={cn(errors.firstName && 'border-red-500')}
                aria-invalid={!!errors.firstName}
                disabled={isLoading}
              />
              <FieldError error={errors.firstName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                {...field('lastName')}
                className={cn(errors.lastName && 'border-red-500')}
                disabled={isLoading}
              />
              <FieldError error={errors.lastName} />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">
                @
              </span>
              <Input
                id="username"
                placeholder="johndoe"
                className={cn('pl-7', errors.username && 'border-red-500')}
                aria-invalid={!!errors.username}
                disabled={isLoading}
                {...field('username')}
                onChange={e => {
                  setValue('username', e.target.value.toLowerCase(), { shouldValidate: true })
                }}
              />
            </div>
            {errors.username ? (
              <FieldError error={errors.username} />
            ) : (
              <p className="text-xs text-muted-foreground">@username will be your unique ID</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...field('email')}
              onChange={e => {
                setValue('email', e.target.value.toLowerCase(), { shouldValidate: true })
              }}
              className={cn(errors.email && 'border-red-500')}
              aria-invalid={!!errors.email}
              disabled={isLoading}
            />
            <FieldError error={errors.email} />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <PasswordInput
              id="password"
              label="Password"
              placeholder="Create a strong password"
              error={errors.password}
              disabled={isLoading}
              {...field('password')}
            />
            <PasswordStrength password={password} />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full mt-2">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              to={ROUTES.LOGIN}
              className="text-primary font-medium hover:underline underline-offset-4"
            >
              Sign in →
            </Link>
          </p>
        </form>
      </AuthFormWrapper>
    </AuthLayout>
  )
}
