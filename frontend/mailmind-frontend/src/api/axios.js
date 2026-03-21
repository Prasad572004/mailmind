import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — auto-attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mailmind_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mailmind_token')
      localStorage.removeItem('mailmind_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly', // ADD THIS
  'https://www.googleapis.com/auth/gmail.modify'     // ADD THIS
];

export default api
