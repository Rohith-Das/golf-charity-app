import { useState, useEffect } from 'react'
import { CreditCard, CheckCircle, Calendar, Crown, X, Loader2 ,AlertCircle} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../hooks/useToast'
import Navbar from '../pages/Navbar'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom'


const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 9.99,
    period: 'month',
    features: ['Unlimited score entry', 'Monthly draws', 'Charity support', 'Score analytics']
  },
  {
    id: 'yearly',
    name: 'Yearly (Save 20%)',
    price: 95.88,
    period: 'year',
    features: ['Everything in Monthly', '2 months FREE', 'Priority support', 'Advanced analytics']
  }
]

export default function SubscriptionPlans({ className = '', standalone = false }) {
  const { profile, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const [cancelLoading, setCancelLoading] = useState(false)
const navigate = useNavigate()

  // Check if user already has active subscription
  const hasActiveSubscription = profile?.subscription_status === 'active'
  const currentPlan = profile?.subscription_plan

  const handleSubscribe = async (plan) => {
    if (hasActiveSubscription) {
      toast.error('You already have an active subscription!')
      return
    }

    setLoading(true)
    
    try {
      // 1. Delete any existing inactive subscriptions
      await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', user.id)
        .neq('status', 'active')

      // 2. Create new subscription
      const startDate = new Date()
      const endDate = new Date()
      if (plan.id === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1)
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1)
      }

      const { error: subError } = await supabase
        .from('subscriptions')
        .insert([{
          user_id: user.id,
          plan: plan.id,
          status: 'active',
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString()
        }])

      // 3. Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_plan: plan.id,
          subscription_id: `sub_${Date.now()}`,
          subscription_ends_at: endDate.toISOString()
        })
        .eq('id', user.id)

      if (subError || profileError) {
        console.error('Subscription errors:', subError, profileError)
        toast.error('Subscription failed. Please try again.')
      } else {
        toast.success(`Successfully subscribed to ${plan.name}! 🎉`)
        setTimeout(() => window.location.reload(), 1500)
      }
    } catch (error) {
      console.error('Subscription error:', error)
      toast.error('Subscription failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }
// Update handleCancelSubscription function:
const handleCancelSubscription = async () => {
      setCancelLoading(true)
  try {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        subscription_status: 'cancelled',
        subscription_plan: 'none',
        subscription_id: null
      })
      .eq('id', user.id)

    const { error: subError } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'cancelled',
        cancel_at_period_end: true,
        cancelled_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (profileError || subError) {
      toast.error('Failed to cancel subscription')
      console.error('Cancel errors:', profileError, subError)
    } else {
      toast.success('Subscription cancelled! 🔓')
      await fetchProfile(user.id)
      navigate('/dashboard')
    }
  } catch (error) {
    console.error('Cancel error:', error)
    toast.error('Failed to cancel subscription')
  } finally {
    setCancelLoading(false)
  } 
}
const handleCancelClick = async () => {
  const result = await Swal.fire({
    title: 'Cancel subscription?',
    text: 'You will lose access to premium features.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Yes, cancel it',
    cancelButtonText: 'Keep subscription',
  })

  if (result.isConfirmed) {
    await handleCancelSubscription()
  }
}

  if (!standalone) {
    return (
      <div className={`bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-2xl p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-emerald-600" />
            <span className="font-semibold text-gray-900">Subscription Status</span>
          </div>
          {hasActiveSubscription && (
            <button
              onClick={handleCancelClick}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
        
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
          hasActiveSubscription 
            ? 'bg-emerald-100 text-emerald-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {hasActiveSubscription 
            ? `${currentPlan?.toUpperCase()} - Active` 
            : 'No Active Subscription'
          }
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-12 px-4">
      {!standalone && <Navbar />}
      <div className={`max-w-4xl mx-auto ${className}`}>
        <div className="bg-white rounded-3xl shadow-2xl border border-amber-200 p-10 text-center">
          <AlertCircle className="h-20 w-20 text-amber-500 mx-auto mb-8" />
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Subscription Required</h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Subscribe to unlock unlimited score entry, monthly draws, and support your favorite charities.
          </p>

          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {PLANS.map((plan) => (
              <div key={plan.id} className={`group relative border-4 rounded-3xl p-10 hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 ${
                hasActiveSubscription && currentPlan === plan.id 
                  ? 'border-emerald-400 bg-emerald-50/50' 
                  : 'border-gray-200 hover:border-primary-300'
              }`}>
                {hasActiveSubscription && currentPlan === plan.id && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-2 rounded-2xl text-lg font-bold shadow-lg flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>YOUR PLAN ✓</span>
                  </div>
                )}
                
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">{plan.name}</h3>
                  <div className="mb-10">
                    <span className="text-5xl font-black text-gray-900">£{plan.price}</span>
                    <span className="text-2xl text-gray-500">/{plan.period}</span>
                  </div>
                  
                  <ul className="space-y-4 mb-10">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start space-x-4 text-gray-700 group-hover:text-gray-900">
                        <CheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-lg">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {hasActiveSubscription && currentPlan === plan.id ? (
                    <div className="bg-emerald-600 text-white p-8 rounded-2xl shadow-2xl">
                      <CheckCircle className="h-16 w-16 mx-auto mb-4" />
                      <p className="text-2xl font-bold mb-2">Active Subscription</p>
                      <p className="text-emerald-200">Ends {profile?.subscription_ends_at ? new Date(profile.subscription_ends_at).toLocaleDateString('en-GB') : '—'}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={loading || hasActiveSubscription}
                      className="w-full bg-gradient-to-r from-primary-600 to-blue-700 hover:from-primary-700 hover:to-blue-800 text-white font-black py-6 px-8 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 transform hover:-translate-y-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-6 w-6" />
                          <span>Subscribe Now</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {hasActiveSubscription && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-red-900 mb-4 flex items-center justify-center space-x-2">
                <X className="h-6 w-6" />
                <span>Manage Subscription</span>
              </h3>
              <button
                onClick={handleCancelClick}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-xl hover:shadow-2xl"
              >
                <X className="h-5 w-5" />
                <span>Cancel Subscription</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}