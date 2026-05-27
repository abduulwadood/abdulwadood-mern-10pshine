import { createSlice } from '@reduxjs/toolkit'
import {
  getAccessToken,
  getUser,
  saveAccessToken,
  saveUser,
  clearAllAuthData,
} from '../../utils/tokenUtils'

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: getUser(),
    accessToken: getAccessToken(),
    isAuthenticated: !!getAccessToken(),
    isLoading: false,
    error: null,
  },
  reducers: {
    setCredentials(state, action) {
      const { user, accessToken } = action.payload
      state.user = user
      state.accessToken = accessToken
      state.isAuthenticated = true
      state.error = null
      saveAccessToken(accessToken)
      saveUser(user)
    },
    updateUser(state, action) {
      state.user = action.payload
      saveUser(action.payload)
    },
    logout(state) {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
      state.error = null
      clearAllAuthData()
    },
    clearError(state) {
      state.error = null
    },
  },
})

export const { setCredentials, updateUser, logout, clearError } = authSlice.actions

export const selectCurrentUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectAccessToken = (state) => state.auth.accessToken
export const selectAuthLoading = (state) => state.auth.isLoading

export default authSlice.reducer
