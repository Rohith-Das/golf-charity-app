// components/DrawPanel.jsx
// User-facing draw panel: shows current draw, user's entry numbers,
// past results, and prize history.

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import {
  formatCurrency,
  countMatches,
  getTierLabel,
} from '../lib/drawEngine'
import {
  Trophy,
  Target,
  Calendar,
  Clock,
  Loader2,
  Star,
  Crown,
  Medal,
  Gift,
  ChevronDown,
  ChevronUp,
  Zap,
  TrendingUp,
  CheckCircle,
  Circle,
} from 'lucide-react'

// ─── Number Ball ────────────────────────────────────────────
function NumberBall({ n, isMatch, size = 'md' }) {
  const base = size === 'lg'
    ? 'h-12 w-12 text-base'
    : size === 'sm'
    ? 'h-8 w-8 text-xs'
    : 'h-10 w-10 text-sm'

  return (
    <div
      className={`${base} rounded-full flex items-center justify-center font-bold border-2 transition-all duration-500 ${
        isMatch === true
          ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-300 text-white shadow-lg shadow-amber-200 scale-110'
          : isMatch === false
          ? 'bg-gray-100 border-gray-200 text-gray-400'
          : 'bg-white border-gray-300 text-gray-700 shadow-sm'
      }`}
    >
      {n}
    </div>
  )
}

// ─── Prize Tier Badge ────────────────────────────────────────
function TierBadge({ matchCount }) {
  if (matchCount >= 5) return (
    <span className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
      <Crown className="h-3 w-3" /><span>5-Match Jackpot!</span>
    </span>
  )
  if (matchCount === 4) return (
    <span className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
      <Medal className="h-3 w-3" /><span>4-Match Winner!</span>
    </span>
  )
  if (matchCount === 3) return (
    <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
      <Star className="h-3 w-3" /><span>3-Match Winner!</span>
    </span>
  )
  return null
}

// ─── Main Component ──────────────────────────────────────────
export default function DrawPanel() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)

  // Current (pending) draw
  const [currentDraw, setCurrentDraw] = useState(null)
  const [userEntry, setUserEntry] = useState(null)

  // Past draws (published)
  const [pastDraws, setpastDraws] = useState([])
  const [userWins, setUserWins] = useState([])
  const [showPast, setShowPast] = useState(false)

  const fetchDrawData = useCallback(async () => {
    setLoading(true)
    if (!user?.id) return

    // 1. Latest pending draw
    const { data: pending } = await supabase
      .from('draws')
      .select('*')
      .eq('status', 'pending')
      .order('draw_number', { ascending: false })
      .limit(1)
      .single()

    setCurrentDraw(pending || null)

    // 2. User's entry in current draw
    if (pending) {
      const { data: entry } = await supabase
        .from('draw_entries')
        .select('*')
        .eq('draw_id', pending.id)
        .eq('user_id', user.id)
        .single()
      setUserEntry(entry || null)
    }

    // 3. Past published draws + user's entries
    const { data: past } = await supabase
      .from('draws')
      .select('*, draw_entries!inner(entry_numbers, matches, is_winner, prize_tier)')
      .eq('status', 'published')
      .eq('draw_entries.user_id', user.id)
      .order('draw_number', { ascending: false })
      .limit(6)

    setpastDraws(past || [])

    // 4. User wins
    const { data: wins } = await supabase
      .from('winners')
      .select('*, draws(month_year, draw_number)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setUserWins(wins || [])

    setLoading(false)
  }, [user?.id])

  useEffect(() => { fetchDrawData() }, [fetchDrawData])

  // ── Total winnings ────────────────────────────────────────
  const totalWon = userWins.reduce((s, w) => s + parseFloat(w.prize_amount || 0), 0)

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-3xl p-6 text-white overflow-hidden relative shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full -translate-y-1/4 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/4 -translate-x-1/4" />
        </div>
        <div className="relative">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Monthly Prize Draw</h2>
              <p className="text-amber-100 text-xs">Stableford scores power your lucky numbers</p>
            </div>
          </div>

          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-amber-200" />
          ) : currentDraw ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-amber-100 text-xs">Current Draw</p>
                  <p className="text-2xl font-bold">{currentDraw.month_year}</p>
                </div>
                <div className="text-right">
                  <p className="text-amber-100 text-xs">Prize Pool</p>
                  <p className="text-2xl font-bold">{formatCurrency(currentDraw.prize_pool)}</p>
                </div>
              </div>

              {currentDraw.jackpot_amount > 0 && (
                <div className="flex items-center space-x-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 w-fit">
                  <Zap className="h-4 w-4 text-yellow-300" />
                  <span className="text-sm font-bold">
                    Jackpot Rollover: {formatCurrency(currentDraw.jackpot_amount)} added!
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/15 rounded-xl px-4 py-3">
              <p className="text-sm text-amber-100">No active draw at the moment. Check back soon!</p>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 bg-white rounded-3xl border border-gray-100">
          <Loader2 className="h-7 w-7 animate-spin text-amber-400" />
        </div>
      ) : (
        <>
          {/* ── Current Entry ── */}
          {currentDraw && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-amber-500" />
                  <h3 className="text-sm font-bold text-gray-900">Your Entry Numbers</h3>
                </div>
                {userEntry ? (
                  <span className="flex items-center space-x-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                    <CheckCircle className="h-3 w-3" /><span>Enrolled</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 px-2.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                    <Clock className="h-3 w-3" /><span>Pending Enrollment</span>
                  </span>
                )}
              </div>

              {userEntry ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                    {userEntry.entry_numbers.map((n) => (
                      <NumberBall key={n} n={n} size="lg" />
                    ))}
                  </div>
                  <div className="flex items-start space-x-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <Star className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      Your entry numbers are derived from your recent Stableford scores.
                      Higher and more consistent scores influence your draw numbers.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                  <Circle className="h-10 w-10 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">Not enrolled yet</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    Make sure your subscription is active and you have at least one golf score recorded. The draw admin will enroll all eligible subscribers.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Prize Breakdown ── */}
          {currentDraw && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Gift className="h-4 w-4 text-amber-500" />
                <span>This Month's Prizes</span>
              </h3>
              <div className="space-y-3">
                {[
                  {
                    label: '5-Number Match',
                    sublabel: 'Jackpot',
                    pct: 40,
                    pool: currentDraw.prize_pool * 0.4 + (currentDraw.jackpot_amount || 0),
                    icon: Crown,
                    color: 'text-amber-600',
                    bg: 'bg-amber-50',
                    border: 'border-amber-100',
                  },
                  {
                    label: '4-Number Match',
                    sublabel: 'Second Prize',
                    pct: 35,
                    pool: currentDraw.prize_pool * 0.35,
                    icon: Medal,
                    color: 'text-blue-600',
                    bg: 'bg-blue-50',
                    border: 'border-blue-100',
                  },
                  {
                    label: '3-Number Match',
                    sublabel: 'Third Prize',
                    pct: 25,
                    pool: currentDraw.prize_pool * 0.25,
                    icon: Star,
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-50',
                    border: 'border-emerald-100',
                  },
                ].map((tier) => {
                  const Icon = tier.icon
                  return (
                    <div key={tier.label} className={`flex items-center justify-between p-3.5 rounded-xl border ${tier.bg} ${tier.border}`}>
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-4 w-4 ${tier.color}`} />
                        <div>
                          <p className={`text-xs font-bold ${tier.color}`}>{tier.label}</p>
                          <p className="text-xs text-gray-400">{tier.sublabel} · {tier.pct}% of pool</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${tier.color}`}>{formatCurrency(tier.pool)}</p>
                        <p className="text-xs text-gray-400">split among winners</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                Match 5 jackpot rolls over to next month if unclaimed
              </p>
            </div>
          )}

          {/* ── Past Results ── */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => setShowPast(!showPast)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-bold text-gray-900">Past Draw Results</span>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">{pastDraws.length}</span>
              </div>
              {showPast ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </button>

            {showPast && (
              <div className="px-6 pb-5 space-y-4 border-t border-gray-100 pt-4">
                {pastDraws.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No past draws yet.</p>
                ) : (
                  pastDraws.map((draw) => {
                    const entry = draw.draw_entries?.[0]
                    const myMatches = entry?.matches || 0
                    const isWinner = entry?.is_winner || false
                    const winnerRecord = userWins.find(w => w.draw_id === draw.id)

                    return (
                      <div
                        key={draw.id}
                        className={`rounded-2xl border p-4 ${
                          isWinner ? 'border-amber-200 bg-amber-50/40' : 'border-gray-100 bg-gray-50/40'
                        }`}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{draw.month_year}</p>
                            <p className="text-xs text-gray-400">Draw #{draw.draw_number} · {draw.winners_count} winner{draw.winners_count !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {isWinner && <TierBadge matchCount={myMatches} />}
                            {!isWinner && (
                              <span className="px-2.5 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                                {myMatches} match{myMatches !== 1 ? 'es' : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Winning numbers vs user entry */}
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-400 mb-1.5">Winning Numbers</p>
                            <div className="flex items-center space-x-2 flex-wrap gap-1.5">
                              {draw.winning_numbers.map(n => (
                                <NumberBall
                                  key={n}
                                  n={n}
                                  isWinning={true}
                                  size="sm"
                                />
                              ))}
                            </div>
                          </div>
                          {entry && (
                            <div>
                              <p className="text-xs text-gray-400 mb-1.5">Your Numbers</p>
                              <div className="flex items-center space-x-2 flex-wrap gap-1.5">
                                {entry.entry_numbers.map(n => (
                                  <NumberBall
                                    key={n}
                                    n={n}
                                    isMatch={draw.winning_numbers.includes(n)}
                                    size="sm"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Prize won */}
                        {winnerRecord && (
                          <div className="mt-3 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                            <span className="text-xs font-semibold text-amber-700">Prize Won</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-bold text-amber-700">{formatCurrency(winnerRecord.prize_amount)}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                winnerRecord.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-600'
                              }`}>{winnerRecord.status}</span>
                            </div>
                          </div>
                        )}

                        {/* Rollover notice */}
                        {draw.rollover && (
                          <div className="mt-2 flex items-center space-x-2 text-xs text-purple-600">
                            <Zap className="h-3 w-3" />
                            <span>Jackpot rolled over — no 5-match winner</span>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {/* ── Winnings Summary ── */}
          {userWins.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-3xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-gray-900">Your Winnings</h3>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500">Total Won</p>
                  <p className="text-3xl font-bold text-emerald-700">{formatCurrency(totalWon)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Draws Won</p>
                  <p className="text-3xl font-bold text-emerald-700">{userWins.length}</p>
                </div>
              </div>
              <div className="space-y-2">
                {userWins.slice(0, 4).map((w) => {
                  const tier = w.match_count >= 5 ? 'match5' : w.match_count === 4 ? 'match4' : 'match3'
                  return (
                    <div key={w.id} className="flex items-center justify-between text-xs bg-white border border-emerald-100 rounded-xl px-3 py-2">
                      <span className="text-gray-500">{w.draws?.month_year}</span>
                      <span className="text-gray-700 font-medium">{getTierLabel(tier)}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-emerald-700">{formatCurrency(w.prize_amount)}</span>
                        {w.status === 'paid' && <CheckCircle className="h-3 w-3 text-emerald-500" />}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}