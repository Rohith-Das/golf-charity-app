

// components/AdminDrawManager.jsx
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
  Crown, Medal, Star, AlertTriangle, ChevronDown, ChevronUp, Zap
} from 'lucide-react';

const TIER_CONFIG = {
  match5: { label: '5-Number Match', sublabel: 'Jackpot', icon: Crown, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
  match4: { label: '4-Number Match', sublabel: 'Second Prize', icon: Medal, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  match3: { label: '3-Number Match', sublabel: 'Third Prize', icon: Star, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
};

function NumberBall({ n, isWinning = false, size = 'md' }) {
  const base = size === 'lg' ? 'h-12 w-12 text-lg' : 'h-9 w-9 text-sm';
  return (
    <div className={`${base} rounded-full flex items-center justify-center font-bold border-2 ${
      isWinning 
        ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-300 text-white shadow-lg' 
        : 'bg-white border-gray-200 text-gray-700'
    }`}>
      {n}
    </div>
  );
}

function PrizeTierCard({ tier, data }) {
  const cfg = TIER_CONFIG[tier];
  const Icon = cfg.icon;
  return (
    <div className={`rounded-2xl border p-4 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Icon className={`h-4 w-4 ${cfg.color}`} />
          <div>
            <p className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</p>
            <p className="text-xs text-gray-400">{cfg.sublabel}</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
          {data.count} winner{data.count !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-gray-400">Pool</p>
          <p className={`font-bold ${cfg.color}`}>{formatCurrency(data.pool)}</p>
        </div>
        <div>
          <p className="text-gray-400">Per Winner</p>
          <p className={`font-bold ${cfg.color}`}>
            {data.count > 0 ? formatCurrency(data.perWinner) : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}

// Confirmation Modal Component
function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDanger = true }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-md w-full mx-4 overflow-hidden shadow-xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            {isDanger && <AlertTriangle className="h-6 w-6 text-red-500" />}
            <h3 className="text-xl font-bold">{title}</h3>
          </div>
          <p className="text-gray-600 mb-6 whitespace-pre-line">{message}</p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 rounded-xl text-white transition ${
                isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


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

// Add this new function
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

    const { data, error } = await supabase.rpc('process_draw_results', { 
      p_draw_id: draw.id 
    });

    if (error) throw error;

    toast.success(
      `Draw published! ${data.match5_winners + data.match4_winners + data.match3_winners} winners`
    );
    
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
    const { error } = await supabase.from('winners')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', winnerId);
    if (error) toast.error('Update failed');
    else {
      toast.success('Marked as paid');
      setWinners(prev => prev.map(w => w.id === winnerId ? { ...w, status: 'paid', paid_at: new Date().toISOString() } : w));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Draw Management</h2>
              <p className="text-xs text-gray-500">Create, simulate & publish monthly draws</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchDraws} className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium">
              <Plus className="h-4 w-4" /> New Draw
            </button>
          </div>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="p-6 bg-amber-50 border-b">
            <h3 className="font-bold mb-4">New Draw</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input type="text" placeholder="April 2026" value={createForm.month_year} onChange={e => setCreateForm({...createForm, month_year: e.target.value})} className="border rounded-xl px-4 py-3" />
              <input type="number" value={createForm.base_prize_pool} onChange={e => setCreateForm({...createForm, base_prize_pool: e.target.value})} className="border rounded-xl px-4 py-3" />
              <select value={createForm.algorithm_type} onChange={e => setCreateForm({...createForm, algorithm_type: e.target.value})} className="border rounded-xl px-4 py-3">
                <option value="random">Random</option>
                <option value="weighted">Weighted</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-6 py-3 text-gray-600">Cancel</button>
              <button onClick={handleCreate} disabled={creating} className="px-6 py-3 bg-amber-600 text-white rounded-xl">
                {creating ? 'Creating...' : 'Create Draw'}
              </button>
            </div>
          </div>
        )}

        {/* Draws List */}
        <div className="divide-y divide-gray-100">
          {loading ? <div className="py-16 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div> : draws.map(draw => (
            <div key={draw.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-xl">#{draw.draw_number}</span>
                    <h3 className="font-semibold">{draw.month_year}</h3>
                  </div>
                  <p className="text-sm text-gray-500">Pool: {formatCurrency(draw.base_prize_pool)} {draw.jackpot_amount > 0 && `+ Rollover ${formatCurrency(draw.jackpot_amount)}`}</p>
                </div>
                <span className={`px-4 py-1 text-xs rounded-full ${draw.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {draw.status}
                </span>
              </div>

              {activeDrawId === draw.id && draw.status === 'pending' && (
                <div className="mt-8 space-y-8">
                  <button onClick={() => generateNumbers(draw)} disabled={simLoading} className="bg-violet-600 text-white px-6 py-3 rounded-2xl flex gap-2 items-center">
                    {simLoading ? <Loader2 className="animate-spin" /> : <Shuffle />} Generate Winning Numbers
                  </button>

                  {simNumbers.length === DRAW_SIZE && (
                    <div>
                      <div className="flex gap-3 flex-wrap mb-4">{simNumbers.map(n => <NumberBall key={n} n={n} isWinning />)}</div>
                      <button onClick={() => runSimulation(draw)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl">Run Simulation</button>
                    </div>
                  )}

                  {simResult && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        {['match5','match4','match3'].map(t => (
                          <PrizeTierCard key={t} tier={t} data={simResult.prizes[t]} />
                        ))}
                      </div>
                      <button onClick={() => publishDraw(draw)} disabled={publishing} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl flex items-center gap-2">
                        {publishing && <Loader2 className="animate-spin" />} Publish Draw
                      </button>
                    </div>
                  )}
                </div>
              )}

              {draw.status === 'published' && (
                <button onClick={() => loadWinners(draw.id)} className="mt-4 text-emerald-600">View Winners</button>
              )}
            </div>
          ))}
        </div>
      </div>
      <ConfirmationModal
  isOpen={confirmModal.isOpen}
  onClose={() => setConfirmModal({ isOpen: false, draw: null })}
  onConfirm={confirmPublish}
  title="Publish Draw"
  message={`Publish "${confirmModal.draw?.month_year}"?\n\nWinning numbers: ${simNumbers.join(', ')}\n\n⚠️ This action is irreversible.`}
  confirmText="Publish"
  isDanger={true}
/>

      {/* Winners Modal */}
      {winnersDrawId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b flex justify-between">
              <h3 className="font-bold text-xl">Winners</h3>
              <button onClick={() => setWinnersDrawId(null)}><X /></button>
            </div>
            <div className="p-6 overflow-auto">
              {winners.map(w => {
                const tier = w.match_count >= 5 ? 'match5' : w.match_count === 4 ? 'match4' : 'match3';
                return (
                  <div key={w.id} className="flex justify-between p-4 border rounded-2xl mb-3">
                    <div>
                      <p>{w.profiles?.full_name || w.profiles?.email}</p>
                      <p className="text-sm text-gray-500">{TIER_CONFIG[tier].label}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(w.prize_amount)}</p>
                      {w.status !== 'paid' && <button onClick={() => markPaid(w.id)} className="text-xs mt-2 bg-emerald-600 text-white px-4 py-1 rounded">Mark Paid</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}