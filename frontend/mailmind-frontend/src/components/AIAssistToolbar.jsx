
import { useState, useRef } from 'react'
import { Sparkles, RotateCcw, ChevronDown } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

// ── Actions — no redundancy with the 5-variation generator ──
const ACTIONS = [
  { key: 'MORE_FORMAL',    label: 'More formal',    emoji: '💼', title: 'Make more formal'    },
  { key: 'MORE_FRIENDLY',  label: 'More friendly',  emoji: '😊', title: 'Make more friendly'  },
  { key: 'SHORTEN',        label: 'Shorter',        emoji: '✂️', title: 'Make shorter'         },
  { key: 'LONGER',         label: 'Longer',         emoji: '📝', title: 'Make longer'          },
  { key: 'GRAMMAR',        label: 'Fix grammar',    emoji: '🔧', title: 'Fix grammar & spelling'},
  { key: 'CONTINUE',       label: 'Continue',       emoji: '▶️', title: 'Continue writing'     },
]

// ── Languages including Marathi + English ───────────────────
const LANGUAGES = [
  'English',
  'Hindi',
  'Marathi',
  'Spanish',
  'French',
  'Arabic',
  'German',
  'Japanese',
  'Portuguese',
  'Chinese',
  'Italian',
  'Russian',
]

export default function AIAssistToolbar({ text, onResult, disabled = false }) {
  const [loading,       setLoading]       = useState(false)
  const [activeAction,  setActiveAction]  = useState(null)
  const [lastText,      setLastText]      = useState(null)
  const [showTranslate, setShowTranslate] = useState(false)
  const dropdownRef = useRef(null)

  const runAssist = async (action, language = null) => {
    if (!text?.trim()) {
      toast.error('Write some text first before using AI assist')
      return
    }
    try {
      setLoading(true)
      setActiveAction(action)
      setShowTranslate(false)

      // Save current for undo
      setLastText(text)

      const payload = { text, action }
      if (language) payload.language = language

      const res    = await api.post('/api/ai/assist', payload)
      const result = res.data?.result
      if (!result) throw new Error('No result from AI')

      onResult(result)
      toast.success(action === 'TRANSLATE'
        ? `✨ Translated to ${language}`
        : '✨ Done!')

    } catch (err) {
      console.error('AI assist error:', err)
      toast.error(err.response?.data?.error || 'AI assist failed')
    } finally {
      setLoading(false)
      setActiveAction(null)
    }
  }

  const handleUndo = () => {
    if (lastText !== null) {
      onResult(lastText)
      setLastText(null)
      toast.success('Undone')
    }
  }

  if (disabled) return null

  return (
    <div className="relative mb-2">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2
                      bg-violet-50/80 border border-violet-100 rounded-xl">

        {/* ✨ AI label */}
        <div className="flex items-center gap-1 mr-1">
          <Sparkles className="w-3.5 h-3.5 text-violet-500" />
          <span className="text-xs font-semibold text-violet-600">AI</span>
        </div>

        <div className="w-px h-4 bg-violet-200" />

        {/* Action buttons */}
        {ACTIONS.map(action => {
          const isActive = loading && activeAction === action.key
          return (
            <button
              key={action.key}
              onClick={() => runAssist(action.key)}
              disabled={loading}
              title={action.title}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium
                         rounded-lg transition-all ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'bg-white hover:bg-violet-100 text-slate-600 hover:text-violet-700 border border-violet-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isActive ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent
                                rounded-full animate-spin" />
              ) : (
                <span className="text-xs">{action.emoji}</span>
              )}
              {action.label}
            </button>
          )
        })}

        {/* Translate dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowTranslate(prev => !prev)}
            disabled={loading}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium
                       rounded-lg transition-all border ${
              showTranslate
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white hover:bg-violet-100 text-slate-600 hover:text-violet-700 border-violet-100'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading && activeAction === 'TRANSLATE' ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent
                              rounded-full animate-spin" />
            ) : (
              <span className="text-xs">🌐</span>
            )}
            Translate
            <ChevronDown className={`w-3 h-3 transition-transform ${
              showTranslate ? 'rotate-180' : ''
            }`} />
          </button>

          {/* Language list */}
          {showTranslate && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border
                            border-slate-200 rounded-xl shadow-lg overflow-hidden
                            min-w-[150px]">
              {LANGUAGES.map(lang => (
                <button
                  key={lang}
                  onClick={() => runAssist('TRANSLATE', lang)}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700
                             hover:bg-violet-50 hover:text-violet-700 transition-colors
                             flex items-center justify-between"
                >
                  {lang}
                  {(lang === 'Hindi' || lang === 'Marathi' || lang === 'English') && (
                    <span className="text-xs text-violet-400 font-medium">✦</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Undo */}
        {lastText !== null && !loading && (
          <>
            <div className="w-px h-4 bg-violet-200 ml-1" />
            <button
              onClick={handleUndo}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium
                         bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-700
                         rounded-lg border border-slate-200 transition-all"
            >
              <RotateCcw className="w-3 h-3" />
              Undo
            </button>
          </>
        )}
      </div>

      {/* Loading hint */}
      {loading && (
        <p className="text-xs text-violet-500 text-center mt-1 animate-pulse">
          ✨ AI is rewriting your text...
        </p>
      )}
    </div>
  )
}