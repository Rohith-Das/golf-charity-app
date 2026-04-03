


// Profile.jsx — Updated to include CharitySelector and contribution % setting
// Replace the charity nudge section and add it as a proper section

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import Navbar from '../pages/Navbar'
import { toast } from 'react-hot-toast'
import {
  User, Mail, Save, ArrowLeft, Shield, CheckCircle, Loader2,
  CreditCard, AlertCircle, Heart
} from 'lucide-react'
import SubscriptionPlans from './SubscriptionPlans'
import CharitySelector from './charity/CharitySelector'

const PLANS = [
  { id: 'monthly', name: 'Monthly', price: 9.99, period: 'month', features: ['Unlimited score entry', 'Monthly draws', 'Charity support'] },
  { id: 'yearly', name: 'Yearly (Save 20%)', price: 95.88, period: 'year', features: ['Everything in Monthly', '2 months FREE', 'Priority support'] },
]

export default function Profile() {
  const { user, profile, fetchProfile } = useAuth()
  const [formData, setFormData] = useState({ full_name: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [subLoading, setSubLoading] = useState(false)
  const [charityId, setCharityId] = useState(null)
  const [charityPct, setCharityPct] = useState(10)
  const [charitySaving, setCharitySaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || user?.email || '',
      })
      setCharityId(profile.charity_id || null)
      setCharityPct(profile.charity_contribution_pct || 10)
    }
  }, [profile, user])

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: formData.full_name, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    if (error) toast.error('Failed to update profile: ' + error.message)
    else {
      toast.success('Profile updated!')
      setSaved(true)
      if (typeof fetchProfile === 'function') fetchProfile(user.id)
      setTimeout(() => setSaved(false), 3000)
    }
    setLoading(false)
  }

  const handleSaveCharity = async () => {
    setCharitySaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ charity_id: charityId, charity_contribution_pct: charityPct })
      .eq('id', user.id)
    if (error) toast.error('Failed to save charity preference')
    else {
      toast.success('Charity preference saved! 💚')
      if (typeof fetchProfile === 'function') fetchProfile(user.id)
    }
    setCharitySaving(false)
  }

  const handleSubscribe = async (plan) => {
    if (profile?.subscription_status === 'active') { toast.error('Already subscribed!'); return }
    setSubLoading(true)
    try {
      await supabase.from('subscriptions').delete().eq('user_id', user.id).neq('status', 'active')
      const startDate = new Date()
      const endDate = new Date()
      plan.id === 'monthly' ? endDate.setMonth(endDate.getMonth() + 1) : endDate.setFullYear(endDate.getFullYear() + 1)
      const { error: subError } = await supabase.from('subscriptions').insert([{
        user_id: user.id, plan: plan.id, status: 'active',
        current_period_start: startDate.toISOString(), current_period_end: endDate.toISOString()
      }])
      const { error: profileError } = await supabase.from('profiles').update({
        subscription_status: 'active', subscription_plan: plan.id,
        subscription_id: `sub_${Date.now()}`, subscription_ends_at: endDate.toISOString()
      }).eq('id', user.id)
      if (subError || profileError) toast.error('Subscription failed')
      else {
        toast.success(`Subscribed to ${plan.name}! 🎉`)
        if (typeof fetchProfile === 'function') fetchProfile(user.id)
        setTimeout(() => window.location.reload(), 1000)
      }
    } catch { toast.error('Subscription failed') }
    setSubLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <Link to="/dashboard" className="inline-flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /><span>Back to Dashboard</span>
        </Link>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-blue-700 px-8 py-10 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full" />
            </div>
            <div className="relative">
              <div className="mx-auto h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-3xl font-bold mb-4 shadow-xl">
                {(formData.full_name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <h1 className="text-2xl font-bold">{formData.full_name || 'Your Profile'}</h1>
              <p className="text-blue-200 text-sm mt-1">{formData.email}</p>
            </div>
          </div>

          <div className="px-8 py-8 space-y-8">
            {/* Profile Form */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Edit Profile</h2>
              <p className="text-sm text-gray-500 mb-5">Update your personal information below</p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input name="full_name" type="text" required value={formData.full_name} onChange={handleChange}
                      placeholder="Your full name"
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-gray-50 focus:bg-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address <span className="ml-2 text-xs text-gray-400 font-normal">(cannot be changed here)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                    <input type="email" value={formData.email} disabled
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                  <div className="flex items-center space-x-2 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 capitalize">{profile?.role || 'user'}</span>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-600 to-blue-700 hover:from-primary-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
                  {loading ? <><Loader2 className="h-5 w-5 animate-spin" /><span>Saving...</span></>
                    : saved ? <><CheckCircle className="h-5 w-5 text-emerald-300" /><span>Saved!</span></>
                    : <><Save className="h-5 w-5" /><span>Save Changes</span></>}
                </button>
              </form>
            </div>

            {/* ── Charity Section ── */}
            <div className="border-t border-gray-100 pt-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-emerald-500" />
                    <span>Your Charity</span>
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {charityPct}% of your subscription supports your chosen charity
                  </p>
                </div>
                <Link to="/charities" className="text-xs text-emerald-600 hover:text-emerald-800 font-medium underline">
                  Browse all
                </Link>
              </div>

              <CharitySelector
                value={charityId}
                onChange={setCharityId}
                contributionPct={charityPct}
                onPctChange={setCharityPct}
                compact={false}
              />

              {/* Override save button since CharitySelector has its own when not compact,
                  but here we want an explicit save tied to Profile page flow */}
              {/* The CharitySelector already saves directly when not compact=false and user is logged in */}
            </div>

            {/* Subscription Section */}
            <div className="border-t border-gray-100 pt-8">
              {profile?.subscription_status === 'active' ? (
                <SubscriptionPlans />
              ) : (
                <div className="p-6 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-2xl">
                  <div className="text-center mb-6">
                    <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Subscription</h3>
                    <p className="text-gray-600">Subscribe to unlock premium features</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {PLANS.map((plan) => (
                      <button key={plan.id} onClick={() => handleSubscribe(plan)} disabled={subLoading}
                        className="p-6 border-2 rounded-xl hover:shadow-xl transition-all duration-200 flex items-start space-x-4 group hover:-translate-y-1 disabled:opacity-50 border-gray-200 hover:border-blue-400">
                        <CreditCard className="h-8 w-8 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 text-left">
                          <h4 className="font-bold text-lg text-gray-900 group-hover:text-blue-700">{plan.name}</h4>
                          <p className="text-2xl font-black text-gray-900">£{plan.price}</p>
                          <p className="text-sm text-gray-500">/{plan.period}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                Member since{' '}
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}