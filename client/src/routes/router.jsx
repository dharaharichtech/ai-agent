import { createBrowserRouter } from 'react-router-dom'
import { routes } from './routes.jsx'

// Create single router instance that doesn't change based on auth state
export const appRouter = createBrowserRouter(routes, {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
})