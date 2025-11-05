import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect to login page if:
    // 1. We're already on the login page
    // 2. The request was to the login endpoint
    const isLoginPage = window.location.pathname === '/login'
    const isLoginRequest = error.config?.url?.includes('/login')

    if (error.response?.status === 401 && !isLoginPage && !isLoginRequest) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api