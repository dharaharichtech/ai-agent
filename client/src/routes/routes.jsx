import { Navigate } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import AssistantsPage from '../pages/AssistantsPage'
import CallPage from '../pages/CallPage'
import CallHistoryPage from '../pages/CallHistoryPage'
import LeadsPage from '../pages/LeadsPage'
import ProjectsPage from '../pages/ProjectsPage'
import ProjectLeadsPage from '../pages/ProjectLeadsPage'
import Login from '../pages/Login'
import Register from '../pages/Register'
import ForgotPassword from '../pages/ForgotPassword'
import ProtectedRoute from './ProtectedRoute'
import Layout from '../components/layout/Layout'

// Single route configuration that handles all cases
export const routes = [
  // Public routes
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register', 
    element: <Register />
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />
  },
  // Protected routes with layout
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        )
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )
      },
      {
        path: 'leads',
        element: (
          <ProtectedRoute>
            <LeadsPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'leads/assistants/:assistantName',
        element: (
          <ProtectedRoute>
            <ProjectLeadsPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'assistants',
        element: (
          <ProtectedRoute>
            <AssistantsPage />
          </ProtectedRoute>
        )
      },
 
      {
        path: 'call-create',
        element: (
          <ProtectedRoute>
            <CallPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'call-history',
        element: (
          <ProtectedRoute>
            <CallHistoryPage />
          </ProtectedRoute>
        )
      },
   
    ]
  },
  // Catch-all route
  {
    path: '*',
    element: <Navigate to="/login" replace />
  }
]