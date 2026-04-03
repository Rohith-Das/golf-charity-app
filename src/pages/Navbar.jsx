import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, ChevronDown, Shield, LayoutDashboard, Heart } from 'lucide-react';

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
    navigate('/auth');        // Changed to /auth (your new single auth page)
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Golfer';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <nav className="bg-slate-950/95 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo - Emotional & Modern */}
          <Link
            to={isAdmin ? '/admin' : '/dashboard'}
            className="flex items-center gap-3 group"
          >
            <div className="h-10 w-10 bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tighter text-white">
                GolfCharity
              </span>
              <p className="text-[10px] text-pink-400 -mt-1 tracking-[2px] font-medium">EVERY SWING GIVES BACK</p>
            </div>
          </Link>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {!isAdmin && (
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 text-sm font-medium transition-all duration-200 px-5 py-2.5 rounded-2xl ${
                  location.pathname === '/dashboard'
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-2 text-sm font-medium transition-all duration-200 px-5 py-2.5 rounded-2xl ${
                  location.pathname === '/admin'
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Shield className="h-4 w-4" />
                Admin Panel
              </Link>
            )}

            {!isAdmin && (
              <Link
                to="/charities"
                className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-all duration-200 px-5 py-2.5 rounded-2xl hover:bg-white/5"
              >
                <Heart className="h-4 w-4" />
                Charities
              </Link>
            )}
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4">
            {/* Subscription Status (Optional - can be enhanced later) */}
            {!isAdmin && profile && (
              <div className="hidden sm:flex items-center gap-2 bg-white/10 text-white text-xs px-4 py-1.5 rounded-full border border-white/10">
                <div className={`w-2 h-2 rounded-full ${profile.subscription_status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="font-medium">
                  {profile.subscription_status === 'active' ? 'Premium' : 'Free'}
                </span>
              </div>
            )}

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 pl-4 pr-5 py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl transition-all duration-200 group"
              >
                {/* Avatar */}
                <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-semibold shadow-inner">
                  {initials}
                </div>

                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-white leading-none">{displayName}</p>
                  {isAdmin && (
                    <p className="text-[10px] text-pink-400 font-medium">Administrator</p>
                  )}
                </div>

                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-slate-900 border border-white/10 rounded-3xl shadow-2xl py-2 z-50 overflow-hidden">
                  {/* User Info */}
                  <div className="px-6 py-4 border-b border-white/10">
                    <p className="font-semibold text-white">{displayName}</p>
                    <p className="text-sm text-slate-400 truncate">{user?.email}</p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    {!isAdmin && (
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-6 py-3 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <User className="h-5 w-5" />
                        <span>My Profile</span>
                      </Link>
                    )}

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-6 py-3 text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}