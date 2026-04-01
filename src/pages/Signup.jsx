import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, User, Lock, Heart } from 'lucide-react'
import { useToast } from '../hooks/useToast'

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  })
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await signUp(formData.email, formData.password)
    
    if (!error) {
      toast.success('Account created! Please check your email to verify.')
      navigate('/login')
    }
    
    setLoading(false)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-blue-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-10">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-emerald-500 via-green-500 to-primary-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <Heart className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Join the Movement</h2>
          <p className="text-gray-600">Play golf. Win prizes. Support charities. Change lives.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white/50"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white/50"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white/50"
                placeholder="At least 8 characters"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white font-semibold py-4 px-4 rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                </svg>
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}