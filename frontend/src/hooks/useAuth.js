import { useSelector, useDispatch } from 'react-redux'
import { selectCurrentUser, selectIsAuthenticated, logout as logoutAction } from '../features/auth/authSlice'
import { useLoginMutation, useLogoutMutation } from '../features/auth/authApi'

export function useAuth() {
  const user = useSelector(selectCurrentUser)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const dispatch = useDispatch()
  const [loginMutation] = useLoginMutation()
  const [logoutMutation] = useLogoutMutation()

  async function login(credentials) {
    return loginMutation(credentials).unwrap()
  }

  async function logout() {
    try {
      await logoutMutation().unwrap()
    } catch {
      // still clear local state if server call fails
    } finally {
      dispatch(logoutAction())
    }
  }

  return {
    user,
    isAuthenticated,
    isEmailVerified: user?.isEmailVerified ?? false,
    login,
    logout,
  }
}
