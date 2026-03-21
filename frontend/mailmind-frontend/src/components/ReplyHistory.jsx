import { useState, useEffect } from 'react'
import { CornerUpLeft, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../api/axios'

export default function ReplyHistory({ emailId, refreshTrigger }) {
  const [replies,  setReplies]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState({})

  // Fires on mount AND whenever a new reply is sent (refreshTrigger changes)
  useEffect(() => {
    if (!emailId) return
    fetchReplies()
  }, [emailId, refreshTrigger])

  const fetchReplies = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/api/inbox/${emailId}/replies`)
      const data = res.data || []
      setReplies(data)

      // Auto-expand the latest reply
      if (data.length > 0) {
        const lastId = data[data.length - 1].id
        setExpanded(prev => ({ ...prev, [lastId]: true }))
      }
    } catch (err) {
      console.error('Failed to load reply history:', err)
      setReplies([])
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  if (loading) {
    return (
      <div className="mt-6 flex items-center gap-2 text-slate-400 text-sm">
        <div className="w-4 h-4 border-2 border-slate-300 border-t-violet-400
                        rounded-full animate-spin" />
        Loading reply history...
      </div>
    )
  }

  if (replies.length === 0) return null

  return (
    <div className="mt-6">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <CornerUpLeft className="w-4 h-4 text-violet-500" />
        <span className="text-sm font-semibold text-slate-700">Your Replies</span>
        <span className="text-xs bg-violet-100 text-violet-700
                         px-2 py-0.5 rounded-full font-medium">
          {replies.length}
        </span>
      </div>

      <div className="space-y-2">
        {replies.map((reply, index) => {
          const isExpanded = !!expanded[reply.id]
          const isLatest   = index === replies.length - 1

          return (
            <div
              key={reply.id}
              className={`border rounded-xl overflow-hidden transition-all ${
                isLatest
                  ? 'border-violet-200 bg-violet-50/50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {/* Header row — always visible, click to expand */}
              <button
                onClick={() => toggleExpand(reply.id)}
                className="w-full flex items-center justify-between px-4 py-3
                           hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isLatest ? 'bg-violet-500' : 'bg-slate-300'
                  }`} />
                  <span className="text-xs font-medium text-slate-600">You replied</span>
                  <span className="text-xs text-slate-400">
                    · {new Date(reply.sentAt).toLocaleString()}
                  </span>
                  {isLatest && (
                    <span className="text-xs bg-violet-100 text-violet-600
                                     px-2 py-0.5 rounded-full font-medium">
                      Latest
                    </span>
                  )}
                </div>
                {isExpanded
                  ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                }
              </button>

              {/* Reply body — collapsible */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-100">
                  <p className="text-sm text-slate-700 leading-relaxed
                                whitespace-pre-wrap mt-3">
                    {reply.replyBody}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}