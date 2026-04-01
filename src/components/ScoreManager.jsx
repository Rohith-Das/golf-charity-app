
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import {
  Plus,
  Trash2,
  Calendar,
  Target,
  AlertTriangle,
  Loader2,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react'

const MAX_SCORES = 5
const MIN_SCORE = 1
const MAX_SCORE = 45

// Stableford colour coding — higher is better
function getScoreStyle(score) {
  if (score >= 40) return { label: 'Excellent', bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500', ring: 'ring-emerald-300' }
  if (score >= 31) return { label: 'Good', bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-500', ring: 'ring-blue-300' }
  if (score >= 21) return { label: 'Average', bg: 'bg-amber-100', text: 'text-amber-700', bar: 'bg-amber-500', ring: 'ring-amber-300' }
  return { label: 'Below Par', bg: 'bg-red-100', text: 'text-red-600', bar: 'bg-red-400', ring: 'ring-red-300' }
}

function ScoreBar({ score }) {
  const style = getScoreStyle(score)
  const pct = Math.round((score / MAX_SCORE) * 100)
  return (
    <div className="flex items-center space-x-2 mt-1.5">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    </div>
  )
}

export default function ScoreManager() {
  const { user } = useAuth()
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    score: '',
    score_date: new Date().toISOString().split('T')[0],
  })

  const fetchScores = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('golf_scores')
      .select('*')
      .eq('user_id', user.id)
      .order('score_date', { ascending: false })
      .limit(MAX_SCORES)

    if (error) toast.error('Failed to load scores')
    else setScores(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (user?.id) fetchScores()
  }, [user?.id])

  const atLimit = scores.length >= MAX_SCORES

  // Oldest score that will be removed on next insert
  const oldestScore = atLimit
    ? [...scores].sort((a, b) => new Date(a.score_date) - new Date(b.score_date))[0]
    : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    const scoreVal = parseInt(form.score, 10)

    if (!form.score_date) return toast.error('Please select a date')
    if (isNaN(scoreVal) || scoreVal < MIN_SCORE || scoreVal > MAX_SCORE)
      return toast.error(`Score must be between ${MIN_SCORE} and ${MAX_SCORE}`)

    // Check duplicate date
    const duplicate = scores.find((s) => s.score_date === form.score_date)
    if (duplicate)
      return toast.error('You already have a score for this date. Choose a different date.')

    setSubmitting(true)

    const { error } = await supabase.from('golf_scores').insert({
      user_id: user.id,
      score: scoreVal,
      score_date: form.score_date,
    })

    if (error) {
      if (error.code === '23505') toast.error('A score for this date already exists.')
      else toast.error('Failed to save score: ' + error.message)
    } else {
      toast.success('Score saved!')
      setForm({ score: '', score_date: new Date().toISOString().split('T')[0] })
      setShowForm(false)
      fetchScores()
    }
    setSubmitting(false)
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    const { error } = await supabase.from('golf_scores').delete().eq('id', id)
    if (error) toast.error('Failed to delete score')
    else {
      toast.success('Score removed')
      setScores((prev) => prev.filter((s) => s.id !== id))
    }
    setDeletingId(null)
  }

  const avg = scores.length
    ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
    : null

  const best = scores.length ? Math.max(...scores.map((s) => s.score)) : null

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center shadow-sm">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">My Golf Scores</h2>
              <p className="text-xs text-gray-500">Stableford format · last {MAX_SCORES} scores retained</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-blue-700 hover:from-primary-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Add Score</span>
            {showForm ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Stats Row */}
        {scores.length > 0 && (
          <div className="flex items-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500">Avg:</span>
              <span className="text-sm font-bold text-gray-900">{avg}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-gray-500">Best:</span>
              <span className="text-sm font-bold text-gray-900">{best}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500">
                {scores.length}/{MAX_SCORES} scores
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Add Score Form */}
      {showForm && (
        <div className="px-6 py-5 bg-gradient-to-br from-primary-50/60 to-blue-50/40 border-b border-primary-100">
          {/* Replacement warning */}
          {atLimit && oldestScore && (
            <div className="flex items-start space-x-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl mb-4">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                <span className="font-semibold">Heads up:</span> You have {MAX_SCORES} scores saved. Adding a new score will
                automatically remove your oldest —{' '}
                <span className="font-semibold">
                  {new Date(oldestScore.score_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} (Score: {oldestScore.score})
                </span>.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
            {/* Score Input */}
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Stableford Score <span className="text-gray-400 font-normal">(1–45)</span>
              </label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  min={MIN_SCORE}
                  max={MAX_SCORE}
                  required
                  value={form.score}
                  onChange={(e) => setForm({ ...form, score: e.target.value })}
                  placeholder="e.g. 36"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white transition-all"
                />
              </div>
              {/* Live score label preview */}
              {form.score && parseInt(form.score) >= MIN_SCORE && parseInt(form.score) <= MAX_SCORE && (
                <p className={`text-xs font-medium mt-1 ${getScoreStyle(parseInt(form.score)).text}`}>
                  {getScoreStyle(parseInt(form.score)).label}
                </p>
              )}
            </div>

            {/* Date Input */}
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Date Played
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={form.score_date}
                  onChange={(e) => setForm({ ...form, score_date: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white transition-all"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-blue-700 hover:from-primary-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center space-x-2 whitespace-nowrap"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /><span>Saving...</span></>
              ) : (
                <><Plus className="h-4 w-4" /><span>Save Score</span></>
              )}
            </button>
          </form>

          {/* Info */}
          <div className="flex items-start space-x-2 mt-3">
            <Info className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400">One score per date. Only your latest {MAX_SCORES} scores are kept.</p>
          </div>
        </div>
      )}

      {/* Score List */}
      <div className="px-6 py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
            <p className="text-sm text-gray-400 mt-3">Loading scores...</p>
          </div>
        ) : scores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-gray-200" />
            </div>
            <p className="text-gray-500 font-medium">No scores yet</p>
            <p className="text-sm text-gray-400 mt-1">Add your first Stableford score to get started</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors"
            >
              Add First Score
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {scores.map((s, idx) => {
              const style = getScoreStyle(s.score)
              const isNewest = idx === 0
              return (
                <div
                  key={s.id}
                  className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 ${
                    isNewest
                      ? 'border-primary-200 bg-primary-50/40'
                      : 'border-gray-100 bg-gray-50/40 hover:bg-gray-50'
                  }`}
                >
                  {/* Position badge */}
                  <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center text-lg font-bold ring-2 ${style.ring} ${style.bg} ${style.text}`}>
                    {s.score}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(s.score_date).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      {isNewest && (
                        <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                          Latest
                        </span>
                      )}
                      {atLimit && oldestScore?.id === s.id && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-xs font-medium rounded-full">
                          Oldest
                        </span>
                      )}
                    </div>
                    <ScoreBar score={s.score} />
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deletingId === s.id}
                    className="flex-shrink-0 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                    title="Delete score"
                  >
                    {deletingId === s.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
