
import { useState, useRef, useEffect } from 'react'
import {
  X, Mail, Plus, Copy, Download,
  ExternalLink, Send, ChevronDown, ChevronUp,
  Check, Zap, Paperclip
} from 'lucide-react'
import { ToneBadge } from './ui/index'
import AIAssistToolbar from './AIAssistToolbar'
import toast from 'react-hot-toast'
import api from '../api/axios'

const MAX_ATTACHMENT_MB = 10

function buildGmailUrl({ to, subject, body }) {
  const base  = 'https://mail.google.com/mail/?view=cm&fs=1'
  const toStr = Array.isArray(to) ? to.join(',') : (to || '')
  const params = new URLSearchParams()
  if (toStr)   params.set('to',   toStr)
  if (subject) params.set('su',   subject)
  if (body)    params.set('body', body)
  return `${base}&${params.toString()}`
}

function buildMailtoUrl({ to, subject, body }) {
  const toStr = Array.isArray(to) ? to.join(',') : (to || '')
  return `mailto:${toStr}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body || '')}`
}

function RecipientInput({ recipients, setRecipients }) {
  const [input, setInput] = useState('')
  const inputRef = useRef(null)

  const isValidEmail = (email) => {
    const trimmed = email.trim()
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && trimmed.length <= 254
  }

  const addRecipient = (val) => {
    const trimmed = val.trim().replace(/,/g, '')
    if (!trimmed) return
    if (!isValidEmail(trimmed)) { toast.error(`"${trimmed}" is not a valid email`); return }
    if (recipients.includes(trimmed)) { toast.error('Email already added'); return }
    setRecipients(prev => [...prev, trimmed])
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault(); addRecipient(input)
    }
    if (e.key === 'Backspace' && !input && recipients.length > 0) {
      setRecipients(prev => prev.slice(0, -1))
    }
  }

  const remove = (email) => setRecipients(prev => prev.filter(r => r !== email))

  return (
    <div
      className="min-h-[46px] w-full bg-white border border-slate-200 rounded-xl
                 px-3 py-2 flex flex-wrap gap-2 items-center cursor-text
                 focus-within:border-violet-400 focus-within:ring-2
                 focus-within:ring-violet-100 transition-all"
      onClick={() => inputRef.current?.focus()}
    >
      {recipients.map(email => (
        <span key={email}
          className="inline-flex items-center gap-1.5 bg-violet-100 text-violet-700
                     text-xs font-medium px-2.5 py-1 rounded-full">
          {email}
          <button onClick={(e) => { e.stopPropagation(); remove(email) }}
            className="hover:text-violet-900 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input && addRecipient(input)}
        placeholder={recipients.length === 0
          ? 'Add recipients — type email and press Enter'
          : 'Add more...'}
        className="flex-1 min-w-[200px] outline-none text-sm text-slate-900
                   placeholder-slate-400 bg-transparent"
      />
      {input && (
        <button onClick={() => addRecipient(input)}
          className="text-xs text-violet-600 hover:text-violet-800 font-medium
                     flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" />Add
        </button>
      )}
    </div>
  )
}

export default function EmailComposerModal({
  isOpen, onClose,
  initialSubject = '', initialBody = '',
  tone = '', mode = 'campaign'
}) {
  const [recipients,  setRecipients]  = useState([])
  const [subject,     setSubject]     = useState(initialSubject)
  const [body,        setBody]        = useState(initialBody)
  const [attachments, setAttachments] = useState([])
  const [copied,      setCopied]      = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [sending,     setSending]     = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setRecipients([])
      setSubject(initialSubject || '')
      setBody(initialBody || '')
      setAttachments([])
      setCopied(false)
      setShowPreview(false)
      setSending(false)
    }
  }, [isOpen, initialSubject, initialBody])

  if (!isOpen) return null

  const handleCloseModal = () => {
    setRecipients([]); setSubject(''); setBody('')
    setAttachments([]); setCopied(false)
    setShowPreview(false); setSending(false)
    onClose()
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

  const handleSendDirectly = async () => {
    if (recipients.length === 0) { toast.error('❌ Add at least one recipient'); return }
    if (!subject.trim())         { toast.error('❌ Subject is required'); return }
    if (!body.trim())            { toast.error('❌ Email body is required'); return }

    setSending(true)
    try {
      const payload = {
        to: recipients, subject, body,
        attachments: attachments.length > 0
          ? attachments.map(({ fileName, base64Data, mimeType }) =>
              ({ fileName, base64Data, mimeType }))
          : null,
      }
      const response = await api.post('/api/email/send', payload)
      const attMsg = attachments.length > 0 ? ` with ${attachments.length} attachment(s)` : ''
      toast.success(`✅ Email sent to ${response.data.recipients} recipient(s)${attMsg}!`, { duration: 3000 })
      setTimeout(() => handleCloseModal(), 1000)
    } catch (err) {
      toast.error(`❌ ${err.response?.data?.error || err.message || 'Failed to send email'}`)
    } finally {
      setSending(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `To: ${recipients.join(', ') || '(no recipients)'}\nSubject: ${subject}\n\n${body}`)
    setCopied(true)
    toast.success('Email copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob(
      [`To: ${recipients.join(', ') || ''}\nSubject: ${subject}\n\n${body}`],
      { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a   = document.createElement('a')
    a.href = url
    a.download = `${subject?.slice(0, 30).replace(/[^a-z0-9]/gi, '_') || 'email'}.txt`
    a.click(); URL.revokeObjectURL(url)
    toast.success('Downloaded!')
  }

  const charCount   = body.length
  const wordCount   = body.trim() ? body.trim().split(/\s+/).length : 0
  const isFormValid = recipients.length > 0 && subject.trim() && body.trim()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,15,20,0.6)' }}
      onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh]
                      flex flex-col overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b
                        border-slate-100 bg-gradient-to-r from-violet-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 text-base">Compose email</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {tone && <ToneBadge tone={tone} />}
                <span className="text-xs text-slate-400">
                  {mode === 'reply' ? 'Smart reply' : 'Campaign email'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={handleCloseModal}
            className="text-slate-400 hover:text-slate-700 p-1
                       hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Recipients */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              To <span className="text-red-500">*</span>
              <span className="text-xs font-normal text-slate-400 ml-2">
                Press Enter to add each email
              </span>
            </label>
            <RecipientInput recipients={recipients} setRecipients={setRecipients} />
            {recipients.length > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                ✅ {recipients.length} recipient{recipients.length > 1 ? 's' : ''} added
              </p>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              className="w-full bg-white border border-slate-200 text-slate-900
                         rounded-xl px-4 py-3 text-sm focus:outline-none
                         focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
            />
          </div>

          {/* Body with AI Assist Toolbar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700">
                Email body <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  {wordCount} words · {charCount} chars
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(body).then(() => toast.success('Copied!'))}
                  className="text-xs text-violet-600 hover:text-violet-800
                             flex items-center gap-1 transition-colors">
                  <Copy className="w-3.5 h-3.5" />Copy body
                </button>
              </div>
            </div>

            {/* ── AI Assist Toolbar ── */}
            <AIAssistToolbar
              text={body}
              onResult={setBody}
              disabled={!body.trim()}
            />

            <textarea
              rows={9}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your email message here..."
              className="w-full bg-white border border-slate-200 text-slate-900
                         rounded-xl px-4 py-3 text-sm focus:outline-none
                         focus:border-violet-400 focus:ring-2 focus:ring-violet-100
                         transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-slate-400" />
                Attachments
                <span className="text-xs font-normal text-slate-400">
                  (max {MAX_ATTACHMENT_MB}MB each)
                </span>
              </label>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs font-medium text-violet-600
                           hover:text-violet-800 bg-violet-50 hover:bg-violet-100
                           px-3 py-1.5 rounded-lg transition-all">
                <Plus className="w-3.5 h-3.5" />Add file
              </button>
              <input ref={fileInputRef} type="file" multiple
                className="hidden" onChange={handleFileSelect} />
            </div>

            {attachments.length > 0 ? (
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border
                              border-slate-200 rounded-xl">
                {attachments.map(att => (
                  <div key={att.fileName}
                    className="flex items-center gap-1.5 bg-white border border-slate-200
                               text-slate-700 text-xs px-3 py-1.5 rounded-full shadow-sm">
                    <Paperclip className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span className="max-w-[160px] truncate font-medium">{att.fileName}</span>
                    <span className="text-slate-400">({att.sizeKb}KB)</span>
                    <button onClick={() => removeAttachment(att.fileName)}
                      className="ml-1 text-slate-400 hover:text-red-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-4 border-2
                           border-dashed border-slate-200 rounded-xl cursor-pointer
                           hover:border-violet-300 hover:bg-violet-50/50 transition-all">
                <Paperclip className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">
                  Click to attach files or drag and drop
                </span>
              </div>
            )}
          </div>

          {/* Preview toggle */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs text-slate-500 hover:text-slate-800
                       flex items-center gap-1 transition-colors">
            {showPreview
              ? <><ChevronUp className="w-3.5 h-3.5" />Hide preview</>
              : <><ChevronDown className="w-3.5 h-3.5" />Show email preview</>}
          </button>

          {showPreview && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm">
              <div className="space-y-1 mb-4 pb-4 border-b border-slate-200">
                <p className="text-xs text-slate-500">
                  <span className="font-medium text-slate-700">To:</span>{' '}
                  {recipients.length > 0
                    ? recipients.join(', ')
                    : <span className="italic text-slate-400">no recipients yet</span>}
                </p>
                <p className="text-xs text-slate-500">
                  <span className="font-medium text-slate-700">Subject:</span>{' '}
                  {subject || <span className="italic text-slate-400">no subject</span>}
                </p>
                {attachments.length > 0 && (
                  <p className="text-xs text-slate-500">
                    <span className="font-medium text-slate-700">Attachments:</span>{' '}
                    {attachments.map(a => a.fileName).join(', ')}
                  </p>
                )}
              </div>
              <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">{body}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <button
              onClick={handleSendDirectly}
              disabled={sending || !isFormValid}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700
                         disabled:bg-slate-300 disabled:cursor-not-allowed text-white
                         text-sm font-medium px-6 py-2.5 rounded-xl transition-all
                         shadow-sm hover:shadow-md hover:shadow-emerald-200 active:scale-95">
              {sending ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent
                                  rounded-full animate-spin" />Sending...</>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Send Email
                  {attachments.length > 0 && (
                    <span className="bg-emerald-500 text-white text-xs
                                     px-1.5 py-0.5 rounded-full">
                      +{attachments.length}
                    </span>
                  )}
                </>
              )}
            </button>

            <button onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-700
                         text-sm font-medium px-4 py-2.5 rounded-xl border border-slate-200
                         transition-all active:scale-95">
              <Paperclip className="w-4 h-4" />
              Attach
              {attachments.length > 0 && (
                <span className="bg-violet-100 text-violet-700 text-xs
                                 px-1.5 py-0.5 rounded-full font-medium">
                  {attachments.length}
                </span>
              )}
            </button>

            <button onClick={() => window.open(
                buildGmailUrl({ to: recipients, subject, body }), '_blank')}
              className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-700
                         text-sm font-medium px-4 py-2.5 rounded-xl border border-slate-200
                         transition-all active:scale-95">
              <ExternalLink className="w-4 h-4" />Gmail
            </button>

            <button onClick={handleCopy}
              className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-700
                         text-sm font-medium px-4 py-2.5 rounded-xl border border-slate-200
                         transition-all active:scale-95">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>

            <button onClick={handleDownload}
              className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-700
                         text-sm font-medium px-4 py-2.5 rounded-xl border border-slate-200
                         transition-all active:scale-95">
              <Download className="w-4 h-4" />Save
            </button>
          </div>

          {!isFormValid && (
            <p className="text-xs text-amber-600 mb-2">
              ⚠️ Fill in recipients, subject, and message to send
            </p>
          )}
          <p className="text-xs text-slate-400">
            💡 <span className="font-medium text-emerald-700">Tip:</span>{' '}
            Use the ✨ AI toolbar above the body to improve your email instantly
          </p>
        </div>
      </div>
    </div>
  )
}