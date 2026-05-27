import { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Provider, useDispatch } from 'react-redux'
import { Toaster } from 'sonner'
import store from './app/store'
import { logout } from './features/auth/authSlice'
import ProtectedRoute from './components/common/ProtectedRoute'
import PublicRoute from './components/common/PublicRoute'
import ErrorBoundary from './components/common/ErrorBoundary'
import PageLoader from './components/common/PageLoader'
import AppLayout from './components/layout/AppLayout'
import { ROUTES } from './constants'

const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const VerifyOTPPage = lazy(() => import('./pages/auth/VerifyOTPPage'))
const DashboardPage = lazy(() => import('./pages/notes/DashboardPage'))
const NoteDetailPage = lazy(() => import('./pages/notes/NoteDetailPage'))
const NoteEditorPage = lazy(() => import('./pages/notes/NoteEditorPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function AuthLogoutListener() {
  const dispatch = useDispatch()
  useEffect(() => {
    function handleAuthLogout() {
      dispatch(logout())
    }
    window.addEventListener('auth:logout', handleAuthLogout)
    return () => window.removeEventListener('auth:logout', handleAuthLogout)
  }, [dispatch])
  return null
}

function AppRoutes() {
  return (
    <>
      <AuthLogoutListener />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />

          {/* Public-only routes */}
          <Route
            path={ROUTES.LOGIN}
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path={ROUTES.REGISTER}
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route
            path={ROUTES.VERIFY_OTP}
            element={
              <PublicRoute>
                <VerifyOTPPage />
              </PublicRoute>
            }
          />

          {/* Protected routes under AppLayout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.NOTE_DETAIL} element={<NoteDetailPage />} />
            <Route path={ROUTES.NOTE_NEW} element={<NoteEditorPage />} />
            <Route path={ROUTES.NOTE_EDIT} element={<NoteEditorPage />} />
            <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          </Route>

          {/* 404 */}
          <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ErrorBoundary>
          <AppRoutes />
          <Toaster position="top-right" richColors closeButton />
        </ErrorBoundary>
      </BrowserRouter>
    </Provider>
  )
}
