import { APP_NAME } from '../../constants'

const features = [
  { icon: '📝', text: 'Create and organize notes effortlessly' },
  { icon: '🎙️', text: 'Voice input in English and Urdu' },
  { icon: '🔍', text: 'Powerful search across all your notes' },
  { icon: '🔒', text: 'Secure with JWT authentication' },
]

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
        <div className="flex items-center gap-3">
          <span className="text-4xl">📝</span>
          <span className="text-2xl font-bold tracking-tight">{APP_NAME}</span>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight">
              Your thoughts,
              <br />
              beautifully organized
            </h1>
            <p className="mt-4 text-indigo-200 text-lg">
              Capture ideas instantly — type or speak in English and Urdu.
            </p>
          </div>

          <ul className="space-y-4">
            {features.map(({ icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-indigo-100">
                <span className="text-xl">{icon}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-indigo-300 text-sm">
          &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </div>

      {/* Right panel — full width on mobile */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <span className="text-3xl">📝</span>
            <span className="text-xl font-bold text-foreground">{APP_NAME}</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
