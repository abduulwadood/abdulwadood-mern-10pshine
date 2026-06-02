import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Check, X, AlertCircle, Loader2, Info } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { cn } from '../../lib/utils'

const schema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[0-9]/, 'Must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine(d => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

function getStrength(pw) {
  const score = [
    pw.length >= 8,
    /[A-Z]/.test(pw),
    /[a-z]/.test(pw),
    /[0-9]/.test(pw),
    /[^A-Za-z0-9]/.test(pw),
    pw.length >= 12,
  ].filter(Boolean).length

  if (score <= 2) return { label: 'Weak',   color: 'bg-red-500',    width: '25%'  }
  if (score <= 3) return { label: 'Fair',   color: 'bg-orange-500', width: '50%'  }
  if (score <= 4) return { label: 'Good',   color: 'bg-yellow-500', width: '75%'  }
  return           { label: 'Strong', color: 'bg-green-500',  width: '100%' }
}

const STRENGTH_COLOR = {
  Weak: 'text-red-500', Fair: 'text-orange-500', Good: 'text-yellow-600', Strong: 'text-green-600',
}

export function ChangePasswordDialog({ isOpen, onClose, onConfirm, isLoading }) {
  const [show, setShow] = useState({ old: false, new: false, confirm: false })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  })

  const newPw = watch('newPassword') || ''
  const strength = useMemo(() => getStrength(newPw), [newPw])

  const criteria = [
    { met: newPw.length >= 8,           label: '8+ characters'    },
    { met: /[A-Z]/.test(newPw),         label: 'Uppercase letter'  },
    { met: /[0-9]/.test(newPw),         label: 'Number'            },
    { met: /[^A-Za-z0-9]/.test(newPw),  label: 'Special character' },
  ]

  function handleClose() {
    if (isLoading) return
    reset()
    setShow({ old: false, new: false, confirm: false })
    onClose()
  }

  async function onSubmit(data) {
    await onConfirm({ oldPassword: data.oldPassword, newPassword: data.newPassword })
    reset()
  }

  const inputCls = (hasError) => cn(
    'w-full pr-11',
    hasError && 'border-red-400 focus-visible:ring-red-400'
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter your current password and choose a strong new one.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

          {/* Current password */}
          <div className="space-y-1.5">
            <Label htmlFor="oldPassword" className="text-sm font-medium">
              Current Password
            </Label>
            <div className="relative">
              <Input
                id="oldPassword"
                type={show.old ? 'text' : 'password'}
                placeholder="••••••••"
                disabled={isLoading}
                {...register('oldPassword')}
                className={inputCls(!!errors.oldPassword)}
              />
              <button
                type="button"
                onClick={() => setShow(s => ({ ...s, old: !s.old }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {show.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.oldPassword && (
              <p className="text-red-500 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{errors.oldPassword.message}
              </p>
            )}
          </div>

          {/* New password */}
          <div className="space-y-1.5">
            <Label htmlFor="newPassword" className="text-sm font-medium">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={show.new ? 'text' : 'password'}
                placeholder="••••••••"
                disabled={isLoading}
                {...register('newPassword')}
                className={inputCls(!!errors.newPassword)}
              />
              <button
                type="button"
                onClick={() => setShow(s => ({ ...s, new: !s.new }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {show.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength bar */}
            {newPw && (
              <div className="space-y-1">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-300', strength.color)}
                    style={{ width: strength.width }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Strength: <span className={cn('font-semibold', STRENGTH_COLOR[strength.label])}>{strength.label}</span>
                </p>
              </div>
            )}

            {/* Criteria */}
            {newPw && (
              <div className="grid grid-cols-2 gap-1 pt-0.5">
                {criteria.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    {c.met
                      ? <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      : <X     className="w-3 h-3 text-gray-300 flex-shrink-0" />
                    }
                    <span className={c.met ? 'text-green-600' : 'text-gray-400'}>{c.label}</span>
                  </div>
                ))}
              </div>
            )}

            {errors.newPassword && (
              <p className="text-red-500 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm New Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={show.confirm ? 'text' : 'password'}
                placeholder="••••••••"
                disabled={isLoading}
                {...register('confirmPassword')}
                className={inputCls(!!errors.confirmPassword)}
              />
              <button
                type="button"
                onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Security note */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>You will be signed out after changing your password.</span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              {isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Changing...</>
                : 'Change Password'
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
