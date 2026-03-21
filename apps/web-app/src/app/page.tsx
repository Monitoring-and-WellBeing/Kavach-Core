'use client'
import { useState } from 'react'
import { Shield, GraduationCap, Users, Building2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

type Tab = 'login' | 'signup'

export default function Landing() {
  const { login, signup } = useAuth()
  const [tab, setTab] = useState<Tab>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  // Login form state
  const [loginData, setLoginData] = useState({ email: '', password: '' })

  // Signup form state
  const [signupData, setSignupData] = useState({
    role: 'INSTITUTE_ADMIN' as const,
    name: '', email: '', password: '', phone: '',
    instituteName: '', instituteType: 'SCHOOL', city: '', state: ''
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(loginData.email, loginData.password)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signup(signupData)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = async (email: string) => {
    setLoading(true)
    setError('')
    try { await login(email, 'demo123') }
    catch { setError('Demo login failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0A0F1E' }}>
      {/* Left — Branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-96 p-10" style={{ background: 'linear-gradient(160deg, #111827 0%, #1a1a2e 100%)', borderRight: '1px solid #1F2937' }}>
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
              <Shield size={22} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl">KAVACH AI</span>
          </div>
          <h2 className="text-white text-3xl font-bold leading-tight mb-4">Student Safety & Digital Wellbeing</h2>
          <p className="text-gray-400 text-sm leading-relaxed">Monitor, protect, and empower students with AI-driven insights. Built for Indian schools and coaching institutes.</p>
        </div>

        {/* Feature list */}
        <div className="space-y-4">
          {[
            { icon: '🛡️', label: 'App & Website Blocking' },
            { icon: '📊', label: 'AI Usage Insights' },
            { icon: '⏱️', label: 'Focus Mode Control' },
            { icon: '🔔', label: 'Real-time Alerts' },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-3">
              <span className="text-xl">{f.icon}</span>
              <span className="text-gray-300 text-sm">{f.label}</span>
            </div>
          ))}
          <p className="text-gray-500 text-xs pt-2">Starting at ₹100/device/month</p>
        </div>
      </div>

      {/* Right — Auth forms */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
              <Shield size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg">KAVACH AI</span>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6">
            <button onClick={() => { setTab('login'); setError('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'login' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              Sign In
            </button>
            <button onClick={() => { setTab('signup'); setError('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'signup' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              Register Institute
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1.5">Email</label>
                <input value={loginData.email} onChange={e => setLoginData(p => ({ ...p, email: e.target.value }))}
                  type="email" placeholder="you@institute.com" required
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1.5">Password</label>
                <div className="relative">
                  <input value={loginData.password} onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))}
                    type={showPass ? 'text' : 'password'} placeholder="••••••••" required
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs block mb-1.5">Your Name</label>
                  <input value={signupData.name} onChange={e => setSignupData(p => ({ ...p, name: e.target.value }))}
                    placeholder="Dr. Vikram Nair" required
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1.5">Phone</label>
                  <input value={signupData.phone} onChange={e => setSignupData(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Email</label>
                <input value={signupData.email} onChange={e => setSignupData(p => ({ ...p, email: e.target.value }))}
                  type="email" placeholder="admin@institute.com" required
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Password</label>
                <input value={signupData.password} onChange={e => setSignupData(p => ({ ...p, password: e.target.value }))}
                  type="password" placeholder="Min. 6 characters" required minLength={6}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1.5">Institute Name</label>
                <input value={signupData.instituteName} onChange={e => setSignupData(p => ({ ...p, instituteName: e.target.value }))}
                  placeholder="Sunrise Academy" required
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-gray-400 text-xs block mb-1.5">Type</label>
                  <select value={signupData.instituteType} onChange={e => setSignupData(p => ({ ...p, instituteType: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="SCHOOL">School</option>
                    <option value="COACHING">Coaching</option>
                    <option value="TRAINING">Training</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1.5">City</label>
                  <input value={signupData.city} onChange={e => setSignupData(p => ({ ...p, city: e.target.value }))}
                    placeholder="Lucknow"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs block mb-1.5">State</label>
                  <input value={signupData.state} onChange={e => setSignupData(p => ({ ...p, state: e.target.value }))}
                    placeholder="UP"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 mt-1" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
                {loading ? 'Creating account...' : 'Register Institute'}
              </button>
            </form>
          )}

          {/* Demo quick access */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-gray-500 text-xs text-center mb-3">— Quick Demo Access —</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Student', email: 'student@demo.com', icon: <GraduationCap size={14} />, color: '#7C3AED' },
                { label: 'Parent', email: 'parent@demo.com', icon: <Users size={14} />, color: '#2563EB' },
                { label: 'Institute', email: 'admin@demo.com', icon: <Building2 size={14} />, color: '#059669' },
              ].map(d => (
                <button key={d.label} onClick={() => quickLogin(d.email)} disabled={loading}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-800 hover:border-gray-700 bg-gray-900/50 hover:bg-gray-800/50 transition-all disabled:opacity-50">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: d.color }}>
                    {d.icon}
                  </div>
                  <span className="text-gray-400 text-xs">{d.label}</span>
                </button>
              ))}
            </div>
            <p className="text-center text-gray-600 text-xs mt-2">All demo passwords: <span className="text-gray-400 font-mono">demo123</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
