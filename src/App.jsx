import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Profile from './components/Profile'
import CharityDirectory from './components/charity/CharityDirectory'
import CharityProfile from './components/charity/CharityProfile'
import WinningsPage from './pages/Winningspage'
import AuthPage from './pages/AuthPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
     <Route path="/auth" element={<AuthPage />} />
<Route path="/login" element={<Navigate to="/auth" replace />} />
<Route path="/signup" element={<Navigate to="/auth" replace />} />
<Route path="/" element={<Navigate to="/auth" replace />} />
          
          {/* User Dashboard */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Dashboard */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
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

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}