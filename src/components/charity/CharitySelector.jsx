import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from "../../contexts/AuthContext";
import { toast } from 'react-hot-toast'
import {
  Heart, Search, CheckCircle, ChevronRight, Loader2, X, TrendingUp
} from 'lucide-react'

const CATEGORY_COLORS = {
  cancer: 'bg-rose-100 text-rose-700',
  veterans: 'bg-blue-100 text-blue-700',
  children: 'bg-amber-100 text-amber-700',
  environment: 'bg-emerald-100 text-emerald-700',
  mental_health: 'bg-purple-100 text-purple-700',
  disability: 'bg-indigo-100 text-indigo-700',
  sports: 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-600',
}


export default function CharitySelector({
  value,
  onChange,
  contributionPct = 10,
  onPctChange,
  compact = false,
  onClose,
}) {
  const [charities, setCharities] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(value || null)
  const [pct, setPct] = useState(contributionPct)
  const [saving, setSaving] = useState(false)
  const { user, fetchProfile } = useAuth()

  useEffect(() => {
    fetchCharities()
  }, [])

  useEffect(() => {
    setSelected(value)
  }, [value])

  const fetchCharities = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('charities')
      .select('id, name, short_description, description, logo_url, category, is_featured, total_raised, supporters_count')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    setCharities(data || [])
    setLoading(false)
  }

  const filtered = charities.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.short_description || c.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (charityId) => {
    setSelected(charityId)
    if (onChange) onChange(charityId)
  }

  const handlePctChange = (newPct) => {
    setPct(newPct)
    if (onPctChange) onPctChange(newPct)
  }

  const handleSave = async () => {
    if (!user || !selected) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        charity_id: selected,
        charity_contribution_pct: pct,
      })
      .eq('id', user.id)
    if (error) {
      toast.error('Failed to save charity preference')
    } else {
      toast.success('Charity preference saved! 💚')
      if (typeof fetchProfile === 'function') fetchProfile(user.id)
      if (onClose) onClose()
    }
    setSaving(false)
  }

  const selectedCharity = charities.find((c) => c.id === selected)

  return (
    <div className={compact ? '' : 'bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden'}>
      {/* Header */}
      {!compact && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Choose Your Charity</h2>
              <p className="text-emerald-100 text-xs">A portion of your subscription goes to them</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div className={compact ? '' : 'p-6'}>
        {/* Currently selected banner */}
        {selectedCharity && (
          <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-emerald-600 font-medium">Currently selected</p>
              <p className="font-bold text-emerald-900 text-sm truncate">{selectedCharity.name}</p>
            </div>
            <button
              onClick={() => handleSelect(null)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Change
            </button>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search charities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 focus:bg-white transition-all"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
            {filtered.map((c) => (
              <CharityOption
                key={c.id}
                charity={c}
                isSelected={selected === c.id}
                onSelect={handleSelect}
              />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">No charities found</div>
            )}
          </div>
        )}

        {/* Contribution % slider */}
        {onPctChange !== undefined && selected && (
          <div className="mt-6 bg-gray-50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Your contribution</h3>
              <span className="text-xl font-black text-emerald-600">{pct}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={pct}
              onChange={(e) => handlePctChange(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Min 10%</span>
              <span>100%</span>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              This % of your subscription fee will be donated to {selectedCharity?.name}.
              Minimum is 10%.
            </p>
          </div>
        )}

        {/* Save button (only shown when not inside a form that handles saving) */}
        {!compact && user && (
          <button
            onClick={handleSave}
            disabled={saving || !selected}
            className="w-full mt-5 flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /><span>Saving...</span></>
            ) : (
              <><Heart className="h-4 w-4" /><span>Save Preference</span></>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

function CharityOption({ charity, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(charity.id)}
      className={`w-full flex items-center space-x-3 p-3.5 rounded-xl border-2 transition-all duration-150 text-left group ${
        isSelected
          ? 'border-emerald-400 bg-emerald-50'
          : 'border-gray-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/50'
      }`}
    >
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 ${
        isSelected ? 'bg-emerald-100' : 'bg-gray-100'
      }`}>
        {charity.logo_url ? (
          <img src={charity.logo_url} alt={charity.name} className="h-full w-full object-cover" />
        ) : (
          <Heart className={`h-5 w-5 ${isSelected ? 'text-emerald-500' : 'text-gray-400'}`} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className={`font-semibold text-sm truncate ${isSelected ? 'text-emerald-900' : 'text-gray-900'}`}>
            {charity.name}
          </p>
          {charity.is_featured && (
            <span className="flex-shrink-0 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
              Featured
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate mt-0.5">
          {charity.short_description || charity.description || ''}
        </p>
        {charity.total_raised > 0 && (
          <p className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center space-x-1">
            <TrendingUp className="h-3 w-3" />
            <span>£{charity.total_raised.toFixed(0)} raised</span>
          </p>
        )}
      </div>

      <div className="flex-shrink-0">
        {isSelected ? (
          <CheckCircle className="h-5 w-5 text-emerald-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-400 transition-colors" />
        )}
      </div>
    </button>
  )
}