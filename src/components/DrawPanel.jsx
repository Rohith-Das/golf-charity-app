
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/drawEngine';
import { Trophy, Target, Calendar, Zap, Loader2, Crown, Medal, Star, CheckCircle } from 'lucide-react';

function NumberBall({ n, isMatch }) {
  return (
    <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-xl border-2 ${
      isMatch 
        ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white border-amber-300 shadow' 
        : 'bg-white border-gray-300 text-gray-700'
    }`}>
      {n}
    </div>
  );
}

export default function DrawPanel() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentDraw, setCurrentDraw] = useState(null);
  const [userEntry, setUserEntry] = useState(null);
  const [pastDraws, setPastDraws] = useState([]);
  const [userWins, setUserWins] = useState([]);
  const [showPast, setShowPast] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data: pending } = await supabase.from('draws').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(1);
    setCurrentDraw(pending);

    if (pending) {
      const { data: entry } = await supabase.from('draw_entries').select('*').eq('draw_id', pending.id).eq('user_id', user.id);
      setUserEntry(entry);
    }

    const { data: past } = await supabase
      .from('draws')
      .select('*, draw_entries!inner(entry_numbers, matches, prize_tier)')
      .eq('status', 'published')
      .eq('draw_entries.user_id', user.id)
      .order('created_at', { ascending: false });

    setPastDraws(past || []);

    const { data: wins } = await supabase.from('winners').select('*, draws(month_year)').eq('user_id', user.id).order('created_at', { ascending: false });
    setUserWins(wins || []);

    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalWon = userWins.reduce((sum, w) => sum + Number(w.prize_amount || 0), 0);

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-3xl p-8 shadow-xl">
        <Trophy className="h-12 w-12 mb-4" />
        <h2 className="text-3xl font-bold">Monthly Prize Draw</h2>
        {currentDraw && (
          <div className="mt-6">
            <p className="text-amber-100">{currentDraw.month_year}</p>
            <p className="text-5xl font-bold mt-2">{formatCurrency(currentDraw.total_prize_pool)}</p>
            {currentDraw.jackpot_amount > 0 && <p className="text-yellow-200 mt-3">Jackpot Rollover: {formatCurrency(currentDraw.jackpot_amount)}</p>}
          </div>
        )}
      </div>

      {currentDraw && userEntry && (
        <div className="bg-white rounded-3xl p-8 border">
          <h3 className="font-semibold flex items-center gap-3 mb-6"><Target className="h-6 w-6 text-amber-500" /> Your Numbers</h3>
          <div className="flex gap-4 flex-wrap">
            {userEntry.entry_numbers.map((n, i) => <NumberBall key={i} n={n} />)}
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border p-8">
        <button onClick={() => setShowPast(!showPast)} className="w-full flex justify-between font-semibold text-lg">
          Past Results & Winnings
        </button>

        {showPast && (
          <div className="mt-8 space-y-8">
            {userWins.length > 0 && (
              <div className="text-center py-6 bg-emerald-50 rounded-2xl">
                <p className="text-4xl font-bold text-emerald-700">{formatCurrency(totalWon)}</p>
                <p className="text-emerald-600">Total Winnings</p>
              </div>
            )}

            {pastDraws.map(draw => {
              const entry = draw.draw_entries?.[0];
              return (
                <div key={draw.id} className="border rounded-2xl p-6">
                  <h4 className="font-semibold">{draw.month_year}</h4>
                  <div className="flex gap-8 mt-6">
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Winning Numbers</p>
                      <div className="flex gap-3">{draw.winning_numbers?.map(n => <NumberBall key={n} n={n} isMatch={entry?.entry_numbers?.includes(n)} />)}</div>
                    </div>
                    {entry && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Your Numbers</p>
                        <div className="flex gap-3">{entry.entry_numbers.map((n,i) => <NumberBall key={i} n={n} isMatch={draw.winning_numbers?.includes(n)} />)}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}