

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import {
  generateRandomNumbers,
  generateWeightedNumbers,
  simulateDraw,
  formatCurrency,
  DRAW_SIZE,
  NUMBER_RANGE,
} from '../lib/drawEngine';
import {
  Trophy, Shuffle, Play, Eye, Send, RefreshCw, Plus, X, Loader2,
  Crown, Medal, Star, AlertTriangle, ChevronDown, ChevronUp, Zap,
  CheckCircle2, CircleDot, Sparkles, Users, Wallet, TrendingUp,
  Calendar, Settings2, ArrowRight, Check
} from 'lucide-react';

/* ─────────────────────────── TIER CONFIG ─────────────────────────── */
const TIER_CONFIG = {
  match5: {
    label: '5-Number Match', sublabel: 'Jackpot', icon: Crown,
    gradient: 'from-amber-400 via-yellow-300 to-amber-500',
    glow: 'shadow-amber-500/30',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-300',
  },
  match4: {
    label: '4-Number Match', sublabel: 'Second Prize', icon: Medal,
    gradient: 'from-sky-400 via-blue-300 to-sky-500',
    glow: 'shadow-sky-500/30',
    text: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    badge: 'bg-sky-500/20 text-sky-300',
  },
  match3: {
    label: '3-Number Match', sublabel: 'Third Prize', icon: Star,
    gradient: 'from-emerald-400 via-green-300 to-emerald-500',
    glow: 'shadow-emerald-500/30',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-300',
  },
};

/* ─────────────────────────── NUMBER BALL ─────────────────────────── */
function NumberBall({ n, isWinning = false, size = 'md', index = 0 }) {
  const base = size === 'lg'
    ? 'h-14 w-14 text-xl'
    : size === 'sm'
    ? 'h-8 w-8 text-xs'
    : 'h-11 w-11 text-base';

  return (
    <div
      className={`
        ${base} rounded-full flex items-center justify-center font-black
        border-2 select-none transition-all duration-300
        ${isWinning
          ? 'bg-gradient-to-br from-amber-400 via-yellow-300 to-orange-500 border-amber-300 text-slate-900 shadow-lg shadow-amber-500/40 scale-105'
          : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-400'
        }
      `}
      style={isWinning ? { animationDelay: `${index * 80}ms` } : {}}
    >
      {n}
    </div>
  );
}

/* ──────────────────────── PRIZE TIER CARD ────────────────────────── */
function PrizeTierCard({ tier, data }) {
  const cfg = TIER_CONFIG[tier];
  const Icon = cfg.icon;
  return (
    <div className={`rounded-2xl border p-5 ${cfg.bg} ${cfg.border} relative overflow-hidden group transition-all duration-300 hover:scale-[1.02]`}>
      {/* Subtle glow blob */}
      <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${cfg.gradient} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />

      <div className="flex items-start justify-between mb-4">
        <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-lg ${cfg.glow}`}>
          <Icon className="h-4 w-4 text-slate-900" />
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}>
          {data.count} winner{data.count !== 1 ? 's' : ''}
        </span>
      </div>

      <p className={`text-sm font-bold ${cfg.text} mb-0.5`}>{cfg.label}</p>
      <p className="text-xs text-slate-500 mb-4">{cfg.sublabel}</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800/60 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Pool</p>
          <p className={`text-sm font-black ${cfg.text}`}>{formatCurrency(data.pool)}</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Per Winner</p>
          <p className={`text-sm font-black ${cfg.text}`}>
            {data.count > 0 ? formatCurrency(data.perWinner) : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── CONFIRMATION MODAL ─────────────────────── */
function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = true }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl shadow-black/60 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isDanger ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
              {isDanger
                ? <AlertTriangle className="h-5 w-5 text-red-400" />
                : <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              }
            </div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
          </div>
        </div>
        <div className="p-6">
          <p className="text-slate-400 whitespace-pre-line text-sm leading-relaxed">{message}</p>
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-sm font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-5 py-2.5 rounded-xl text-white transition text-sm font-bold ${
              isDanger
                ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/40'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/40'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── STATUS BADGE ───────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    published: { label: 'Published', cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30', dot: 'bg-emerald-400' },
    pending:   { label: 'Pending',   cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',   dot: 'bg-amber-400'   },
    draft:     { label: 'Draft',     cls: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',   dot: 'bg-slate-400'   },
  };
  const { label, cls, dot } = map[status] || map.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

/* ─────────────────────── STEP INDICATOR ─────────────────────────── */
function StepIndicator({ step, label, active, done }) {
  return (
    <div className={`flex items-center gap-2 text-xs font-semibold ${
      done ? 'text-emerald-400' : active ? 'text-amber-400' : 'text-slate-600'
    }`}>
      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all
        ${done ? 'bg-emerald-500 border-emerald-400 text-white' : active ? 'bg-amber-500/20 border-amber-400 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-600'}`}>
        {done ? <Check className="h-3 w-3" /> : step}
      </div>
      {label}
    </div>
  );
}

/* ══════════════════════ MAIN COMPONENT ═══════════════════════════ */
export default function AdminDrawManager() {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDrawId, setActiveDrawId] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    month_year: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
    base_prize_pool: 15000,
    algorithm_type: 'random',
  });
  const [creating, setCreating] = useState(false);

  const [simNumbers, setSimNumbers] = useState([]);
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [entriesCache, setEntriesCache] = useState({});

  const [publishing, setPublishing] = useState(false);
  const [winnersDrawId, setWinnersDrawId] = useState(null);
  const [winners, setWinners] = useState([]);
  const [winnersLoading, setWinnersLoading] = useState(false);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, draw: null });

  const fetchDraws = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('draws')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error('Failed to load draws');
    else setDraws(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDraws(); }, [fetchDraws]);

  const loadEntries = async (drawId) => {
    if (entriesCache[drawId]) return entriesCache[drawId];
    const { data } = await supabase
      .from('draw_entries')
      .select('id, user_id, entry_numbers, profiles(full_name, email)')
      .eq('draw_id', drawId);
    const entries = (data || []).map(e => ({
      ...e,
      name: e.profiles?.full_name || e.profiles?.email || 'Unknown',
    }));
    setEntriesCache(prev => ({ ...prev, [drawId]: entries }));
    return entries;
  };

  const handleCreate = async () => {
    if (!createForm.month_year) return toast.error('Month/year required');
    setCreating(true);
    const { data, error } = await supabase.from('draws').insert({
      month_year: createForm.month_year,
      base_prize_pool: Number(createForm.base_prize_pool),
      algorithm_type: createForm.algorithm_type,
      status: 'pending',
    }).select().single();

    if (error) {
      toast.error('Create failed: ' + error.message);
    } else {
      toast.success('Draw created!');
      setDraws(prev => [data, ...prev]);
      setShowCreate(false);
      setActiveDrawId(data.id);
      const { error: enrollErr } = await supabase.rpc('enroll_draw_entries', { p_draw_id: data.id });
      if (enrollErr) toast.error('Enrollment failed');
      else toast.success('Users enrolled successfully!');
      fetchDraws();
    }
    setCreating(false);
  };

  const generateNumbers = async (draw) => {
    setSimLoading(true);
    let nums = [];
    if (draw.algorithm_type === 'weighted') {
      const { data: scores } = await supabase.from('golf_scores').select('score');
      nums = generateWeightedNumbers((scores || []).map(s => s.score));
    } else {
      nums = generateRandomNumbers();
    }
    setSimNumbers(nums);
    setSimResult(null);
    setSimLoading(false);
  };

  const runSimulation = async (draw) => {
    setSimLoading(true);
    const nums = simNumbers.length === DRAW_SIZE ? simNumbers : await generateNumbers(draw);
    const entries = await loadEntries(draw.id);
    const result = simulateDraw(nums, entries, draw.base_prize_pool || 10000, draw.jackpot_amount || 0);
    setSimResult(result);
    setSimLoading(false);
    toast.success('Simulation completed!');
  };

  const publishDraw = (draw) => {
    if (simNumbers.length !== DRAW_SIZE) {
      toast.error('Generate winning numbers first');
      return;
    }
    setConfirmModal({ isOpen: true, draw });
  };

  const confirmPublish = async () => {
    const draw = confirmModal.draw;
    if (!draw) return;
    setPublishing(true);
    try {
      const { error: updateError } = await supabase
        .from('draws')
        .update({ winning_numbers: simNumbers })
        .eq('id', draw.id);
      if (updateError) throw updateError;

      const { data, error } = await supabase.rpc('process_draw_results', { p_draw_id: draw.id });
      if (error) throw error;

      toast.success(`Draw published! ${data.match5_winners + data.match4_winners + data.match3_winners} winners`);
      fetchDraws();
      setSimNumbers([]);
      setSimResult(null);
    } catch (error) {
      toast.error('Publish failed: ' + error.message);
    } finally {
      setPublishing(false);
      setConfirmModal({ isOpen: false, draw: null });
    }
  };

  const loadWinners = async (drawId) => {
    setWinnersDrawId(drawId);
    setWinnersLoading(true);
    const { data } = await supabase
      .from('winners')
      .select('*, profiles(full_name, email)')
      .eq('draw_id', drawId);
    setWinners(data || []);
    setWinnersLoading(false);
  };

const markPaid = async (winnerId) => {
  const { error } = await supabase.rpc('mark_winner_paid', {
    p_winner_id: winnerId,
    p_payment_reference: null,
  })
  if (error) toast.error('Update failed: ' + error.message)
  else {
    toast.success('Marked as paid')
    setWinners(prev => prev.map(w =>
      w.id === winnerId ? { ...w, status: 'paid', paid_at: new Date().toISOString() } : w
    ))
  }
}

  /* ──── Derived: step state for active pending draw ──── */
  const hasNumbers = simNumbers.length === DRAW_SIZE;
  const hasResult  = !!simResult;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* ── Page header ── */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-900/40 shrink-0">
              <Trophy className="h-5 w-5 text-slate-900" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight">Draw Management</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Create, simulate &amp; publish monthly draws</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDraws}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 transition text-slate-400 hover:text-white"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-900 rounded-xl text-sm font-bold shadow-lg shadow-amber-900/30 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Draw</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Create Form ── */}
        {showCreate && (
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl overflow-hidden shadow-xl shadow-amber-900/10">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <h3 className="font-bold text-white">Create New Draw</h3>
              </div>
              <button onClick={() => setShowCreate(false)} className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition">
                <X className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" /> Month / Year
                  </label>
                  <input
                    type="text"
                    placeholder="April 2026"
                    value={createForm.month_year}
                    onChange={e => setCreateForm({ ...createForm, month_year: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet className="h-3 w-3" /> Prize Pool (₹)
                  </label>
                  <input
                    type="number"
                    value={createForm.base_prize_pool}
                    onChange={e => setCreateForm({ ...createForm, base_prize_pool: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Settings2 className="h-3 w-3" /> Algorithm
                  </label>
                  <select
                    value={createForm.algorithm_type}
                    onChange={e => setCreateForm({ ...createForm, algorithm_type: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition appearance-none cursor-pointer"
                  >
                    <option value="random">🎲 Random</option>
                    <option value="weighted">⚖️ Weighted</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowCreate(false)} className="px-5 py-2.5 text-slate-400 hover:text-white rounded-xl text-sm transition">
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-slate-900 rounded-xl text-sm font-bold shadow-lg shadow-amber-900/30 disabled:opacity-50 transition-all"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {creating ? 'Creating…' : 'Create Draw'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Draws List ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
            <p className="text-slate-500 text-sm">Loading draws…</p>
          </div>
        ) : draws.length === 0 ? (
          <div className="text-center py-24">
            <div className="h-16 w-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-slate-400 font-semibold">No draws yet</p>
            <p className="text-slate-600 text-sm mt-1">Create your first draw to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {draws.map((draw, index) => {
              const isActive = activeDrawId === draw.id;
              const isPending = draw.status === 'pending';
              const isThisActive = isActive && isPending;

              return (
                <div
                  key={draw.id}
                  className={`bg-slate-900 border rounded-3xl overflow-hidden transition-all duration-300 ${
                    isThisActive
                      ? 'border-amber-500/40 shadow-xl shadow-amber-900/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Draw header row */}
                  <div
                    className="px-5 sm:px-6 py-5 flex items-center gap-4 cursor-pointer group"
                    onClick={() => {
                      if (isPending) setActiveDrawId(isActive ? null : draw.id);
                    }}
                  >
                    {/* Draw number badge */}
                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                      draw.status === 'published'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      #{draw.draw_number}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-white text-base">{draw.month_year}</h3>
                        <StatusBadge status={draw.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Wallet className="h-3 w-3" /> {formatCurrency(draw.base_prize_pool)}
                        </span>
                        {draw.jackpot_amount > 0 && (
                          <span className="flex items-center gap-1 text-amber-500">
                            <TrendingUp className="h-3 w-3" /> +{formatCurrency(draw.jackpot_amount)} rollover
                          </span>
                        )}
                        <span className="capitalize text-slate-600">{draw.algorithm_type}</span>
                      </div>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {draw.status === 'published' && (
                        <button
                          onClick={e => { e.stopPropagation(); loadWinners(draw.id); }}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold hover:bg-emerald-500/25 transition"
                        >
                          <Users className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Winners</span>
                        </button>
                      )}
                      {isPending && (
                        <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-transform duration-300 ${isActive ? 'rotate-180' : ''} bg-slate-800`}>
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Winning numbers (published draws) */}
                  {draw.status === 'published' && draw.winning_numbers?.length > 0 && (
                    <div className="px-5 sm:px-6 pb-5">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Winning Numbers</p>
                      <div className="flex flex-wrap gap-2">
                        {draw.winning_numbers.map((n, i) => (
                          <NumberBall key={n} n={n} isWinning size="sm" index={i} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Active Draw Workflow Panel ── */}
                  {isThisActive && (
                    <div className="border-t border-slate-800">
                      {/* Step progress bar */}
                      <div className="px-5 sm:px-6 py-4 bg-slate-800/40 border-b border-slate-800">
                        <div className="flex items-center gap-3 flex-wrap">
                          <StepIndicator step="1" label="Generate Numbers" active={!hasNumbers} done={hasNumbers} />
                          <ArrowRight className="h-3 w-3 text-slate-700 shrink-0" />
                          <StepIndicator step="2" label="Simulate" active={hasNumbers && !hasResult} done={hasResult} />
                          <ArrowRight className="h-3 w-3 text-slate-700 shrink-0" />
                          <StepIndicator step="3" label="Publish" active={hasResult} done={false} />
                        </div>
                      </div>

                      <div className="p-5 sm:p-6 space-y-6">
                        {/* Step 1: Generate */}
                        <div>
                          <button
                            onClick={() => generateNumbers(draw)}
                            disabled={simLoading}
                            className="flex items-center gap-2.5 px-5 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-violet-900/30 transition-all"
                          >
                            {simLoading && !hasNumbers
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Shuffle className="h-4 w-4" />}
                            Generate Winning Numbers
                          </button>
                        </div>

                        {/* Step 2: Show numbers & simulate */}
                        {hasNumbers && (
                          <div className="space-y-4">
                            <div>
                              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Generated Numbers</p>
                              <div className="flex flex-wrap gap-2.5">
                                {simNumbers.map((n, i) => (
                                  <NumberBall key={n} n={n} isWinning index={i} />
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={() => runSimulation(draw)}
                              disabled={simLoading}
                              className="flex items-center gap-2.5 px-5 py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-sky-900/30 transition-all"
                            >
                              {simLoading
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Play className="h-4 w-4" />}
                              {simLoading ? 'Simulating…' : 'Run Simulation'}
                            </button>
                          </div>
                        )}

                        {/* Step 3: Results & Publish */}
                        {hasResult && (
                          <div className="space-y-5">
                            <div>
                              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Prize Breakdown</p>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {['match5', 'match4', 'match3'].map(t => (
                                  <PrizeTierCard key={t} tier={t} data={simResult.prizes[t]} />
                                ))}
                              </div>
                            </div>

                            {/* Total summary */}
                            <div className="bg-slate-800/60 rounded-2xl p-4 flex flex-wrap gap-4 sm:gap-8">
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Total Winners</p>
                                <p className="text-xl font-black text-white">
                                  {(simResult.prizes.match5?.count || 0) + (simResult.prizes.match4?.count || 0) + (simResult.prizes.match3?.count || 0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Total Paid Out</p>
                                <p className="text-xl font-black text-amber-400">
                                  {formatCurrency(
                                    (simResult.prizes.match5?.pool || 0) +
                                    (simResult.prizes.match4?.pool || 0) +
                                    (simResult.prizes.match3?.pool || 0)
                                  )}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => publishDraw(draw)}
                              disabled={publishing}
                              className="flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 disabled:opacity-60 text-white rounded-2xl font-bold text-sm shadow-xl shadow-emerald-900/30 transition-all"
                            >
                              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                              {publishing ? 'Publishing…' : 'Publish Draw'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Confirmation Modal ── */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, draw: null })}
        onConfirm={confirmPublish}
        title="Publish Draw"
        message={`You're about to publish "${confirmModal.draw?.month_year}".\n\nWinning numbers: ${simNumbers.join(', ')}\n\n⚠️ This action cannot be undone.`}
        confirmText="Publish Draw"
        isDanger={true}
      />

      {/* ── Winners Modal ── */}
      {winnersDrawId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden shadow-2xl shadow-black/60 flex flex-col">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Winners</h3>
                  <p className="text-xs text-slate-500">{winners.length} total</p>
                </div>
              </div>
              <button
                onClick={() => setWinnersDrawId(null)}
                className="h-9 w-9 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {winnersLoading ? (
                <div className="flex flex-col items-center py-12 gap-3">
                  <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
                  <p className="text-slate-500 text-sm">Loading winners…</p>
                </div>
              ) : winners.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500">No winners found</p>
                </div>
              ) : (
                winners.map(w => {
                  const tier = w.match_count >= 5 ? 'match5' : w.match_count === 4 ? 'match4' : 'match3';
                  const cfg = TIER_CONFIG[tier];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={w.id}
                      className={`flex items-center gap-4 p-4 rounded-2xl border ${cfg.bg} ${cfg.border}`}
                    >
                      <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shrink-0 shadow-lg ${cfg.glow}`}>
                        <Icon className="h-4 w-4 text-slate-900" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-white truncate">
                          {w.profiles?.full_name || w.profiles?.email || 'Unknown'}
                        </p>
                        <p className={`text-xs ${cfg.text}`}>{cfg.label}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-black text-sm ${cfg.text}`}>{formatCurrency(w.prize_amount)}</p>
                        {w.status === 'paid' ? (
                          <span className="text-xs text-emerald-400 flex items-center gap-1 justify-end mt-1">
                            <Check className="h-3 w-3" /> Paid
                          </span>
                        ) : (
                          <button
                            onClick={() => markPaid(w.id)}
                            className="mt-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg transition font-semibold"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}