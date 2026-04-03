import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <LoadingSpinner />

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // If adminOnly route but user is not admin → redirect to user dashboard
  if (adminOnly && profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  // If user is admin and trying to access user dashboard → redirect to admin panel
  if (!adminOnly && profile?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return children
}