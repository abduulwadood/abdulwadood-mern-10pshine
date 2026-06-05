import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import authReducer from '../features/auth/authSlice'
import notesReducer from '../features/notes/notesSlice'
import { authApi } from '../features/auth/authApi'
import { notesApi } from '../features/notes/notesApi'
import { imagesApi } from '../features/images/imagesApi'
import { commentsApi } from '../features/comments/commentsApi'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notes: notesReducer,
    [authApi.reducerPath]: authApi.reducer,
    [notesApi.reducerPath]: notesApi.reducer,
    [imagesApi.reducerPath]: imagesApi.reducer,
    [commentsApi.reducerPath]: commentsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(notesApi.middleware)
      .concat(imagesApi.middleware)
      .concat(commentsApi.middleware),
})

setupListeners(store.dispatch)

export default store
