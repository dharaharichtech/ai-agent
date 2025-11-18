import { createSlice } from '@reduxjs/toolkit'

// Safe localStorage parsing function
const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('user')
    if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
      return JSON.parse(storedUser)
    }
  } catch (error) {
    console.error('Error parsing stored user:', error)
    localStorage.removeItem('user') // Remove corrupted data
  }
  return null
}

const getStoredToken = () => {
  const token = localStorage.getItem('token')
  return (token && token !== 'undefined' && token !== 'null') ? token : null
}

const initialState = {
  user: getStoredUser(),
  token: getStoredToken(),
  isLoading: false,
  error: null,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    loginSuccess: (state, action) => {
      state.isLoading = false
      state.user = action.payload.user
      state.token = action.payload.token
      state.error = null
      
      // Safe localStorage storage
      if (action.payload.user) {
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      }
      if (action.payload.token) {
        localStorage.setItem('token', action.payload.token)
      }
    },
    loginFailure: (state, action) => {
      state.isLoading = false
      state.user = null
      state.token = null
      state.error = action.payload
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isLoading = false
      state.error = null
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      localStorage.removeItem('rememberMe')
    },
    clearError: (state) => {
      state.error = null
    },
    forceLogout: (state) => {
      state.user = null
      state.token = null
      state.isLoading = false
      state.error = null
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      localStorage.removeItem('rememberMe')
      localStorage.removeItem('auth_redirect_needed')
    },
  },
})

export const { loginStart, loginSuccess, loginFailure, logout, clearError, forceLogout } = userSlice.actions
export default userSlice.reducer