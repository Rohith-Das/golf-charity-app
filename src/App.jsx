import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import { Suspense, lazy } from 'react'
import LoadingSpinner from './components/LoadingSpinner'

// Lazy load components for code splitting
const AuthPage = lazy(() => import('./pages/AuthPage'))
const UserDashboard = lazy(() => import('./pages/UserDashboard'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const Profile = lazy(() => import('./components/Profile'))
const CharityDirectory = lazy(() => import('./components/charity/CharityDirectory'))
const CharityProfile = lazy(() => import('./components/charity/CharityProfile'))
const WinningsPage = lazy(() => import('./pages/Winningspage'))

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Auth Routes */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            <Route path="/signup" element={<Navigate to="/auth" replace />} />
            <Route path="/" element={<Navigate to="/auth" replace />} />

            {/* User Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Other Protected Routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route path="/charities" element={<CharityDirectory />} />
            <Route path="/charities/:id" element={<CharityProfile />} />
            <Route path="/winnings" element={<WinningsPage />} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}