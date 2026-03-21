import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ui/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import { Component } from 'react'

import LandingPage    from './pages/LandingPage'
import LoginPage      from './pages/LoginPage'
import RegisterPage   from './pages/RegisterPage'
import DashboardPage  from './pages/DashboardPage'
import InboxPage      from './pages/InboxPage'
import CampaignPage   from './pages/CampaignPage'
import SmartReplyPage from './pages/SmartReplyPage'
import AnalyticsPage  from './pages/AnalyticsPage'

// ── Error Boundary — catches any unhandled JS error ──────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center
                            justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              An unexpected error occurred. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700
                         text-white text-sm font-medium rounded-xl transition-all"
            >
              Go to homepage
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"         element={<LandingPage />}  />
      <Route path="/login"    element={<LoginPage />}    />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout><DashboardPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/inbox" element={
        <ProtectedRoute>
          <DashboardLayout><InboxPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/campaigns" element={
        <ProtectedRoute>
          <DashboardLayout><CampaignPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/smart-reply" element={
        <ProtectedRoute>
          <DashboardLayout><SmartReplyPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute>
          <DashboardLayout><AnalyticsPage /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#18181c',
                color: '#fff',
                border: '1px solid #3a3a46',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#7F77DD', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}