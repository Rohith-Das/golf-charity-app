import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../lib/drawEngine';
import {
  Trophy, CheckCircle, XCircle, Banknote, Crown, Medal, Star,
  Eye, Loader2, RefreshCw, Filter, Search, ExternalLink,
  MessageSquare, CheckCheck, Info, ArrowUpDown, Users, Wallet,
  TrendingUp, Shield
} from 'lucide-react';

/* ─── Config ─── */
const STATUS_CONFIG = {
  pending: {
    label: 'Awaiting Proof',
    color: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    dot: 'bg-amber-400',
  },
  proof_submitted: {
    label: 'Under Review',
    color: 'text-sky-400',
    badge: 'bg-sky-500/20 text-sky-300 border border-sky-500/40',
    dot: 'bg-sky-400 animate-pulse',
  },
  approved: {
    label: 'Approved',
    color: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    dot: 'bg-emerald-400',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-400',
    badge: 'bg-red-500/20 text-red-300 border border-red-500/40',
    dot: 'bg-red-400',
  },
  paid: {
    label: 'Paid',
    color: 'text-violet-400',
    badge: 'bg-violet-500/20 text-violet-300 border border-violet-500/40',
    dot: 'bg-violet-400',
  },
};

const TIER_CONFIG = {
  5: { label: 'Jackpot', icon: Crown, gradient: 'from-amber-400 to-orange-500' },
  4: { label: '4-Match', icon: Medal, gradient: 'from-sky-400 to-blue-500' },
  3: { label: '3-Match', icon: Star, gradient: 'from-emerald-400 to-green-500' },
};

const ALL_STATUSES = ['all', 'pending', 'proof_submitted', 'approved', 'rejected', 'paid'];

/* ─── Review Modal ─── */
function ReviewModal({ winner, onClose, onReviewed }) {
  const [notes, setNotes] = useState('');
  const [payRef, setPayRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState(null);

  const tierCfg = TIER_CONFIG[winner.match_count] || TIER_CONFIG[3];
  const TierIcon = tierCfg.icon;

  const handleAction = async (act) => {
    setAction(act);
    setLoading(true);
    try {
      if (act === 'approve') {
        const { error } = await supabase.rpc('review_winner_proof', {
          p_winner_id: winner.id,
          p_action: 'approved',
          p_notes: notes || null,
        });
        if (error) throw error;
        toast.success('Proof approved successfully');
      } else if (act === 'reject') {
        if (!notes.trim()) {
          toast.error('Please provide a rejection reason');
          setLoading(false);
          setAction(null);
          return;
        }
        const { error } = await supabase.rpc('review_winner_proof', {
          p_winner_id: winner.id,
          p_action: 'rejected',
          p_notes: notes,
        });
        if (error) throw error;
        toast.success('Proof rejected — user notified');
      } else if (act === 'pay') {
        const { error } = await supabase.rpc('mark_winner_paid', {
          p_winner_id: winner.id,
          p_payment_reference: payRef || null,
        });
        if (error) throw error;
        toast.success('Payment marked as completed');
      }
      onReviewed();
      onClose();
    } catch (err) {
      toast.error('Action failed: ' + err.message);
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-700 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${tierCfg.gradient} flex items-center justify-center shadow-lg`}>
              <TierIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-xl">Review Winner</h3>
              <p className="text-sm text-slate-400">{winner.profiles?.full_name || winner.profiles?.email}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Prize Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
              <p className="text-xs text-slate-500 mb-1">PRIZE</p>
              <p className="text-3xl font-bold text-amber-400">{formatCurrency(winner.prize_amount)}</p>
            </div>
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
              <p className="text-xs text-slate-500 mb-1">DRAW</p>
              <p className="text-lg font-semibold text-white">{winner.draws?.month_year || '—'}</p>
            </div>
          </div>

          {/* Proof */}
          {winner.proof_url ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                <FileImage className="h-4 w-4" /> Submitted Proof
              </p>
              <div className="rounded-2xl overflow-hidden border border-slate-700 bg-black">
                <img 
                  src={winner.proof_url} 
                  alt="Proof" 
                  className="w-full max-h-80 object-contain" 
                />
              </div>
              <a
                href={winner.proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:text-sky-300 text-sm flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" /> Open full proof
              </a>
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-dashed border-slate-700 rounded-2xl p-12 text-center">
              <FileImage className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No proof submitted yet</p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm text-slate-400 mb-2 font-medium">
              Admin Notes {winner.status === 'proof_submitted' && <span className="text-red-400">(required for rejection)</span>}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write your review notes or rejection reason..."
              rows={4}
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white focus:border-rose-500 placeholder-slate-500 resize-y min-h-[110px]"
            />
          </div>

          {/* Payment Reference */}
          {winner.status === 'approved' && (
            <div>
              <label className="block text-sm text-slate-400 mb-2 font-medium">Payment Reference (Optional)</label>
              <input
                type="text"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="Transaction ID, bank reference, etc."
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:border-violet-500"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col gap-3">
            {winner.status === 'proof_submitted' && (
              <>
                <button
                  onClick={() => handleAction('approve')}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-2xl font-semibold text-white flex items-center justify-center gap-3 transition disabled:opacity-70"
                >
                  {loading && action === 'approve' ? <Loader2 className="animate-spin h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                  Approve Proof
                </button>

                <button
                  onClick={() => handleAction('reject')}
                  disabled={loading}
                  className="w-full py-4 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 rounded-2xl font-semibold flex items-center justify-center gap-3 transition disabled:opacity-70"
                >
                  {loading && action === 'reject' ? <Loader2 className="animate-spin h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  Reject Proof
                </button>
              </>
            )}

            {winner.status === 'approved' && (
              <button
                onClick={() => handleAction('pay')}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-700 rounded-2xl font-semibold text-white flex items-center justify-center gap-3 transition disabled:opacity-70"
              >
                {loading && action === 'pay' ? <Loader2 className="animate-spin h-5 w-5" /> : <Banknote className="h-5 w-5" />}
                Mark as Paid — {formatCurrency(winner.prize_amount)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Winner Row */
function WinnerRow({ winner, onReview }) {
  const cfg = STATUS_CONFIG[winner.status] || STATUS_CONFIG.pending;
  const tierCfg = TIER_CONFIG[winner.match_count] || TIER_CONFIG[3];
  const TierIcon = tierCfg.icon;
  const isUrgent = winner.status === 'proof_submitted';

  return (
    <tr className={`group border-b border-slate-800 hover:bg-slate-800/70 transition-all ${isUrgent ? 'bg-rose-950/30' : ''}`}>
      <td className="px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-sm font-bold text-white">
            {(winner.profiles?.full_name || 'U').substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{winner.profiles?.full_name || 'Unknown'}</p>
            <p className="text-xs text-slate-500 truncate">{winner.profiles?.email}</p>
          </div>
        </div>
      </td>

      <td className="px-6 py-5 hidden md:table-cell">
        <p className="text-slate-300">{winner.draws?.month_year || '—'}</p>
      </td>

      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-xl bg-gradient-to-br ${tierCfg.gradient} flex items-center justify-center`}>
            <TierIcon className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-slate-300">{tierCfg.label}</span>
        </div>
      </td>

      <td className="px-6 py-5">
        <p className="font-bold text-amber-400 text-lg tracking-tight">{formatCurrency(winner.prize_amount)}</p>
      </td>

      <td className="px-6 py-5">
        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold ${cfg.badge}`}>
          <span className={`h-2 w-2 rounded-full mr-2 ${cfg.dot}`} />
          {cfg.label}
        </span>
      </td>

      <td className="px-6 py-5 text-right">
        <button
          onClick={() => onReview(winner)}
          className={`px-6 py-3 rounded-2xl text-sm font-medium flex items-center gap-2 transition-all ${
            isUrgent 
              ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/40' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
          }`}
        >
          <Eye className="h-4 w-4" />
          {isUrgent ? 'Review Now' : 'View'}
        </button>
      </td>
    </tr>
  );
}

/* Main Component */
export default function AdminWinnersManager() {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [reviewTarget, setReviewTarget] = useState(null);
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  const fetchWinners = useCallback(async () => {
    setLoading(true);
    // Your existing fetch logic (kept unchanged for data accuracy)
    const { data: winnersData, error: winnersError } = await supabase
      .from('winners')
      .select('*')
      .order(sortField, { ascending: sortDir === 'asc' });

    if (winnersError) {
      toast.error('Failed to load winners');
      setLoading(false);
      return;
    }

    if (!winnersData?.length) {
      setWinners([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(winnersData.map(w => w.user_id))];
    const drawIds = [...new Set(winnersData.map(w => w.draw_id))];

    const [{ data: profilesData }, { data: drawsData }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email').in('id', userIds),
      supabase.from('draws').select('id, month_year').in('id', drawIds)
    ]);

    const profileMap = Object.fromEntries((profilesData || []).map(p => [p.id, p]));
    const drawMap = Object.fromEntries((drawsData || []).map(d => [d.id, d]));

    const enriched = winnersData.map(w => ({
      ...w,
      profiles: profileMap[w.user_id] || null,
      draws: drawMap[w.draw_id] || null,
    }));

    setWinners(enriched);
    setLoading(false);
  }, [sortField, sortDir]);

  useEffect(() => {
    fetchWinners();
  }, [fetchWinners]);

  const filtered = winners.filter(w => {
    const matchesStatus = filterStatus === 'all' || w.status === filterStatus;
    const q = search.toLowerCase();
    const matchesSearch = !q || 
      (w.profiles?.full_name || '').toLowerCase().includes(q) ||
      (w.profiles?.email || '').toLowerCase().includes(q) ||
      (w.draws?.month_year || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: winners.length,
    needsReview: winners.filter(w => w.status === 'proof_submitted').length,
    approved: winners.filter(w => w.status === 'approved').length,
    paid: winners.filter(w => w.status === 'paid').length,
    totalPaid: winners.filter(w => w.status === 'paid').reduce((s, w) => s + Number(w.prize_amount || 0), 0),
    pendingPayout: winners.filter(w => w.status === 'approved').reduce((s, w) => s + Number(w.prize_amount || 0), 0),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center">
            <Trophy className="h-7 w-7 text-slate-950" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Winners Management</h1>
            <p className="text-slate-400">Review proofs • Approve • Process payouts</p>
          </div>
        </div>
        <button 
          onClick={fetchWinners}
          className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-sm font-medium transition"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Winners', value: stats.total, icon: Users, color: 'text-white' },
          { label: 'Needs Review', value: stats.needsReview, icon: Shield, color: 'text-rose-400', highlight: stats.needsReview > 0 },
          { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Paid', value: stats.paid, icon: CheckCheck, color: 'text-violet-400' },
          { label: 'Total Paid', value: formatCurrency(stats.totalPaid), icon: Wallet, color: 'text-amber-400' },
          { label: 'Pending Payout', value: formatCurrency(stats.pendingPayout), icon: TrendingUp, color: 'text-emerald-400' },
        ].map((s) => (
          <div key={s.label} className={`rounded-3xl p-5 border ${s.highlight ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-900 border-slate-700'}`}>
            <s.icon className={`h-5 w-5 mb-3 ${s.color}`} />
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, email or draw..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl focus:border-rose-500 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {ALL_STATUSES.map((s) => {
              const active = filterStatus === s;
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-5 py-3 rounded-2xl text-sm font-medium transition-all ${
                    active 
                      ? 'bg-white text-slate-900 shadow-lg' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-rose-400" />
            <p className="text-slate-400 mt-4">Loading winners...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Trophy className="h-12 w-12 text-slate-700 mx-auto mb-4" />
            <p className="text-xl text-slate-400">No winners found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-950">
                  {['Winner', 'Draw', 'Tier', 'Prize', 'Status', 'Action'].map((header, i) => (
                    <th key={i} className="px-6 py-5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((winner) => (
                  <WinnerRow 
                    key={winner.id} 
                    winner={winner} 
                    onReview={setReviewTarget} 
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewTarget && (
        <ReviewModal
          winner={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onReviewed={fetchWinners}
        />
      )}
    </div>
  );
}