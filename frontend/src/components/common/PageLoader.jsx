import { APP_NAME } from '../../constants'
import LoadingSpinner from './LoadingSpinner'

export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background gap-4">
      <span className="text-5xl animate-bounce">📝</span>
      <p className="text-xl font-semibold text-foreground">{APP_NAME}</p>
      <LoadingSpinner size="lg" />
    </div>
  )
}
