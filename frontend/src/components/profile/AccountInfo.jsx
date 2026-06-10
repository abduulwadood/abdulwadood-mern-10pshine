import { Shield } from 'lucide-react'
import { formatDate, formatRelativeDate } from '../../utils/formatters'

export function AccountInfo({ user }) {
  return (
    <div className="bg-white rounded-xl border p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Shield className="w-4 h-4 text-indigo-600" />
        Account Information
      </h3>

      <div className="space-y-4">
        {/* Email */}
        <div className="pb-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Email Address
          </p>
          <p className="text-sm font-medium text-gray-900">{user?.email}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            This email is linked to your PearlNotes account and cannot be changed
          </p>
        </div>

        {/* Joined date */}
        <div className="pb-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Member Since
          </p>
          <p className="text-sm font-medium text-gray-900">
            {user?.createdAt ? formatDate(user.createdAt) : '—'}
          </p>
          {user?.createdAt && (
            <p className="text-xs text-gray-400 mt-0.5">
              Account created {formatRelativeDate(user.createdAt)}
            </p>
          )}
        </div>

        {/* Status */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Account Status
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-900">Active</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Your account is in good standing</p>
        </div>
      </div>
    </div>
  )
}
