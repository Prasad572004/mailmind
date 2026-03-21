import { useState, useEffect } from 'react'
import { MessageSquareReply, Sparkles, Copy, Trash2, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { smartReplyAPI } from '../api/services'
import { LoadingSpinner, EmptyState, ToneBadge, PageHeader } from '../components/ui/index'
import EmailComposerModal from '../components/EmailComposerModal'
import toast from 'react-hot-toast'
import api from '../api/axios'

function normalizeTone(tone) {
  if (!tone) return 'General'
  const map = { PROFESSIONAL:'Professional', CASUAL:'Casual', FRIENDLY:'Friendly', URGENT:'Urgent', PERSUASIVE:'Persuasive', BRIEF:'Brief' }
  return map[tone.toUpperCase()] || (tone.charAt(0).toUpperCase() + tone.slice(1).toLowerCase())
}

function safeParse(data) {
  if (typeof data === 'string') { try { return JSON.parse(data) } catch { return data } }
  return data
}

function isReplyObj(obj) {
  return obj && typeof obj === 'object' && (obj.tone || obj.body || obj.replyBody || obj.content)
}

function extractReplies(raw) {
  const data = safeParse(raw)
  if (!data) return []
  if (Array.isArray(data)) {
    if (data.length > 0 && isReplyObj(data[0])) return data
    const flat = data.flatMap(item => {
      const inner = safeParse(item?.replies ?? item?.smartReplies ?? item?.replyList ?? [])
      if (Array.isArray(inner) && inner.length > 0) return inner
      if (isReplyObj(item)) return [item]
      return []
    })
    if (flat.length > 0) return flat
  }
  if (typeof data === 'object' && !Array.isArray(data)) {
    for (const key of ['replies','smartReplies','replyOptions','replyList','variations','content','data','result','results','items']) {
      const val = safeParse(data[key])
      if (Array.isArray(val) && val.length > 0 && isReplyObj(val[0])) return val
    }
    if (isReplyObj(data)) return [data]
  }
  return []
}

function getBody(r)    { return r?.body || r?.replyBody || r?.content || r?.emailBody || r?.text || '' }
function getSubject(r) { return r?.replySubject || r?.subjectLine || r?.subject || '' }

const TONE_BORDER = { Professional:'hover:border-blue-300', Casual:'hover:border-emerald-300', Friendly:'hover:border-amber-300', Urgent:'hover:border-red-300', Brief:'hover:border-slate-300' }

function ReplyCard({ reply, onUseThis }) {
  const [expanded, setExpanded] = useState(false)
  const body    = getBody(reply)
  const tone    = normalizeTone(reply.tone)
  const subject = getSubject(reply)

  const copy = () => { navigator.clipboard.writeText(body); toast.success(`${tone} reply copied!`) }

  return (
    <div className={`border border-slate-200 rounded-2xl p-5 bg-white flex flex-col gap-3 transition-all duration-200 ${TONE_BORDER[tone] || 'hover:border-violet-300'} hover:shadow-sm`}>
      <div className="flex items-center justify-between">
        <ToneBadge tone={tone} />
        <button onClick={copy} className="text-slate-400 hover:text-slate-700 transition-colors"><Copy className="w-4 h-4" /></button>
      </div>

      {subject && (
        <p className="text-xs text-slate-500">Subject: <span className="text-slate-800 font-medium">{subject}</span></p>
      )}

      {body
        ? <p className={`text-sm text-slate-600 leading-relaxed flex-1 whitespace-pre-wrap ${!expanded ? 'line-clamp-4' : ''}`}>{body}</p>
        : <p className="text-sm text-slate-400 italic">No content</p>
      }

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button onClick={() => setExpanded(!expanded)}
          className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors">
          {expanded ? <><ChevronUp className="w-3.5 h-3.5" />Less</> : <><ChevronDown className="w-3.5 h-3.5" />More</>}
        </button>
        <div className="flex items-center gap-2">
          <button onClick={copy}
            className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-all">
            Copy
          </button>
          <button
            onClick={() => onUseThis({ subject, body, tone })}
            className="text-xs font-medium bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg transition-all shadow-sm hover:shadow-violet-200 hover:shadow-md active:scale-95"
          >
            Use this →
          </button>
        </div>
      </div>
    </div>
  )
}

function HistoryItem({ item, onDelete }) {
  const [open,    setOpen]    = useState(false)
  const [reps,    setReps]    = useState([])
  const [loading, setLoading] = useState(false)
  const [modal,   setModal]   = useState({ open: false, subject: '', body: '', tone: '' })

  const toggle = async () => {
    if (open) { setOpen(false); return }
    if (reps.length > 0) { setOpen(true); return }
    const direct = extractReplies(item.replies ?? item.smartReplies ?? item.replyList ?? [])
    if (direct.length > 0) { setReps(direct); setOpen(true); return }
    
    setLoading(true)
    try {
      const res = await api.get(`/api/smart-reply/${item.id}`)
      const parsed = extractReplies(res.data?.replies ?? res.data?.smartReplies ?? res.data)
      if (parsed.length > 0) {
        setReps(parsed)
      } else if (isReplyObj(item)) {
        setReps([item])
      } else {
        toast.error('Could not load replies')
      }
    } catch (err) {
      console.error('Error loading replies:', err)
      if (isReplyObj(item)) {
        setReps([item])
      } else {
        toast.error('Failed to load replies')
      }
    } finally { 
      setLoading(false)
      setOpen(true)
    }
  }

  return (
    <>
      <div className="card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{item.originalSubject || 'No subject'}</p>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.originalEmail}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle}
              className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors font-medium">
              {loading ? <div className="w-3 h-3 border border-violet-600 border-t-transparent rounded-full animate-spin" />
                : open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Replies
            </button>
            <button onClick={() => onDelete(item.id)} className="text-slate-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {open && (
          <div className="mt-4">
            {reps.length > 0
              ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {reps.map((r, i) => (
                    <ReplyCard key={i} reply={r}
                      onUseThis={({ subject, body, tone }) => setModal({ open: true, subject, body, tone })} />
                  ))}
                </div>
              : <p className="text-xs text-slate-400 text-center py-4">No replies found</p>
            }
          </div>
        )}
      </div>

      <EmailComposerModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, subject: '', body: '', tone: '' })}
        initialSubject={modal.subject}
        initialBody={modal.body}
        tone={modal.tone}
        mode="reply"
      />
    </>
  )
}

const SESSION_KEY = 'mailmind_last_replies'

export default function SmartReplyPage() {
  const [originalEmail,   setOriginalEmail]   = useState('')
  const [originalSubject, setOriginalSubject] = useState('')
  const [senderEmail,     setSenderEmail]     = useState('')
  const [replies,         setReplies]         = useState([])
  const [history,         setHistory]         = useState([])
  const [loading,         setLoading]         = useState(true)
  const [generating,      setGenerating]      = useState(false)
  const [modal,           setModal]           = useState({ open: false, subject: '', body: '', tone: '' })

  useEffect(() => {
    try { const s = sessionStorage.getItem(SESSION_KEY); if (s) setReplies(JSON.parse(s)) } catch {}
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const res = await smartReplyAPI.history()
      setHistory(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error('Error loading history:', err)
      toast.error('Could not load reply history')
      setHistory([])
    }
    finally { setLoading(false) }
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!originalEmail.trim()) { 
      toast.error('Please paste the email you want to reply to')
      return 
    }
    
    setGenerating(true)
    setReplies([])
    sessionStorage.removeItem(SESSION_KEY)

    try {
      const res = await smartReplyAPI.generate({ 
        originalEmail, 
        originalSubject, 
        senderEmail 
      })
      
      let list = extractReplies(res.data)

      if (list.length > 0) {
        setReplies(list)
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(list))
        toast.success(`Generated ${list.length} reply options! 🎉`)
        
        // Refresh history in background - don't wait for it
        loadHistory()
      } else {
        toast.error('No replies generated — check backend response')
        console.warn('extractReplies returned empty:', res.data)
      }
    } catch (err) {
      console.error('Error generating replies:', err)
      toast.error(err.response?.data?.message || 'Failed to generate replies')
    } finally { 
      setGenerating(false) 
    }
  }

  const handleDelete = async (id) => {
    toast((t) => (
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-700">Delete this reply?</span>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id)
              try {
                await smartReplyAPI.delete(id)
                setHistory(prev => prev.filter(h => h.id !== id))
                toast.success('Deleted')
              } catch (err) {
                console.error('Error deleting reply:', err)
                toast.error('Could not delete reply')
              }
            }}
            className="px-3 py-1 text-xs font-medium bg-red-500 hover:bg-red-600
                       text-white rounded-lg transition-all">
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 text-xs font-medium bg-slate-200 hover:bg-slate-300
                       text-slate-700 rounded-lg transition-all">
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 5000 })
  }

  const clearForm = () => {
    setOriginalEmail(''); 
    setOriginalSubject(''); 
    setSenderEmail(''); 
    setReplies([])
    sessionStorage.removeItem(SESSION_KEY)
  }

  if (loading) return <LoadingSpinner text="Loading..." />

  return (
    <>
      <div className="animate-fade-in">
        <PageHeader 
          title="Smart reply" 
          subtitle="Paste any incoming email and get 4 AI-crafted replies in different tones" 
        />

        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MessageSquareReply className="w-4 h-4 text-blue-600" />Paste incoming email
          </h2>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Subject line <span className="text-slate-400 font-normal">(optional)</span></label>
                <input type="text" placeholder="e.g. Inquiry about pricing plans"
                  value={originalSubject} onChange={e => setOriginalSubject(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label">Sender email <span className="text-slate-400 font-normal">(optional)</span></label>
                <input type="email" placeholder="sender@company.com"
                  value={senderEmail} onChange={e => setSenderEmail(e.target.value)} className="input-field" />
              </div>
            </div>
            <div>
              <label className="label">Email content <span className="text-red-500">*</span></label>
              <textarea rows={6} placeholder="Paste the full email content here..."
                value={originalEmail} onChange={e => setOriginalEmail(e.target.value)} className="input-field resize-none" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={generating} className="btn-primary flex items-center gap-2">
                {generating ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4" />Generate replies</>}
              </button>
              {(originalEmail || replies.length > 0) && (
                <button type="button" onClick={clearForm} className="btn-secondary text-sm">Clear</button>
              )}
            </div>
          </form>
        </div>

        {generating && (
          <div className="card p-8 mb-6 text-center border-violet-200 bg-violet-50">
            <div className="w-10 h-10 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-600 text-sm font-medium">Groq AI is crafting your replies...</p>
          </div>
        )}

        {replies.length > 0 && (
          <div className="mb-8">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600" />
              Your reply options
              <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{replies.length} options</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {replies.map((r, i) => (
                <ReplyCard key={i} reply={r}
                  onUseThis={({ subject, body, tone }) => setModal({ open: true, subject, body, tone })} />
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="font-semibold text-slate-900 mb-4">Reply history</h2>
          {history.length === 0
            ? <EmptyState icon={MessageSquareReply} title="No reply history" description="Generated replies will appear here" />
            : <div className="space-y-3">{history.map(item => <HistoryItem key={item.id} item={item} onDelete={handleDelete} />)}</div>
          }
        </div>
      </div>

      <EmailComposerModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, subject: '', body: '', tone: '' })}
        initialSubject={modal.subject}
        initialBody={modal.body}
        tone={modal.tone}
        mode="reply"
      />
    </>
  )
}