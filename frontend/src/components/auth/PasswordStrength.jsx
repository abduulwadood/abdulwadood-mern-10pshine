import { cn } from '../../lib/utils'

function getStrength(password) {
  if (!password) return null
  const criteria = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
    password.length >= 12,
  ]
  const score = criteria.filter(Boolean).length
  if (score <= 2) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/4', textColor: 'text-red-600' }
  if (score <= 3) return { label: 'Fair', color: 'bg-orange-500', width: 'w-2/4', textColor: 'text-orange-600' }
  if (score <= 4) return { label: 'Good', color: 'bg-yellow-500', width: 'w-3/4', textColor: 'text-yellow-600' }
  return { label: 'Strong', color: 'bg-green-500', width: 'w-full', textColor: 'text-green-600' }
}

const checks = [
  { test: (p) => p.length >= 8, label: '8+ characters' },
  { test: (p) => /[A-Z]/.test(p), label: 'Uppercase letter' },
  { test: (p) => /[0-9]/.test(p), label: 'Number' },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: 'Special character' },
]

export function PasswordStrength({ password }) {
  if (!password) return null
  const strength = getStrength(password)

  return (
    <div className="space-y-2 mt-1">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-300', strength.color, strength.width)}
          />
        </div>
        <span className={cn('text-xs font-medium w-12 text-right', strength.textColor)}>
          {strength.label}
        </span>
      </div>

      {/* Criteria checklist */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {checks.map(({ test, label }) => {
          const met = test(password)
          return (
            <div
              key={label}
              className={cn(
                'flex items-center gap-1.5 text-xs transition-colors',
                met ? 'text-green-600' : 'text-muted-foreground'
              )}
            >
              <span className="text-sm leading-none">{met ? '✅' : '✗'}</span>
              {label}
            </div>
          )
        })}
      </div>
    </div>
  )
}
