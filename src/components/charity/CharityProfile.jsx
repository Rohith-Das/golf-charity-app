import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Navbar from '../../pages/Navbar'
import { toast } from 'react-hot-toast'
import {
  Heart, Globe, Phone, Mail, Users, TrendingUp, Calendar,
  ArrowLeft, CheckCircle, ExternalLink, Loader2, Star, MapPin
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

export default function CharityProfile() {
  const { id } = useParams()
  const { user, profile, fetchProfile } = useAuth()
  const [charity, setCharity] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState(false)
  const isSelected = profile?.charity_id === id

  useEffect(() => {
    fetchCharity()
  }, [id])

  const fetchCharity = async () => {
    setLoading(true)
    const [{ data: c }, { data: ev }] = await Promise.all([
      supabase.from('charities').select('*').eq('id', id).single(),
      supabase
        .from('charity_events')
        .select('*')
        .eq('charity_id', id)
        .order('event_date', { ascending: true }),
    ])
    setCharity(c)
    setEvents(ev || [])
    setLoading(false)
  }

  const handleSelect = async () => {
    if (!user) {
      toast.error('Please sign in to select a charity')
      return
    }
    setSelecting(true)
    const { error } = await supabase
      .from('profiles')
      .update({ charity_id: id })
      .eq('id', user.id)
    if (error) {
      toast.error('Failed to select charity')
    } else {
      toast.success(`${charity.name} is now your supported charity! 💚`)
      if (typeof fetchProfile === 'function') fetchProfile(user.id)
    }
    setSelecting(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f7]">
      <Navbar />
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    </div>
  )

  if (!charity) return (
    <div className="min-h-screen bg-[#faf9f7]">
      <Navbar />
      <div className="text-center py-32 text-gray-400">Charity not found</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <Navbar />

      {/* Banner */}
      <div className="relative h-56 bg-gradient-to-br from-emerald-600 to-teal-800 overflow-hidden">
        {charity.banner_url ? (
          <img src={charity.banner_url} alt="" className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <Heart className="h-48 w-48 text-white" />
          </div>
        )}
        {charity.is_featured && (
          <div className="absolute top-4 right-4 bg-amber-400 text-amber-900 px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1 shadow">
            <Star className="h-3.5 w-3.5" />
            <span>Featured Charity</span>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-12 pb-16">
        {/* Back link */}
        <Link to="/charities" className="inline-flex items-center space-x-1.5 text-sm text-white/80 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>All Charities</span>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div className="flex items-start space-x-5">
              <div className="h-20 w-20 rounded-2xl bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
                {charity.logo_url ? (
                  <img src={charity.logo_url} alt={charity.name} className="h-full w-full object-cover" />
                ) : (
                  <Heart className="h-10 w-10 text-emerald-500" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-3 flex-wrap gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{charity.name}</h1>
                  {charity.category && (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${CATEGORY_COLORS[charity.category]}`}>
                      {charity.category.replace('_', ' ')}
                    </span>
                  )}
                </div>
                {charity.registered_charity_number && (
                  <p className="text-xs text-gray-400 mt-1">Registered No: {charity.registered_charity_number}</p>
                )}
                <p className="text-gray-600 mt-2 text-sm leading-relaxed max-w-lg">
                  {charity.short_description || charity.description}
                </p>
              </div>
            </div>

            {/* CTA */}
            {user ? (
              isSelected ? (
                <div className="flex-shrink-0 bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 text-center min-w-[160px]">
                  <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-emerald-800">Your Charity</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Currently selected</p>
                </div>
              ) : (
                <button
                  onClick={handleSelect}
                  disabled={selecting}
                  className="flex-shrink-0 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 min-w-[160px] disabled:opacity-60"
                >
                  {selecting ? (
                    <Loader2 className="h-6 w-6 animate-spin mb-1" />
                  ) : (
                    <Heart className="h-6 w-6 mb-1" />
                  )}
                  <span className="font-bold">Support This</span>
                  <span className="text-xs text-emerald-100 mt-0.5">Select as your charity</span>
                </button>
              )
            ) : (
              <Link
                to="/login"
                className="flex-shrink-0 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl px-8 py-4 shadow-lg transition-all min-w-[160px]"
              >
                <Heart className="h-6 w-6 mb-1" />
                <span className="font-bold">Sign in to Support</span>
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 border-t border-b border-gray-100 divide-x divide-gray-100">
            {[
              { label: 'Total Raised', value: `£${(charity.total_raised || 0).toFixed(0)}`, icon: TrendingUp, color: 'text-emerald-600' },
              { label: 'Supporters', value: charity.supporters_count || 0, icon: Users, color: 'text-blue-600' },
              { label: 'Events', value: events.length, icon: Calendar, color: 'text-purple-600' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center py-6">
                <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="px-8 py-8 grid md:grid-cols-3 gap-8">
            {/* Long description */}
            <div className="md:col-span-2 space-y-6">
              {charity.long_description && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">About {charity.name}</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">{charity.long_description}</p>
                </div>
              )}

              {/* Events */}
              {events.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Events</h2>
                  <div className="space-y-3">
                    {events.map((ev) => (
                      <EventRow key={ev.id} event={ev} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Contact */}
              <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">Contact & Links</h3>
                {charity.website_url && (
                  <a
                    href={charity.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-2.5 text-sm text-emerald-700 hover:text-emerald-900 font-medium group"
                  >
                    <Globe className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Website</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}
                {charity.contact_email && (
                  <a href={`mailto:${charity.contact_email}`} className="flex items-center space-x-2.5 text-sm text-gray-600 hover:text-gray-900">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{charity.contact_email}</span>
                  </a>
                )}
                {charity.phone && (
                  <div className="flex items-center space-x-2.5 text-sm text-gray-600">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>{charity.phone}</span>
                  </div>
                )}
                {charity.address && (
                  <div className="flex items-start space-x-2.5 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span className="leading-snug">{charity.address}</span>
                  </div>
                )}
              </div>

              {/* Contribution info */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                <Heart className="h-5 w-5 text-emerald-500 mb-2" />
                <h3 className="font-semibold text-emerald-900 text-sm mb-1">How you contribute</h3>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  A minimum of 10% of your subscription fee is automatically donated to your selected charity each billing cycle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EventRow({ event }) {
  const date = new Date(event.event_date)
  const isPast = date < new Date()

  return (
    <div className={`flex items-start space-x-4 p-4 rounded-xl border transition-all ${
      isPast ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-blue-50 border-blue-100 hover:shadow-sm'
    }`}>
      <div className="flex-shrink-0 text-center min-w-[44px]">
        <p className="text-xs font-bold text-blue-500 uppercase">
          {date.toLocaleDateString('en-GB', { month: 'short' })}
        </p>
        <p className="text-xl font-black text-blue-900">{date.getDate()}</p>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-gray-900 text-sm">{event.title}</h4>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
            event.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
            event.status === 'completed' ? 'bg-gray-100 text-gray-600' :
            event.status === 'cancelled' ? 'bg-red-100 text-red-700' :
            'bg-emerald-100 text-emerald-700'
          }`}>
            {event.status}
          </span>
        </div>
        {event.location && (
          <p className="text-xs text-gray-500 mt-0.5 flex items-center space-x-1">
            <MapPin className="h-3 w-3" />
            <span>{event.location}</span>
          </p>
        )}
        {event.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{event.description}</p>
        )}
        {event.registration_url && !isPast && (
          <a
            href={event.registration_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-semibold mt-2"
          >
            <span>Register</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  )
}