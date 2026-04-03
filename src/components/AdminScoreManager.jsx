import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
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
} from 'lucide-react';

const MIN_SCORE = 1;
const MAX_SCORE = 45;

function getScoreStyle(score) {
  if (score >= 40) return { label: 'Excellent', color: 'text-emerald-400', dot: 'bg-emerald-500' };
  if (score >= 31) return { label: 'Good', color: 'text-blue-400', dot: 'bg-blue-500' };
  if (score >= 21) return { label: 'Average', color: 'text-amber-400', dot: 'bg-amber-500' };
  return { label: 'Below Par', color: 'text-red-400', dot: 'bg-red-500' };
}

export default function AdminScoreManager() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [scores, setScores] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingScores, setLoadingScores] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ score: '', score_date: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('role', 'user')
      .order('full_name', { ascending: true });

    if (error) toast.error('Failed to load users');
    else setUsers(data || []);
    setLoadingUsers(false);
  };

  const fetchScores = async (userId) => {
    setLoadingScores(true);
    const { data, error } = await supabase
      .from('golf_scores')
      .select('*')
      .eq('user_id', userId)
      .order('score_date', { ascending: false });

    if (error) toast.error('Failed to load scores');
    else setScores(data || []);
    setLoadingScores(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const selectUser = (u) => {
    setSelectedUser(u);
    setDropdownOpen(false);
    setUserSearch('');
    setEditingId(null);
    fetchScores(u.id);
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditData({ score: s.score, score_date: s.score_date });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ score: '', score_date: '' });
  };

  const saveEdit = async (scoreId) => {
    const scoreVal = parseInt(editData.score, 10);
    if (isNaN(scoreVal) || scoreVal < MIN_SCORE || scoreVal > MAX_SCORE)
      return toast.error(`Score must be between ${MIN_SCORE} and ${MAX_SCORE}`);
    if (!editData.score_date)
      return toast.error('Date is required');

    const duplicate = scores.find(
      (s) => s.score_date === editData.score_date && s.id !== scoreId
    );
    if (duplicate)
      return toast.error('Another score already exists on this date');

    setSaving(true);
    const { error } = await supabase
      .from('golf_scores')
      .update({ 
        score: scoreVal, 
        score_date: editData.score_date, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', scoreId);

    if (error) {
      toast.error('Update failed: ' + error.message);
    } else {
      toast.success('Score updated successfully!');
      setScores((prev) =>
        prev
          .map((s) => s.id === scoreId ? { ...s, score: scoreVal, score_date: editData.score_date } : s)
          .sort((a, b) => new Date(b.score_date) - new Date(a.score_date))
      );
      cancelEdit();
    }
    setSaving(false);
  };

  const handleDelete = async (scoreId) => {
    setDeletingId(scoreId);
    const { error } = await supabase.from('golf_scores').delete().eq('id', scoreId);
    if (error) toast.error('Delete failed');
    else {
      toast.success('Score deleted');
      setScores((prev) => prev.filter((s) => s.id !== scoreId));
    }
    setDeletingId(null);
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const avg = scores.length
    ? Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length)
    : null;

  const initials = (u) =>
    (u.full_name || u.email || 'U')
      .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl flex items-center justify-center">
            <Target className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Score Management</h2>
            <p className="text-slate-400 text-sm">Manage players' golf scores</p>
          </div>
        </div>

        {selectedUser && (
          <button
            onClick={() => fetchScores(selectedUser.id)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-sm font-medium transition"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        )}
      </div>

      <div className="p-6 space-y-8">
        {/* User Selector */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-3">Select Player</label>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-2xl px-5 py-4 text-left transition-all"
            >
              {selectedUser ? (
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-bold text-sm">
                    {initials(selectedUser)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{selectedUser.full_name || 'No Name'}</p>
                    <p className="text-xs text-slate-500">{selectedUser.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-slate-400">
                  <User className="h-5 w-5" />
                  <span>Choose a player to manage scores...</span>
                </div>
              )}

              <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute z-50 mt-2 w-full bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-700">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 pl-11 py-3 rounded-2xl text-sm focus:border-violet-500 placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {loadingUsers ? (
                    <div className="py-12 flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">No players found</div>
                  ) : (
                    filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => selectUser(u)}
                        className={`w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-800 transition-all text-left ${
                          selectedUser?.id === u.id ? 'bg-slate-800' : ''
                        }`}
                      >
                        <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {initials(u)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{u.full_name || 'No name'}</p>
                          <p className="text-xs text-slate-500 truncate">{u.email}</p>
                        </div>
                        {selectedUser?.id === u.id && <Check className="h-5 w-5 text-emerald-400" />}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scores Section */}
        {!selectedUser ? (
          <div className="bg-slate-900/50 border border-slate-700 border-dashed rounded-3xl py-20 text-center">
            <User className="h-12 w-12 mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 font-medium">Select a player to view and manage their scores</p>
          </div>
        ) : loadingScores ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
            <p className="text-slate-400 mt-4">Loading scores...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Player Info Bar */}
            <div className="flex items-center justify-between bg-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-bold">
                  {initials(selectedUser)}
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{selectedUser.full_name || 'Unknown Player'}</p>
                  <p className="text-xs text-slate-500">{selectedUser.email}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-400">Total Scores</p>
                <p className="text-2xl font-bold text-white">{scores.length}/5</p>
              </div>
            </div>

            {scores.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-700 rounded-3xl py-16 text-center">
                <Target className="h-14 w-14 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">This player has no scores recorded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {scores.map((s) => {
                  const style = getScoreStyle(s.score);
                  const isEditing = editingId === s.id;

                  return (
                    <div
                      key={s.id}
                      className={`bg-slate-800 border rounded-3xl p-6 transition-all ${
                        isEditing ? 'border-violet-500' : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-5">
                        {/* Score Circle */}
                        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-3xl font-bold flex-shrink-0 transition-all ${
                          isEditing 
                            ? 'bg-violet-500 text-white' 
                            : `bg-slate-700 ${style.color}`
                        }`}>
                          {isEditing ? editData.score || '?' : s.score}
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                          {isEditing ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs text-slate-400 block mb-1">Score</label>
                                <input
                                  type="number"
                                  min={MIN_SCORE}
                                  max={MAX_SCORE}
                                  value={editData.score}
                                  onChange={(e) => setEditData({ ...editData, score: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-600 rounded-2xl px-4 py-3 text-white focus:border-violet-500"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-400 block mb-1">Date</label>
                                <input
                                  type="date"
                                  value={editData.score_date}
                                  onChange={(e) => setEditData({ ...editData, score_date: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-600 rounded-2xl px-4 py-3 text-white focus:border-violet-500"
                                />
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-white font-medium">
                                {new Date(s.score_date).toLocaleDateString('en-GB', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <div className={`h-2 w-2 rounded-full ${style.dot}`} />
                                <span className={`text-sm font-medium ${style.color}`}>{style.label}</span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 self-end md:self-center">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveEdit(s.id)}
                                disabled={saving}
                                className="flex-1 md:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-medium text-sm transition flex items-center justify-center gap-2 disabled:opacity-70"
                              >
                                {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Check className="h-4 w-4" />}
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="flex-1 md:flex-none px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-2xl font-medium text-sm transition"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(s)}
                                className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-2xl text-sm font-medium transition flex items-center gap-2"
                              >
                                <Edit2 className="h-4 w-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(s.id)}
                                disabled={deletingId === s.id}
                                className="px-5 py-3 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-2xl text-sm font-medium transition flex items-center gap-2 disabled:opacity-50"
                              >
                                {deletingId === s.id ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}