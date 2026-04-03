import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
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
} from 'lucide-react';

const MAX_SCORES = 5;
const MIN_SCORE = 1;
const MAX_SCORE = 45;

function getScoreStyle(score) {
  if (score >= 40) return { label: 'Excellent', color: 'text-emerald-400', bar: 'bg-emerald-500' };
  if (score >= 31) return { label: 'Good', color: 'text-blue-400', bar: 'bg-blue-500' };
  if (score >= 21) return { label: 'Average', color: 'text-amber-400', bar: 'bg-amber-500' };
  return { label: 'Below Par', color: 'text-red-400', bar: 'bg-red-500' };
}

export default function ScoreManager() {
  const { user } = useAuth();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    score: '',
    score_date: new Date().toISOString().split('T')[0],
  });

  const fetchScores = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('golf_scores')
      .select('*')
      .eq('user_id', user.id)
      .order('score_date', { ascending: false })
      .limit(MAX_SCORES);

    if (error) toast.error('Failed to load scores');
    else setScores(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchScores();
  }, [user?.id]);

  const atLimit = scores.length >= MAX_SCORES;
  const oldestScore = atLimit
    ? [...scores].sort((a, b) => new Date(a.score_date) - new Date(b.score_date))[0]
    : null;

  const avg = scores.length
    ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
    : null;

  const best = scores.length ? Math.max(...scores.map((s) => s.score)) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const scoreVal = parseInt(form.score, 10);

    if (!form.score_date) return toast.error('Please select a date');
    if (isNaN(scoreVal) || scoreVal < MIN_SCORE || scoreVal > MAX_SCORE) {
      return toast.error(`Score must be between ${MIN_SCORE} and ${MAX_SCORE}`);
    }

    const duplicate = scores.find((s) => s.score_date === form.score_date);
    if (duplicate) return toast.error('You already have a score for this date.');

    setSubmitting(true);

    const { error } = await supabase.from('golf_scores').insert({
      user_id: user.id,
      score: scoreVal,
      score_date: form.score_date,
    });

    if (error) {
      toast.error(error.message || 'Failed to save score');
    } else {
      toast.success('Score saved successfully!');
      setForm({ score: '', score_date: new Date().toISOString().split('T')[0] });
      setShowForm(false);
      fetchScores();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    const { error } = await supabase.from('golf_scores').delete().eq('id', id);
    if (error) toast.error('Failed to delete score');
    else {
      toast.success('Score deleted');
      setScores((prev) => prev.filter((s) => s.id !== id));
    }
    setDeletingId(null);
  };

  return (
    <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden scroll-animate">
      {/* Header */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <Target className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">My Golf Scores</h2>
              <p className="text-slate-400 text-sm">Stableford • Last {MAX_SCORES} scores kept</p>
            </div>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-white font-medium transition-all active:scale-95"
          >
            <Plus className="h-5 w-5" />
            <span>Add Score</span>
            {showForm ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>

        {/* Stats */}
        {scores.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-emerald-400 text-2xl font-bold">{avg || '-'}</p>
              <p className="text-xs text-slate-400">Average</p>
            </div>
            <div>
              <p className="text-amber-400 text-2xl font-bold">{best || '-'}</p>
              <p className="text-xs text-slate-400">Best Score</p>
            </div>
            <div>
              <p className="text-white text-2xl font-bold">{scores.length}/{MAX_SCORES}</p>
              <p className="text-xs text-slate-400">Entries</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Score Form */}
      {showForm && (
        <div className="p-6 bg-white/5 border-b border-white/10">
          {atLimit && oldestScore && (
            <div className="mb-5 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-300">
                Adding this score will replace your oldest score from{' '}
                <span className="font-medium">
                  {new Date(oldestScore.score_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                </span>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Stableford Score (1-45)</label>
              <div className="relative">
                <Target className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="number"
                  min={MIN_SCORE}
                  max={MAX_SCORE}
                  required
                  value={form.score}
                  onChange={(e) => setForm({ ...form, score: e.target.value })}
                  placeholder="36"
                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
              {form.score && (
                <p className={`text-sm mt-2 font-medium ${getScoreStyle(parseInt(form.score)).color}`}>
                  {getScoreStyle(parseInt(form.score)).label}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Date Played</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={form.score_date}
                  onChange={(e) => setForm({ ...form, score_date: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="sm:col-span-2 mt-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 py-4 rounded-2xl font-semibold text-lg transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving Score...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Save Score
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
            <Info className="h-4 w-4" />
            One score per date • Only your latest {MAX_SCORES} scores are saved
          </div>
        </div>
      )}

      {/* Scores List */}
      <div className="p-6">
        {loading ? (
          <div className="py-16 flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-rose-400" />
            <p className="text-slate-400 mt-4">Loading your scores...</p>
          </div>
        ) : scores.length === 0 ? (
          <div className="py-16 text-center">
            <Target className="h-16 w-16 mx-auto text-slate-600" />
            <p className="text-xl font-medium text-white mt-6">No scores recorded yet</p>
            <p className="text-slate-400 mt-2">Add your first round to start tracking progress</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-6 px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-white font-medium"
            >
              Add Your First Score
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {scores.map((s, idx) => {
              const style = getScoreStyle(s.score);
              const isNewest = idx === 0;

              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-5 p-5 rounded-2xl border transition-all ${
                    isNewest
                      ? 'border-rose-500/30 bg-white/5'
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  }`}
                >
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-3xl font-bold ring-2 ring-offset-2 ring-offset-slate-950 ${style.color === 'text-emerald-400' ? 'ring-emerald-500' : style.color === 'text-blue-400' ? 'ring-blue-500' : style.color === 'text-amber-400' ? 'ring-amber-500' : 'ring-red-500'}`}>
                    {s.score}
                  </div>

                  <div className="flex-1">
                    <p className="font-medium text-white">
                      {new Date(s.score_date).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </p>
                    <p className={`text-sm mt-1 ${style.color}`}>{style.label}</p>
                  </div>

                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deletingId === s.id}
                    className="p-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    {deletingId === s.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Trash2 className="h-5 w-5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}