import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function NotFound() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-background">
      <div className="text-8xl font-black text-muted-foreground/20 select-none">404</div>
      <div className="text-5xl">🔍</div>
      <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
      <p className="text-muted-foreground text-center max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
        className="px-6 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
      >
        {isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}
      </button>
    </div>
  )
}
