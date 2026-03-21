
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, LayoutDashboard, Inbox, Zap, MessageSquareReply, BarChart3, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const navLinks = [
  { to: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/inbox',       label: 'Inbox',       icon: Inbox },
  { to: '/campaigns',   label: 'Campaigns',   icon: Zap },
  { to: '/smart-reply', label: 'Smart Reply', icon: MessageSquareReply },
  { to: '/analytics',   label: 'Analytics',   icon: BarChart3 },
]

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }
  const isActive = (path) => location.pathname === path

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-violet-200 group-hover:shadow-md transition-all">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">
              Mail<span className="text-violet-600">Mind</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {isAuthenticated ? (
              navLinks.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(to)
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}>
                  <Icon className="w-4 h-4" />{label}
                </Link>
              ))
            ) : (
              <>
                <a href="#features"     className="btn-ghost text-sm">Features</a>
                <a href="#how-it-works" className="btn-ghost text-sm">How it works</a>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
                  <div className="w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm text-slate-700 font-medium">{user?.name}</span>
                </div>
                <button onClick={handleLogout} className="btn-ghost text-sm flex items-center gap-1.5">
                  <LogOut className="w-4 h-4" />Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn-ghost text-sm">Login</Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-2">Get started</Link>
              </>
            )}
          </div>

          <button className="md:hidden text-slate-600 hover:text-slate-900" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 flex flex-col gap-2">
          {isAuthenticated ? (
            <>
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${isActive(to) ? 'bg-violet-50 text-violet-700' : 'text-slate-600'}`}>
                  <Icon className="w-4 h-4" />{label}
                </Link>
              ))}
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600">
                <LogOut className="w-4 h-4" />Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    onClick={() => setOpen(false)} className="px-4 py-2.5 text-sm text-slate-600">Login</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="btn-primary text-sm text-center">Get started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}