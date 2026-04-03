
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { toast } from 'react-hot-toast'
import { formatCurrency } from '../../lib/drawEngine'
import {
  Trophy, CheckCircle, XCircle, Banknote, Crown, Medal, Star,
  Eye, Loader2, RefreshCw, Filter, Search, Clock, Shield,
  AlertTriangle, ChevronDown, ChevronUp, X, Check, FileImage,
  TrendingUp, Users, Wallet, ExternalLink, MessageSquare,
  CheckCheck, Info, ArrowUpDown
} from 'lucide-react'

/* ─── Config ─── */
const STATUS_CONFIG = {
  pending: {
    label: 'Awaiting Proof', color: 'text-amber-400',
    bg: 'bg-amber-500/10', border: 'border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    dot: 'bg-amber-400',
  },
  proof_submitted: {
    label: 'Review Required', color: 'text-sky-400',
    bg: 'bg-sky-500/10', border: 'border-sky-500/30',
    badge: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
    dot: 'bg-sky-400 animate-pulse',
  },
  approved: {
    label: 'Approved', color: 'text-emerald-400',
    bg: 'bg-emerald-500/10', border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  rejected: {
    label: 'Rejected', color: 'text-red-400',
    bg: 'bg-red-500/10', border: 'border-red-500/30',
    badge: 'bg-red-500/20 text-red-300 border border-red-500/30',
    dot: 'bg-red-400',
  },
  paid: {
    label: 'Paid', color: 'text-violet-400',
    bg: 'bg-violet-500/10', border: 'border-violet-500/30',
    badge: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
    dot: 'bg-violet-400',
  },
}

const TIER_CONFIG = {
  5: { label: 'Jackpot', icon: Crown, gradient: 'from-amber-400 to-orange-500' },
  4: { label: '4-Match', icon: Medal, gradient: 'from-sky-400 to-blue-500' },
  3: { label: '3-Match', icon: Star, gradient: 'from-emerald-400 to-green-500' },
}

const ALL_STATUSES = ['all', 'pending', 'proof_submitted', 'approved', 'rejected', 'paid']

/* ─── Review Modal ─── */
function ReviewModal({ winner, onClose, onReviewed }) {
  const [notes, setNotes] = useState('')
  const [payRef, setPayRef] = useState('')
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState(null) // 'approve' | 'reject' | 'pay'

  const tierCfg = TIER_CONFIG[winner.match_count] || TIER_CONFIG[3]
  const TierIcon = tierCfg.icon

  const handleAction = async (act) => {
    setAction(act)
    setLoading(true)
    try {
      if (act === 'approve') {
        const { error } = await supabase.rpc('review_winner_proof', {
          p_winner_id: winner.id,
          p_action: 'approved',
          p_notes: notes || null,
        })
        if (error) throw error
        toast.success('Proof approved ✓')
      } else if (act === 'reject') {
        if (!notes.trim()) { toast.error('Please provide a rejection reason'); setLoading(false); setAction(null); return }
        const { error } = await supabase.rpc('review_winner_proof', {
          p_winner_id: winner.id,
          p_action: 'rejected',
          p_notes: notes,
        })
        if (error) throw error
        toast.success('Proof rejected — user notified')
      } else if (act === 'pay') {
        const { error } = await supabase.rpc('mark_winner_paid', {
          p_winner_id: winner.id,
          p_payment_reference: payRef || null,
        })
        if (error) throw error
        toast.success(`Payment of ${formatCurrency(winner.prize_amount)} marked as sent!`)
      }
      onReviewed()
      onClose()
    } catch (err) {
      toast.error('Action failed: ' + err.message)
    } finally {
      setLoading(false)
      setAction(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${tierCfg.gradient} flex items-center justify-center shadow-lg`}>
              <TierIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Review Winner</h3>
              <p className="text-xs text-slate-500">{winner.profiles?.full_name || winner.profiles?.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Prize info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/60 rounded-2xl p-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Prize Amount</p>
              <p className="text-xl font-black text-amber-400">{formatCurrency(winner.prize_amount)}</p>
            </div>
            <div className="bg-slate-800/60 rounded-2xl p-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Draw</p>
              <p className="text-sm font-bold text-white">{winner.draws?.month_year || '—'}</p>
            </div>
          </div>

          {/* Proof image */}
          {winner.proof_url ? (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileImage className="h-3 w-3" /> Submitted Proof
                <span className="text-slate-600">·</span>
                <span className="text-slate-600 normal-case">
                  {winner.proof_submitted_at ? new Date(winner.proof_submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </p>
              <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-800">
                {winner.proof_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={winner.proof_url}
                    alt="Score proof"
                    className="w-full max-h-64 object-contain"
                  />
                ) : (
                  <div className="p-6 text-center">
                    <FileImage className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">PDF document submitted</p>
                  </div>
                )}
              </div>
              <a
                href={winner.proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium transition"
              >
                <ExternalLink className="h-3 w-3" /> Open full proof
              </a>
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-dashed border-slate-700 rounded-2xl p-6 text-center">
              <FileImage className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No proof submitted yet</p>
            </div>
          )}

          {/* Notes input */}
          {(winner.status === 'proof_submitted' || winner.status === 'approved') && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3" /> Admin Notes
                {winner.status === 'proof_submitted' && <span className="text-red-400 normal-case">(required for rejection)</span>}
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes or rejection reason…"
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition resize-none"
              />
            </div>
          )}

          {/* Payment reference (for pay action) */}
          {winner.status === 'approved' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Banknote className="h-3 w-3" /> Payment Reference (optional)
              </label>
              <input
                type="text"
                value={payRef}
                onChange={e => setPayRef(e.target.value)}
                placeholder="Bank transfer ref, PayPal ID, etc."
                className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition"
              />
            </div>
          )}

          {/* Previous admin notes (read-only) */}
          {winner.admin_notes && winner.status !== 'proof_submitted' && (
            <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Previous Notes</p>
              <p className="text-xs text-slate-400">{winner.admin_notes}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            {winner.status === 'proof_submitted' && (
              <>
                <button
                  onClick={() => handleAction('approve')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold text-sm disabled:opacity-50 transition-all shadow-lg shadow-emerald-900/30"
                >
                  {loading && action === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Approve Proof
                </button>
                <button
                  onClick={() => handleAction('reject')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 font-bold text-sm disabled:opacity-50 transition-all"
                >
                  {loading && action === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  Reject Proof
                </button>
              </>
            )}

            {winner.status === 'approved' && (
              <button
                onClick={() => handleAction('pay')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-bold text-sm disabled:opacity-50 transition-all shadow-lg shadow-violet-900/30"
              >
                {loading && action === 'pay' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
                Mark as Paid — {formatCurrency(winner.prize_amount)}
              </button>
            )}

            {(winner.status === 'paid' || winner.status === 'pending' || winner.status === 'rejected') && (
              <div className="flex items-center gap-2 py-3 px-4 rounded-2xl bg-slate-800/40 border border-slate-700">
                <Info className="h-4 w-4 text-slate-500 shrink-0" />
                <p className="text-xs text-slate-500">
                  {winner.status === 'paid' && `Paid on ${new Date(winner.paid_at).toLocaleDateString('en-GB')}`}
                  {winner.status === 'pending' && 'Waiting for user to submit proof'}
                  {winner.status === 'rejected' && 'User has been notified to re-submit'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Winner Row ─── */
function WinnerRow({ winner, onReview }) {
  const cfg = STATUS_CONFIG[winner.status] || STATUS_CONFIG.pending
  const tierCfg = TIER_CONFIG[winner.match_count] || TIER_CONFIG[3]
  const TierIcon = tierCfg.icon
  const needsAction = winner.status === 'proof_submitted'

  return (
    <tr className={`transition-colors hover:bg-slate-800/30 ${needsAction ? 'bg-sky-500/5' : ''}`}>
      {/* User */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {(winner.profiles?.full_name || winner.profiles?.email || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">{winner.profiles?.full_name || 'Unknown'}</p>
            <p className="text-[10px] text-slate-500 truncate">{winner.profiles?.email}</p>
          </div>
        </div>
      </td>

      {/* Draw */}
      <td className="px-4 py-4 hidden sm:table-cell">
        <p className="text-sm text-slate-300 font-medium">{winner.draws?.month_year || '—'}</p>
      </td>

      {/* Tier */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${tierCfg.gradient} flex items-center justify-center shrink-0`}>
            <TierIcon className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-slate-300 hidden lg:block">{tierCfg.label}</span>
        </div>
      </td>

      {/* Prize */}
      <td className="px-4 py-4">
        <p className="font-black text-amber-400 text-sm">{formatCurrency(winner.prize_amount)}</p>
      </td>

      {/* Status */}
      <td className="px-4 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${cfg.badge} whitespace-nowrap`}>
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
          {cfg.label}
        </span>
      </td>

      {/* Date */}
      <td className="px-4 py-4 hidden md:table-cell">
        <p className="text-xs text-slate-500">
          {new Date(winner.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </p>
      </td>

      {/* Action */}
      <td className="px-4 py-4">
        <button
          onClick={() => onReview(winner)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            needsAction
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 hover:bg-sky-500/30'
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <Eye className="h-3.5 w-3.5" />
          {needsAction ? 'Review Now' : 'View'}
        </button>
      </td>
    </tr>
  )
}

/* ═══════════════ MAIN COMPONENT ═══════════════ */
export default function AdminWinnersManager() {
  const [winners, setWinners] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [reviewTarget, setReviewTarget] = useState(null)
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')

const fetchWinners = useCallback(async () => {
  setLoading(true)
  
  // Step 1: fetch winners directly
  const { data: winnersData, error: winnersError } = await supabase
    .from('winners')
    .select('*')
    .order(sortField, { ascending: sortDir === 'asc' })

  if (winnersError) {
    console.error('Winners error:', winnersError)
    toast.error('Failed to load winners: ' + winnersError.message)
    setLoading(false)
    return
  }

  if (!winnersData || winnersData.length === 0) {
    setWinners([])
    setLoading(false)
    return
  }

  // Step 2: fetch related profiles separately
  const userIds = [...new Set(winnersData.map(w => w.user_id))]
  const drawIds = [...new Set(winnersData.map(w => w.draw_id))]

  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds)

  const { data: drawsData } = await supabase
    .from('draws')
    .select('id, month_year, winning_numbers')
    .in('id', drawIds)

  // Step 3: manually join
  const profileMap = Object.fromEntries((profilesData || []).map(p => [p.id, p]))
  const drawMap = Object.fromEntries((drawsData || []).map(d => [d.id, d]))

  const enriched = winnersData.map(w => ({
    ...w,
    profiles: profileMap[w.user_id] || null,
    draws: drawMap[w.draw_id] || null,
  }))

  setWinners(enriched)
  setLoading(false)
}, [sortField, sortDir])

  useEffect(() => { fetchWinners() }, [fetchWinners])

  const filtered = winners.filter(w => {
    const matchesStatus = filterStatus === 'all' || w.status === filterStatus
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      (w.profiles?.full_name || '').toLowerCase().includes(q) ||
      (w.profiles?.email || '').toLowerCase().includes(q) ||
      (w.draws?.month_year || '').toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  /* Summary stats */
  const stats = {
    total: winners.length,
    needsReview: winners.filter(w => w.status === 'proof_submitted').length,
    approved: winners.filter(w => w.status === 'approved').length,
    paid: winners.filter(w => w.status === 'paid').length,
    totalPaid: winners.filter(w => w.status === 'paid').reduce((s, w) => s + Number(w.prize_amount || 0), 0),
    pendingPayout: winners.filter(w => w.status === 'approved').reduce((s, w) => s + Number(w.prize_amount || 0), 0),
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" /> Winners Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Review proofs, approve & process payouts</p>
        </div>
        <button onClick={fetchWinners} className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition">
          <RefreshCw className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Winners', value: stats.total, icon: Users, color: 'text-white' },
          { label: 'Needs Review', value: stats.needsReview, icon: Shield, color: 'text-sky-400', highlight: stats.needsReview > 0 },
          { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Paid Out', value: stats.paid, icon: CheckCheck, color: 'text-violet-400' },
          { label: 'Total Paid', value: formatCurrency(stats.totalPaid), icon: Wallet, color: 'text-amber-400' },
          { label: 'Pending Pay', value: formatCurrency(stats.pendingPayout), icon: TrendingUp, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-3 ${s.highlight ? 'bg-sky-500/10 border-sky-500/30' : 'bg-slate-800/60 border-slate-800'}`}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider leading-none">{s.label}</p>
            </div>
            <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          {ALL_STATUSES.map(s => {
            const cfg = s === 'all' ? null : STATUS_CONFIG[s]
            const count = s === 'all' ? winners.length : winners.filter(w => w.status === s).length
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                  filterStatus === s
                    ? 'bg-slate-700 text-white border border-slate-600'
                    : 'bg-slate-800/60 text-slate-500 border border-slate-800 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                {cfg && <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />}
                {s === 'all' ? 'All' : cfg.label}
                <span className="bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded-md text-[9px] font-bold">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
            <p className="text-slate-500 text-sm">Loading winners…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="h-10 w-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500">No winners found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/60 border-b border-slate-800">
                  {[
                    { label: 'Winner', field: null },
                    { label: 'Draw', field: null, hidden: 'sm' },
                    { label: 'Tier', field: null },
                    { label: 'Prize', field: 'prize_amount' },
                    { label: 'Status', field: 'status' },
                    { label: 'Date', field: 'created_at', hidden: 'md' },
                    { label: 'Action', field: null },
                  ].map(col => (
                    <th
                      key={col.label}
                      onClick={() => col.field && (sortField === col.field ? setSortDir(d => d === 'asc' ? 'desc' : 'asc') : (setSortField(col.field), setSortDir('desc')))}
                      className={`px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider ${col.field ? 'cursor-pointer hover:text-slate-300' : ''} ${col.hidden ? `hidden ${col.hidden}:table-cell` : ''}`}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {col.field && <ArrowUpDown className="h-3 w-3" />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map(w => (
                  <WinnerRow key={w.id} winner={w} onReview={setReviewTarget} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-800/20">
            <p className="text-[10px] text-slate-600">
              {filtered.length} of {winners.length} records
              {stats.needsReview > 0 && (
                <span className="ml-3 text-sky-400 font-semibold">· {stats.needsReview} proof{stats.needsReview !== 1 ? 's' : ''} awaiting review</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Review modal */}
      {reviewTarget && (
        <ReviewModal
          winner={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onReviewed={fetchWinners}
        />
      )}
    </div>
  )
}