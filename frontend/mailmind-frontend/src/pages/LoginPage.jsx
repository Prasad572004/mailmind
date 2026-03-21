import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api/services'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, user } = useAuth()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [errors,   setErrors]   = useState({})
  const [loading,  setLoading]  = useState(false)

  // 🔧 FIX #11: Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!email)    errs.email    = 'Email is required'
    if (!password) errs.password = 'Password is required'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      const res = await authAPI.login({ email, password })
      const { token, user, name } = res.data
      login(user || { name: name || email, email }, token)
      toast.success('Welcome back!')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Invalid email or password'
      toast.error(errorMsg)
      setErrors({ submit: errorMsg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-md">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-xl">
            Mail<span className="text-violet-600">Mind</span>
          </span>
        </div>

        <div className="card p-8 shadow-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome back</h1>
            <p className="text-slate-500 text-sm">Sign in to your MailMind account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }))
                  }}
                  className={`input-field pl-10 ${errors.email ? 'border-red-400 focus:ring-red-100' : ''}`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }))
                  }}
                  className={`input-field pl-10 ${errors.password ? 'border-red-400 focus:ring-red-100' : ''}`}
                />
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-700">{errors.submit}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><span>Sign in</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <p className="text-center text-sm text-slate-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-violet-600 hover:text-violet-700 font-medium">
              Create one free
            </Link>
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          Powered by Groq AI
        </div>
      </div>
    </div>
  )
}