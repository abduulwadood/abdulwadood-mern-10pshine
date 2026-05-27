import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import authReducer from '../features/auth/authSlice'
import notesReducer from '../features/notes/notesSlice'
import { authApi } from '../features/auth/authApi'
import { notesApi } from '../features/notes/notesApi'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notes: notesReducer,
    [authApi.reducerPath]: authApi.reducer,
    [notesApi.reducerPath]: notesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(notesApi.middleware),
})

setupListeners(store.dispatch)

export default store
