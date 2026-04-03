

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatCurrency } from '../../lib/drawEngine'
import { Link } from 'react-router-dom'
import {
  Trophy, Wallet, Clock, CheckCircle, XCircle, Banknote,
  Crown, Medal, Star, ArrowRight, Loader2, AlertTriangle,
  TrendingUp, Upload
} from 'lucide-react'

const STATUS_META = {
  pending: { label: 'Upload Proof', color: 'text-amber-400', dot: 'bg-amber-400', urgent: true },
  proof_submitted: { label: 'Under Review', color: 'text-sky-400', dot: 'bg-sky-400', urgent: false },
  approved: { label: 'Payment Pending', color: 'text-emerald-400', dot: 'bg-emerald-400', urgent: false },
  rejected: { label: 'Re-upload Required', color: 'text-red-400', dot: 'bg-red-400', urgent: true },
  paid: { label: 'Paid', color: 'text-violet-400', dot: 'bg-violet-400', urgent: false },
}

const TIER_ICONS = { 5: Crown, 4: Medal, 3: Star }
const TIER_GRADIENTS = {
  5: 'from-amber-400 to-orange-500',
  4: 'from-sky-400 to-blue-500',
  3: 'from-emerald-400 to-green-500',
}

export default function WinningsOverview() {
  const { user } = useAuth()
  const [winners, setWinners] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchWinners = useCallback(async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from('winners')
      .select('*, draws(month_year)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
    setWinners(data || [])
    setLoading(false)
  }, [user?.id])

  useEffect(() => { fetchWinners() }, [fetchWinners])

  const totalPaid = winners.filter(w => w.status === 'paid').reduce((s, w) => s + Number(w.prize_amount || 0), 0)
  const pendingPayout = winners.filter(w => ['approved', 'proof_submitted'].includes(w.status)).reduce((s, w) => s + Number(w.prize_amount || 0), 0)
  const actionRequired = winners.filter(w => w.status === 'pending' || w.status === 'rejected').length

  if (loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
      </div>
    )
  }

  if (winners.length === 0) return null

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="px-5 sm:px-6 py-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" />
          <h3 className="font-black text-white text-base">My Winnings</h3>
        </div>
        <Link
          to="/winnings"
          className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold transition"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 divide-x divide-slate-800 border-b border-slate-800">
        {[
          { label: 'Total Paid', value: formatCurrency(totalPaid), icon: Wallet, color: 'text-violet-400' },
          { label: 'Pending', value: formatCurrency(pendingPayout), icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Action Needed', value: actionRequired, icon: AlertTriangle, color: actionRequired > 0 ? 'text-amber-400' : 'text-slate-600' },
        ].map(s => (
          <div key={s.label} className="px-4 py-3 text-center">
            <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
            <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-slate-600 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent winners */}
      <div className="divide-y divide-slate-800/60">
        {winners.map(w => {
          const meta = STATUS_META[w.status] || STATUS_META.pending
          const TierIcon = TIER_ICONS[w.match_count] || Star
          const grad = TIER_GRADIENTS[w.match_count] || TIER_GRADIENTS[3]

          return (
            <div key={w.id} className="px-5 sm:px-6 py-3.5 flex items-center gap-3">
              <div className={`h-8 w-8 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shrink-0`}>
                <TierIcon className="h-4 w-4 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white text-sm">{formatCurrency(w.prize_amount)}</p>
                  <span className="text-[9px] text-slate-500">{w.draws?.month_year}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${meta.dot}`} />
                  <p className={`text-[10px] font-semibold ${meta.color}`}>{meta.label}</p>
                </div>
              </div>

              {meta.urgent && (
                <Link
                  to="/winnings"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold hover:bg-amber-500/30 transition shrink-0"
                >
                  <Upload className="h-3 w-3" />
                  <span className="hidden sm:block">Upload</span>
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}