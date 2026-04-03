import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { Heart, Mail, Lock, User, Eye, EyeOff, Trophy, Users } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and signup
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Form States
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      // Login
      const { error } = await signIn(formData.email, formData.password);
      if (!error) {
        navigate('/dashboard');
      }
    } else {
      // Signup
      const { error } = await signUp(formData.email, formData.password, formData.fullName);
      if (!error) {
        toast.success('Account created! Please check your email to verify.');
        setIsLogin(true); // Switch to login after successful signup
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex">
      {/* Left Side - Emotional Story / Charity Focus */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(at_30%_20%,rgba(236,72,153,0.15),transparent)]" />
        
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-14 w-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <span className="text-4xl font-bold text-white tracking-tight">GolfCharity</span>
          </div>

          <h1 className="text-6xl font-bold text-white leading-tight mb-6">
            Every swing<br />
            can <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">change a life</span>
          </h1>

          <p className="text-xl text-slate-300 mb-10 leading-relaxed">
            Track your golf scores. Enter monthly draws. 
            Support meaningful charities with every subscription.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
              <Trophy className="w-10 h-10 text-amber-400 mb-4" />
              <h3 className="text-white font-semibold text-xl mb-1">Win Big</h3>
              <p className="text-slate-400">Monthly prize pools from subscriptions</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
              <Users className="w-10 h-10 text-emerald-400 mb-4" />
              <h3 className="text-white font-semibold text-xl mb-1">Give Back</h3>
              <p className="text-slate-400">Minimum 10% goes to your chosen charity</p>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-12 right-12 text-[180px] font-black text-white/5 select-none">GC</div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Toggle Buttons */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-10">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-4 text-sm font-semibold rounded-xl transition-all duration-300 ${
                isLogin 
                  ? 'bg-white shadow text-gray-900' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-4 text-sm font-semibold rounded-xl transition-all duration-300 ${
                !isLogin 
                  ? 'bg-white shadow text-gray-900' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Join Now
            </button>
          </div>

          {/* Form Title */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {isLogin ? 'Welcome Back' : 'Join the Movement'}
            </h2>
            <p className="text-gray-600 mt-2">
              {isLogin 
                ? 'Sign in to track scores and enter draws' 
                : 'Play golf. Win prizes. Support charities.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    required={!isLogin}
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full pl-11 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-11 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-11 pr-12 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-700 hover:via-pink-700 hover:to-purple-700 text-white font-semibold py-4 rounded-2xl text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70"
            >
              {loading 
                ? 'Please wait...' 
                : isLogin 
                  ? 'Sign In' 
                  : 'Create Account & Start Giving'
              }
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-8 text-center text-xs text-gray-500">
            Demo: admin@golfcharity.com / password123
          </div>
        </div>
      </div>
    </div>
  );
}