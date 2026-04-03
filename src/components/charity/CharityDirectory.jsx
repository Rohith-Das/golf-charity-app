import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../pages/Navbar'
import {
  Search, Filter, Heart, Globe, Phone, Mail, Star,
  Users, TrendingUp, Calendar, ChevronRight, Award, Loader2
} from 'lucide-react'

const CATEGORIES = [
  { id: 'all', label: 'All Charities' },
  { id: 'cancer', label: 'Cancer' },
  { id: 'veterans', label: 'Veterans' },
  { id: 'children', label: 'Children' },
  { id: 'environment', label: 'Environment' },
  { id: 'mental_health', label: 'Mental Health' },
  { id: 'disability', label: 'Disability' },
  { id: 'sports', label: 'Sports' },
  { id: 'other', label: 'Other' },
]

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

export default function CharityDirectory() {
  const [charities, setCharities] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [{ data: charityData }, { data: eventData }] = await Promise.all([
      supabase
        .from('charities')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('charity_events')
        .select('*, charities(name)')
        .eq('status', 'upcoming')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(6),
    ])
    setCharities(charityData || [])
    setFeatured((charityData || []).filter((c) => c.is_featured))
    setEvents(eventData || [])
    setLoading(false)
  }

  const filtered = charities.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.short_description || c.description || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'all' || c.category === category
    return matchSearch && matchCat
  })

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <Navbar />

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-20 w-72 h-72 bg-emerald-400 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-10 w-96 h-64 bg-cyan-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 text-white">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Heart className="h-4 w-4 text-rose-300" />
            <span>Making Golf Matter</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Support a cause<br />
            <span className="text-emerald-300">you believe in</span>
          </h1>
          <p className="text-teal-100 text-lg max-w-xl mb-8">
            Every subscription contributes to charities chosen by our community. 
            Browse and select the cause closest to your heart.
          </p>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search charities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white text-gray-900 rounded-2xl focus:ring-4 focus:ring-emerald-300/30 outline-none text-base shadow-xl"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">

        {/* Featured Section */}
        {featured.length > 0 && !search && category === 'all' && (
          <section>
            <div className="flex items-center space-x-2 mb-6">
              <Star className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-bold text-gray-900">Spotlight Charities</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {featured.map((c) => (
                <FeaturedCard key={c.id} charity={c} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        {events.length > 0 && !search && category === 'all' && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-bold text-gray-900">Upcoming Events</h2>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {events.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
          </section>
        )}

        {/* Category Filter */}
        <section>
          <div className="flex items-center space-x-2 mb-5">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-600">Filter by category</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  category === cat.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* All Charities Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Heart className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No charities found</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((c) => (
                <CharityCard key={c.id} charity={c} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function FeaturedCard({ charity }) {
  return (
    <Link
      to={`/charities/${charity.id}`}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="h-32 bg-gradient-to-br from-emerald-400 to-teal-600 relative overflow-hidden">
        {charity.banner_url ? (
          <img src={charity.banner_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <Heart className="h-20 w-20 text-white" />
          </div>
        )}
        <div className="absolute top-3 right-3 bg-amber-400 text-amber-900 px-2.5 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
          <Star className="h-3 w-3" />
          <span>Featured</span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors mb-1">
          {charity.name}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-4">
          {charity.short_description || charity.description}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className={`px-2.5 py-1 rounded-full font-semibold capitalize ${CATEGORY_COLORS[charity.category] || CATEGORY_COLORS.other}`}>
            {charity.category?.replace('_', ' ') || 'charity'}
          </span>
          {charity.supporters_count > 0 && (
            <span className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{charity.supporters_count} supporters</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function CharityCard({ charity }) {
  return (
    <Link
      to={`/charities/${charity.id}`}
      className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {charity.logo_url ? (
            <img src={charity.logo_url} alt={charity.name} className="h-full w-full object-cover" />
          ) : (
            <Heart className="h-6 w-6 text-emerald-500" />
          )}
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${CATEGORY_COLORS[charity.category] || CATEGORY_COLORS.other}`}>
          {charity.category?.replace('_', ' ') || 'charity'}
        </span>
      </div>
      <h3 className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors mb-1">
        {charity.name}
      </h3>
      <p className="text-sm text-gray-500 line-clamp-2 flex-1 mb-4">
        {charity.short_description || charity.description}
      </p>
      <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
        {charity.total_raised > 0 ? (
          <span className="flex items-center space-x-1 text-emerald-600 font-semibold">
            <TrendingUp className="h-3 w-3" />
            <span>£{charity.total_raised.toFixed(0)} raised</span>
          </span>
        ) : (
          <span className="text-gray-300">New charity</span>
        )}
        <span className="flex items-center space-x-1 text-emerald-600 font-medium group-hover:translate-x-0.5 transition-transform">
          <span>View</span>
          <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  )
}

function EventCard({ event }) {
  const date = new Date(event.event_date)
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow flex items-start space-x-4">
      <div className="flex-shrink-0 bg-blue-50 rounded-xl p-3 text-center min-w-[56px]">
        <p className="text-xs font-bold text-blue-500 uppercase">
          {date.toLocaleDateString('en-GB', { month: 'short' })}
        </p>
        <p className="text-2xl font-black text-blue-900">{date.getDate()}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-blue-500 font-medium mb-1">{event.charities?.name}</p>
        <h4 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{event.title}</h4>
        {event.location && (
          <p className="text-xs text-gray-400 line-clamp-1">{event.location}</p>
        )}
      </div>
    </div>
  )
}