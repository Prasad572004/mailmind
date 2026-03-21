
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ui/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import OAuthCallbackPage from './pages/OAuthCallbackPage'

import LandingPage    from './pages/LandingPage'
import LoginPage      from './pages/LoginPage'
import RegisterPage   from './pages/RegisterPage'
import DashboardPage  from './pages/DashboardPage'
import InboxPage      from './pages/InboxPage'
import CampaignPage   from './pages/CampaignPage'
import SmartReplyPage from './pages/SmartReplyPage'
import AnalyticsPage  from './pages/AnalyticsPage'

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes — NO PublicLayout wrapper
          LandingPage has its own Navbar built-in
          LoginPage and RegisterPage have their own minimal layouts */}
      <Route path="/"         element={<LandingPage />}  />
      <Route path="/login"    element={<LoginPage />}    />
      <Route path="/register" element={<RegisterPage />} />

      {/* OAuth callback — no layout, no auth guard */}
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />

      {/* Protected routes — wrapped in DashboardLayout */}
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

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}