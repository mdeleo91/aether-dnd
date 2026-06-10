import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider.jsx'

export default function ProtectedRoute({ children, requireRole, redirectTo = '/login' }) {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900 text-white/50">
        <div className="flex items-center gap-3 text-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-amethyst-400/40 border-t-amethyst-300" />
          Loading your table…
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Wrong role for this route → send to the right home.
  if (requireRole && role !== requireRole) {
    return <Navigate to={role === 'player' ? '/play' : '/app'} replace />
  }

  return children
}
