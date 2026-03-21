import { Loader2 } from 'lucide-react'

export function Button({ children, variant = 'primary', loading, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary:   'bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 shadow-sm hover:shadow-md hover:shadow-violet-200',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 px-6 py-3 border border-slate-200 shadow-sm',
    ghost:     'text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-4 py-2',
    danger:    'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-6 py-3',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={loading} {...props}>
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}

export function StatCard({ label, value, icon: Icon, color = 'purple' }) {
  const colors = {
    purple: 'text-violet-600 bg-violet-50',
    blue:   'text-blue-600 bg-blue-50',
    green:  'text-emerald-600 bg-emerald-50',
    amber:  'text-amber-600 bg-amber-50',
  }
  return (
    <div className="card p-6 flex items-start gap-4">
      {Icon && (
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-3xl font-bold text-slate-900 mt-0.5">{value ?? '—'}</p>
      </div>
    </div>
  )
}

export function LoadingSpinner({ size = 'md', text }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className={`${sizes[size]} border-2 border-violet-600 border-t-transparent rounded-full animate-spin`} />
      {text && <p className="text-sm text-slate-500">{text}</p>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && (
        <div className="p-4 bg-slate-100 rounded-2xl mb-4">
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {description && <p className="text-slate-500 mt-1 max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function ToneBadge({ tone }) {
  const styles = {
    Professional: 'bg-blue-100 text-blue-700 border-blue-200',
    Casual:       'bg-emerald-100 text-emerald-700 border-emerald-200',
    Friendly:     'bg-amber-100 text-amber-700 border-amber-200',
    Urgent:       'bg-red-100 text-red-700 border-red-200',
    Persuasive:   'bg-violet-100 text-violet-700 border-violet-200',
  }
  const style = styles[tone] || 'bg-slate-100 text-slate-600 border-slate-200'
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${style}`}>
      {tone}
    </span>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-slate-500 mt-1 text-sm">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
