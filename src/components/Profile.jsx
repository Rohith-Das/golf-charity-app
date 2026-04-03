import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import Navbar from '../pages/Navbar'
import { toast } from 'react-hot-toast'
import {
  User, Mail, Save, ArrowLeft, Shield, CheckCircle, Loader2
} from 'lucide-react'
import SubscriptionPlans from './SubscriptionPlans'

export default function Profile() {
  const { user, profile, fetchProfile } = useAuth()
  const [formData, setFormData] = useState({ full_name: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || user?.email || '',
      })
    }
  }, [profile, user])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    const { error } = await supabase
      .from('profiles')
      .update({ 
        full_name: formData.full_name, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', user.id)

    if (error) {
      toast.error('Failed to update profile: ' + error.message)
    } else {
      toast.success('Profile updated successfully!')
      setSaved(true)
      if (typeof fetchProfile === 'function') fetchProfile(user.id)
      setTimeout(() => setSaved(false), 2500)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Dashboard
        </Link>

        <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-rose-600 to-purple-700 px-10 py-16 text-center">
            <div className="mx-auto h-28 w-28 rounded-3xl bg-white/20 backdrop-blur-md border-4 border-white/30 flex items-center justify-center text-5xl font-bold shadow-2xl mb-6">
              {(formData.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <h1 className="text-4xl font-bold text-white">{formData.full_name || 'Your Profile'}</h1>
            <p className="text-pink-200 mt-2">{formData.email}</p>
          </div>

          <div className="p-10 space-y-10">
            {/* Personal Information */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-6">Personal Information</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-slate-400 text-sm block mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      name="full_name"
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={handleChange}
                      className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 text-sm block mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 text-sm block mb-2">Role</label>
                  <div className="flex items-center gap-3 bg-white/10 border border-white/10 rounded-2xl px-5 py-4">
                    <Shield className="h-5 w-5 text-slate-400" />
                    <span className="text-white capitalize">{profile?.role || 'user'}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-70"
                >
                  {loading ? (
                    <><Loader2 className="animate-spin h-6 w-6" /> Saving...</>
                  ) : saved ? (
                    <><CheckCircle className="h-6 w-6" /> Changes Saved</>
                  ) : (
                    <><Save className="h-6 w-6" /> Save Changes</>
                  )}
                </button>
              </form>
            </div>

            {/* Subscription Section */}
            <div className="pt-8 border-t border-white/10">
              <h2 className="text-2xl font-semibold text-white mb-6">Your Subscription</h2>
              <SubscriptionPlans />
            </div>

            {/* Member Since */}
            <div className="text-center text-sm text-slate-500 pt-8 border-t border-white/10">
              Member since{' '}
              {profile?.created_at 
                ? new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
                : '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}