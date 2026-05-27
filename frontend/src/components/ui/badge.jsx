import { cn } from '../../lib/utils'

const variants = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-gray-100 text-gray-600',
  outline: 'border border-gray-300 text-gray-600 bg-transparent',
  destructive: 'bg-red-100 text-red-700',
}

export function Badge({ className, variant = 'default', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
