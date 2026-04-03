import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import Navbar from './Navbar'
import { Trophy, TrendingUp, Heart, User, ChevronRight } from 'lucide-react'
import ScoreManager from '../components/ScoreManager'
import DrawPanel from '../components/DrawPanel'
import WinningsOverview from '../components/winners/Winningsoverview'
import SubscriptionPlans from '../components/SubscriptionPlans'
import CharitySelector from '../components/charity/CharitySelector'   // ← Added

export default function UserDashboard() {
  const { profile } = useAuth()
  const isSubscribed = profile?.subscription_status === 'active'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        
        {/* Hero Welcome */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-rose-600 via-pink-600 to-purple-700 p-10 md:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent)]" />
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <p className="text-pink-200 text-sm font-medium tracking-widest">WELCOME BACK</p>
              <h1 className="text-5xl md:text-6xl font-bold mt-3 leading-tight">
                {profile?.full_name || 'Golfer'}
              </h1>
              <p className="mt-4 text-xl text-pink-100 max-w-md">
                Every round you play helps support causes that matter.
              </p>
            </div>

            <Link
              to="/profile"
              className="flex items-center gap-3 bg-white/20 hover:bg-white/30 backdrop-blur-md px-8 py-4 rounded-2xl text-sm font-semibold transition-all border border-white/30 self-start md:self-center"
            >
              <User className="h-5 w-5" />
              Edit Profile
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>

      

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: 'Draw Entries', value: '0', icon: Trophy, color: 'from-amber-400 to-orange-500' },
            { label: 'Total Winnings', value: `£${Number(profile?.total_winnings ?? 0).toFixed(2)}`, icon: TrendingUp, color: 'from-emerald-400 to-teal-500' },
            { label: 'Charity Impact', value: `${profile?.charity_contribution_pct ?? 10}%`, icon: Heart, color: 'from-rose-400 to-pink-500' },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-white/30 transition-all">
              <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-6`}>
                <s.icon className="h-7 w-7 text-white" />
              </div>
              <p className="text-4xl font-bold text-white mb-1">{s.value}</p>
              <p className="text-slate-400 text-lg">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Main Content */}
        {isSubscribed ? (
          <div className="space-y-12">
            <DrawPanel />
            <ScoreManager />
            <WinningsOverview />
          </div>
        ) : (
          <SubscriptionPlans standalone={true} />
        )}

          {/* Charity Section - Prominent on Dashboard */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
            <div className="h-16 w-16 rounded-2xl bg-rose-500/20 flex items-center justify-center flex-shrink-0">
              <Heart className="h-9 w-9 text-rose-400" />
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-white">Your Charity</h2>
              <p className="text-pink-200 mt-2 text-lg">
                Choose a cause you care about. At least 10% of your subscription supports them.
              </p>
            </div>
          </div>

          <CharitySelector
            value={profile?.charity_id}
            contributionPct={profile?.charity_contribution_pct || 10}
            compact={false}
          />
        </div>
      </div>
    </div>
  )
}