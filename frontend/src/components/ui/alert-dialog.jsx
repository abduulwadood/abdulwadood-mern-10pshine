import { createContext, useContext } from 'react'
import { cn } from '../../lib/utils'

const Ctx = createContext(null)

export function AlertDialog({ open, onOpenChange, children }) {
  if (!open) return null
  return (
    <Ctx.Provider value={{ onOpenChange }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        />
        {children}
      </div>
    </Ctx.Provider>
  )
}

export function AlertDialogContent({ className, children }) {
  return (
    <div
      className={cn(
        'relative z-50 bg-white rounded-xl shadow-xl w-full max-w-md p-6',
        'animate-in fade-in zoom-in-95 duration-200',
        className
      )}
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>
  )
}

export function AlertDialogHeader({ className, children }) {
  return (
    <div className={cn('flex flex-col gap-2 mb-5', className)}>
      {children}
    </div>
  )
}

export function AlertDialogTitle({ className, children }) {
  return (
    <h2 className={cn('text-lg font-semibold text-gray-900', className)}>
      {children}
    </h2>
  )
}

export function AlertDialogDescription({ className, children }) {
  return (
    <p className={cn('text-sm text-gray-500 leading-relaxed', className)}>
      {children}
    </p>
  )
}

export function AlertDialogFooter({ className, children }) {
  return (
    <div className={cn('flex justify-end gap-2 mt-6', className)}>
      {children}
    </div>
  )
}

export function AlertDialogCancel({ className, children, onClick }) {
  const ctx = useContext(Ctx)
  return (
    <button
      type="button"
      onClick={() => { onClick?.(); ctx?.onOpenChange(false) }}
      className={cn(
        'px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700',
        'hover:bg-gray-50 transition-colors',
        className
      )}
    >
      {children}
    </button>
  )
}

export function AlertDialogAction({ className, children, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg',
        'bg-primary text-primary-foreground hover:opacity-90 transition-colors',
        'disabled:opacity-50 disabled:pointer-events-none',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
