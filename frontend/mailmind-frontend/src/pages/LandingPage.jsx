
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Mail, Zap, MessageSquareReply, BarChart3, ArrowRight,
  Sparkles, Shield, ChevronRight,
  CheckCircle, Globe, TrendingUp, ChevronDown, Brain,
  Paperclip, CornerUpLeft, MailOpen
} from 'lucide-react'

// ── Scroll animation ──────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])
  return [ref, inView]
}

function Animate({ children, delay = 0, className = '' }) {
  const [ref, inView] = useInView()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className} ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// ── Data ──────────────────────────────────────────────────────
const features = [
  {
    icon: Zap,
    title: 'Campaign Creator',
    description: 'Describe your campaign idea in plain text. MailMind generates 5 complete email variations across Professional, Casual, Friendly, Urgent, and Persuasive tones — ready to review and send.',
    color: 'violet',
    tag: 'Most used',
  },
  {
    icon: MessageSquareReply,
    title: 'Smart Reply',
    description: 'Open any email in your inbox and receive 4 context-aware reply drafts in seconds. Select a tone, edit if needed, and send — without leaving the platform.',
    color: 'blue',
    tag: null,
  },
  {
    icon: Brain,
    title: 'AI Writing Assistant',
    description: 'Refine any draft with precision. Make it more formal, more concise, expand the content, fix grammar, or translate into 12 languages — all with a single click.',
    color: 'violet',
    tag: 'New',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track your inbox health score, reply rate, email volume trends, and top senders. Understand how you communicate and where to improve.',
    color: 'blue',
    tag: null,
  },
  {
    icon: Paperclip,
    title: 'File Attachments',
    description: 'Attach files to any email or reply directly from MailMind. All file types supported up to 10MB, sent as multipart MIME attachments via the Gmail API.',
    color: 'violet',
    tag: null,
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'OAuth2-authenticated, JWT-secured, and encrypted in transit. Your email data is never shared, sold, or used to train any AI model.',
    color: 'blue',
    tag: null,
  },
]

const steps = [
  {
    number: '01',
    title: 'Connect your Gmail account',
    description: 'Authorize access via Google OAuth2 in one click. MailMind syncs your inbox securely and you are ready to work within 30 seconds.',
    icon: MailOpen,
  },
  {
    number: '02',
    title: 'AI generates your options',
    description: 'Paste an incoming email or describe a campaign idea. Groq AI processes your input and returns multiple polished variations in different tones — instantly.',
    icon: Sparkles,
  },
  {
    number: '03',
    title: 'Refine, select and send',
    description: 'Use the AI writing assistant to sharpen any draft. Select the best version, make final edits, and send directly from MailMind.',
    icon: CornerUpLeft,
  },
]

const stats = [
  { value: '12+',  label: 'Languages supported', icon: Globe        },
  { value: '5x',   label: 'Faster email writing', icon: TrendingUp   },
  { value: '7',    label: 'AI writing actions',   icon: Brain        },
  { value: '100%', label: 'Free to get started',  icon: CheckCircle  },
]

const faqs = [
  {
    q: 'Is MailMind free to use?',
    a: 'Yes. MailMind is completely free. It is built on the Groq API free tier which supports up to 14,400 requests per day — more than sufficient for personal and professional use.',
  },
  {
    q: 'Is my email data private?',
    a: 'Your emails are synced from Gmail and stored securely. They are never shared, sold, or used to train any AI model. You retain full ownership of your data.',
  },
  {
    q: 'How does the Gmail integration work?',
    a: "MailMind uses Google's official OAuth2 authorization flow. We request only the minimum scopes required — read, modify, and send. You can revoke access at any time from your dashboard.",
  },
  {
    q: 'Which AI model does MailMind use?',
    a: 'MailMind is powered by Groq AI, one of the fastest AI inference platforms available. Responses are typically generated in under a second.',
  },
  {
    q: 'Which languages are supported for translation?',
    a: 'The AI writing assistant supports 12 languages: English, Hindi, Marathi, Spanish, French, Arabic, German, Japanese, Portuguese, Chinese, Italian, and Russian.',
  },
  {
    q: 'Can I attach files to emails?',
    a: 'Yes. All file types up to 10MB per attachment are supported. Files are encoded on the client and sent as multipart MIME attachments through the Gmail API.',
  },
]

// ── FAQ item ──────────────────────────────────────────────────
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border rounded-xl transition-all duration-200 overflow-hidden ${
      open ? 'border-violet-200 bg-violet-50/30' : 'border-slate-200 bg-white'
    }`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
      >
        <span className="font-medium text-slate-900 text-sm">{q}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${
          open ? 'rotate-180 text-violet-600' : 'text-slate-400'
        }`} />
      </button>
      {open && (
        <div className="px-6 pb-5 border-t border-slate-100">
          <p className="text-sm text-slate-500 leading-relaxed pt-4">{a}</p>
        </div>
      )}
    </div>
  )
}

// ── Navbar ────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm'
        : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <span style={{ fontWeight: 700, letterSpacing: '-0.01em' }}
            className="text-slate-900 text-base">
            Mail<span className="text-violet-600">Mind</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features"     className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">How it works</a>
          <a href="#faq"          className="text-sm text-slate-500 hover:text-slate-900 transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login"
            className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Log in
          </Link>
          <Link to="/register"
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700
                       text-white text-sm font-medium px-4 py-2 rounded-lg
                       transition-all shadow-sm active:scale-95">
            Sign up free
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function LandingPage() {

  // ── Inject Plus Jakarta Sans font — no CSS file needed ──────
  useEffect(() => {
    // Add Google Fonts link tag to <head>
    const link = document.createElement('link')
    link.rel  = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
    document.head.appendChild(link)

    // Apply font to entire page while on landing
    const prev = document.body.style.fontFamily
    document.body.style.fontFamily = "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif"

    // Cleanup — restore original font when navigating away
    return () => {
      document.body.style.fontFamily = prev
    }
  }, [])

  return (
    <div className="bg-white text-slate-900 overflow-x-hidden">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50
                          to-white min-h-screen flex items-center pt-16">

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-32 left-1/3 w-80 h-80 bg-violet-100
                          rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-32 right-1/3 w-72 h-72 bg-blue-100
                          rounded-full blur-3xl opacity-40" />
        </div>

        <div className="max-w-5xl mx-auto px-6 relative z-10 py-24 text-center w-full">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-100
                          text-violet-600 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            Powered by Groq AI
          </div>

          {/* ── HERO HEADLINE ── */}
          <h1 style={{
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.08,
            fontSize: "clamp(40px, 6vw, 72px)",
            color: "#0f172a",
          }} className="mb-6">
            The Perfect Email
            <br /><span style={{ color: '#7c3aed' }}>You Imagined. Now Real.</span>
          </h1>

          {/* Subheadline */}
          <p style={{
            fontWeight: 400,
            fontSize: "clamp(16px, 1.5vw, 20px)",
            letterSpacing: "-0.01em",
            lineHeight: 1.7,
          }} className="text-slate-500 max-w-xl mx-auto mb-10">
            Write perfect emails in any tone, get AI-drafted replies,
            and manage your entire inbox — all from one place.
          </p>
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link to="/register"
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700
                         text-white font-medium px-7 py-3.5 rounded-lg transition-all
                         shadow-md hover:shadow-lg active:scale-95 text-sm">
              Sign up free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login"
              className="flex items-center gap-2 bg-white hover:bg-slate-50
                         text-slate-600 font-medium px-7 py-3.5 rounded-lg
                         border border-slate-200 hover:border-slate-300
                         transition-all text-sm">
              Log in
            </Link>
          </div>

          {/* Hero mockup */}
          <div className="mx-auto max-w-2xl">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3
                              border-b border-slate-100 bg-slate-50">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-3 bg-white rounded px-3 py-1 text-xs
                                text-slate-400 text-left border border-slate-200">
                  mailmind.app/inbox
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  AI ready
                </div>
              </div>
              <div className="p-5 text-left">
                <p className="text-xs text-slate-400 font-mono mb-4">
                  Smart Reply — 4 drafts generated
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { tone: 'Professional', preview: 'Thank you for your message. I would be glad to schedule a call to discuss this at your convenience.', bg: 'bg-blue-50 border-blue-100',   badge: 'text-blue-700 bg-blue-100'   },
                    { tone: 'Friendly',     preview: "Hey, thanks for writing in! I'd love to walk you through this — let's find a time that works.",       bg: 'bg-violet-50 border-violet-100', badge: 'text-violet-700 bg-violet-100' },
                    { tone: 'Casual',       preview: "Sure, happy to help! Here's the quick breakdown — let me know if you have any questions.",              bg: 'bg-slate-50 border-slate-200',   badge: 'text-slate-600 bg-slate-100'  },
                    { tone: 'Brief',        preview: "Thanks for writing in. Here are the key details. Let me know how you'd like to proceed.",               bg: 'bg-amber-50 border-amber-100',   badge: 'text-amber-700 bg-amber-100'  },
                  ].map(({ tone, preview, bg, badge }) => (
                    <div key={tone} className={`rounded-lg border p-3.5 ${bg}`}>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge}`}>
                        {tone}
                      </span>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">
                        {preview}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-slate-400">Select a tone to load into composer</p>
                  <button className="text-xs bg-violet-600 text-white px-3 py-1.5
                                     rounded-lg font-medium">
                    Use Professional →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-14 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map(({ value, label, icon: Icon }, i) => (
              <Animate key={label} delay={i * 80}>
                <div className="text-center">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center
                                  justify-center mx-auto mb-3 border border-slate-100">
                    <Icon className="w-4 h-4 text-violet-600" />
                  </div>
                  <p style={{ fontWeight: 800, letterSpacing: '-0.03em' }}
                     className="text-2xl text-slate-900 mb-0.5">{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              </Animate>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <Animate>
            <div className="text-center mb-14">
              <span className="text-xs font-semibold text-violet-600 tracking-widest
                               uppercase mb-3 block">
                Features
              </span>
              <h2 style={{ fontWeight: 800, letterSpacing: '-0.03em' }}
                  className="text-3xl lg:text-4xl text-slate-900 mb-3">
                Everything you need in one place
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
                From generating campaigns to managing replies —
                MailMind covers the full email workflow.
              </p>
            </div>
          </Animate>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, description, color, tag }, i) => (
              <Animate key={title} delay={i * 60}>
                <div className={`group relative bg-white rounded-xl border border-slate-200
                                p-6 flex flex-col gap-4 h-full transition-all duration-300
                                hover:shadow-lg hover:-translate-y-0.5 ${
                  color === 'violet' ? 'hover:border-violet-200' : 'hover:border-blue-200'
                }`}>
                  {tag && (
                    <span className={`absolute top-4 right-4 text-xs font-semibold
                                     px-2 py-0.5 rounded-full ${
                      tag === 'New'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-violet-50 text-violet-600 border border-violet-200'
                    }`}>
                      {tag}
                    </span>
                  )}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                                   transition-colors duration-300 ${
                    color === 'violet'
                      ? 'bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white'
                      : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700 }}
                        className="text-slate-900 mb-1.5 text-sm">{title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
                  </div>
                </div>
              </Animate>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Animate>
                <span className="text-xs font-semibold text-blue-600 tracking-widest
                                 uppercase mb-3 block">
                  How it works
                </span>
                <h2 style={{ fontWeight: 800, letterSpacing: '-0.03em' }}
                    className="text-3xl lg:text-4xl text-slate-900 mb-3">
                  From idea to sent email
                  <br />in three steps
                </h2>
                <p className="text-slate-500 mb-10 leading-relaxed">
                  No setup. No templates. Just describe what you need
                  and MailMind handles the rest.
                </p>
              </Animate>

              <div className="flex flex-col">
                {steps.map((step, i) => (
                  <Animate key={step.number} delay={i * 120}>
                    <div className="flex gap-5 items-start">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center
                                        justify-center flex-shrink-0">
                          <span style={{ fontWeight: 800 }}
                                className="text-white text-xs">{step.number}</span>
                        </div>
                        {i < steps.length - 1 && (
                          <div className="w-px flex-1 bg-violet-200 mt-2 min-h-[40px]" />
                        )}
                      </div>
                      <div className="pb-10">
                        <div className="flex items-center gap-2 mb-1.5">
                          <step.icon className="w-3.5 h-3.5 text-violet-600" />
                          <h3 style={{ fontWeight: 700 }}
                              className="text-slate-900 text-sm">{step.title}</h3>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </Animate>
                ))}
              </div>
            </div>

            {/* Terminal */}
            <Animate delay={150}>
              <div className="bg-slate-900 rounded-xl p-5 font-mono text-sm
                              shadow-xl border border-slate-800">
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  </div>
                  <span className="text-slate-500 text-xs ml-1">campaign-generator</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-400">Groq AI</span>
                  </div>
                </div>
                <div className="space-y-4 text-xs">
                  <div>
                    <p className="text-slate-600 mb-1">// Campaign brief</p>
                    <p className="text-emerald-400">$ "30% summer sale — shoes collection"</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-2">// Processing...</p>
                    <div className="flex items-center gap-2">
                      {[0, 150, 300].map(d => (
                        <span key={d} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                          style={{ animationDelay: `${d}ms` }} />
                      ))}
                      <span className="text-violet-400">Generating 5 variations</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-800 pt-3 space-y-2">
                    <p className="text-slate-600">// Output</p>
                    {[
                      { label: 'variation_1', tone: 'Professional', color: 'text-blue-400'    },
                      { label: 'variation_2', tone: 'Casual',       color: 'text-emerald-400' },
                      { label: 'variation_3', tone: 'Friendly',     color: 'text-amber-400'   },
                      { label: 'variation_4', tone: 'Urgent',       color: 'text-red-400'     },
                      { label: 'variation_5', tone: 'Persuasive',   color: 'text-violet-400'  },
                    ].map(({ label, tone, color }) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className="text-slate-600">{label}:</span>
                        <span className={`${color} font-medium`}>[{tone}]</span>
                        <div className="flex-1 h-px bg-slate-800" />
                        <CheckCircle className="w-3 h-3 text-slate-700" />
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-800 pt-3 space-y-1">
                    <p className="text-slate-600">// Selected: variation_2 · AI assist: "Make shorter"</p>
                    <p className="text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3" />
                      Sent via Gmail API
                    </p>
                  </div>
                </div>
              </div>
            </Animate>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 bg-slate-50">
        <div className="max-w-2xl mx-auto px-6">
          <Animate>
            <div className="text-center mb-12">
              <span className="text-xs font-semibold text-violet-600 tracking-widest
                               uppercase mb-3 block">
                FAQ
              </span>
              <h2 style={{ fontWeight: 800, letterSpacing: '-0.03em' }}
                  className="text-3xl lg:text-4xl text-slate-900 mb-3">
                Common questions
              </h2>
              <p className="text-slate-500">
                Everything you need to know before getting started
              </p>
            </div>
          </Animate>

          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <Animate key={i} delay={i * 50}>
                <FAQItem q={faq.q} a={faq.a} />
              </Animate>
            ))}
          </div>

          <Animate delay={100}>
            <div className="mt-10 text-center">
              <Link to="/register"
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700
                           text-white font-medium px-7 py-3 rounded-lg transition-all
                           text-sm shadow-md hover:shadow-lg active:scale-95">
                Sign up free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Animate>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                  <Mail className="w-3.5 h-3.5 text-white" />
                </div>
                <span style={{ fontWeight: 700 }} className="text-white text-base">
                  Mail<span className="text-violet-400">Mind</span>
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs mb-5">
                AI-powered email platform built on Spring Boot, React,
                PostgreSQL, and Groq AI.
              </p>
              <div className="flex flex-wrap gap-2">
                {['React', 'Spring Boot', 'PostgreSQL', 'Groq AI', 'Gmail API'].map(tech => (
                  <span key={tech}
                    className="text-xs bg-slate-800 border border-slate-700
                               text-slate-400 px-2.5 py-1 rounded-full">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase
                             tracking-wider mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><a href="#features"     className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
                <li><a href="#faq"          className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase
                             tracking-wider mb-4">Account</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><Link to="/login"     className="hover:text-white transition-colors">Log in</Link></li>
                <li><Link to="/register"  className="hover:text-white transition-colors">Sign up</Link></li>
                <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link to="/inbox"     className="hover:text-white transition-colors">Inbox</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800">
          <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row
                          items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} MailMind. Built with React · Spring Boot · Groq AI.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}