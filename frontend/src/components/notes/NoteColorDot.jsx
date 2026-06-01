import { cn } from '../../lib/utils'

export function NoteColorDot({ color, size = 'sm', className }) {
  const sizes = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  }
  return (
    <span
      className={cn(
        'inline-block rounded-full border border-black/10 flex-shrink-0',
        sizes[size],
        className
      )}
      style={{ backgroundColor: color || '#ffffff' }}
    />
  )
}
