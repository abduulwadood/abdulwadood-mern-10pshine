import { useState, forwardRef } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { cn } from '../../lib/utils'

const PasswordInput = forwardRef(function PasswordInput(
  { label = 'Password', id, error, className, ...rest },
  ref
) {
  const [show, setShow] = useState(false)

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <Input
          ref={ref}
          id={id}
          type={show ? 'text' : 'password'}
          className={cn('pr-10', error && 'border-red-500 focus-visible:ring-red-500', className)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...rest}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-500 flex items-center gap-1">
          {error.message}
        </p>
      )}
    </div>
  )
})

export { PasswordInput }
