import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { User, LogOut, ChevronDown, Shield, LayoutDashboard } from 'lucide-react'

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    setDropdownOpen(false)
    await signOut()
    navigate('/login')
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <nav className="bg-white/90 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to={isAdmin ? '/admin' : '/dashboard'}
            className="flex items-center space-x-3 group"
          >
            <div className="h-9 w-9 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-blue-700 bg-clip-text text-transparent">
              GolfCharity
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-1">
            {isAdmin ? (
              <Link
                to="/admin"
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  location.pathname === '/admin'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Shield className="h-4 w-4" />
                <span>Admin Panel</span>
              </Link>
            ) : (
              <Link
                to="/dashboard"
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  location.pathname === '/dashboard'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            )}
          </div>

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2.5 pl-3 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-all duration-150 group"
            >
              {/* Avatar */}
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-900 leading-tight">{displayName}</p>
                {isAdmin && (
                  <p className="text-xs text-primary-600 font-medium">Administrator</p>
                )}
              </div>
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  {isAdmin && (
                    <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-primary-50 text-primary-700">
                      <Shield className="h-3 w-3 mr-1" /> Admin
                    </span>
                  )}
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  {!isAdmin && (
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="h-4 w-4 text-gray-400" />
                      <span>My Profile</span>
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
