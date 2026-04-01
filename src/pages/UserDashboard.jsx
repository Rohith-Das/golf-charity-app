
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import Navbar from './Navbar'
import { Trophy, Target, Heart, TrendingUp, User, ChevronRight } from 'lucide-react'
import ScoreManager from '../components/ScoreManager'

export default function UserDashboard() {
  const { profile } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Welcome Banner */}
        <div className="relative bg-gradient-to-r from-primary-600 via-blue-600 to-indigo-700 rounded-3xl p-8 text-white overflow-hidden shadow-2xl">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-blue-200 text-sm font-medium mb-1">Welcome back 👋</p>
              <h1 className="text-3xl font-bold mb-2">{profile?.full_name || 'Golfer'}</h1>
              <p className="text-blue-100 text-sm">
                Subscription:{' '}
                <span className={`font-semibold capitalize ${profile?.subscription_status === 'active' ? 'text-emerald-300' : 'text-yellow-300'}`}>
                  {profile?.subscription_status || 'Inactive'}
                </span>
              </p>
            </div>
            <Link
              to="/profile"
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border border-white/30"
            >
              <User className="h-4 w-4" />
              <span>Edit Profile</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Draw Entries',
              value: '0',
              icon: Trophy,
              color: 'from-amber-500 to-orange-500',
              bg: 'bg-amber-50',
              text: 'text-amber-700',
            },
            {
              label: 'Total Winnings',
              value: `£${Number(profile?.total_winnings ?? 0).toFixed(2)}`,
              icon: TrendingUp,
              color: 'from-emerald-500 to-green-600',
              bg: 'bg-emerald-50',
              text: 'text-emerald-700',
            },
            {
              label: 'Charity %',
              value: `${profile?.charity_contribution_pct ?? 10}%`,
              icon: Heart,
              color: 'from-rose-500 to-pink-600',
              bg: 'bg-rose-50',
              text: 'text-rose-700',
            },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-sm`}>
                  <s.icon className="h-4 w-4 text-white" />
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
                  {s.label}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Score Manager — full width */}
        <ScoreManager />

        {/* Charity nudge */}
        {!profile?.charity_id && (
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl bg-rose-100 flex items-center justify-center">
                <Heart className="h-6 w-6 text-rose-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Choose your charity</p>
                <p className="text-sm text-gray-600">Support a cause you care about when you win</p>
              </div>
            </div>
            <Link
              to="/profile"
              className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Set Charity
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}