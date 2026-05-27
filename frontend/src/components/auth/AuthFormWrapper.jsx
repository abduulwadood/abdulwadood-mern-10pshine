import { APP_NAME } from '../../constants'

export function AuthFormWrapper({ title, subtitle, children }) {
  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      {/* Mobile-only logo */}
      <div className="flex lg:hidden items-center justify-center gap-2 mb-2">
        <span className="text-3xl">📝</span>
        <span className="text-xl font-bold text-foreground">{APP_NAME}</span>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
      </div>

      {children}
    </div>
  )
}
