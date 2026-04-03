import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { toast } from 'react-hot-toast'
import {
  Plus, Edit2, Trash2, X, Check, Loader2, Heart,
  Star, Globe, Phone, Mail, Calendar, ChevronDown, ChevronUp,
  Image, Eye, EyeOff, RefreshCw, AlertCircle, MapPin
} from 'lucide-react'

const CATEGORIES = ['cancer', 'veterans', 'children', 'environment', 'mental_health', 'disability', 'sports', 'other']
const BLANK_CHARITY = {
  name: '', description: '', short_description: '', long_description: '',
  website_url: '', contact_email: '', phone: '', address: '',
  registered_charity_number: '', category: 'other',
  is_featured: false, is_active: true, sort_order: 0,
  logo_url: '', banner_url: '', image_url: ''
}
const BLANK_EVENT = {
  title: '', description: '', event_date: '', location: '',
  image_url: '', registration_url: '',
  is_featured: false, status: 'upcoming',
  max_participants: '', current_participants: 0
}

export default function AdminCharityManager() {
  const [charities, setCharities] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list')  // 'list' | 'add' | 'edit' | 'events'
  const [activeCharity, setActiveCharity] = useState(null)
  const [formData, setFormData] = useState(BLANK_CHARITY)
  const [events, setEvents] = useState([])
  const [eventForm, setEventForm] = useState(BLANK_EVENT)
  const [editingEventId, setEditingEventId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => { fetchCharities() }, [])

  const fetchCharities = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('charities')
      .select('*, charity_events(*)')
      .order('sort_order', { ascending: true })
    if (error) toast.error('Failed to load charities')
    else setCharities(data || [])
    setLoading(false)
  }

  const openAdd = () => {
    setFormData(BLANK_CHARITY)
    setActiveCharity(null)
    setView('add')
  }

  const openEdit = (c) => {
    setFormData({ ...BLANK_CHARITY, ...c })
    setActiveCharity(c)
    setView('edit')
  }

  const openEvents = async (c) => {
    setActiveCharity(c)
    const { data } = await supabase
      .from('charity_events')
      .select('*')
      .eq('charity_id', c.id)
      .order('event_date', { ascending: true })
    setEvents(data || [])
    setEventForm({ ...BLANK_EVENT })
    setEditingEventId(null)
    setView('events')
  }

  const handleSaveCharity = async () => {
    if (!formData.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    const payload = { ...formData }
    delete payload.charity_events
    delete payload.id
    delete payload.created_at
    delete payload.updated_at

    let error
    if (activeCharity) {
      ;({ error } = await supabase.from('charities').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', activeCharity.id))
    } else {
      ;({ error } = await supabase.from('charities').insert([payload]))
    }

    if (error) toast.error('Failed to save: ' + error.message)
    else {
      toast.success(activeCharity ? 'Charity updated!' : 'Charity added!')
      fetchCharities()
      setView('list')
    }
    setSaving(false)
  }

  const handleDeleteCharity = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    const { error } = await supabase.from('charities').delete().eq('id', id)
    if (error) toast.error('Delete failed: ' + error.message)
    else {
      toast.success('Charity deleted')
      fetchCharities()
    }
  }

  const toggleActive = async (c) => {
    const { error } = await supabase
      .from('charities')
      .update({ is_active: !c.is_active })
      .eq('id', c.id)
    if (error) toast.error('Update failed')
    else {
      toast.success(c.is_active ? 'Charity hidden' : 'Charity visible')
      fetchCharities()
    }
  }

  const handleSaveEvent = async () => {
    if (!eventForm.title || !eventForm.event_date) { toast.error('Title and date required'); return }
    setSaving(true)
    const payload = {
      ...eventForm,
      charity_id: activeCharity.id,
      max_participants: eventForm.max_participants ? Number(eventForm.max_participants) : null,
    }
    delete payload.id
    delete payload.created_at
    delete payload.updated_at

    let error
    if (editingEventId) {
      ;({ error } = await supabase.from('charity_events').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingEventId))
    } else {
      ;({ error } = await supabase.from('charity_events').insert([payload]))
    }

    if (error) toast.error('Failed to save event: ' + error.message)
    else {
      toast.success(editingEventId ? 'Event updated!' : 'Event added!')
      const { data } = await supabase.from('charity_events').select('*').eq('charity_id', activeCharity.id).order('event_date')
      setEvents(data || [])
      setEventForm({ ...BLANK_EVENT })
      setEditingEventId(null)
    }
    setSaving(false)
  }

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this event?')) return
    await supabase.from('charity_events').delete().eq('id', id)
    setEvents((prev) => prev.filter((e) => e.id !== id))
    toast.success('Event deleted')
  }

  const field = (key, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={formData[key] || ''}
        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 focus:bg-white transition-all"
      />
    </div>
  )

  const eventField = (key, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={eventForm[key] || ''}
        onChange={(e) => setEventForm({ ...eventForm, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 focus:bg-white transition-all"
      />
    </div>
  )

  // ── LIST VIEW ──
  if (view === 'list') return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Charity Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">{charities.length} charities registered</p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={fetchCharities} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <RefreshCw className="h-4 w-4 text-gray-500" />
          </button>
          <button
            onClick={openAdd}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Add Charity</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>
      ) : charities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <Heart className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No charities yet. Add your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {charities.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {c.logo_url ? (
                      <img src={c.logo_url} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      <Heart className="h-6 w-6 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <h3 className="font-bold text-gray-900">{c.name}</h3>
                      {c.is_featured && (
                        <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center space-x-0.5">
                          <Star className="h-3 w-3" /><span>Featured</span>
                        </span>
                      )}
                      {!c.is_active && (
                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-semibold">Hidden</span>
                      )}
                      {c.category && (
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full capitalize">
                          {c.category.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {c.charity_events?.length || 0} events · {c.supporters_count || 0} supporters
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleActive(c)}
                    className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                    title={c.is_active ? 'Hide charity' : 'Show charity'}
                  >
                    {c.is_active ? <Eye className="h-4 w-4 text-emerald-500" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
                  </button>
                  <button
                    onClick={() => openEvents(c)}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors border border-blue-200"
                  >
                    <Calendar className="h-3.5 w-3.5" /><span>Events</span>
                  </button>
                  <button
                    onClick={() => openEdit(c)}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors border border-emerald-200"
                  >
                    <Edit2 className="h-3.5 w-3.5" /><span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCharity(c.id, c.name)}
                    className="p-2.5 rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ── ADD / EDIT FORM ──
  if (view === 'add' || view === 'edit') return (
    <div className="space-y-5">
      <div className="flex items-center space-x-3">
        <button onClick={() => setView('list')} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
          <X className="h-4 w-4 text-gray-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{view === 'add' ? 'Add New Charity' : `Edit: ${activeCharity?.name}`}</h2>
          <p className="text-sm text-gray-500 mt-0.5">Fill in the charity details below</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6 shadow-sm">
        {/* Basic Info */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">Basic Information</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {field('name', 'Charity Name *', 'text', 'e.g. Cancer Research UK')}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Category</label>
              <select
                value={formData.category || 'other'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-all"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                ))}
              </select>
            </div>
            {field('registered_charity_number', 'Registered Charity Number', 'text', 'e.g. 1089464')}
            {field('sort_order', 'Sort Order', 'number', '0')}
          </div>
        </div>

        {/* Descriptions */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">Descriptions</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Short Description</label>
              <input
                type="text"
                value={formData.short_description || ''}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                placeholder="One-line summary shown in listings"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Full Description (shown on charity page)</label>
              <textarea
                value={formData.long_description || ''}
                onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                rows={5}
                placeholder="Detailed description of the charity's work and impact..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Media */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">Media URLs</h3>
          <div className="space-y-3">
            {field('logo_url', 'Logo URL', 'url', 'https://...')}
            {field('banner_url', 'Banner Image URL', 'url', 'https://...')}
            {field('image_url', 'Gallery Image URL', 'url', 'https://...')}
          </div>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">Contact & Links</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {field('website_url', 'Website URL', 'url', 'https://...')}
            {field('contact_email', 'Contact Email', 'email', 'info@charity.org')}
            {field('phone', 'Phone Number', 'text', '+44 ...')}
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Address</label>
            <textarea
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
              placeholder="Full postal address"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-all resize-none"
            />
          </div>
        </div>

        {/* Flags */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">Settings</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { key: 'is_featured', label: 'Featured (shown in spotlight)', desc: 'Highlighted on the directory homepage' },
              { key: 'is_active', label: 'Active (visible to users)', desc: 'Users can see and select this charity' },
            ].map(({ key, label, desc }) => (
              <label key={key} className={`flex items-start space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                formData[key] ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-gray-50'
              }`}>
                <input
                  type="checkbox"
                  checked={!!formData[key]}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                  className="h-4 w-4 mt-0.5 accent-emerald-600 rounded"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3">
        <button onClick={() => setView('list')} className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors">
          Cancel
        </button>
        <button
          onClick={handleSaveCharity}
          disabled={saving}
          className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          <span>{view === 'add' ? 'Add Charity' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  )

  // ── EVENTS MANAGER ──
  if (view === 'events') return (
    <div className="space-y-5">
      <div className="flex items-center space-x-3">
        <button onClick={() => setView('list')} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
          <X className="h-4 w-4 text-gray-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Events: {activeCharity?.name}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{events.length} events</p>
        </div>
      </div>

      {/* Add/Edit event form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 mb-4">
          {editingEventId ? 'Edit Event' : 'Add New Event'}
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {eventField('title', 'Event Title *', 'text', 'e.g. Charity Golf Day 2025')}
          {eventField('event_date', 'Event Date *', 'date')}
          {eventField('location', 'Location', 'text', 'Venue name, City')}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Status</label>
            <select
              value={eventForm.status}
              onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-all"
            >
              {['upcoming', 'ongoing', 'completed', 'cancelled'].map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          {eventField('registration_url', 'Registration URL', 'url', 'https://...')}
          {eventField('max_participants', 'Max Participants', 'number', '120')}
        </div>
        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Description</label>
          <textarea
            value={eventForm.description || ''}
            onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
            rows={3}
            placeholder="Describe the event..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-all resize-none"
          />
        </div>
        <div className="mt-4 flex items-center justify-end space-x-3">
          {editingEventId && (
            <button
              onClick={() => { setEditingEventId(null); setEventForm({ ...BLANK_EVENT }) }}
              className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSaveEvent}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span>{editingEventId ? 'Update Event' : 'Add Event'}</span>
          </button>
        </div>
      </div>

      {/* Events list */}
      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No events yet. Add the first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <div key={ev.id} className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-blue-50 rounded-lg px-3 py-2 text-center min-w-[48px]">
                  <p className="text-xs font-bold text-blue-500 uppercase">
                    {new Date(ev.event_date).toLocaleDateString('en-GB', { month: 'short' })}
                  </p>
                  <p className="text-lg font-black text-blue-800">
                    {new Date(ev.event_date).getDate()}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{ev.title}</p>
                  {ev.location && (
                    <p className="text-xs text-gray-400 flex items-center space-x-1 mt-0.5">
                      <MapPin className="h-3 w-3" /><span>{ev.location}</span>
                    </p>
                  )}
                  <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                    ev.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                    ev.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                    ev.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {ev.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={() => { setEventForm({ ...BLANK_EVENT, ...ev }); setEditingEventId(ev.id) }}
                  className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteEvent(ev.id)}
                  className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return null
}