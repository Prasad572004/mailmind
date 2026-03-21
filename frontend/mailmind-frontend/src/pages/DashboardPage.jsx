
import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Mail, CornerUpLeft, Zap, BarChart3,
  MessageSquareReply, ArrowRight, Clock,
  AlertCircle, CheckCircle, TrendingUp,
  Inbox, Star, RefreshCw, Wifi, WifiOff,
  Calendar, LogOut, ChevronDown, X
} from 'lucide-react'
import { analyticsAPI, campaignAPI } from '../api/services'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner } from '../components/ui/index'
import toast from 'react-hot-toast'

const STATUS_STYLES = {
  DRAFT:    'bg-slate-100 text-slate-600',
  ACTIVE:   'bg-blue-100 text-blue-700',
  SENT:     'bg-emerald-100 text-emerald-700',
  ARCHIVED: 'bg-slate-100 text-slate-400',
}

function getHealthInfo(score) {
  if (score === null || score === undefined)
    return { label: 'No data',         color: 'text-slate-400' }
  if (score >= 80) return { label: 'Excellent',       color: 'text-green-600' }
  if (score >= 60) return { label: 'Good',            color: 'text-blue-600'  }
  if (score >= 40) return { label: 'Needs attention', color: 'text-amber-600' }
  return             { label: 'Action needed',        color: 'text-red-600'   }
}

function buildInsight(stats, recentEmails) {
  const unread    = stats?.unreadEmails ?? 0
  const replyRate = stats?.totalEmails > 0
    ? Math.round(((stats?.repliesSent ?? 0) / stats.totalEmails) * 100) : 0
  const health    = stats?.healthScore ?? null

  if (!stats?.totalEmails)
    return { icon: '📬', text: 'Sync your inbox to get personalised insights and start managing your emails with AI.' }
  if (unread > 30)
    return { icon: '📬', text: `You have ${unread} unread emails. Open your inbox and use Smart Reply to respond to important ones faster.` }
  if (replyRate < 10 && stats?.totalEmails > 5)
    return { icon: '💬', text: `Your reply rate is only ${replyRate}%. Try using Smart Reply in the inbox — it generates 4 reply options in seconds.` }
  if (health !== null && health < 40)
    return { icon: '❤️', text: `Your inbox health score is ${health}/100. Read your unread emails and reply to more to improve it.` }
  if ((stats?.totalCampaigns ?? 0) === 0)
    return { icon: '⚡', text: "You haven't created any campaigns yet. Describe your idea and let AI generate 5 email variations for you." }
  return { icon: '✅', text: `Looking good! You've sent ${stats?.repliesSent ?? 0} replies and created ${stats?.totalCampaigns ?? 0} campaigns. Keep it up!` }
}

function StatCard({ label, value, icon: Icon, color, sub, subColor }) {
  const colors = {
    purple: { bg: 'bg-violet-50', icon: 'text-violet-600', val: 'text-violet-700' },
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   val: 'text-blue-700'   },
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  val: 'text-green-700'  },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  val: 'text-amber-700'  },
    red:    { bg: 'bg-red-50',    icon: 'text-red-600',    val: 'text-red-700'    },
  }
  const c = colors[color] || colors.purple
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${c.icon}`} />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className={`text-2xl font-bold ${c.val} mt-0.5`}>{value ?? 0}</p>
        {sub && <p className={`text-xs mt-0.5 ${subColor || 'text-slate-400'}`}>{sub}</p>}
      </div>
    </div>
  )
}

function QuickAction({ to, icon: Icon, label, desc, color }) {
  const colors = {
    violet: { bg: 'bg-violet-50', icon: 'text-violet-600', hover: 'hover:border-violet-300 hover:bg-violet-50/80' },
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   hover: 'hover:border-blue-300 hover:bg-blue-50/80'     },
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  hover: 'hover:border-green-300 hover:bg-green-50/80'   },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  hover: 'hover:border-amber-300 hover:bg-amber-50/80'   },
  }
  const c = colors[color] || colors.violet
  return (
    <Link to={to}>
      <div className={`card p-4 flex items-center gap-3 transition-all duration-200
                       hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${c.hover}`}>
        <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="text-xs text-slate-500 truncate">{desc}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-300 ml-auto flex-shrink-0" />
      </div>
    </Link>
  )
}

// ── Profile dropdown ──────────────────────────────────────────
function ProfileDropdown({ user, stats, onLogout, onDisconnectGmail }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Recently'

  // Close on outside click
  useEffect(() => {
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div className="relative" ref={ref}>

      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200
                   hover:border-violet-300 rounded-xl transition-all shadow-sm
                   hover:shadow-md group"
      >
        {/* Avatar */}
        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-700
                        rounded-lg flex items-center justify-center
                        text-white text-sm font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-sm font-semibold text-slate-800 leading-tight">
            {user?.name?.split(' ')[0] || 'Profile'}
          </p>
          <p className="text-xs text-slate-400 leading-tight truncate max-w-[120px]">
            {user?.email || ''}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ml-1 ${
          open ? 'rotate-180' : ''
        }`} />
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white border
                        border-slate-200 rounded-2xl shadow-xl z-50
                        animate-fade-in overflow-hidden">

          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-violet-50 to-blue-50
                          border-b border-slate-100 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-700
                            rounded-xl flex items-center justify-center
                            text-white text-lg font-bold flex-shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email || ''}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto text-slate-400 hover:text-slate-600 transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stats */}
          <div className="px-5 py-4 space-y-3 border-b border-slate-100">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                {user?.gmailConnected
                  ? <Wifi className="w-4 h-4 text-green-500" />
                  : <WifiOff className="w-4 h-4 text-slate-400" />}
                Gmail
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                user?.gmailConnected
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {user?.gmailConnected ? 'Connected' : 'Not connected'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                Member since
              </div>
              <span className="text-xs font-medium text-slate-500">{memberSince}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                Emails synced
              </div>
              <span className="text-xs font-bold text-slate-700">
                {stats?.totalEmails ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Zap className="w-4 h-4 text-slate-400" />
                Campaigns
              </div>
              <span className="text-xs font-bold text-slate-700">
                {stats?.totalCampaigns ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MessageSquareReply className="w-4 h-4 text-slate-400" />
                Smart replies
              </div>
              <span className="text-xs font-bold text-slate-700">
                {stats?.totalSmartReplies ?? 0}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 py-3 space-y-1">
            <Link
              to="/analytics"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm
                         text-slate-600 hover:text-violet-600 hover:bg-violet-50
                         rounded-xl transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              View full analytics
            </Link>

            {user?.gmailConnected ? (
              <button
                onClick={() => { onDisconnectGmail(); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm
                           text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                <WifiOff className="w-4 h-4" />
                Disconnect Gmail
              </button>
            ) : (
              <Link
                to="/inbox"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm
                           text-violet-600 hover:bg-violet-50 rounded-xl transition-all"
              >
                <Wifi className="w-4 h-4" />
                Connect Gmail
              </Link>
            )}

            {/* Divider */}
            <div className="border-t border-slate-100 my-1" />

            <button
              onClick={() => { onLogout(); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm
                         text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate           = useNavigate()
  const { user, updateUser, logout } = useAuth()
  const [stats,        setStats]        = useState(null)
  const [campaigns,    setCampaigns]    = useState([])
  const [recentEmails, setRecentEmails] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [syncing,      setSyncing]      = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, cRes, eRes] = await Promise.all([
          analyticsAPI.overview(),
          campaignAPI.getAll(),
          api.get('/api/inbox').catch(() => ({ data: [] })),
        ])
        setStats(sRes.data || {})
        const campList = Array.isArray(cRes.data)
          ? cRes.data : (cRes.data?.campaigns ?? [])
        setCampaigns(campList.slice(0, 3))
        setRecentEmails(Array.isArray(eRes.data) ? eRes.data.slice(0, 5) : [])
      } catch (err) {
        console.error('Dashboard load error:', err)
        toast.error('Failed to load dashboard data')
        setStats({})
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSync = async () => {
    try {
      setSyncing(true)
      await api.post('/api/inbox/sync')
      const res = await api.get('/api/inbox')
      setRecentEmails(Array.isArray(res.data) ? res.data.slice(0, 5) : [])
      toast.success('Inbox synced!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to sync')
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnectGmail = async () => {
    if (!window.confirm('Disconnect your Gmail account?')) return
    try {
      await api.post('/api/auth/google/disconnect')
      updateUser({ gmailConnected: false })
      toast.success('Gmail disconnected')
    } catch {
      toast.error('Failed to disconnect Gmail')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // ── Derived values ──────────────────────────────────────────
  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name?.split(' ')[0] || 'there'

  const unreadEmails   = stats?.unreadEmails   ?? 0
  const repliesSent    = stats?.repliesSent    ?? 0
  const totalCampaigns = stats?.totalCampaigns ?? 0
  const totalEmails    = stats?.totalEmails    ?? 0
  const replyRate      = totalEmails > 0
    ? Math.round((repliesSent / totalEmails) * 100) : 0

  const readEmails  = Math.max(0, totalEmails - unreadEmails)
  const readRate    = totalEmails > 0 ? readEmails / totalEmails : 0
  const healthScore = totalEmails > 0
    ? Math.min(100,
        Math.round(readRate * 40) +
        Math.min(40, Math.round((replyRate / 20) * 40)) +
        (recentEmails.length > 0 ? 20 : 0))
    : null

  const healthInfo = getHealthInfo(healthScore)
  const insight    = buildInsight({ ...stats, healthScore }, recentEmails)

  if (loading) return <LoadingSpinner text="Loading dashboard..." />

  return (
    <div className="animate-fade-in space-y-6">

      {/* ── Top bar: Greeting + Profile dropdown + Sync ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Here's what needs your attention today.
          </p>
        </div>

        {/* Right side — profile + sync */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {user?.gmailConnected && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                         bg-white border border-slate-200 text-slate-600
                         hover:border-violet-300 hover:text-violet-600
                         rounded-xl transition-all disabled:opacity-50 shadow-sm">
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {syncing ? 'Syncing...' : 'Sync inbox'}
              </span>
            </button>
          )}

          {/* Profile dropdown */}
          <ProfileDropdown
            user={user}
            stats={stats}
            onLogout={handleLogout}
            onDisconnectGmail={handleDisconnectGmail}
          />
        </div>
      </div>

      {/* ── Gmail not connected banner ── */}
      {!user?.gmailConnected && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl
                        flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>Gmail not connected.</strong> Connect to sync emails and unlock all features.
            </p>
          </div>
          <Link to="/inbox"
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white
                       text-sm font-medium rounded-xl transition-all whitespace-nowrap">
            Connect Gmail
          </Link>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Unread emails"
          value={unreadEmails}
          icon={Mail}
          color={unreadEmails > 20 ? 'red' : 'blue'}
          sub={`of ${totalEmails} total`}
        />
        <StatCard
          label="Replies sent"
          value={repliesSent}
          icon={CornerUpLeft}
          color="green"
          sub={`${replyRate}% reply rate`}
        />
        <StatCard
          label="Inbox health"
          value={healthScore !== null ? `${healthScore}/100` : '—'}
          icon={healthScore !== null && healthScore >= 60 ? CheckCircle : AlertCircle}
          color={
            healthScore === null ? 'amber' :
            healthScore >= 80    ? 'green' :
            healthScore >= 60    ? 'blue'  :
            healthScore >= 40    ? 'amber' : 'red'
          }
          sub={healthInfo.label}
          subColor={healthInfo.color}
        />
        <StatCard
          label="Campaigns"
          value={totalCampaigns}
          icon={Zap}
          color="purple"
          sub={`${stats?.activeCampaigns ?? 0} active`}
        />
      </div>

      {/* ── Recent emails + Quick actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent emails — 2/3 */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Inbox className="w-4 h-4 text-violet-600" />
              Recent emails
            </h2>
            <Link to="/inbox"
              className="text-xs text-violet-600 hover:text-violet-700
                         flex items-center gap-1 transition-colors font-medium">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Mail className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-sm text-slate-500">No emails yet</p>
              <p className="text-xs text-slate-400 mt-1">
                {user?.gmailConnected
                  ? 'Click "Sync inbox" to fetch your emails'
                  : 'Connect Gmail to see your emails here'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentEmails.map((email, i) => (
                <div
                  key={email.id ?? i}
                  onClick={() => navigate('/inbox')}
                  className="py-3 flex items-start gap-3 cursor-pointer
                             hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex-shrink-0 mt-1.5">
                    <div className={`w-2 h-2 rounded-full ${
                      email.isRead === true ? 'bg-slate-200' : 'bg-violet-500'
                    }`} />
                  </div>
                  {email.isStarred === true && (
                    <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${
                        email.isRead === true
                          ? 'text-slate-500'
                          : 'text-slate-900 font-semibold'
                      }`}>
                        {email.from?.replace(/<.*>/, '').trim() || 'Unknown'}
                      </p>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {email.date
                          ? new Date(email.date).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric'
                            })
                          : '—'}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 truncate ${
                      email.isRead === true ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {email.subject || '(No subject)'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions — 1/3 */}
        <div className="space-y-3">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-600" />
            Quick actions
          </h2>
          <QuickAction to="/inbox" icon={Inbox} label="Go to Inbox"
            desc={unreadEmails > 0 ? `${unreadEmails} unread emails` : 'View your emails'}
            color="blue" />
          <QuickAction to="/campaigns" icon={Zap} label="New campaign"
            desc="AI generates 5 variations" color="violet" />
          <QuickAction to="/smart-reply" icon={MessageSquareReply} label="Smart reply"
            desc="Reply in 4 different tones" color="green" />
          <QuickAction to="/analytics" icon={BarChart3} label="View analytics"
            desc="Charts & inbox health" color="amber" />
        </div>
      </div>

      {/* ── Recent campaigns ── */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-600" />
            Recent campaigns
          </h2>
          <Link to="/campaigns"
            className="text-xs text-violet-600 hover:text-violet-700
                       flex items-center gap-1 transition-colors font-medium">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Zap className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-sm text-slate-500">No campaigns yet</p>
            <Link to="/campaigns"
              className="mt-3 text-xs font-medium text-violet-600
                         hover:text-violet-700 transition-colors">
              Create your first campaign →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {campaigns.map((c, i) => (
              <div key={c.id ?? c.campaignId ?? i}
                className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center
                                  justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {c.title || `Campaign #${c.id}`}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <p className="text-xs text-slate-400">
                        {c.createdAt
                          ? new Date(c.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric'
                            })
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full
                                 flex-shrink-0 ${
                  STATUS_STYLES[c.status] || STATUS_STYLES.DRAFT}`}>
                  {c.status || 'DRAFT'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── AI Insight ── */}
      <div className="card p-5 bg-gradient-to-r from-violet-50 to-blue-50
                      border-violet-200 flex items-start gap-4">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center
                        flex-shrink-0 shadow-sm text-lg">
          {insight.icon}
        </div>
        <div>
          <p className="text-xs font-semibold text-violet-600 mb-1">💡 AI Insight</p>
          <p className="text-sm text-slate-700 leading-relaxed">{insight.text}</p>
        </div>
      </div>

    </div>
  )
}