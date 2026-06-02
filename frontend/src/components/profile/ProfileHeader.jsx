import { CheckCircle, AlertCircle, Pencil } from 'lucide-react'
import { Button } from '../ui/button'
import { extractInitials } from '../../utils/formatters'

export function ProfileHeader({ user, onEditClick }) {
  const initials = extractInitials(user?.firstName, user?.lastName)

  return (
    <div className="bg-white rounded-xl border p-6 flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-6">
      {/* Avatar */}
      <div className="flex-shrink-0 w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold select-none">
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h2 className="text-xl font-bold text-gray-900 truncate">
          {user?.firstName} {user?.lastName}
        </h2>
        {user?.username && (
          <p className="text-sm text-gray-500 mt-0.5">@{user.username}</p>
        )}
        <p className="text-sm text-gray-600 mt-1 truncate">{user?.email}</p>

        <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-2">
          {user?.isEmailVerified ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
              <span className="text-xs font-medium text-green-600">Email Verified</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
              <span className="text-xs font-medium text-orange-500">Email Not Verified</span>
            </>
          )}
        </div>
      </div>

      {/* Edit button */}
      <Button variant="outline" size="sm" onClick={onEditClick} className="gap-1.5 flex-shrink-0">
        <Pencil className="w-3.5 h-3.5" />
        Edit Profile
      </Button>
    </div>
  )
}
