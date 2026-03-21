
import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts'
import {
  Mail, CornerUpLeft, Zap, MessageSquareReply,
  MailOpen, Users, TrendingUp, AlertCircle,
  CheckCircle, Clock, BarChart3
} from 'lucide-react'
import { analyticsAPI } from '../api/services'
import { LoadingSpinner } from '../components/ui/index'
import toast from 'react-hot-toast'

// ── Design tokens ─────────────────────────────────────────────
const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    color: '#0f172a',
    fontSize: '13px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
  },
  cursor: { fill: 'rgba(124,58,237,0.05)' },
}

const STATUS_COLORS = {
  DRAFT:    '#94a3b8',
  ACTIVE:   '#3b82f6',
  SENT:     '#10b981',
  ARCHIVED: '#cbd5e1',
}

const CHART_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']
const READ_COLORS  = ['#3b82f6', '#f59e0b']

// ── Health score ──────────────────────────────────────────────
function computeHealthScore(totalEmails, unreadEmails, repliesSent, emailsPerDay) {
  if (totalEmails === 0) return null
  const readRate   = totalEmails > 0 ? (totalEmails - unreadEmails) / totalEmails : 0
  const replyRate  = totalEmails > 0 ? repliesSent / totalEmails : 0
  const readScore  = Math.round(readRate * 40)
  const replyScore = Math.min(40, Math.round((replyRate / 0.2) * 40))
  const hasRecent  = emailsPerDay.slice(-3).some(d => d.count > 0)
  return Math.min(100, readScore + replyScore + (hasRecent ? 20 : 0))
}

function getHealthLabel(score) {
  if (score === null) return { label: 'No data yet',    color: 'text-slate-400', bg: 'bg-slate-100',  bar: 'bg-slate-300',  icon: Clock        }
  if (score >= 80)   return { label: 'Excellent',       color: 'text-green-700', bg: 'bg-green-50',   bar: 'bg-green-500',  icon: CheckCircle  }
  if (score >= 60)   return { label: 'Good',            color: 'text-blue-700',  bg: 'bg-blue-50',    bar: 'bg-blue-500',   icon: TrendingUp   }
  if (score >= 40)   return { label: 'Needs attention', color: 'text-amber-700', bg: 'bg-amber-50',   bar: 'bg-amber-500',  icon: AlertCircle  }
  return               { label: 'Action needed',        color: 'text-red-700',   bg: 'bg-red-50',     bar: 'bg-red-500',    icon: AlertCircle  }
}

function getHealthInsight(score, unreadEmails, replyRatePercent, totalEmails) {
  if (score === null || totalEmails === 0)
    return 'Sync your inbox to get personalised insights.'
  if (score >= 80)
    return `Great work! You're reading ${100 - Math.round((unreadEmails / totalEmails) * 100)}% of emails and replying to ${replyRatePercent}% — keep it up.`
  if (unreadEmails > 20)
    return `You have ${unreadEmails} unread emails. Reading them will improve your inbox health score.`
  if (replyRatePercent < 10)
    return `Your reply rate is ${replyRatePercent}%. Try replying to more emails — aim for 20%+ for a healthy score.`
  return `You're doing well. Keep reading and replying to emails to improve your score.`
}

// ── Reusable components ───────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub }) {
  const colors = {
    purple: { bg: 'bg-violet-50', icon: 'text-violet-600', val: 'text-violet-700' },
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   val: 'text-blue-700'   },
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  val: 'text-green-700'  },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  val: 'text-amber-700'  },
  }
  const c = colors[color] || colors.purple
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center
                       justify-center flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${c.icon}`} />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className={`text-2xl font-bold ${c.val} mt-0.5`}>{value ?? 0}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function SectionCard({ title, icon: Icon, children, className = '' }) {
  return (
    <div className={`card p-6 ${className}`}>
      <h2 className="font-semibold text-slate-900 mb-5 flex items-center gap-2">
        <Icon className="w-4 h-4 text-violet-600" />
        {title}
      </h2>
      {children}
    </div>
  )
}

function EmptyChart({ message }) {
  return (
    <div className="flex flex-col items-center justify-center h-40
                    text-slate-400 text-sm gap-2">
      <BarChart3 className="w-8 h-8 text-slate-200" />
      <p className="text-center leading-relaxed">{message}</p>
    </div>
  )
}

function ReadTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2
                    shadow-md text-xs">
      <span className="font-medium text-slate-700">{name}:</span>{' '}
      <span className="text-slate-900 font-bold">{value}</span>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await analyticsAPI.overview()
        setStats(res.data || {})
      } catch (err) {
        console.error('Analytics load error:', err)
        toast.error('Could not load analytics data')
        setStats({})
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <LoadingSpinner text="Loading analytics..." />

  // ── Safe extractions ──────────────────────────────────────
  const totalEmails       = stats?.totalEmails       ?? 0
  const unreadEmails      = stats?.unreadEmails      ?? 0
  const readEmails        = Math.max(0, totalEmails - unreadEmails)
  const repliesSent       = stats?.repliesSent       ?? 0
  const totalCampaigns    = stats?.totalCampaigns    ?? 0
  const totalSmartReplies = stats?.totalSmartReplies ?? 0
  const activeCampaigns   = stats?.activeCampaigns   ?? 0
  const emailsPerDay      = stats?.emailsPerDay      || []
  const topSenders        = stats?.topSenders        || []
  const monthlyData       = stats?.monthlyCampaigns  || []

  const replyRatePercent = totalEmails > 0
    ? Math.round((repliesSent / totalEmails) * 100) : 0
  const readRatePercent  = totalEmails > 0
    ? Math.round((readEmails / totalEmails) * 100)  : 0

  const healthScore  = computeHealthScore(totalEmails, unreadEmails, repliesSent, emailsPerDay)
  const healthInfo   = getHealthLabel(healthScore)
  const healthInsight = getHealthInsight(healthScore, unreadEmails, replyRatePercent, totalEmails)
  const HealthIcon   = healthInfo.icon

  const replyPieData = [
    { name: 'Replied',     value: stats?.replyRate?.replied    || 0 },
    { name: 'Not replied', value: stats?.replyRate?.notReplied || 0 },
  ].filter(d => d.value > 0)

  const readPieData = [
    { name: 'Read',   value: readEmails   },
    { name: 'Unread', value: unreadEmails },
  ].filter(d => d.value > 0)

  const statusData = stats?.campaignsByStatus
    ? Object.entries(stats.campaignsByStatus)
        .map(([status, count]) => ({ status, count: Number(count) }))
        .filter(d => d.count > 0)
    : []

  return (
    <div className="animate-fade-in space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Your inbox health and email activity
          {stats?.userName && (
            <span className="text-violet-600 font-medium"> — {stats.userName}</span>
          )}
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total emails"   value={totalEmails}       icon={Mail}                color="blue"   sub={`${unreadEmails} unread`}    />
        <StatCard label="Replies sent"   value={repliesSent}       icon={CornerUpLeft}         color="green"  sub={`${replyRatePercent}% reply rate`} />
        <StatCard label="Campaigns"      value={totalCampaigns}    icon={Zap}                  color="purple" sub={`${activeCampaigns} active`} />
        <StatCard label="Smart replies"  value={totalSmartReplies} icon={MessageSquareReply}   color="amber"  sub="AI generated"                />
      </div>

      {/* ── Health score + Read vs Unread ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Inbox health score */}
        <div className={`card p-6 ${healthInfo.bg} border-0`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <HealthIcon className={`w-4 h-4 ${healthInfo.color}`} />
                Inbox health score
              </h2>
              <p className={`text-xs font-medium mt-1 ${healthInfo.color}`}>
                {healthInfo.label}
              </p>
            </div>
            {healthScore !== null && (
              <span className={`text-4xl font-bold ${healthInfo.color}`}>
                {healthScore}
                <span className="text-lg font-normal opacity-60">/100</span>
              </span>
            )}
          </div>

          {healthScore !== null && (
            <div className="mb-4">
              <div className="h-3 bg-white/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${healthInfo.bar}`}
                  style={{ width: `${healthScore}%` }}
                />
              </div>
            </div>
          )}

          {totalEmails > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white/60 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-slate-800">{readRatePercent}%</p>
                <p className="text-xs text-slate-500 mt-0.5">Read rate</p>
              </div>
              <div className="bg-white/60 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-slate-800">{replyRatePercent}%</p>
                <p className="text-xs text-slate-500 mt-0.5">Reply rate</p>
              </div>
              <div className="bg-white/60 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-slate-800">{unreadEmails}</p>
                <p className="text-xs text-slate-500 mt-0.5">Unread</p>
              </div>
            </div>
          )}
          <p className="text-sm text-slate-600 leading-relaxed">💡 {healthInsight}</p>
        </div>

        {/* Read vs Unread */}
        <SectionCard title="Read vs unread" icon={MailOpen}>
          {readPieData.length === 0 ? (
            <EmptyChart message="Sync your inbox to see the breakdown." />
          ) : (
            <>
              <div className="flex items-center justify-around mb-2">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{readEmails}</p>
                  <p className="text-xs text-slate-400 mt-1">Read</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-300">/</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-500">{unreadEmails}</p>
                  <p className="text-xs text-slate-400 mt-1">Unread</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-800">{totalEmails}</p>
                  <p className="text-xs text-slate-400 mt-1">Total</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={readPieData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3}>
                    {readPieData.map((_, i) => (
                      <Cell key={i} fill={READ_COLORS[i % READ_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ReadTooltip />} />
                  <Legend formatter={v => (
                    <span style={{ color: '#64748b', fontSize: 11 }}>{v}</span>
                  )} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-1">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-slate-500">Read rate</span>
                  <span className="text-xs font-semibold text-blue-600">{readRatePercent}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-700"
                    style={{ width: `${readRatePercent}%` }} />
                </div>
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* ── Emails per day ── */}
      <SectionCard title="Emails received — last 7 days" icon={Mail}>
        {totalEmails === 0 ? (
          <EmptyChart message="No emails yet. Sync your inbox to see daily activity." />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={emailsPerDay} barCategoryGap="40%"
              margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="count" name="Emails" radius={[6, 6, 0, 0]} minPointSize={3}>
                {emailsPerDay.map((entry, i) => (
                  <Cell key={i}
                    fill={entry.count > 0 ? '#7c3aed' : '#ede9fe'}
                    stroke={entry.count === 0 ? '#c4b5fd' : 'none'}
                    strokeWidth={entry.count === 0 ? 1 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      {/* ── Monthly activity + Top senders ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <SectionCard title="Monthly activity — last 6 months" icon={TrendingUp} className="lg:col-span-2">
          {monthlyData.every(d => !d.emails && !d.replies) ? (
            <EmptyChart message="No activity data yet." />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Legend formatter={v => (
                  <span style={{ color: '#64748b', fontSize: 11 }}>{v}</span>
                )} />
                <Line type="monotone" dataKey="emails" name="Emails received"
                  stroke="#7c3aed" strokeWidth={2}
                  dot={{ fill: '#7c3aed', r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="replies" name="Replies sent"
                  stroke="#10b981" strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Top senders" icon={Users}>
          {topSenders.length === 0 ? (
            <EmptyChart message="Sync your inbox to see who emails you most." />
          ) : (
            <div className="space-y-4">
              {topSenders.map((s, i) => {
                const maxCount = topSenders[0]?.count || 1
                const pct = Math.round((s.count / maxCount) * 100)
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center
                                        text-white text-xs font-bold flex-shrink-0"
                          style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}>
                          {i + 1}
                        </div>
                        <span className="text-sm text-slate-700 truncate" title={s.sender}>
                          {s.sender}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-600 ml-3 flex-shrink-0">
                        {s.count}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden ml-8">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Campaign status ── */}
      <SectionCard title="Campaigns by status" icon={Zap}>
        {statusData.length === 0 ? (
          <EmptyChart message="Create campaigns to see status breakdown." />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={statusData} layout="vertical" barCategoryGap="30%"
              margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="status" tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false} tickLine={false} width={60} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="count" name="Campaigns" radius={[0, 4, 4, 0]}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.status] || '#7c3aed'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

    </div>
  )
}