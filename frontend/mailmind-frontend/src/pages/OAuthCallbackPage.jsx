import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function OAuthCallbackPage() {
  const navigate = useNavigate()
  const { updateUser } = useAuth()
  const [status, setStatus] = useState('Connecting your Gmail account...')

  useEffect(() => {
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

        // Merge the returned user (which has gmailConnected: true)
        // // into AuthContext + localStorage so InboxPage sees it immediately
        // if (res.data.user) {
        //   updateUser(res.data.user)
        // }
        if (res.data.user) {
  // res.data.user has gmailConnected: true — merge it in
  updateUser({ ...res.data.user, gmailConnected: true })
}

        toast.success('Gmail connected successfully!')
        navigate('/inbox')
      } catch (err) {
        console.error('OAuth callback error:', err)
        const msg = err.response?.data?.error || 'Failed to connect Gmail'
        toast.error(msg)
        navigate('/inbox')
      }
    }

    exchangeCode()
  }, []) // runs once on mount

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