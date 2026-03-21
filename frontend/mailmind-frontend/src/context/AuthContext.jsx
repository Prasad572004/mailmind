
import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(null)
  const [loading, setLoading] = useState(true)

  // On every app load — rehydrate from localStorage then refresh Gmail status
  useEffect(() => {
    const savedToken = localStorage.getItem('mailmind_token')
    const savedUser  = localStorage.getItem('mailmind_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      // Always re-check Gmail connection from backend so banner is accurate
      refreshGmailStatus(savedToken)
    }
    setLoading(false)
  }, [])

  // Hits GET /api/auth/google/status and updates gmailConnected in state + localStorage
  const refreshGmailStatus = async (authToken) => {
    try {
      const res = await api.get('/api/auth/google/status', {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      const gmailConnected = res.data.gmailConnected === true
      setUser(prev => {
        if (!prev) return prev
        const updated = { ...prev, gmailConnected }
        localStorage.setItem('mailmind_user', JSON.stringify(updated))
        return updated
      })
    } catch (err) {
      // Silently fail — don't break the app if this check fails
      console.warn('Could not refresh Gmail status:', err)
    }
  }

  const login = (userData, jwtToken) => {
    setUser(userData)
    setToken(jwtToken)
    localStorage.setItem('mailmind_token', jwtToken)
    localStorage.setItem('mailmind_user',  JSON.stringify(userData))
    // Re-check Gmail status right after login so banner shows correctly
    refreshGmailStatus(jwtToken)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('mailmind_token')
    localStorage.removeItem('mailmind_user')
  }

  // Updates user in both state and localStorage without touching the JWT token
  const updateUser = (updatedUser) => {
    const merged = { ...user, ...updatedUser }
    setUser(merged)
    localStorage.setItem('mailmind_user', JSON.stringify(merged))
  }

  const isAuthenticated = !!token

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      updateUser,
      isAuthenticated,
      refreshGmailStatus  // exposed so OAuthCallbackPage can call it after connecting
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}