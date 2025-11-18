import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

// Create axios instance
const axiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if we're not already on login page and not in a login attempt
      const isLoginRequest = error.config?.url?.includes('/auth/login')
      const currentPath = window.location.pathname
      
      if (!isLoginRequest && currentPath !== '/login') {
        // Token expired or invalid
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        
        // Use React Router navigation instead of window.location to prevent page reload
        // The Redux state will update and ProtectedRoute will handle the redirect
        localStorage.setItem('auth_redirect_needed', 'true')
      }
    }
    return Promise.reject(error)
  }
)

export default axiosInstance