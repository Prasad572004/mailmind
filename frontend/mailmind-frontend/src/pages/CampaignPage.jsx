
import { useState, useEffect } from 'react'
import { Zap, Plus, Trash2, CheckCircle, Copy, Clock, ChevronDown, ChevronUp, Globe } from 'lucide-react'
import { campaignAPI } from '../api/services'
import { LoadingSpinner, EmptyState, ToneBadge, PageHeader } from '../components/ui/index'
import EmailComposerModal from '../components/EmailComposerModal'
import toast from 'react-hot-toast'

const STATUS_STYLES = {
  DRAFT:    'bg-slate-100 text-slate-600',
  ACTIVE:   'bg-blue-100 text-blue-700',
  SENT:     'bg-emerald-100 text-emerald-700',
  ARCHIVED: 'bg-slate-100 text-slate-400',
}

// Languages for generation step
const GEN_LANGUAGES = [
  { value: 'English',    label: 'English'    },
  { value: 'Hindi',      label: 'Hindi'      },
  { value: 'Marathi',    label: 'Marathi'    },
  { value: 'Spanish',    label: 'Spanish'    },
  { value: 'French',     label: 'French'     },
  { value: 'Arabic',     label: 'Arabic'     },
  { value: 'German',     label: 'German'     },
  { value: 'Japanese',   label: 'Japanese'   },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Chinese',    label: 'Chinese'    },
]

function normalizeTone(tone) {
  if (!tone) return 'General'
  const map = {
    PROFESSIONAL: 'Professional', CASUAL: 'Casual',
    FRIENDLY: 'Friendly', URGENT: 'Urgent', PERSUASIVE: 'Persuasive'
  }
  return map[tone.toUpperCase()] || (tone.charAt(0).toUpperCase() + tone.slice(1).toLowerCase())
}

function safeParse(data) {
  if (typeof data === 'string') { try { return JSON.parse(data) } catch { return data } }
  return data
}

function getCampaignId(c) { return c?.id ?? c?.campaignId ?? null }

function extractVariations(raw) {
  const data = safeParse(raw)
  if (!data) return []
  if (Array.isArray(data) && data.length > 0) return data
  if (typeof data === 'object') {
    for (const key of ['variations','emailVariations','emailVariation','content','data','result','results','items']) {
      const val = safeParse(data[key])
      if (Array.isArray(val) && val.length > 0) return val
    }
    if (data.id && (data.tone || data.body || data.subjectLine)) return [data]
  }
  return []
}

function getBody(v)    { return v?.body || v?.emailBody || v?.content || v?.text || '' }
function getSubject(v) { return v?.subjectLine || v?.subject || v?.emailSubject || '' }

// ── Variation card ────────────────────────────────────────────
function VariationCard({ variation, onSelect, selectedId, onUseThis }) {
  const [expanded, setExpanded] = useState(false)
  const varId      = variation?.id ?? variation?.variationId
  const isSelected = selectedId === varId
  const body       = getBody(variation)
  const tone       = normalizeTone(variation.tone)
  const subject    = getSubject(variation)

  const copy = () => { navigator.clipboard.writeText(body); toast.success('Copied!') }

  const handleSelectClick = (e) => {
    e.preventDefault(); e.stopPropagation()
    if (!varId) { toast.error('Variation ID missing'); return }
    onSelect(varId)
  }

  return (
    <div className={`border rounded-2xl p-5 transition-all duration-200 ${
      isSelected
        ? 'border-violet-400 bg-violet-50 shadow-md'
        : 'border-slate-200 bg-white hover:border-violet-300 hover:shadow-sm'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <ToneBadge tone={tone} />
          {isSelected && (
            <span className="text-xs bg-violet-100 text-violet-700 border border-violet-200
                             px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Selected
            </span>
          )}
        </div>
        <button onClick={copy}
          className="text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0">
          <Copy className="w-4 h-4" />
        </button>
      </div>

      {subject && (
        <p className="text-xs text-slate-500 mb-2">
          Subject: <span className="text-slate-800 font-medium">{subject}</span>
        </p>
      )}

      {body
        ? <p className={`text-sm text-slate-600 leading-relaxed whitespace-pre-wrap ${
            !expanded ? 'line-clamp-3' : ''}`}>{body}</p>
        : <p className="text-sm text-slate-400 italic">No content</p>
      }

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <button onClick={() => setExpanded(!expanded)}
          className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors">
          {expanded
            ? <><ChevronUp className="w-3.5 h-3.5" />Less</>
            : <><ChevronDown className="w-3.5 h-3.5" />More</>}
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectClick}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
              isSelected
                ? 'bg-violet-100 text-violet-700 border border-violet-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}>
            {isSelected ? 'Selected ✓' : 'Select'}
          </button>
          <button
            onClick={() => onUseThis({ subject, body, tone })}
            className="text-xs font-medium bg-violet-600 hover:bg-violet-700 text-white
                       px-3 py-1.5 rounded-lg transition-all shadow-sm
                       hover:shadow-violet-200 hover:shadow-md active:scale-95">
            Use this →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Campaign card ─────────────────────────────────────────────
function CampaignCard({ campaign, onDelete, onStatusChange }) {
  const [variations, setVariations] = useState([])
  const [loadingVar, setLoadingVar] = useState(false)
  const [showVar,    setShowVar]    = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [modal,      setModal]      = useState({ open: false, subject: '', body: '', tone: '' })

  const campaignId = getCampaignId(campaign)

  const toggleVariations = async () => {
    if (showVar) { setShowVar(false); return }
    if (variations.length > 0) { setShowVar(true); return }
    if (!campaignId) { toast.error('Campaign ID missing'); return }

    setLoadingVar(true)
    try {
      const res  = await campaignAPI.getVariations(campaignId)
      const list = extractVariations(res.data)
      setVariations(list)
      if (list.length === 0) toast.error('No variations found')
      setShowVar(true)
    } catch (err) {
      toast.error('Could not load variations: ' + (err.response?.status || err.message))
    } finally { setLoadingVar(false) }
  }

  const handleSelect = async (varId) => {
    if (!varId) { toast.error('Invalid variation ID'); return }
    try {
      await campaignAPI.selectVariation(varId)
      setSelectedId(varId)
      toast.success('✅ Variation selected!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not select variation')
    }
  }

  const handleStatus = async (status) => {
    try {
      await campaignAPI.updateStatus(campaignId, status)
      onStatusChange(campaignId, status)
      toast.success(`Status → ${status}`)
    } catch { toast.error('Could not update status') }
  }

  return (
    <>
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center
                            justify-center flex-shrink-0 mt-0.5">
              <Zap className="w-5 h-5 text-violet-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">
                {campaign.title || `Campaign #${campaignId}`}
              </h3>
              <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{campaign.roughIdea}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  STATUS_STYLES[campaign.status] || STATUS_STYLES.DRAFT}`}>
                  {campaign.status || 'DRAFT'}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  {campaign.createdAt
                    ? new Date(campaign.createdAt).toLocaleDateString()
                    : '—'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              value={campaign.status || 'DRAFT'}
              onChange={e => { handleStatus(e.target.value); e.target.blur() }}
              className="text-xs bg-white border border-slate-200 text-slate-700
                         rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-400"
            >
              {['DRAFT','ACTIVE','SENT','ARCHIVED'].map(s => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => onDelete(campaignId)}
              className="text-slate-400 hover:text-red-500 transition-colors p-1">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button onClick={toggleVariations}
          className="mt-4 w-full flex items-center justify-center gap-2 text-xs
                     text-violet-600 hover:text-violet-700 border border-violet-200
                     hover:border-violet-400 hover:bg-violet-50 rounded-xl py-2.5
                     transition-all font-medium">
          {loadingVar
            ? <div className="w-3.5 h-3.5 border-2 border-violet-600 border-t-transparent
                              rounded-full animate-spin" />
            : <>{showVar
                ? <><ChevronUp className="w-3.5 h-3.5" />Hide AI variations</>
                : <><ChevronDown className="w-3.5 h-3.5" />View AI variations</>}</>
          }
        </button>

        {showVar && (
          <div className="mt-4">
            {variations.length > 0
              ? <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {variations.map((v, i) => (
                    <VariationCard
                      key={v?.id ?? i}
                      variation={v}
                      onSelect={handleSelect}
                      selectedId={selectedId}
                      onUseThis={({ subject, body, tone }) =>
                        setModal({ open: true, subject, body, tone })}
                    />
                  ))}
                </div>
              : <p className="text-center text-sm text-slate-400 py-6">No variations found.</p>
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
        mode="campaign"
      />
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function CampaignPage() {
  const [campaigns, setCampaigns] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [creating,  setCreating]  = useState(false)
  const [showForm,  setShowForm]  = useState(false)
  const [title,     setTitle]     = useState('')
  const [roughIdea, setRoughIdea] = useState('')
  const [language,  setLanguage]  = useState('English') // ← new

  useEffect(() => { loadCampaigns() }, [])

  const loadCampaigns = async () => {
    try {
      const res  = await campaignAPI.getAll()
      const raw  = res.data
      let list   = Array.isArray(raw) ? raw
        : (raw?.campaigns ?? raw?.content ?? raw?.data ?? raw?.result ?? [])
      if (!Array.isArray(list)) list = []
      setCampaigns(list)
    } catch (err) {
      console.error(err)
      toast.error('Could not load campaigns')
    } finally { setLoading(false) }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!title.trim() || !roughIdea.trim()) {
      toast.error('Please fill in both fields'); return
    }
    setCreating(true)
    try {
      // Append language instruction to rough idea if not English
      const ideaWithLanguage = language !== 'English'
        ? `${roughIdea}\n\nIMPORTANT: Generate all email variations in ${language} language.`
        : roughIdea

      const res = await campaignAPI.create({ title, roughIdea: ideaWithLanguage })
      setCampaigns(prev => [res.data, ...prev])
      setTitle(''); setRoughIdea(''); setLanguage('English'); setShowForm(false)
      toast.success('Campaign created! Click "View AI variations" to see emails 🎉')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create campaign')
    } finally { setCreating(false) }
  }

  const handleDelete = async (id) => {
    if (!id) return
    toast((t) => (
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-700">Delete this campaign?</span>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id)
              try {
                await campaignAPI.delete(id)
                setCampaigns(prev => prev.filter(c => getCampaignId(c) !== id))
                toast.success('Deleted')
              } catch { toast.error('Could not delete') }
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

  const handleStatusChange = (id, status) => {
    setCampaigns(prev => prev.map(c =>
      getCampaignId(c) === id ? { ...c, status } : c
    ))
  }

  if (loading) return <LoadingSpinner text="Loading campaigns..." />

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Campaigns"
        subtitle="Create AI-powered email campaigns from a rough idea"
        action={
          <button onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
            <Plus className="w-4 h-4" />New campaign
          </button>
        }
      />

      {showForm && (
        <div className="card p-6 mb-6 border-violet-200 bg-violet-50/30">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-600" />Create new campaign
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">

            {/* Title */}
            <div>
              <label className="label">Campaign title</label>
              <input
                type="text"
                placeholder="e.g. Summer Sale 2025"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Rough idea */}
            <div>
              <label className="label">Describe your campaign idea</label>
              <textarea
                rows={4}
                placeholder="e.g. Promote 30% discount on all shoes this summer..."
                value={roughIdea}
                onChange={e => setRoughIdea(e.target.value)}
                className="input-field resize-none"
              />
            </div>

            {/* ── Language selector ── */}
            <div>
              <label className="label flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                Generate emails in
              </label>
              <div className="flex flex-wrap gap-2">
                {GEN_LANGUAGES.map(lang => (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => setLanguage(lang.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      language === lang.value
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:bg-violet-50'
                    }`}
                  >
                    {lang.label}
                    {(lang.value === 'Hindi' || lang.value === 'Marathi') && (
                      <span className="ml-1 opacity-70">✦</span>
                    )}
                  </button>
                ))}
              </div>
              {language !== 'English' && (
                <p className="text-xs text-violet-600 mt-1.5">
                  ✓ All 5 email variations will be generated in {language}
                </p>
              )}
            </div>

            <p className="text-xs text-slate-400">
              Groq AI will generate 5 email variations from this idea
            </p>

            <div className="flex gap-3">
              <button type="submit" disabled={creating}
                className="btn-primary flex items-center gap-2">
                {creating
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent
                                       rounded-full animate-spin" />Generating...</>
                  : <><Zap className="w-4 h-4" />Generate emails</>}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {campaigns.length === 0
        ? <EmptyState
            icon={Zap}
            title="No campaigns yet"
            description="Create your first campaign and let Groq AI generate 5 email variations"
            action={
              <button onClick={() => setShowForm(true)}
                className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />Create campaign
              </button>
            }
          />
        : <div className="space-y-4">
            {campaigns.map((c, i) => (
              <CampaignCard
                key={getCampaignId(c) ?? i}
                campaign={c}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
      }
    </div>
  )
}