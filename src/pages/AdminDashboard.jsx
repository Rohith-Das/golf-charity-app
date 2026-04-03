import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from './Navbar'
import AdminScoreManager from '../components/AdminScoreManager'
import { toast } from 'react-hot-toast'
import {
  Users, Search, Edit2, X, Check, Loader2, Shield, User, RefreshCw,
  ChevronDown, ChevronUp, Target, CreditCard, Calendar, Crown,Trophy,Heart,Medal
} from 'lucide-react'
import AdminDrawManager from '../components/AdminDrawManager'
import AdminCharityManager from '../components/charity/AdminCharityManager'
import AdminWinnersManager from '../components/winners/Adminwinnersmanager'


const ROLES = ['user', 'admin']
const STATUSES = ['active', 'inactive', 'cancelled', 'trial']
const PLANS = ['none', 'monthly', 'yearly']

const TABS = [
  { id: 'users',  label: 'Users',           icon: Users  },
  { id: 'draws',  label: 'Draw Management', icon: Trophy },
  { id: 'scores', label: 'Score Manager',   icon: Target },
    { id: 'charities', label: 'Charities',        icon: Heart  }, 
    { id: 'winners', label: 'Winners', icon: Medal },
]

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [saving, setSaving] = useState(false)
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        subscriptions!user_id (
          plan,
          status,
          current_period_end,
          cancel_at_period_end
        )
      `)
      .order(sortField, { ascending: sortDir === 'asc' })
    
    if (error) {
      toast.error('Failed to load users')
      console.error(error)
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  useEffect(() => { 
    fetchUsers() 
  }, [sortField, sortDir])

  const startEdit = (u) => {
    setEditingId(u.id)
    setEditData({ 
      full_name: u.full_name || '', 
      role: u.role || 'user', 
      subscription_status: u.subscription_status || 'inactive',
      subscription_plan: u.subscription_plan || 'none'
    })
  }

  const cancelEdit = () => { 
    setEditingId(null); 
    setEditData({}) 
  }

  const saveEdit = async (userId) => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      full_name: editData.full_name, 
      role: editData.role,
      subscription_status: editData.subscription_status,
      subscription_plan: editData.subscription_plan,
      updated_at: new Date().toISOString(),
    }).eq('id', userId)
    
    if (error) {
      toast.error('Update failed: ' + error.message)
    } else {
      toast.success('User updated!')
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, ...editData } : u))
      cancelEdit()
    }
    setSaving(false)
  }

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const filtered = users.filter(
    (u) =>
      u.role !== 'admin' &&
      (
        (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase())
      )
  )

  const SortIcon = ({ field }) =>
    sortField === field
      ? sortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
      : <ChevronDown className="h-3.5 w-3.5 opacity-30" />

  const roleBadge = (role) =>
    role === 'admin' ? (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
        <Shield className="h-3 w-3" /><span>Admin</span>
      </span>
    ) : (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
        <User className="h-3 w-3" /><span>User</span>
      </span>
    )

  const statusBadge = (status) => {
    const map = { 
      active: 'bg-emerald-100 text-emerald-700', 
      inactive: 'bg-gray-100 text-gray-600', 
      trial: 'bg-blue-100 text-blue-700', 
      cancelled: 'bg-red-100 text-red-600' 
    }
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status || 'inactive'}</span>
  }

  const planBadge = (plan, endsAt) => {
    if (!plan || plan === 'none') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">None</span>
    }
    
    const endsText = endsAt ? new Date(endsAt).toLocaleDateString('en-GB', { 
      month: 'short', day: 'numeric' 
    }) : '—'
    
    return (
      <div className="flex flex-col items-start space-y-1">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
          plan === 'monthly' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-purple-100 text-purple-800'
        }`}>
          {plan.toUpperCase()}
        </span>
        {endsAt && (
          <span className="text-xs text-gray-500">Ends {endsText}</span>
        )}
      </div>
    )
  }

  const initials = (name, email) =>
    (name || email || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage users, roles, subscriptions, and scores</p>
          </div>
          <button
            onClick={fetchUsers}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors"
          >
            <RefreshCw className="h-4 w-4" /><span>Refresh</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: users.filter(u => u.role !== 'admin').length, color: 'text-gray-900' },
            { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: 'text-purple-700' },
            { label: 'Active Subs', value: users.filter(u => u.subscription_status === 'active').length, color: 'text-emerald-700' },
            { label: 'Revenue/mo', value: '£' + users.filter(u => u.subscription_status === 'active' && u.subscription_plan === 'monthly').length * 9.99 + users.filter(u => u.subscription_status === 'active' && u.subscription_plan === 'yearly').length * 7.99, color: 'text-indigo-700' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary-600 to-blue-700 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab: Users */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary-600" />
                <h2 className="text-base font-bold text-gray-900">All Users</h2>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{filtered.length}</span>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {[
                      { label: 'User', field: 'full_name' },
                      { label: 'Role', field: 'role' },
                      { label: 'Subscription', field: 'subscription_plan' },
                      { label: 'Status', field: 'subscription_status' },
                      { label: 'Joined', field: 'created_at' },
                      { label: 'Actions', field: null },
                    ].map((col) => (
                      <th
                        key={col.label}
                        onClick={() => col.field && toggleSort(col.field)}
                        className={`px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider select-none ${col.field ? 'cursor-pointer hover:text-gray-700' : ''}`}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{col.label}</span>
                          {col.field && <SortIcon field={col.field} />}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan={6} className="py-20 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto" />
                      <p className="text-sm text-gray-400 mt-3">Loading users...</p>
                    </td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="py-20 text-center text-gray-400 text-sm">No users found</td></tr>
                  ) : (
                    filtered.map((u) => {
                      const isEditing = editingId === u.id
                      const activeSub = u.subscriptions?.find(s => s.status === 'active')
                      return (
                        <tr key={u.id} className={`transition-colors ${isEditing ? 'bg-primary-50/40' : 'hover:bg-gray-50/60'}`}>
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {initials(u.full_name, u.email)}
                              </div>
                              <div className="min-w-0">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editData.full_name}
                                    onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                                    className="w-full px-2.5 py-1.5 border border-primary-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white"
                                    placeholder="Full name"
                                  />
                                ) : (
                                  <p className="font-semibold text-gray-900 truncate">
                                    {u.full_name || <span className="text-gray-400 italic">No name</span>}
                                  </p>
                                )}
                                <p className="text-xs text-gray-400 truncate mt-0.5">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-4 py-4">
                            {isEditing ? (
                              <select 
                                value={editData.role} 
                                onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                                className="px-3 py-1.5 border border-primary-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white"
                              >
                                {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                              </select>
                            ) : roleBadge(u.role)}
                          </td>

                          <td className="px-4 py-4">
                            {isEditing ? (
                              <select 
                                value={editData.subscription_plan || 'none'} 
                                onChange={(e) => setEditData({...editData, subscription_plan: e.target.value})}
                                className="px-3 py-1.5 border border-primary-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white"
                              >
                                {PLANS.map((p) => (
                                  <option key={p} value={p}>
                                    {p === 'none' ? 'No Plan' : p.charAt(0).toUpperCase() + p.slice(1)}
                                  </option>
                                ))}
                              </select>
                            ) : planBadge(u.subscription_plan, u.subscription_ends_at)}
                          </td>

                          <td className="px-4 py-4">
                            {isEditing ? (
                              <select 
                                value={editData.subscription_status} 
                                onChange={(e) => setEditData({...editData, subscription_status: e.target.value})}
                                className="px-3 py-1.5 border border-primary-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white"
                              >
                                {STATUSES.map((s) => (
                                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                ))}
                              </select>
                            ) : statusBadge(u.subscription_status)}
                          </td>

                          <td className="px-4 py-4 text-gray-500 text-xs whitespace-nowrap">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB', { 
                              day: 'numeric', month: 'short', year: 'numeric' 
                            }) : '—'}
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-2">
                              {isEditing ? (
                                <>
                                  <button 
                                    onClick={() => saveEdit(u.id)} 
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
                                    <X className="h-3.5 w-3.5" /><span>Cancel</span>
                                  </button>
                                </>
                              ) : (
                                <button 
                                  onClick={() => startEdit(u)}
                                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-semibold rounded-lg transition-colors border border-primary-200"
                                >
                                  <Edit2 className="h-3.5 w-3.5" /><span>Edit</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {!loading && filtered.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <p className="text-xs text-gray-400">
                  Showing {filtered.length} of {users.filter(u => u.role !== 'admin').length} users
                  {users.filter(u => u.subscription_status === 'active').length > 0 && (
                    <span className="ml-4 text-emerald-600 font-medium">
                      • {users.filter(u => u.subscription_status === 'active').length} active subscribers
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

       {/* Tab: Draws */}
        {activeTab === 'draws' && <AdminDrawManager />}
 
        {/* Tab: Scores */}
        {activeTab === 'scores' && <AdminScoreManager />}
          {activeTab === 'charities' && <AdminCharityManager />}
          {activeTab === 'winners' && <AdminWinnersManager />}
      </div>
    </div>
  )
}