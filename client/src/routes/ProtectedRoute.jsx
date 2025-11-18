import { useSelector, useDispatch } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import PropTypes from 'prop-types'
import { forceLogout } from '../redux/slices/userSlice'

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useSelector((state) => state.user)
  const location = useLocation()
  const dispatch = useDispatch()

  // Check for auth redirect flag on mount and clean it up
  useEffect(() => {
    if (localStorage.getItem('auth_redirect_needed')) {
      dispatch(forceLogout())
    }
  }, [dispatch])

  // Show nothing while checking auth state to prevent flashing
  if (isLoading) {
    return null
  }

  if (!user) {
    // Save the attempted location so we can redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  return children
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
}

export default ProtectedRoute