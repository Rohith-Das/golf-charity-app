// components/AdminDrawManager.jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import {
  generateRandomNumbers,
  generateWeightedNumbers,
  simulateDraw,
  calculatePrizes,
  formatCurrency,
  getCurrentMonthYear,
  PRIZE_POOL_DEFAULT,
  NUMBER_RANGE,
  DRAW_SIZE,
} from '../lib/drawEngine'
import {
  Shuffle,
  Play,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Trophy,
  Users,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Eye,
  Send,
  RefreshCw,
  Star,
  Crown,
  Zap,
  DollarSign,
  Medal,
  X,
  Plus,
  Settings,
  TrendingUp,
  Gift,
} from 'lucide-react'

// ─── Tier config ───────────────────────────────────────────
const TIER_CONFIG = {
  match5: {
    label: '5-Number Match',
    sublabel: 'Jackpot',
    icon: Crown,
    pct: 40,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
  match4: {
    label: '4-Number Match',
    sublabel: 'Second Prize',
    icon: Medal,
    pct: 35,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
  },
  match3: {
    label: '3-Number Match',
    sublabel: 'Third Prize',
    icon: Star,
    pct: 25,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
  },
}

// ─── Number Ball ───────────────────────────────────────────
function NumberBall({ n, isWinning, size = 'md' }) {
  const base = size === 'lg' ? 'h-12 w-12 text-lg' : 'h-9 w-9 text-sm'
  return (
    <div
      className={`${base} rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300 ${
        isWinning
          ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-300 text-white shadow-lg shadow-amber-200'
          : 'bg-white border-gray-200 text-gray-700'
      }`}
    >
      {n}
    </div>
  )
}

// ─── Prize Tier Card ───────────────────────────────────────
function PrizeTierCard({ tier, data }) {
  const cfg = TIER_CONFIG[tier]
  const Icon = cfg.icon
  return (
    <div className={`rounded-2xl border p-4 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Icon className={`h-4 w-4 ${cfg.color}`} />
          <div>
            <p className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</p>
            <p className="text-xs text-gray-400">{cfg.sublabel} · {cfg.pct}% pool</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
          {data.count} winner{data.count !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-gray-400">Pool</p>
          <p className={`font-bold text-sm ${cfg.color}`}>{formatCurrency(data.pool)}</p>
        </div>
        <div>
          <p className="text-gray-400">Per Winner</p>
          <p className={`font-bold text-sm ${cfg.color}`}>
            {data.count > 0 ? formatCurrency(data.perWinner) : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────
export default function AdminDrawManager() {
  const [draws, setDraws] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeDrawId, setActiveDrawId] = useState(null)

  // Create draw form
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({
    month_year: getCurrentMonthYear(),
    prize_pool: PRIZE_POOL_DEFAULT,
    jackpot_amount: 0,
    algorithm_type: 'random',
  })
  const [creating, setCreating] = useState(false)

  // Simulation state
  const [simNumbers, setSimNumbers] = useState([])
  const [simResult, setSimResult] = useState(null)
  const [simLoading, setSimLoading] = useState(false)
  const [entriesCache, setEntriesCache] = useState({}) // draw_id → entries

  // Publishing
  const [publishing, setPublishing] = useState(false)

  // Winners modal
  const [winnersDrawId, setWinnersDrawId] = useState(null)
  const [winners, setWinners] = useState([])
  const [winnersLoading, setWinnersLoading] = useState(false)

  // ── Data fetch ─────────────────────────────────────────
  const fetchDraws = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('draws')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) toast.error('Failed to load draws')
    else setDraws(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchDraws() }, [fetchDraws])

  // ── Load entries for a draw (for simulation) ───────────
  const loadEntries = async (drawId) => {
    if (entriesCache[drawId]) return entriesCache[drawId]
    const { data, error } = await supabase
      .from('draw_entries')
      .select('id, user_id, entry_numbers, profiles(full_name, email)')
      .eq('draw_id', drawId)
    if (error) { toast.error('Failed to load entries'); return [] }
    const entries = (data || []).map(e => ({
      ...e,
      name: e.profiles?.full_name || e.profiles?.email || 'Unknown',
    }))
    setEntriesCache(prev => ({ ...prev, [drawId]: entries }))
    return entries
  }

  // ── Create draw ────────────────────────────────────────
  const handleCreate = async () => {
    if (!createForm.month_year) return toast.error('Month/year required')
    setCreating(true)

    // Get next draw number
    const maxNum = draws.reduce((m, d) => Math.max(m, d.draw_number || 0), 0)

    const { data, error } = await supabase.from('draws').insert({
      draw_number: maxNum + 1,
      month_year: createForm.month_year,
      prize_pool: Number(createForm.prize_pool),
      jackpot_amount: Number(createForm.jackpot_amount),
      algorithm_type: createForm.algorithm_type,
      winning_numbers: [], // set during simulation/publish
      status: 'pending',
    }).select().single()

    if (error) {
      toast.error('Create failed: ' + error.message)
    } else {
      toast.success('Draw created!')
      setDraws(prev => [data, ...prev])
      setShowCreate(false)
      setActiveDrawId(data.id)

      // Auto-enroll eligible users
      const { error: enrollErr } = await supabase.rpc('enroll_draw_entries', { p_draw_id: data.id })
      if (enrollErr) toast.error('Entry enrollment failed: ' + enrollErr.message)
      else toast.success('Eligible subscribers enrolled!')
      fetchDraws()
    }
    setCreating(false)
  }

  // ── Generate numbers ───────────────────────────────────
  const generateNumbers = async (draw) => {
    setSimLoading(true)
    let nums = []

    if (draw.algorithm_type === 'weighted') {
      // Fetch all active user scores for weighting
      const { data: scores } = await supabase
        .from('golf_scores')
        .select('score')
        .in('user_id', (await supabase.from('profiles').select('id').eq('subscription_status', 'active')).data?.map(p => p.id) || [])
      const allScores = (scores || []).map(s => s.score)
      nums = generateWeightedNumbers(allScores)
    } else {
      nums = generateRandomNumbers()
    }

    setSimNumbers(nums)
    setSimResult(null)
    setSimLoading(false)
    return nums
  }

  // ── Run simulation ─────────────────────────────────────
  const runSimulation = async (draw) => {
    setSimLoading(true)
    const nums = simNumbers.length === DRAW_SIZE ? simNumbers : await generateNumbers(draw)
    const entries = await loadEntries(draw.id)

    const result = simulateDraw(nums, entries, draw.prize_pool, draw.jackpot_amount || 0)
    setSimResult(result)

    // Persist simulation data
    await supabase.from('draws').update({
      simulation_run: true,
      simulation_data: {
        winning_numbers: nums,
        total_winners: result.totalWinners,
        jackpot_rolls: result.jackpotRolls,
        prizes: result.prizes,
      },
    }).eq('id', draw.id)

    setSimLoading(false)
    toast.success('Simulation complete!')
  }

  // ── Publish draw ───────────────────────────────────────
  const publishDraw = async (draw) => {
    if (simNumbers.length !== DRAW_SIZE) {
      return toast.error('Generate winning numbers first')
    }

    const confirmed = window.confirm(
      `Publish draw "${draw.month_year}" with winning numbers [${simNumbers.join(', ')}]?\n\nThis will finalise results and notify winners. This action cannot be undone.`
    )
    if (!confirmed) return

    setPublishing(true)

    // Save winning numbers, then call the process function
    const { error: updateErr } = await supabase.from('draws').update({
      winning_numbers: simNumbers,
    }).eq('id', draw.id)

    if (updateErr) {
      toast.error('Failed to set winning numbers')
      setPublishing(false)
      return
    }

    const { data, error } = await supabase.rpc('process_draw_results', { p_draw_id: draw.id })
    if (error) {
      toast.error('Publish failed: ' + error.message)
    } else {
      toast.success(`Draw published! ${data.match5_winners + data.match4_winners + data.match3_winners} winners found.`)
      fetchDraws()
      setSimResult(null)
      setSimNumbers([])
    }
    setPublishing(false)
  }

  // ── Load winners ───────────────────────────────────────
  const loadWinners = async (drawId) => {
    setWinnersDrawId(drawId)
    setWinnersLoading(true)
    const { data, error } = await supabase
      .from('winners')
      .select('*, profiles(full_name, email)')
      .eq('draw_id', drawId)
      .order('match_count', { ascending: false })
    if (error) toast.error('Failed to load winners')
    else setWinners(data || [])
    setWinnersLoading(false)
  }

  // ── Mark winner paid ───────────────────────────────────
  const markPaid = async (winnerId) => {
    const { error } = await supabase.from('winners')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', winnerId)
    if (error) toast.error('Update failed')
    else {
      toast.success('Marked as paid!')
      setWinners(prev => prev.map(w => w.id === winnerId ? { ...w, status: 'paid', paid_at: new Date().toISOString() } : w))
    }
  }

  const activeDraw = draws.find(d => d.id === activeDrawId)

  // ── Draw status badge ──────────────────────────────────
  const statusBadge = (status) => {
    const map = {
      pending: 'bg-amber-100 text-amber-700',
      published: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-600',
    }
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Draw Management</h2>
              <p className="text-xs text-gray-500">Create, simulate, and publish monthly prize draws</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchDraws}
              className="flex items-center space-x-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-xl transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Draw</span>
            </button>
          </div>
        </div>

        {/* ── Create Form ── */}
        {showCreate && (
          <div className="px-6 py-5 bg-amber-50/40 border-b border-amber-100">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <Settings className="h-4 w-4 text-amber-600" />
              <span>Configure New Draw</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Month / Year</label>
                <input
                  type="text"
                  placeholder="e.g. April 2026"
                  value={createForm.month_year}
                  onChange={e => setCreateForm({ ...createForm, month_year: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Prize Pool (£)</label>
                <input
                  type="number"
                  min={100}
                  value={createForm.prize_pool}
                  onChange={e => setCreateForm({ ...createForm, prize_pool: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Jackpot Rollover (£)</label>
                <input
                  type="number"
                  min={0}
                  value={createForm.jackpot_amount}
                  onChange={e => setCreateForm({ ...createForm, jackpot_amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Draw Algorithm</label>
                <select
                  value={createForm.algorithm_type}
                  onChange={e => setCreateForm({ ...createForm, algorithm_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                >
                  <option value="random">Random (Standard)</option>
                  <option value="weighted">Weighted by Scores</option>
                </select>
              </div>
            </div>

            {/* Algorithm explanation */}
            <div className="mt-3 p-3 bg-white border border-amber-200 rounded-xl text-xs text-gray-600">
              {createForm.algorithm_type === 'random'
                ? '🎲 Random: 5 numbers drawn uniformly at random from 1–45. Fair and transparent.'
                : '⚖️ Weighted: Numbers that appear less often in user scores are given higher draw probability, reducing shared wins and increasing excitement.'}
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl">Cancel</button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center space-x-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl disabled:opacity-60"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                <span>Create & Enroll</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Draws List ── */}
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-amber-400" />
            </div>
          ) : draws.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Trophy className="h-12 w-12 text-gray-100 mb-3" />
              <p className="text-gray-400 text-sm">No draws yet. Create your first monthly draw.</p>
            </div>
          ) : (
            draws.map((draw) => (
              <div key={draw.id} className="px-6 py-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  {/* Left: info */}
                  <div className="flex items-center space-x-4">
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-amber-700">#{draw.draw_number}</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <p className="text-sm font-bold text-gray-900">{draw.month_year}</p>
                        {statusBadge(draw.status)}
                        {draw.rollover && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                            🎰 Jackpot Rolled
                          </span>
                        )}
                        {draw.simulation_run && draw.status === 'pending' && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                            Simulated
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
                        <span>Pool: <strong className="text-gray-700">{formatCurrency(draw.prize_pool)}</strong></span>
                        {draw.jackpot_amount > 0 && (
                          <span>Jackpot: <strong className="text-amber-600">+{formatCurrency(draw.jackpot_amount)}</strong></span>
                        )}
                        <span>Entries: <strong className="text-gray-700">{draw.total_entries || 0}</strong></span>
                        {draw.status === 'published' && (
                          <span>Winners: <strong className="text-emerald-700">{draw.winners_count}</strong></span>
                        )}
                      </div>

                      {/* Winning numbers (if published) */}
                      {draw.status === 'published' && draw.winning_numbers?.length > 0 && (
                        <div className="flex items-center space-x-1.5 mt-2">
                          {draw.winning_numbers.map(n => (
                            <NumberBall key={n} n={n} isWinning />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center space-x-2 flex-wrap gap-2">
                    {draw.status === 'published' && (
                      <button
                        onClick={() => loadWinners(draw.id)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200"
                      >
                        <Trophy className="h-3.5 w-3.5" />
                        <span>View Winners</span>
                      </button>
                    )}
                    {draw.status === 'pending' && (
                      <button
                        onClick={() => setActiveDrawId(activeDrawId === draw.id ? null : draw.id)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg border border-amber-200"
                      >
                        {activeDrawId === draw.id ? <ChevronUp className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        <span>{activeDrawId === draw.id ? 'Collapse' : 'Manage Draw'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Draw Management Panel ── */}
                {activeDrawId === draw.id && draw.status === 'pending' && (
                  <div className="mt-5 space-y-5">
                    {/* Step 1: Generate Numbers */}
                    <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-200 rounded-2xl p-5">
                      <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center space-x-2">
                        <span className="h-5 w-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">1</span>
                        <span>Generate Winning Numbers</span>
                      </h4>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => generateNumbers(draw)}
                          disabled={simLoading}
                          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white text-sm font-semibold rounded-xl shadow-sm disabled:opacity-60"
                        >
                          {simLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shuffle className="h-4 w-4" />}
                          <span>{draw.algorithm_type === 'weighted' ? 'Generate (Weighted)' : 'Generate (Random)'}</span>
                        </button>

                        {simNumbers.length === DRAW_SIZE && (
                          <div className="flex items-center space-x-2 flex-wrap gap-2">
                            {simNumbers.map((n) => (
                              <NumberBall key={n} n={n} isWinning size="lg" />
                            ))}
                            <button
                              onClick={() => { setSimNumbers([]); setSimResult(null) }}
                              className="p-1.5 text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Manual override */}
                      <details className="mt-3">
                        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Manual override</summary>
                        <div className="mt-2 flex items-center space-x-2 flex-wrap gap-2">
                          {Array.from({ length: DRAW_SIZE }).map((_, i) => (
                            <input
                              key={i}
                              type="number"
                              min={1}
                              max={NUMBER_RANGE}
                              placeholder={`N${i + 1}`}
                              value={simNumbers[i] || ''}
                              onChange={e => {
                                const updated = [...simNumbers]
                                updated[i] = parseInt(e.target.value) || ''
                                setSimNumbers(updated.filter(Boolean))
                              }}
                              className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center"
                            />
                          ))}
                        </div>
                      </details>
                    </div>

                    {/* Step 2: Simulate */}
                    {simNumbers.length === DRAW_SIZE && (
                      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
                        <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center space-x-2">
                          <span className="h-5 w-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                          <span>Preview Simulation</span>
                        </h4>

                        <button
                          onClick={() => runSimulation(draw)}
                          disabled={simLoading}
                          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm disabled:opacity-60 mb-4"
                        >
                          {simLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                          <span>Run Simulation</span>
                        </button>

                        {simResult && (
                          <div className="space-y-4">
                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                                <p className="text-2xl font-bold text-gray-900">{draw.total_entries || 0}</p>
                                <p className="text-xs text-gray-400">Total Entries</p>
                              </div>
                              <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                                <p className="text-2xl font-bold text-emerald-600">{simResult.totalWinners}</p>
                                <p className="text-xs text-gray-400">Winners</p>
                              </div>
                              <div className={`rounded-xl p-3 border text-center ${simResult.jackpotRolls ? 'bg-purple-50 border-purple-100' : 'bg-white border-gray-100'}`}>
                                <p className={`text-2xl font-bold ${simResult.jackpotRolls ? 'text-purple-600' : 'text-gray-900'}`}>
                                  {simResult.jackpotRolls ? 'Rolls' : 'Won'}
                                </p>
                                <p className="text-xs text-gray-400">Jackpot</p>
                              </div>
                            </div>

                            {/* Prize tiers */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {Object.entries(simResult.prizes).filter(([k]) => k !== 'rollover').map(([tier, data]) => (
                                <PrizeTierCard key={tier} tier={tier} data={data} />
                              ))}
                            </div>

                            {/* Rollover notice */}
                            {simResult.jackpotRolls && (
                              <div className="flex items-center space-x-3 p-3 bg-purple-50 border border-purple-200 rounded-xl">
                                <Zap className="h-4 w-4 text-purple-500 flex-shrink-0" />
                                <p className="text-xs text-purple-700 font-medium">
                                  No 5-match winner — jackpot of {formatCurrency(simResult.prizes.rollover)} rolls over to next month!
                                </p>
                              </div>
                            )}

                            {/* Top winners preview (first 5) */}
                            {simResult.entries.filter(e => e.isWinner).length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-600 mb-2">Winners Preview</p>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                  {simResult.entries.filter(e => e.isWinner).slice(0, 10).map((e, i) => {
                                    const cfg = TIER_CONFIG[e.tier]
                                    return (
                                      <div key={i} className="flex items-center justify-between px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs">
                                        <span className="font-medium text-gray-800 truncate max-w-[120px]">{e.name}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}>{e.matches} matches</span>
                                        <span className="font-bold text-emerald-700">{formatCurrency(e.prizeAmount)}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 3: Publish */}
                    {simNumbers.length === DRAW_SIZE && (
                      <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-5">
                        <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center space-x-2">
                          <span className="h-5 w-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">3</span>
                          <span>Publish Official Results</span>
                        </h4>
                        <div className="flex items-start space-x-3 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700">
                            Publishing is <strong>irreversible</strong>. Winning numbers will be locked, prizes calculated, and winners notified. Ensure simulation results look correct first.
                          </p>
                        </div>
                        <button
                          onClick={() => publishDraw(draw)}
                          disabled={publishing}
                          className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white text-sm font-bold rounded-xl shadow-sm disabled:opacity-60"
                        >
                          {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          <span>Publish Draw Results</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Winners Modal ── */}
      {winnersDrawId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <Trophy className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-bold text-gray-900">Draw Winners</h3>
              </div>
              <button onClick={() => setWinnersDrawId(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {winnersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-7 w-7 animate-spin text-amber-400" />
                </div>
              ) : winners.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No winners for this draw.</div>
              ) : (
                <div className="space-y-3">
                  {winners.map((w) => {
                    const tier = w.match_count >= 5 ? 'match5' : w.match_count === 4 ? 'match4' : 'match3'
                    const cfg = TIER_CONFIG[tier]
                    const Icon = cfg.icon
                    return (
                      <div key={w.id} className={`flex items-center justify-between p-4 rounded-2xl border ${cfg.bg} ${cfg.border}`}>
                        <div className="flex items-center space-x-3">
                          <Icon className={`h-5 w-5 ${cfg.color}`} />
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {w.profiles?.full_name || w.profiles?.email || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-400">{cfg.label}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className={`text-sm font-bold ${cfg.color}`}>{formatCurrency(w.prize_amount)}</p>
                            <p className="text-xs text-gray-400 capitalize">{w.status}</p>
                          </div>
                          {w.status !== 'paid' && (
                            <button
                              onClick={() => markPaid(w.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg"
                            >
                              Mark Paid
                            </button>
                          )}
                          {w.status === 'paid' && (
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}