
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import {
  Target,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Loader2,
  ChevronDown,
  Calendar,
  User,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'

const MIN_SCORE = 1
const MAX_SCORE = 45

function getScoreStyle(score) {
  if (score >= 40) return { label: 'Excellent', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' }
  if (score >= 31) return { label: 'Good', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' }
  if (score >= 21) return { label: 'Average', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' }
  return { label: 'Below Par', bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-400' }
}

export default function AdminScoreManager() {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [scores, setScores] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingScores, setLoadingScores] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Edit state
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({ score: '', score_date: '' })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Fetch non-admin users
  const fetchUsers = async () => {
    setLoadingUsers(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('role', 'user')
      .order('full_name', { ascending: true })

    if (error) toast.error('Failed to load users')
    else setUsers(data || [])
    setLoadingUsers(false)
  }

  // Fetch scores for selected user
  const fetchScores = async (userId) => {
    setLoadingScores(true)
    const { data, error } = await supabase
      .from('golf_scores')
      .select('*')
      .eq('user_id', userId)
      .order('score_date', { ascending: false })

    if (error) toast.error('Failed to load scores')
    else setScores(data || [])
    setLoadingScores(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const selectUser = (u) => {
    setSelectedUser(u)
    setDropdownOpen(false)
    setUserSearch('')
    setEditingId(null)
    fetchScores(u.id)
  }

  const startEdit = (s) => {
    setEditingId(s.id)
    setEditData({ score: s.score, score_date: s.score_date })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditData({ score: '', score_date: '' })
  }

  const saveEdit = async (scoreId) => {
    const scoreVal = parseInt(editData.score, 10)
    if (isNaN(scoreVal) || scoreVal < MIN_SCORE || scoreVal > MAX_SCORE)
      return toast.error(`Score must be between ${MIN_SCORE} and ${MAX_SCORE}`)
    if (!editData.score_date)
      return toast.error('Date is required')

    // Check for duplicate date (excluding current record)
    const duplicate = scores.find(
      (s) => s.score_date === editData.score_date && s.id !== scoreId
    )
    if (duplicate)
      return toast.error('Another score already exists on this date')

    setSaving(true)
    const { error } = await supabase
      .from('golf_scores')
      .update({ score: scoreVal, score_date: editData.score_date, updated_at: new Date().toISOString() })
      .eq('id', scoreId)

    if (error) {
      toast.error('Update failed: ' + error.message)
    } else {
      toast.success('Score updated!')
      setScores((prev) =>
        prev
          .map((s) => s.id === scoreId ? { ...s, score: scoreVal, score_date: editData.score_date } : s)
          .sort((a, b) => new Date(b.score_date) - new Date(a.score_date))
      )
      cancelEdit()
    }
    setSaving(false)
  }

  const handleDelete = async (scoreId) => {
    setDeletingId(scoreId)
    const { error } = await supabase.from('golf_scores').delete().eq('id', scoreId)
    if (error) toast.error('Delete failed: ' + error.message)
    else {
      toast.success('Score deleted')
      setScores((prev) => prev.filter((s) => s.id !== scoreId))
    }
    setDeletingId(null)
  }

  const filteredUsers = users.filter(
    (u) =>
      (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
  )

  const avg = scores.length
    ? Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length)
    : null

  const initials = (u) =>
    (u.full_name || u.email || 'U')
      .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Score Management</h2>
            <p className="text-xs text-gray-500">View and edit any user's golf scores</p>
          </div>
        </div>
        {selectedUser && (
          <button
            onClick={() => fetchScores(selectedUser.id)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-xl transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* User Selector */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Player
          </label>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors text-left"
            >
              {selectedUser ? (
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                    {initials(selectedUser)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedUser.full_name || 'No name'}</p>
                    <p className="text-xs text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-gray-400">
                  <User className="h-4 w-4" />
                  <span className="text-sm">Choose a player...</span>
                </div>
              )}
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 overflow-hidden">
                {/* Search within dropdown */}
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search players..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      autoFocus
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50"
                    />
                  </div>
                </div>
                <div className="max-h-52 overflow-y-auto">
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No players found</p>
                  ) : (
                    filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => selectUser(u)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-purple-50 transition-colors text-left ${
                          selectedUser?.id === u.id ? 'bg-purple-50' : ''
                        }`}
                      >
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {initials(u)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {u.full_name || <span className="italic text-gray-400">No name</span>}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{u.email}</p>
                        </div>
                        {selectedUser?.id === u.id && (
                          <Check className="h-4 w-4 text-purple-600 flex-shrink-0 ml-auto" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scores Panel */}
        {!selectedUser ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl">
            <User className="h-10 w-10 text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm font-medium">Select a player above to view their scores</p>
          </div>
        ) : loadingScores ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            <p className="text-sm text-gray-400 mt-3">Loading scores...</p>
          </div>
        ) : (
          <div>
            {/* Player Summary */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                  {initials(selectedUser)}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{selectedUser.full_name || 'No name'}</p>
                  <p className="text-xs text-gray-400">{scores.length}/5 scores recorded</p>
                </div>
              </div>
              {scores.length > 0 && (
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>Avg: <strong className="text-gray-900">{avg}</strong></span>
                  <span>Best: <strong className="text-gray-900">{Math.max(...scores.map(s => s.score))}</strong></span>
                </div>
              )}
            </div>

            {scores.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                <Target className="h-10 w-10 text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">No scores recorded for this player</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {scores.map((s, idx) => {
                  const style = getScoreStyle(s.score)
                  const isEditing = editingId === s.id
                  return (
                    <div
                      key={s.id}
                      className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border transition-all duration-200 ${
                        isEditing
                          ? 'border-purple-300 bg-purple-50/40'
                          : 'border-gray-100 bg-gray-50/40 hover:border-gray-200'
                      }`}
                    >
                      {/* Score Badge */}
                      <div className={`flex-shrink-0 h-11 w-11 rounded-xl flex items-center justify-center text-base font-bold ring-2 ${
                        isEditing ? 'ring-purple-300 bg-purple-100 text-purple-700' : `ring-transparent ${style.bg} ${style.text}`
                      }`}>
                        {isEditing ? editData.score || '—' : s.score}
                      </div>

                      {/* Fields */}
                      {isEditing ? (
                        <div className="flex flex-col sm:flex-row gap-2.5 flex-1">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Score (1–45)</label>
                            <div className="relative">
                              <Target className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                              <input
                                type="number"
                                min={MIN_SCORE}
                                max={MAX_SCORE}
                                value={editData.score}
                                onChange={(e) => setEditData({ ...editData, score: e.target.value })}
                                className="w-full pl-8 pr-3 py-2 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                              />
                            </div>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                            <div className="relative">
                              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                              <input
                                type="date"
                                max={new Date().toISOString().split('T')[0]}
                                value={editData.score_date}
                                onChange={(e) => setEditData({ ...editData, score_date: e.target.value })}
                                className="w-full pl-8 pr-3 py-2 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {new Date(s.score_date).toLocaleDateString('en-GB', {
                                weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
                              })}
                            </p>
                            {idx === 0 && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">Latest</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                            <span className={`text-xs font-medium ${style.text}`}>{style.label}</span>
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-24">
                              <div
                                className={`h-full rounded-full ${style.dot}`}
                                style={{ width: `${(s.score / MAX_SCORE) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(s.id)}
                              disabled={saving}
                              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
                            >
                              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                              <span>Save</span>
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Cancel</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(s)}
                              className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg transition-colors border border-purple-200"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(s.id)}
                              disabled={deletingId === s.id}
                              className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition-colors border border-red-200 disabled:opacity-50"
                            >
                              {deletingId === s.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
