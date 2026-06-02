import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '../../lib/baseQuery'
import { setCredentials, updateUser, logout as logoutAction } from './authSlice'

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (data) => ({ url: '/auth/register', method: 'POST', data }),
    }),

    verifyOTP: builder.mutation({
      query: (data) => ({ url: '/auth/verify-otp', method: 'POST', data }),
    }),

    resendOTP: builder.mutation({
      query: (data) => ({ url: '/auth/resend-otp', method: 'POST', data }),
    }),

    login: builder.mutation({
      query: (credentials) => ({ url: '/auth/login', method: 'POST', data: credentials }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          // data = { success, message, data: { accessToken, user }, ... }
          const { accessToken, user } = data.data
          dispatch(setCredentials({ user, accessToken }))
        } catch {
          // handled by component
        }
      },
    }),

    refreshToken: builder.mutation({
      query: () => ({ url: '/auth/refresh-token', method: 'POST' }),
    }),

    logout: builder.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
        } catch {
          // still clear local state even if server fails
        } finally {
          dispatch(logoutAction())
        }
      },
    }),

    getMe: builder.query({
      query: () => ({ url: '/auth/me' }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(updateUser(data.data?.user))
        } catch {
          // ignored
        }
      },
    }),

    changePassword: builder.mutation({
      query: (data) => ({ url: '/auth/change-password', method: 'POST', data }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          if (data.data?.requiresReLogin) {
            dispatch(logoutAction())
          }
        } catch {
          // handled by component
        }
      },
    }),

    updateProfile: builder.mutation({
      query: (profileData) => ({ url: '/auth/me', method: 'PATCH', data: profileData }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          const user = data.data?.user ?? data.data
          if (user) dispatch(updateUser(user))
        } catch {
          // handled by component
        }
      },
    }),
  }),
})

export const {
  useRegisterMutation,
  useVerifyOTPMutation,
  useResendOTPMutation,
  useLoginMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = authApi
