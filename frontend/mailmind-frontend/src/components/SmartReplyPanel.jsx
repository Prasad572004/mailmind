
import { useState, useRef } from 'react'
import {
  Zap, Send, RotateCcw, Paperclip, X,
  Bold, Italic, Underline, List, Link
} from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import AIAssistToolbar from './AIAssistToolbar'

const TONES = [
  { key: 'PROFESSIONAL', label: 'Professional', emoji: '💼', desc: 'Formal and business-like' },
  { key: 'CASUAL',       label: 'Casual',       emoji: '😊', desc: 'Relaxed and friendly'    },
  { key: 'FRIENDLY',     label: 'Friendly',     emoji: '🤝', desc: 'Warm and approachable'   },
  { key: 'BRIEF',        label: 'Brief',        emoji: '⚡', desc: 'Short and to the point'  },
]

const MAX_ATTACHMENT_MB = 10

export default function SmartReplyPanel({ email, onReplySent }) {
  const [generating, setGenerating]     = useState(false)
  const [sending,    setSending]        = useState(false)
  const [variations, setVariations]     = useState([])
  const [selectedTone, setSelectedTone] = useState(null)
  const [replyText,  setReplyText]      = useState('')
  const [attachments, setAttachments]   = useState([])
  const [showCompose, setShowCompose]   = useState(false)
  const fileInputRef = useRef(null)

  const toAddress    = email?.from || ''
  const replySubject = email?.subject?.startsWith('Re:')
    ? email.subject
    : `Re: ${email?.subject || ''}`

  const handleGenerate = async () => {
    try {
      setGenerating(true)
      setVariations([])
      setSelectedTone(null)
      setReplyText('')
      setShowCompose(false)

      const res  = await api.post(`/api/inbox/${email.id}/generate-reply`)
      const vars = res.data.variations || []
      setVariations(vars)

      const professional = vars.find(v => v.tone === 'PROFESSIONAL') || vars[0]
      if (professional) {
        setSelectedTone(professional.tone)
        setReplyText(professional.replyBody || '')
        setShowCompose(true)
      }

      toast.success('Reply suggestions generated!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate reply')
    } finally {
      setGenerating(false)
    }
  }

  const handleSelectTone = (variation) => {
    setSelectedTone(variation.tone)
    setReplyText(variation.replyBody || '')
    setShowCompose(true)
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    const newAttachments = []
    for (const file of files) {
      if (file.size / (1024 * 1024) > MAX_ATTACHMENT_MB) {
        toast.error(`${file.name} exceeds ${MAX_ATTACHMENT_MB}MB limit`); continue
      }
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload  = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      newAttachments.push({
        fileName: file.name, base64Data,
        mimeType: file.type || 'application/octet-stream',
        sizeKb:   Math.round(file.size / 1024),
      })
    }
    setAttachments(prev => [...prev, ...newAttachments])
    e.target.value = ''
  }

  const removeAttachment = (fileName) =>
    setAttachments(prev => prev.filter(a => a.fileName !== fileName))

  const handleSend = async () => {
    if (!replyText.trim()) { toast.error('Reply body cannot be empty'); return }
    try {
      setSending(true)
      await api.post(`/api/inbox/${email.id}/send-reply`, {
        replyBody: replyText,
        attachments: attachments.length > 0
          ? attachments.map(({ fileName, base64Data, mimeType }) =>
              ({ fileName, base64Data, mimeType }))
          : null,
      })
      toast.success(attachments.length > 0
        ? `Reply sent with ${attachments.length} attachment(s)!`
        : 'Reply sent successfully!')

      setReplyText('')
      setAttachments([])
      setVariations([])
      setSelectedTone(null)
      setShowCompose(false)

      if (onReplySent) onReplySent()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const handleDiscard = () => {
    setReplyText('')
    setAttachments([])
    setVariations([])
    setSelectedTone(null)
    setShowCompose(false)
  }

  const insertFormat = (prefix, suffix = prefix) => {
    const textarea = document.getElementById('reply-textarea')
    if (!textarea) return
    const start    = textarea.selectionStart
    const end      = textarea.selectionEnd
    const selected = replyText.substring(start, end)
    setReplyText(
      replyText.substring(0, start) + prefix + selected + suffix + replyText.substring(end)
    )
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, end + prefix.length)
    }, 0)
  }

  return (
    <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden shadow-sm">

      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-3
                      bg-gradient-to-r from-violet-50 to-blue-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-violet-600" />
          <span className="text-sm font-semibold text-slate-800">Smart Reply</span>
          {variations.length > 0 && !showCompose && (
            <span className="text-xs text-slate-500">— pick a tone below</span>
          )}
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                     bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300
                     text-white rounded-lg transition-all">
          {generating ? (
            <><div className="w-3 h-3 border-2 border-white border-t-transparent
                              rounded-full animate-spin" />Generating...</>
          ) : variations.length > 0 ? (
            <><RotateCcw className="w-3 h-3" />Regenerate</>
          ) : (
            <><Zap className="w-3 h-3" />Generate Reply</>
          )}
        </button>
      </div>

      <div className="bg-white">

        {/* Tone cards */}
        {variations.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 border-b border-slate-100">
            {TONES.map(tone => {
              const variation  = variations.find(v => v.tone === tone.key)
              if (!variation) return null
              const isSelected = selectedTone === tone.key
              return (
                <button key={tone.key} onClick={() => handleSelectTone(variation)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-violet-400 bg-violet-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/50'
                  }`}>
                  <div className="text-base mb-1">{tone.emoji}</div>
                  <div className={`text-xs font-semibold ${
                    isSelected ? 'text-violet-700' : 'text-slate-700'}`}>
                    {tone.label}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 leading-tight">{tone.desc}</div>
                </button>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {variations.length === 0 && !generating && (
          <div className="text-center py-8">
            <Zap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">
              Click <strong>Generate Reply</strong> to get AI-powered reply suggestions
            </p>
            <p className="text-xs text-slate-400 mt-1">
              4 tone variations will be generated based on the email content
            </p>
          </div>
        )}

        {/* Generating skeleton */}
        {generating && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600
                            rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Generating smart replies...</p>
          </div>
        )}

        {/* Gmail-like compose area */}
        {showCompose && (
          <div>
            {/* To / Subject fields */}
            <div className="border-b border-slate-100 divide-y divide-slate-100">
              <div className="flex items-center px-4 py-2 gap-2">
                <span className="text-xs font-medium text-slate-400 w-14">To</span>
                <span className="text-sm text-slate-700 truncate">{toAddress}</span>
              </div>
              <div className="flex items-center px-4 py-2 gap-2">
                <span className="text-xs font-medium text-slate-400 w-14">Subject</span>
                <span className="text-sm text-slate-700 truncate">{replySubject}</span>
              </div>
            </div>

            {/* Formatting toolbar */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-100">
              <button onClick={() => insertFormat('**')} title="Bold"
                className="p-1.5 rounded hover:bg-slate-100 text-slate-500
                           hover:text-slate-800 transition-colors">
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => insertFormat('_')} title="Italic"
                className="p-1.5 rounded hover:bg-slate-100 text-slate-500
                           hover:text-slate-800 transition-colors">
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => insertFormat('<u>', '</u>')} title="Underline"
                className="p-1.5 rounded hover:bg-slate-100 text-slate-500
                           hover:text-slate-800 transition-colors">
                <Underline className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <button onClick={() => {
    const url = window.prompt('Enter URL:')
    if (url && url.startsWith('http')) insertFormat(`[`, `](${url})`)
    else if (url) insertFormat(`[`, `](https://${url})`)
  }} title="Insert link"
                className="p-1.5 rounded hover:bg-slate-100 text-slate-500
                           hover:text-slate-800 transition-colors">
                <Link className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setReplyText(prev => '• ' + prev)} title="Bullet list"
                className="p-1.5 rounded hover:bg-slate-100 text-slate-500
                           hover:text-slate-800 transition-colors">
                <List className="w-3.5 h-3.5" />
              </button>
              <div className="ml-auto text-xs text-slate-400">
                {replyText.length} chars
              </div>
            </div>

            {/* ── AI Assist Toolbar ── */}
            <div className="px-4 pt-3">
              <AIAssistToolbar
                text={replyText}
                onResult={setReplyText}
                disabled={!replyText.trim()}
              />
            </div>

            {/* Reply textarea */}
            <textarea
              id="reply-textarea"
              rows={7}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              className="w-full px-4 py-3 text-sm text-slate-800 bg-white
                         focus:outline-none resize-none leading-relaxed"
              placeholder="Write your reply..."
            />

            {/* Attachment chips */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4 pb-3">
                {attachments.map(att => (
                  <div key={att.fileName}
                    className="flex items-center gap-1.5 bg-slate-100 text-slate-700
                               text-xs px-3 py-1.5 rounded-full">
                    <Paperclip className="w-3 h-3 text-slate-400" />
                    <span className="max-w-[140px] truncate">{att.fileName}</span>
                    <span className="text-slate-400">({att.sizeKb}KB)</span>
                    <button onClick={() => removeAttachment(att.fileName)}
                      className="ml-1 text-slate-400 hover:text-red-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Footer action bar */}
            <div className="flex items-center gap-2 px-4 py-3
                            border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={handleSend}
                disabled={sending || !replyText.trim()}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium
                           bg-violet-600 hover:bg-violet-700
                           disabled:bg-slate-300 disabled:cursor-not-allowed
                           text-white rounded-xl transition-all shadow-sm
                           hover:shadow-md hover:shadow-violet-200 active:scale-95">
                {sending ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent
                                    rounded-full animate-spin" />Sending...</>
                ) : (
                  <><Send className="w-4 h-4" />Send</>
                )}
              </button>

              <button onClick={() => fileInputRef.current?.click()}
                title="Attach file"
                className="p-2 rounded-xl hover:bg-slate-200 text-slate-500
                           hover:text-slate-700 transition-colors">
                <Paperclip className="w-4 h-4" />
              </button>
              <input ref={fileInputRef} type="file" multiple
                className="hidden" onChange={handleFileSelect} />

              <button onClick={handleDiscard}
                className="ml-auto p-2 rounded-xl hover:bg-red-50 text-slate-400
                           hover:text-red-500 transition-colors" title="Discard reply">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}