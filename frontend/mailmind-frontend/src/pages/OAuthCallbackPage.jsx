import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function OAuthCallbackPage() {
  const navigate    = useNavigate()
  const { updateUser } = useAuth()
  const [status, setStatus] = useState('Connecting your Gmail account...')
  const hasRun = useRef(false) // prevents double execution in React StrictMode

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const params = new URLSearchParams(window.location.search)
    const code   = params.get('code')
    const error  = params.get('error')

    if (error) {
      toast.error('Gmail connection was denied')
      navigate('/inbox')
      return
    }

    if (!code) {
      toast.error('No authorization code received from Google')
      navigate('/inbox')
      return
    }

    const exchangeCode = async () => {
      try {
        setStatus('Saving Gmail connection...')
        const res = await api.post('/api/auth/google/callback', { code })
        if (res.data.user) {
          updateUser({ ...res.data.user, gmailConnected: true })
        }
        toast.success('Gmail connected successfully!')
        navigate('/inbox')
      } catch (err) {
        console.error('OAuth callback error:', err)
        toast.error(err.response?.data?.error || 'Failed to connect Gmail')
        navigate('/inbox')
      }
    }

    exchangeCode()
  }, [navigate, updateUser]) // ← M3 FIX: proper deps array

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600
                        rounded-full animate-spin mx-auto" />
        <p className="text-slate-700 font-medium">{status}</p>
        <p className="text-slate-400 text-sm">Please wait, do not close this tab</p>
      </div>
    </div>
  )
}