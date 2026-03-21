import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Mail, LayoutDashboard, Inbox, Zap, MessageSquareReply, 
         BarChart3, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const links = [
  { to: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/inbox',       label: 'Inbox',       icon: Inbox },
  { to: '/campaigns',   label: 'Campaigns',   icon: Zap },
  { to: '/smart-reply', label: 'Smart Reply', icon: MessageSquareReply },
  { to: '/analytics',   label: 'Analytics',   icon: BarChart3 },
]

export default function DashboardLayout({ children }) {
  const location = useLocation()
  const navigate  = useNavigate()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }
  const isActive = (path) => location.pathname === path
  const closeMobile = () => setMobileOpen(false)

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 bg-white
                        border-r border-slate-200 p-4 shadow-sm">
        <Link to="/" className="flex items-center gap-2.5 px-2 mb-8">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center
                          justify-center shadow-sm">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-lg">
            Mail<span className="text-violet-600">Mind</span>
          </span>
        </Link>

        <nav className="flex flex-col gap-1 flex-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
                         text-sm font-medium transition-all duration-200 ${
                isActive(to)
                  ? 'bg-violet-50 text-violet-700 border border-violet-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}>
              <Icon className="w-4 h-4" />{label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-200 pt-4 mt-4">
          <div className="flex items-center gap-3 px-3 mb-3">
            <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center
                            justify-center text-sm font-bold text-white">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
                       text-sm text-slate-600 hover:text-slate-900
                       hover:bg-slate-100 transition-all">
            <LogOut className="w-4 h-4" />Logout
          </button>
        </div>
      </aside>

      {/* ── Mobile overlay ───────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* ── Mobile sidebar drawer ────────────────────────────── */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl
                       transform transition-transform duration-300 ease-in-out
                       lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-4">

          {/* Header */}
          <div className="flex items-center justify-between mb-8 px-2">
            <Link to="/" onClick={closeMobile}
              className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center
                              justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-lg">
                Mail<span className="text-violet-600">Mind</span>
              </span>
            </Link>
            <button onClick={closeMobile}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-1 flex-1">
            {links.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={closeMobile}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
                           text-sm font-medium transition-all duration-200 ${
                  isActive(to)
                    ? 'bg-violet-50 text-violet-700 border border-violet-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}>
                <Icon className="w-4 h-4" />{label}
              </Link>
            ))}
          </nav>

          {/* User + logout */}
          <div className="border-t border-slate-200 pt-4 mt-4">
            <div className="flex items-center gap-3 px-3 mb-3">
              <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center
                              justify-center text-sm font-bold text-white">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button onClick={() => { closeMobile(); handleLogout() }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
                         text-sm text-slate-600 hover:text-slate-900
                         hover:bg-slate-100 transition-all">
              <LogOut className="w-4 h-4" />Logout
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar — only visible on small screens */}
        <div className="lg:hidden flex items-center justify-between
                        px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
          <button onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <Menu className="w-5 h-5 text-slate-600" />
          </button>

          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center
                            justify-center">
              <Mail className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-base">
              Mail<span className="text-violet-600">Mind</span>
            </span>
          </Link>

          <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center
                          justify-center text-sm font-bold text-white">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>

        <div className="flex-1 p-4 lg:p-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  )
}