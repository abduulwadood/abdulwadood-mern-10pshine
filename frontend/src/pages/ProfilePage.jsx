import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'
import { LogOut, Lock } from 'lucide-react'
import { selectCurrentUser } from '../features/auth/authSlice'
import {
  useLogoutMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from '../features/auth/authApi'
import { useGetNoteStatsQuery } from '../features/notes/notesApi'
import { ROUTES, TOAST_MESSAGES } from '../constants'
import { Button } from '../components/ui/button'
import { ProfileHeader } from '../components/profile/ProfileHeader'
import { ProfileStats } from '../components/profile/ProfileStats'
import { AccountInfo } from '../components/profile/AccountInfo'
import { ProfileForm } from '../components/profile/ProfileForm'
import { LogoutDialog } from '../components/profile/LogoutDialog'
import { ChangePasswordDialog } from '../components/profile/ChangePasswordDialog'

export default function ProfilePage() {
  const navigate = useNavigate()
  const user = useSelector(selectCurrentUser)

  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const formRef = useRef(null)

  const { data: statsData, isLoading: statsLoading } = useGetNoteStatsQuery()
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation()
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation()
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation()

  const stats = statsData?.data?.stats ?? statsData?.data ?? null

  if (!user) {
    navigate(ROUTES.LOGIN, { replace: true })
    return null
  }

  async function handleLogout() {
    try {
      await logout().unwrap()
    } catch {
      // logout action clears state even on server error (see authApi)
    }
    toast.success(TOAST_MESSAGES.LOGOUT_SUCCESS)
    navigate(ROUTES.LOGIN, { replace: true })
  }

  async function handleSaveProfile(data) {
    try {
      await updateProfile(data).unwrap()
      toast.success(TOAST_MESSAGES.PROFILE_UPDATED)
      setShowForm(false)
    } catch (err) {
      toast.error(err?.data?.message || TOAST_MESSAGES.ERROR_GENERIC)
    }
  }

  async function handleChangePassword(data) {
    try {
      await changePassword(data).unwrap()
      toast.success('Password changed successfully!')
      setShowChangePassword(false)
      toast.info('Please sign in with your new password.', { duration: 4000 })
      navigate(ROUTES.LOGIN, { replace: true })
    } catch (err) {
      toast.error(err?.data?.message || TOAST_MESSAGES.ERROR_GENERIC)
    }
  }

  function handleEditClick() {
    setShowForm(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-gray-200 bg-white">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
          <p className="text-xs text-gray-500 mt-0.5">View and manage your account</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 lg:px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-6 pb-16">

          <ProfileHeader user={user} onEditClick={handleEditClick} />
          <ProfileStats stats={stats} isLoading={statsLoading} />
          <AccountInfo user={user} />

          {showForm && (
            <div ref={formRef}>
              <ProfileForm
                user={user}
                onSave={handleSaveProfile}
                onCancel={() => setShowForm(false)}
                isSaving={isUpdating}
              />
            </div>
          )}

          {/* Security section */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-500" />
              Security
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Keep your account secure by regularly updating your password.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChangePassword(true)}
              className="gap-2"
            >
              <Lock className="w-4 h-4" />
              Change Password
            </Button>
          </div>

          {/* Logout section */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Sign Out</h3>
            <p className="text-sm text-gray-500 mb-4">
              You will be logged out and redirected to the login page.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowLogoutDialog(true)}
              disabled={isLoggingOut}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <LogoutDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogout}
        isLoading={isLoggingOut}
      />

      <ChangePasswordDialog
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onConfirm={handleChangePassword}
        isLoading={isChangingPassword}
      />
    </div>
  )
}
