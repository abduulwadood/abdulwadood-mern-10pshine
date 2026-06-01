import { createContext, useContext, useState, useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'

const Ctx = createContext(null)

export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <Ctx.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative">
        {children}
      </div>
    </Ctx.Provider>
  )
}

export function DropdownMenuTrigger({ children, asChild, className }) {
  const { setOpen } = useContext(Ctx)
  if (asChild) {
    return (
      <div onClick={() => setOpen(o => !o)} className={cn('cursor-pointer', className)}>
        {children}
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={() => setOpen(o => !o)}
      className={cn('flex items-center', className)}
    >
      {children}
    </button>
  )
}

export function DropdownMenuContent({ className, align = 'end', children }) {
  const { open } = useContext(Ctx)
  if (!open) return null
  return (
    <div
      className={cn(
        'absolute z-50 mt-1 min-w-[160px] rounded-lg border border-gray-200 bg-white shadow-lg py-1',
        'animate-in fade-in zoom-in-95 duration-150',
        align === 'end' ? 'right-0' : 'left-0',
        'top-full',
        className
      )}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({ className, children, onClick }) {
  const { setOpen } = useContext(Ctx)
  return (
    <button
      type="button"
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700',
        'hover:bg-gray-50 transition-colors text-left',
        className
      )}
      onClick={() => { onClick?.(); setOpen(false) }}
    >
      {children}
    </button>
  )
}

export function DropdownMenuSeparator({ className }) {
  return <div className={cn('my-1 h-px bg-gray-200', className)} />
}
