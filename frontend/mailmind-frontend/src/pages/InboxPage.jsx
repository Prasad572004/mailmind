
import { useState, useEffect } from 'react'
import { Mail, Search, Star, CornerUpLeft, Send } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import SmartReplyPanel from '../components/SmartReplyPanel'
import ReplyHistory from '../components/ReplyHistory'

export default function InboxPage() {
  const { user } = useAuth()
  const [emails, setEmails]         = useState([])
  const [sentEmails, setSentEmails] = useState([])
  const [loading, setLoading]       = useState(true)
  const [syncing, setSyncing]       = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [filter, setFilter]         = useState('all') // all | unread | starred | sent
  // Use Date.now() so ReplyHistory always fires on first open
  const [replyRefreshKey, setReplyRefreshKey] = useState(Date.now())

  useEffect(() => {
    loadEmails()
    const interval = setInterval(() => {
      if (user?.gmailConnected) syncEmails()
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Load sent folder whenever Sent tab is opened
  useEffect(() => {
    if (filter === 'sent') loadSentEmails()
  }, [filter])

const loadEmails = async () => {
  try {
    setLoading(true)
    const res = await api.get('/api/inbox')
    // Sort newest first permanently
    const sorted = (res.data || []).sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    )
    setEmails(sorted)
  } catch (err) {
    console.error('Failed to load emails:', err)
    setEmails([])
  } finally {
    setLoading(false)
  }
}

  const loadSentEmails = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/inbox/sent')
      setSentEmails(res.data)
    } catch (err) {
      console.error('Failed to load sent emails:', err)
    } finally {
      setLoading(false)
    }
  }

  const connectGmail = async () => {
    try {
      setConnecting(true)
      const res = await api.get('/api/auth/google/login-url')
      if (res.data?.url) window.location.href = res.data.url
      else toast.error('Failed to get Google login URL')
    } catch (err) {
      toast.error('Failed to start Gmail connection')
    } finally {
      setConnecting(false)
    }
  }

  const syncEmails = async () => {
    try {
      setSyncing(true)
      await api.post('/api/inbox/sync')
      await loadEmails()
      toast.success('Emails synced successfully!')
    } catch (err) {
      if (err.response?.status === 401) toast.error('Session expired. Please login again.')
      else if (err.response?.status === 400) toast.error('Gmail not connected. Please connect first.')
      else toast.error(err.response?.data?.error || 'Failed to sync emails')
    } finally {
      setSyncing(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) { loadEmails(); return }
    try {
      // const res = await api.get(`/api/inbox/search?query=${searchQuery}`)
      //Update: encodeURIComponent to handle special characters in search query
      const res = await api.get(`/api/inbox/search?query=${encodeURIComponent(searchQuery.trim())}`)
      setEmails(res.data)
    } catch (err) {
      toast.error('Search failed')
    }
  }

  const toggleRead = async (emailId, isRead) => {
    try {
      await api.put(`/api/inbox/${emailId}/${isRead ? 'unread' : 'read'}`)
      setEmails(prev => prev.map(e =>
        e.id === emailId ? { ...e, isRead: !isRead } : e
      ))
    } catch (err) {
      toast.error('Failed to update email')
    }
  }

  const toggleStar = async (emailId, isStarred) => {
    try {
      await api.put(`/api/inbox/${emailId}/star`)
      setEmails(prev => prev.map(e =>
        e.id === emailId ? { ...e, isStarred: !isStarred } : e
      ))
    } catch (err) {
      toast.error('Failed to star email')
    }
  }

  const viewEmail = async (email) => {
    try {
      const res = await api.get(`/api/inbox/${email.id}`)
      setSelectedEmail(res.data)
      setReplyRefreshKey(Date.now()) // always fresh key on open
      if (!email.isRead) toggleRead(email.id, false)
    } catch (err) {
      toast.error('Failed to load email')
    }
  }

  const handleReplySent = async () => {
    if (!selectedEmail) return
    try {
      const res = await api.get(`/api/inbox/${selectedEmail.id}`)
      setSelectedEmail(res.data)
      setReplyRefreshKey(Date.now()) // trigger ReplyHistory refetch
      setEmails(prev => prev.map(e =>
        e.id === selectedEmail.id ? { ...e, isReplied: true } : e
      ))
      // Refresh sent folder if it was loaded
      if (sentEmails.length > 0) loadSentEmails()
    } catch (err) {
      console.error('Failed to refresh email after reply:', err)
    }
  }

  // ── Filtering with null-safe boolean checks ────────────────
  let filteredEmails = emails
  if (filter === 'unread')       filteredEmails = emails.filter(e => e.isRead === false)
  else if (filter === 'starred') filteredEmails = emails.filter(e => e.isStarred === true)

  const FILTERS = [
    { label: 'All',     value: 'all'     },
    { label: 'Unread',  value: 'unread'  },
    { label: 'Starred', value: 'starred' },
    { label: 'Sent',    value: 'sent'    },
  ]

  if (selectedEmail) {
    return (
      <EmailDetailView
        email={selectedEmail}
        onBack={() => setSelectedEmail(null)}
        onReplySent={handleReplySent}
        replyRefreshKey={replyRefreshKey}
      />
    )
  }

  return (
    <div className="animate-fade-in">

      {/* ── Gmail not connected banner ── */}
      {!user?.gmailConnected && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl
                        flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Gmail not connected.</strong>{' '}
            Connect your Gmail account to start syncing emails.
          </p>
          <button
            onClick={connectGmail}
            disabled={connecting}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300
                       text-white text-sm font-medium rounded-xl transition-all whitespace-nowrap"
          >
            {connecting ? 'Redirecting...' : '🔗 Connect Gmail'}
          </button>
        </div>
      )}

      {/* ── Gmail connected banner ── */}
      {user?.gmailConnected && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm text-green-800">
            ✅ <strong>Gmail connected.</strong> Click "Sync Emails" to fetch your latest emails.
          </p>
        </div>
      )}

      {/* ── Header ── */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Inbox</h1>
            <p className="text-slate-600">Read and manage incoming emails</p>
          </div>
          <button
            onClick={syncEmails}
            disabled={syncing || !user?.gmailConnected}
            className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700
                       disabled:bg-slate-300 disabled:cursor-not-allowed
                       text-white font-medium rounded-xl transition-all"
          >
            {syncing ? 'Syncing...' : 'Sync Emails'}
          </button>
        </div>

        {/* Search — hidden on Sent tab */}
        {filter !== 'sent' && (
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200
                           text-slate-900 rounded-xl focus:outline-none focus:border-violet-400"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700
                         font-medium border border-slate-200 rounded-xl transition-all"
            >
              Search
            </button>
          </form>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f.value
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sent folder view ── */}
      {filter === 'sent' && (
        <SentFolder sentEmails={sentEmails} loading={loading} />
      )}

      {/* ── Email list ── */}
      {filter !== 'sent' && (
        loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600
                            rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-600">Loading emails...</p>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="card p-12 text-center">
            <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">
              {filter === 'starred'
                ? 'No starred emails yet. Star an email to save it here.'
                : filter === 'unread'
                ? 'No unread emails.'
                : user?.gmailConnected
                ? 'No emails found. Try syncing.'
                : 'Connect Gmail to see your emails.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredEmails.map((email) => (
              <div
                key={email.id}
                onClick={() => viewEmail(email)}
                className={`card p-4 cursor-pointer hover:bg-slate-50 border-l-4 transition-all ${
                  email.isRead === true ? 'border-l-slate-200' : 'border-l-violet-600'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleStar(email.id, email.isStarred) }}
                      className={`transition-colors ${
                        email.isStarred === true
                          ? 'text-yellow-500'
                          : 'text-slate-400 hover:text-yellow-500'
                      }`}
                    >
                      <Star className="w-5 h-5"
                            fill={email.isStarred === true ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className={`text-sm font-medium ${
                          email.isRead === true ? 'text-slate-600' : 'text-slate-900 font-semibold'
                        }`}>
                          {email.from}
                        </p>
                        <p className={`text-sm ${
                          email.isRead === true ? 'text-slate-500' : 'text-slate-700 font-medium'
                        }`}>
                          {email.subject}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-1">
                          {email.preview}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-slate-500">
                          {new Date(email.date).toLocaleDateString()}
                        </span>
                        {email.isReplied === true && (
                          <span className="text-xs bg-green-100 text-green-700
                                           px-2 py-0.5 rounded-full font-medium">
                            Replied
                          </span>
                        )}
                        {email.isRead !== true && (
                          <div className="w-2 h-2 rounded-full bg-violet-600" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

// ── Sent folder component ──────────────────────────────────────────────────────
function SentFolder({ sentEmails, loading }) {
  const [expanded, setExpanded] = useState({})
  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600
                        rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-600">Loading sent emails...</p>
      </div>
    )
  }

  if (sentEmails.length === 0) {
    return (
      <div className="card p-12 text-center">
        <Send className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">No sent replies yet.</p>
        <p className="text-xs text-slate-400 mt-1">
          Replies you send via Smart Reply will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sentEmails.map(sent => {
        const isExpanded = !!expanded[sent.id]
        return (
          <div key={sent.id}
               className="card border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => toggle(sent.id)}
              className="w-full flex items-start justify-between p-4
                         hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center
                                justify-center flex-shrink-0 mt-0.5">
                  <CornerUpLeft className="w-4 h-4 text-violet-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {sent.originalSubject || '(No Subject)'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    To: {sent.originalFrom || 'Unknown'}
                  </p>
                  {!isExpanded && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {sent.replyBody}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0 ml-4 mt-0.5">
                {new Date(sent.sentAt).toLocaleString()}
              </span>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 border-t border-slate-100">
                <p className="text-sm text-slate-700 leading-relaxed
                              whitespace-pre-wrap mt-3">
                  {sent.replyBody}
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Email detail view ──────────────────────────────────────────────────────────
function EmailDetailView({ email, onBack, onReplySent, replyRefreshKey }) {
  return (
    <div className="animate-fade-in">
      <button
        onClick={onBack}
        className="mb-4 text-violet-600 hover:text-violet-700 font-medium
                   text-sm flex items-center gap-1"
      >
        ← Back to Inbox
      </button>

      <div className="card p-8">
        {/* Email header */}
        <div className="mb-6 pb-4 border-b border-slate-200">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h2 className="text-2xl font-bold text-slate-900">{email.subject}</h2>
            {email.isReplied === true && (
              <span className="flex items-center gap-1 text-xs bg-green-100
                               text-green-700 px-3 py-1 rounded-full font-medium flex-shrink-0">
                <CornerUpLeft className="w-3 h-3" />
                Replied
              </span>
            )}
          </div>
          <div className="space-y-1 text-sm text-slate-600">
            <p><span className="font-medium">From:</span> {email.from}</p>
            <p><span className="font-medium">To:</span> {email.to}</p>
            <p>
              <span className="font-medium">Date:</span>{' '}
              {new Date(email.date).toLocaleString()}
            </p>
            {email.isReplied === true && email.repliedAt && (
              <p className="text-green-600">
                <span className="font-medium">Replied:</span>{' '}
                {new Date(email.repliedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Email body */}
        <div className="prose max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
          {email.body}
        </div>

        {/* Reply history — above compose panel */}
        <ReplyHistory emailId={email.id} refreshTrigger={replyRefreshKey} />

        {/* Smart Reply compose panel */}
        <SmartReplyPanel email={email} onReplySent={onReplySent} />
      </div>
    </div>
  )
}